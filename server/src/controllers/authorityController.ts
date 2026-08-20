import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { AuthRequest } from '../middleware/authMiddleware';
import { LLMService } from '../services/llmService';
import { EmailService } from '../services/emailService';

export class AuthorityController {
  /**
   * Filterable Complaints List for Command Dashboard (Section 3.4 & 8)
   */
  public static async getComplaints(req: AuthRequest, res: Response) {
    try {
      const {
        zone,
        status,
        issue_type,
        is_verified,
        min_severity,
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
        limit = 100,
        offset = 0
      } = req.query as any;

      let query = `
        SELECT c.*,
               u.full_name as reporter_name, u.phone as reporter_phone, u.email as reporter_email,
               d.name as department_name, d.zone as department_zone,
               o.badge_number as officer_badge, ou.full_name as officer_name,
               (SELECT COUNT(*) FROM evidence_files WHERE complaint_id = c.id) as evidence_count
        FROM complaints c
        LEFT JOIN users u ON u.id = c.reporter_id
        LEFT JOIN departments d ON d.id = c.assigned_department_id
        LEFT JOIN officers o ON o.id = c.assigned_officer_id
        LEFT JOIN users ou ON ou.id = o.user_id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (zone && zone !== 'all') {
        query += ` AND (d.zone = ? OR d.id = ?)`;
        params.push(zone, zone);
      }

      if (status && status !== 'all') {
        query += ` AND c.status = ?`;
        params.push(status);
      }

      if (issue_type && issue_type !== 'all') {
        query += ` AND c.issue_type = ?`;
        params.push(issue_type);
      }

      if (is_verified !== undefined && is_verified !== 'all') {
        query += ` AND c.is_reporter_verified = ?`;
        params.push(is_verified === 'true' || is_verified === '1' ? 1 : 0);
      }

      if (min_severity) {
        query += ` AND c.severity_score >= ?`;
        params.push(parseFloat(min_severity));
      }

      if (search) {
        query += ` AND (c.ticket_id LIKE ? OR c.description LIKE ? OR c.address_text LIKE ? OR c.vehicle_number LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      // Safe sorting
      const allowedSortFields: Record<string, string> = {
        created_at: 'c.created_at',
        severity_score: 'c.severity_score',
        status: 'c.status',
        ticket_id: 'c.ticket_id'
      };

      const sortCol = allowedSortFields[sort_by] || 'c.created_at';
      const dir = sort_order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      query += ` ORDER BY ${sortCol} ${dir} LIMIT ? OFFSET ?`;
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const complaints = db.prepare(query).all(...params);

      // Summary counts for quick stats
      const totalOpen = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('resolved', 'closed')").get() as any;
      const totalCritical = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE severity_score >= 8.0 AND status NOT IN ('resolved', 'closed')").get() as any;

      return res.json({
        complaints: complaints.map((c: any) => ({
          ...c,
          is_reporter_verified: Boolean(c.is_reporter_verified),
          tow_required: Boolean(c.tow_required)
        })),
        stats: {
          total_open: totalOpen.count,
          total_critical: totalCritical.count
        }
      });
    } catch (err: any) {
      console.error('Authority get complaints error:', err);
      return res.status(500).json({ error: 'Failed to fetch authority complaints.' });
    }
  }

  /**
   * Complaint Detail with AI Officer Briefing (Section 3.4, 8 & 10.2)
   */
  public static async getComplaintDetail(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const complaint = db.prepare(`
        SELECT c.*,
               u.full_name as reporter_name, u.phone as reporter_phone, u.email as reporter_email, u.is_identity_verified as reporter_verified_now,
               d.name as department_name, d.zone as department_zone,
               o.badge_number as officer_badge, ou.full_name as officer_name
        FROM complaints c
        LEFT JOIN users u ON u.id = c.reporter_id
        LEFT JOIN departments d ON d.id = c.assigned_department_id
        LEFT JOIN officers o ON o.id = c.assigned_officer_id
        LEFT JOIN users ou ON ou.id = o.user_id
        WHERE c.id = ? OR c.ticket_id = ?
      `).get(id, id) as any;

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found.' });
      }

      const evidence = db.prepare('SELECT * FROM evidence_files WHERE complaint_id = ? ORDER BY uploaded_at ASC').all(complaint.id);
      const timeline = db.prepare(`
        SELECT h.*, u.full_name as changed_by_name, u.role as changed_by_role
        FROM complaint_status_history h
        LEFT JOIN users u ON u.id = h.changed_by
        WHERE h.complaint_id = ?
        ORDER BY h.changed_at ASC
      `).all(complaint.id);

      // Generate AI Officer Briefing dynamically using Template 2
      const officerBriefing = LLMService.generateOfficerBriefing(complaint, evidence.length);

      return res.json({
        complaint: {
          ...complaint,
          is_reporter_verified: Boolean(complaint.is_reporter_verified),
          tow_required: Boolean(complaint.tow_required)
        },
        evidence,
        timeline,
        officerBriefing
      });
    } catch (err: any) {
      console.error('Authority complaint detail error:', err);
      return res.status(500).json({ error: 'Failed to retrieve complaint detail.' });
    }
  }

  /**
   * Update Complaint Status (Section 3.4, 8)
   */
  public static async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const validStatuses = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const complaint = db.prepare(`
        SELECT c.*, u.email as reporter_email 
        FROM complaints c
        LEFT JOIN users u ON u.id = c.reporter_id
        WHERE c.id = ?
      `).get(id) as any;

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found.' });
      }

      // Update complaint status
      db.prepare(`
        UPDATE complaints 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(status, id);

      // Record in audit status history
      const officerId = req.user?.id || null;
      db.prepare(`
        INSERT INTO complaint_status_history (id, complaint_id, status, note, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), id, status, note || `Status transitioned to ${status.replace(/_/g, ' ')}.`, officerId);

      // Trigger automatic email alert to citizen
      if (complaint.reporter_email) {
        EmailService.sendStatusUpdate(complaint.reporter_email, complaint.ticket_id, status, note);
      }

      return res.json({
        success: true,
        message: `Ticket ${complaint.ticket_id} status updated to '${status}'.`,
        status
      });
    } catch (err: any) {
      console.error('Update status error:', err);
      return res.status(500).json({ error: 'Failed to update complaint status.' });
    }
  }

  /**
   * Assign Department and Officer (Section 8)
   */
  public static async assign(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { department_id, officer_id, note } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any;
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found.' });
      }

      let newStatus = complaint.status;
      if (officer_id && (complaint.status === 'submitted' || complaint.status === 'under_review')) {
        newStatus = 'assigned';
      }

      db.prepare(`
        UPDATE complaints 
        SET assigned_department_id = COALESCE(?, assigned_department_id),
            assigned_officer_id = COALESCE(?, assigned_officer_id),
            status = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(department_id || null, officer_id || null, newStatus, id);

      // Add status history record
      let assignmentNote = note;
      if (!assignmentNote) {
        const dept = department_id ? db.prepare('SELECT name FROM departments WHERE id = ?').get(department_id) as any : null;
        const off = officer_id ? db.prepare('SELECT badge_number FROM officers WHERE id = ?').get(officer_id) as any : null;
        assignmentNote = `Assigned to ${dept?.name || 'Department'} ${off?.badge_number ? `(Officer Badge #${off.badge_number})` : ''}.`;
      }

      db.prepare(`
        INSERT INTO complaint_status_history (id, complaint_id, status, note, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), id, newStatus, assignmentNote, req.user?.id || null);

      return res.json({
        success: true,
        message: 'Assignment updated successfully.',
        status: newStatus
      });
    } catch (err: any) {
      console.error('Assign error:', err);
      return res.status(500).json({ error: 'Failed to assign complaint.' });
    }
  }

  /**
   * Add Internal Officer Note (Section 8)
   */
  public static async addInternalNote(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!note || note.trim().length === 0) {
        return res.status(400).json({ error: 'Note text is required.' });
      }

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any;
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found.' });
      }

      const officerName = req.user?.full_name || 'Traffic Officer';
      const badge = req.user?.role === 'officer' ? ` (Badge Verified)` : '';

      db.prepare(`
        INSERT INTO complaint_status_history (id, complaint_id, status, note, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), id, complaint.status, `[Internal Operational Note by ${officerName}${badge}]: ${note}`, req.user?.id || null);

      return res.json({ success: true, message: 'Internal note recorded.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to record internal note.' });
    }
  }

  /**
   * Get Departments & Officers list for assignment modal
   */
  public static async getDepartmentsAndOfficers(_req: AuthRequest, res: Response) {
    try {
      const departments = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
      const officers = db.prepare(`
        SELECT o.id, o.department_id, o.badge_number, u.full_name as officer_name, u.phone as officer_phone, d.name as department_name
        FROM officers o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN departments d ON d.id = o.department_id
        ORDER BY u.full_name ASC
      `).all();

      return res.json({ departments, officers });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch departments and officers.' });
    }
  }
}
