import { Request, Response } from 'express';
import { db } from '../db/database';
import { GroqService, ChatMessage, TicketContext } from '../services/groqService';

// Per-client in-memory Rate Limiter (Max 20 requests per 5 minutes)
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 20;

export class ChatbotController {
  /**
   * Reset rate limits (useful for unit/integration tests)
   */
  public static resetRateLimits(): void {
    rateLimitMap.clear();
  }

  /**
   * Conversational Chatbot Endpoint (/api/chatbot/message)
   * Powered by Groq LPU Inference (llama-3.3-70b-versatile)
   */
  public static async handleMessage(req: Request, res: Response) {
    try {
      const { message, history = [] } = req.body;

      // Failure State 3: Invalid / Malformed user input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Message content cannot be empty.',
          code: 'INVALID_INPUT'
        });
      }

      // Rate Limiting Check (Failure State 2)
      const clientId = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-client';
      const now = Date.now();
      let record = rateLimitMap.get(clientId);

      if (!record) {
        record = { timestamps: [] };
        rateLimitMap.set(clientId, record);
      }

      // Filter out timestamps older than the window
      record.timestamps = record.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

      if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        const oldestTimestamp = record.timestamps[0];
        const retryAfterSeconds = Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW_MS - now) / 1000);

        return res.status(429).json({
          error: `Chatbot rate limit exceeded. You can send up to ${MAX_REQUESTS_PER_WINDOW} messages per 5 minutes.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfterSeconds,
          message: `Please wait ${retryAfterSeconds} seconds before sending another message.`
        });
      }

      // Record this valid request
      record.timestamps.push(now);

      const cleanMsg = message.trim();

      // Step 1: Detect ticket reference pattern in message (e.g. TM-2026-004521 or 004521)
      const ticketRegex = /(TM-2026-\d{6})/i;
      const ticketMatch = cleanMsg.match(ticketRegex);

      let ticketContext: TicketContext | null = null;
      if (ticketMatch) {
        const ticketIdQuery = ticketMatch[1].toUpperCase();

        const dbRecord = db.prepare(`
          SELECT c.*, d.name as department_name, o.badge_number as assigned_officer_badge,
                 u.full_name as reporter_name
          FROM complaints c
          LEFT JOIN departments d ON d.id = c.assigned_department_id
          LEFT JOIN officers o ON o.id = c.assigned_officer_id
          LEFT JOIN users u ON u.id = c.reporter_id
          WHERE c.ticket_id = ?
        `).get(ticketIdQuery) as any;

        if (dbRecord) {
          ticketContext = {
            ticket_id: dbRecord.ticket_id,
            issue_type: dbRecord.issue_type,
            description: dbRecord.description,
            address_text: dbRecord.address_text,
            severity_score: dbRecord.severity_score,
            severity_reasoning: dbRecord.severity_reasoning,
            status: dbRecord.status,
            department_name: dbRecord.department_name,
            assigned_officer_badge: dbRecord.assigned_officer_badge,
            is_reporter_verified: Boolean(dbRecord.is_reporter_verified),
            vehicle_number: dbRecord.vehicle_number,
            tow_required: Boolean(dbRecord.tow_required),
            created_at: dbRecord.created_at,
            updated_at: dbRecord.updated_at
          };
        }
      }

      // Step 2: Detect if user is describing an issue and generate pre-fill draft
      let complaintDraft = null;
      const lower = cleanMsg.toLowerCase();
      if (
        lower.includes('report') ||
        lower.includes('car blocked') ||
        lower.includes('jam') ||
        lower.includes('accident') ||
        lower.includes('pothole') ||
        lower.includes('parking') ||
        lower.includes('signal')
      ) {
        let detectedType = 'other';
        if (lower.includes('park') || lower.includes('car') || lower.includes('bike') || lower.includes('footpath') || lower.includes('blocked') || lower.includes('gate')) {
          detectedType = 'illegal_parking';
        } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('hit')) {
          detectedType = 'accident';
        } else if (lower.includes('jam') || lower.includes('traffic') || lower.includes('stuck') || lower.includes('gridlock')) {
          detectedType = 'traffic_jam';
        } else if (lower.includes('pothole') || lower.includes('road') || lower.includes('crater') || lower.includes('damage')) {
          detectedType = 'road_damage';
        } else if (lower.includes('signal') || lower.includes('red light') || lower.includes('blinking')) {
          detectedType = 'signal_fault';
        } else if (lower.includes('rash') || lower.includes('speeding') || lower.includes('stunt')) {
          detectedType = 'rash_driving';
        }

        // Detect Nagpur landmark
        let detectedLoc = 'Sitabuldi Square, Nagpur';
        if (lower.includes('dharampeth')) detectedLoc = 'Dharampeth Coffee House Square, Nagpur';
        else if (lower.includes('sadar')) detectedLoc = 'Residency Road, Sadar, Nagpur';
        else if (lower.includes('wardha')) detectedLoc = 'Wardha Road, Metro Pillar 114, Nagpur';
        else if (lower.includes('medical')) detectedLoc = 'Government Medical College Hospital Gate, Nagpur';
        else if (lower.includes('cotton') || lower.includes('itwari')) detectedLoc = 'Cotton Market Main Road, Itwari, Nagpur';
        else if (lower.includes('mankapur')) detectedLoc = 'Mankapur Ring Road Flyover, Nagpur';

        // Extract vehicle number if present
        const plateMatch = cleanMsg.match(/([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4})/i);
        const extractedPlate = plateMatch ? plateMatch[0].toUpperCase().replace(/\s+/g, '-') : undefined;

        complaintDraft = {
          issue_type: detectedType,
          description: cleanMsg,
          address_text: detectedLoc,
          vehicle_number: extractedPlate,
          readyToReview: true
        };
      }

      // Step 3: Format chat messages
      const conversationMessages: ChatMessage[] = [
        ...history.map((h: any) => ({
          role: (h.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: h.content || h.text || ''
        })),
        { role: 'user', content: cleanMsg }
      ];

      // Step 4: Call GroqService
      const groqService = GroqService.getInstance();
      const botResponse = await groqService.getChatCompletion(conversationMessages, ticketContext);

      return res.json({
        reply: botResponse,
        model: 'llama-3.3-70b-versatile (Groq LPU)',
        ticketFound: Boolean(ticketContext),
        ticketDetails: ticketContext ? {
          ticket_id: ticketContext.ticket_id,
          status: ticketContext.status,
          issue_type: ticketContext.issue_type,
          severity_score: ticketContext.severity_score
        } : null,
        complaintDraft,
        remainingRequests: MAX_REQUESTS_PER_WINDOW - record.timestamps.length
      });
    } catch (err: any) {
      console.error('❌ [ChatbotController] Unexpected error:', err);
      // Failure State 1: Server / API error fallback
      return res.status(200).json({
        reply: "I'm having trouble responding right now — please try again or file your complaint directly via the Report Issue portal. For emergencies, please dial 112 or Traffic Hotline 1095.",
        model: 'fallback-system',
        ticketFound: false,
        complaintDraft: null
      });
    }
  }
}
