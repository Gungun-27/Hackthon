import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { AuthRequest } from '../middleware/authMiddleware';
import { LLMService } from '../services/llmService';
import { EmailService } from '../services/emailService';

// Helper to format unique Ticket ID: TM-2026-XXXXXX
function generateTicketId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `TM-2026-${randomNum}`;
}

export class ComplaintsController {
  /**
   * AI-Assist for live description enhancement & severity preview (Section 10.1)
   */
  public static async aiAssist(req: Request, res: Response) {
    try {
      const { issue_type = 'other', raw_text = '', address_text = '' } = req.body;
      if (!raw_text || raw_text.trim().length === 0) {
        return res.status(400).json({ error: 'raw_text is required for AI enhancement.' });
      }

      const result = await LLMService.enhanceDescriptionAndScore(issue_type, raw_text, address_text);
      return res.json(result);
    } catch (err: any) {
      console.error('AI Assist error:', err);
      return res.status(500).json({ error: 'Failed to generate AI assistance.' });
    }
  }

  /**
   * Submit New Complaint (Multi-step + Evidence + Parking Violation Details)
   */
  public static async submitComplaint(req: AuthRequest, res: Response) {
    try {
      const {
        issue_type,
        description,
        ai_enhanced_description,
        latitude,
        longitude,
        location_accuracy_m = 15,
        address_text,
        severity_score,
        severity_reasoning,
        vehicle_number,
        vehicle_type,
        parking_violation_type,
        tow_required,
        reporter_name,
        reporter_phone,
        reporter_email
      } = req.body;

      if (!issue_type || !description || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Missing required complaint fields (issue_type, description, latitude, longitude).' });
      }

      // Check if user is logged in or provided contact details
      let reporterId = req.user?.id || null;
      let isReporterVerified = req.user?.is_identity_verified ? 1 : 0;
      let notificationEmail = req.user?.email || reporter_email || 'citizen@nagpur.gov.in';

      // If user isn't logged in but provided phone/email, find or create temporary citizen record
      if (!reporterId && (reporter_phone || reporter_email)) {
        const existing = db.prepare('SELECT id, is_identity_verified, email FROM users WHERE phone = ? OR email = ?').get(reporter_phone, reporter_email) as any;
        if (existing) {
          reporterId = existing.id;
          isReporterVerified = existing.is_identity_verified;
          notificationEmail = existing.email;
        } else {
          reporterId = uuidv4();
          db.prepare(`
            INSERT INTO users (id, full_name, phone, email, password_hash, role, is_identity_verified)
            VALUES (?, ?, ?, ?, 'UNREGISTERED_GUEST', 'citizen', 0)
          `).run(reporterId, reporter_name || 'Nagpur Resident', reporter_phone || `9890${Math.floor(100000 + Math.random() * 900000)}`, reporter_email || `guest_${Date.now()}@trafficmitra.nagpur.gov.in`);
        }
      }

      // Automatically compute AI severity & enhancement if not passed from client
      let finalEnhancedDesc = ai_enhanced_description;
      let finalSeverity = parseFloat(severity_score);
      let finalReasoning = severity_reasoning;

      if (!finalEnhancedDesc || isNaN(finalSeverity) || !finalReasoning) {
        const aiResult = await LLMService.enhanceDescriptionAndScore(issue_type, description, address_text || 'Nagpur');
        finalEnhancedDesc = aiResult.enhanced_description;
        finalSeverity = aiResult.severity_score;
        finalReasoning = aiResult.reasoning;
      }

      // Determine initial Department Assignment based on issue category
      let assignedDeptId = null;
      if (issue_type === 'illegal_parking' || issue_type === 'rash_driving' || issue_type === 'traffic_jam') {
        const dept = db.prepare("SELECT id FROM departments WHERE name LIKE '%Traffic Police%' LIMIT 1").get() as any;
        if (dept) assignedDeptId = dept.id;
      } else if (issue_type === 'road_damage' || issue_type === 'signal_fault') {
        const dept = db.prepare("SELECT id FROM departments WHERE name LIKE '%NMC%' LIMIT 1").get() as any;
        if (dept) assignedDeptId = dept.id;
      }

      const complaintId = uuidv4();
      const ticketId = generateTicketId();

      db.prepare(`
        INSERT INTO complaints (
          id, ticket_id, reporter_id, issue_type, description, ai_enhanced_description,
          latitude, longitude, location_accuracy_m, address_text, severity_score, severity_reasoning,
          status, assigned_department_id, is_reporter_verified,
          vehicle_number, vehicle_type, parking_violation_type, tow_required
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?)
      `).run(
        complaintId,
        ticketId,
        reporterId,
        issue_type,
        description,
        finalEnhancedDesc,
        parseFloat(latitude),
        parseFloat(longitude),
        parseInt(location_accuracy_m, 10),
        address_text || 'Nagpur, Maharashtra',
        finalSeverity,
        finalReasoning,
        assignedDeptId,
        isReporterVerified,
        vehicle_number ? vehicle_number.toUpperCase().trim() : null,
        vehicle_type || null,
        parking_violation_type || null,
        tow_required === 'true' || tow_required === true || tow_required === 1 ? 1 : 0
      );

      // Create initial status history record (Section 7)
      db.prepare(`
        INSERT INTO complaint_status_history (id, complaint_id, status, note, changed_by)
        VALUES (?, ?, 'submitted', 'Grievance submitted by citizen and logged in Nagpur Command System.', ?)
      `).run(uuidv4(), complaintId, reporterId);

      // Process uploaded files if any
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const insertFileStmt = db.prepare(`
          INSERT INTO evidence_files (id, complaint_id, file_type, storage_url)
          VALUES (?, ?, ?, ?)
        `);

        for (const file of files) {
          let fileType = 'photo';
          if (file.mimetype.startsWith('video/')) fileType = 'video';
          else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

          const storageUrl = `/uploads/${file.filename}`;
          insertFileStmt.run(uuidv4(), complaintId, fileType, storageUrl);
        }
      }

      // Trigger automatic confirmation email (Section 3.2 / 3.3)
      if (notificationEmail) {
        EmailService.sendTicketConfirmation(notificationEmail, ticketId, issue_type, address_text || 'Nagpur, Maharashtra');
      }

      return res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully.',
        ticketId,
        complaintId,
        trackingUrl: `/track/${ticketId}`,
        severity_score: finalSeverity,
        severity_reasoning: finalReasoning,
        isReporterVerified: Boolean(isReporterVerified)
      });
    } catch (err: any) {
      console.error('Submit complaint error:', err);
      return res.status(500).json({ error: 'Internal server error while submitting complaint.' });
    }
  }

  /**
   * Get Logged-in User's Complaints
   */
  public static async getMyComplaints(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const complaints = db.prepare(`
        SELECT c.*, d.name as department_name, d.zone as department_zone,
               (SELECT COUNT(*) FROM evidence_files WHERE complaint_id = c.id) as evidence_count
        FROM complaints c
        LEFT JOIN departments d ON d.id = c.assigned_department_id
        WHERE c.reporter_id = ?
        ORDER BY c.created_at DESC
      `).all(req.user.id);

      return res.json(complaints);
    } catch (err: any) {
      console.error('Get my complaints error:', err);
      return res.status(500).json({ error: 'Failed to retrieve complaints.' });
    }
  }

  /**
   * Public Tracking by Ticket ID (Section 3.3, No login required)
   */
  public static async getByTicketId(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      if (!ticketId) {
        return res.status(400).json({ error: 'Ticket ID is required.' });
      }

      const complaint = db.prepare(`
        SELECT c.*, 
               u.full_name as reporter_name, u.is_identity_verified as reporter_verified_current,
               d.name as department_name, d.zone as department_zone,
               o.badge_number as officer_badge, ou.full_name as officer_name
        FROM complaints c
        LEFT JOIN users u ON u.id = c.reporter_id
        LEFT JOIN departments d ON d.id = c.assigned_department_id
        LEFT JOIN officers o ON o.id = c.assigned_officer_id
        LEFT JOIN users ou ON ou.id = o.user_id
        WHERE c.ticket_id = ? OR c.id = ?
      `).get(ticketId, ticketId) as any;

      if (!complaint) {
        return res.status(404).json({ error: `Ticket '${ticketId}' not found. Please verify the ticket reference.` });
      }

      // Fetch status timeline
      const timeline = db.prepare(`
        SELECT h.*, u.full_name as changed_by_name, u.role as changed_by_role
        FROM complaint_status_history h
        LEFT JOIN users u ON u.id = h.changed_by
        WHERE h.complaint_id = ?
        ORDER BY h.changed_at ASC
      `).all(complaint.id);

      // Fetch evidence files
      const evidence = db.prepare(`
        SELECT * FROM evidence_files WHERE complaint_id = ? ORDER BY uploaded_at ASC
      `).all(complaint.id);

      // Calculate estimated resolution time based on issue type (Section 3.3)
      const resolutionEstimates: Record<string, string> = {
        accident: '15 - 30 minutes (Immediate Emergency Response)',
        traffic_jam: '20 - 45 minutes (Traffic Marshalling)',
        rash_driving: '1 - 2 hours (CCTV & E-Challan Trace)',
        illegal_parking: '30 - 60 minutes (Towing & Fine Squad)',
        signal_fault: '2 - 4 hours (NMC Signal Technical Team)',
        road_damage: '24 - 48 hours (NMC Public Works Dispatch)',
        other: '2 - 6 hours'
      };

      const estimatedResolution = resolutionEstimates[complaint.issue_type] || '2 - 4 hours';

      return res.json({
        complaint: {
          ...complaint,
          is_reporter_verified: Boolean(complaint.is_reporter_verified),
          tow_required: Boolean(complaint.tow_required),
          estimated_resolution: estimatedResolution
        },
        timeline,
        evidence
      });
    } catch (err: any) {
      console.error('Tracking error:', err);
      return res.status(500).json({ error: 'Failed to retrieve tracking details.' });
    }
  }

  /**
   * Add Follow-up comment or supplementary evidence to open complaint (Section 3.3)
   */
  public static async addFollowup(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // complaint ID
      const { comment, reporter_name } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any;
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found.' });
      }

      if (complaint.status === 'closed') {
        return res.status(400).json({ error: 'Cannot add follow-up to a closed ticket.' });
      }

      const changedBy = req.user?.id || complaint.reporter_id || null;
      const authorText = req.user?.full_name || reporter_name || 'Citizen';

      // Insert into status history as comment / followup note
      db.prepare(`
        INSERT INTO complaint_status_history (id, complaint_id, status, note, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), complaint.id, complaint.status, `[Citizen Note by ${authorText}]: ${comment || 'Uploaded supplementary evidence.'}`, changedBy);

      // Handle additional evidence files
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const insertFileStmt = db.prepare(`
          INSERT INTO evidence_files (id, complaint_id, file_type, storage_url)
          VALUES (?, ?, ?, ?)
        `);

        for (const file of files) {
          let fileType = 'photo';
          if (file.mimetype.startsWith('video/')) fileType = 'video';
          else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

          insertFileStmt.run(uuidv4(), complaint.id, fileType, `/uploads/${file.filename}`);
        }
      }

      return res.json({ success: true, message: 'Follow-up appended successfully.' });
    } catch (err: any) {
      console.error('Add follow-up error:', err);
      return res.status(500).json({ error: 'Failed to add follow-up.' });
    }
  }
}
