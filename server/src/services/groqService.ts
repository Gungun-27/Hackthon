import Groq from 'groq-sdk';
import { config } from '../config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TicketContext {
  ticket_id: string;
  issue_type: string;
  description: string;
  address_text: string;
  severity_score: number;
  severity_reasoning?: string;
  status: string;
  department_name?: string;
  assigned_officer_badge?: string;
  is_reporter_verified?: boolean;
  vehicle_number?: string;
  tow_required?: boolean;
  created_at: string;
  updated_at?: string;
}

export class GroqService {
  private static instance: GroqService;
  private groqClient: Groq | null = null;
  // Primary model as per spec with intelligent fallback to active account models
  private readonly primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  private readonly candidateModels = [
    process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b'
  ];
  private activeModel: string = 'openai/gpt-oss-120b';
  private readonly timeoutMs = 8000; // 8 seconds SLA

  private constructor() {
    if (config.groqApiKey) {
      try {
        this.groqClient = new Groq({
          apiKey: config.groqApiKey,
          timeout: this.timeoutMs
        });
        this.activeModel = this.primaryModel;
        console.log(`🚀 [GroqService] Groq client initialized successfully with model: ${this.activeModel}`);
      } catch (err) {
        console.error('❌ [GroqService] Failed to initialize Groq client:', err);
      }
    }
  }

  public static getInstance(): GroqService {
    if (!GroqService.instance) {
      GroqService.instance = new GroqService();
    }
    return GroqService.instance;
  }

  /**
   * Constructs the Section 10 System Prompt with anti-hallucination constraint
   */
  private buildSystemPrompt(context: TicketContext | null): string {
    const ticketContextStr = context ? JSON.stringify(context, null, 2) : 'null (No verified ticket context for this query)';

    return `System: You are the TrafficMitra citizen assistant for Nagpur Municipal Corporation & Nagpur Traffic Police.
You help citizens report traffic issues (jams, accidents, rash driving, road damage, signal faults), file illegal parking complaints (with vehicle number & towing dispatch), check live ticket status, and understand DigiLocker verification.

CRITICAL ANTI-HALLUCINATION INSTRUCTION:
- If the citizen asks about a specific ticket status, use ONLY the verified ticket data provided below in the Ticket Context block.
- If the Ticket Context below is null or the ticket ID is not found in the context, explicitly inform the citizen that no active ticket with that ID exists in the Nagpur Municipal & Police database. NEVER guess, assume, or fabricate any ticket details.
- Provide crisp, polite, and actionable responses. Use bolding and bullet points for readability.
- If the user asks about emergency assistance, inform them to dial 112 (Police Emergency) or 1095 (Nagpur Traffic Control).
- If the user is describing an issue to report, advise them on the category and mention that they can click "Review & File Complaint" to pre-fill the official form.

Ticket Context (from real database):
${ticketContextStr}`;
  }

  /**
   * Execute chat completion with timeout, dynamic model resolution, and 1-time transient retry
   */
  public async getChatCompletion(
    messages: ChatMessage[],
    context: TicketContext | null = null
  ): Promise<string> {
    if (!this.groqClient) {
      return this.fallbackResponse(messages, context, 'API_KEY_UNAVAILABLE');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    const formattedMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    ];

    // Try active model first, fallback to alternate candidate models if 404
    for (const modelToTry of this.candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const response = await this.groqClient.chat.completions.create({
            model: modelToTry,
            messages: formattedMessages,
            temperature: 0.3,
            max_tokens: 800,
            top_p: 0.9
          });

          const replyContent = response.choices[0]?.message?.content;
          if (replyContent && replyContent.trim().length > 0) {
            this.activeModel = modelToTry;
            return replyContent.trim();
          }
        } catch (error: any) {
          const isModelNotFound = error.status === 404 || error.code === 'model_not_found';
          if (isModelNotFound) {
            // Move to next candidate model immediately
            break;
          }

          const isTransient = error.status >= 500 || error.code === 'ETIMEDOUT' || error.name === 'AbortError';
          if (!isTransient || attempts >= maxAttempts) {
            break;
          }

          // Short backoff before retry
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    return this.fallbackResponse(messages, context, 'TIMEOUT_OR_FALLBACK');
  }

  /**
   * Graceful fallback when Groq API is unreachable or timed out
   */
  private fallbackResponse(
    messages: ChatMessage[],
    context: TicketContext | null,
    reason: string
  ): string {
    console.log(`🛡️ [GroqService] Using structured fallback (Reason: ${reason})`);

    const latestUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';

    if (context) {
      const statusMap: Record<string, string> = {
        submitted: 'Received & Pending Initial Control Room Triage',
        under_review: 'Under Review by Nagpur Traffic Control Room',
        assigned: `Assigned to ${context.assigned_officer_badge ? `Officer #${context.assigned_officer_badge}` : 'Zonal Traffic Officer'} (${context.department_name || 'Nagpur Police/NMC'})`,
        in_progress: 'Active on-ground inspection & enforcement in progress',
        resolved: 'Resolved on-site by authorized personnel',
        closed: 'Closed & Archived'
      };

      return `Regarding Ticket **${context.ticket_id}**:\n` +
        `• **Current Status:** ${statusMap[context.status] || context.status}\n` +
        `• **Category:** ${context.issue_type.replace(/_/g, ' ').toUpperCase()}\n` +
        `• **Location:** ${context.address_text || 'Nagpur'}\n` +
        `• **Priority Score:** ${context.severity_score}/10\n` +
        `• **Assigned Unit:** ${context.department_name || 'Nagpur Municipal/Traffic Police'}\n` +
        `• **Last Updated:** ${new Date(context.updated_at || context.created_at).toLocaleString('en-IN')}\n\n` +
        (context.status === 'resolved'
          ? 'This grievance has been resolved on site.'
          : 'Our zonal dispatch team is actively monitoring this ticket.');
    }

    if (latestUserMsg.includes('parking') || latestUserMsg.includes('car') || latestUserMsg.includes('tow')) {
      return `To report an illegal parking or vehicle obstruction in Nagpur:\n\n` +
        `1. Click **"Report Parking Violation"** in the navigation bar.\n` +
        `2. Select the violation sub-type (e.g. *Footpath Encroachment*, *Double Parking*, *Hospital Gate Obstruction*).\n` +
        `3. Enter the vehicle license plate (e.g. MH-31-XX-XXXX) and drop an accurate pin on the map.\n` +
        `4. Check the **"Request NMC Towing Squad"** box if immediate removal is needed.`;
    }

    return `Hello! I am the TrafficMitra Civic Assistant powered by Groq LPU inference. I can help you with:\n\n` +
      `• Real-time ticket tracking (e.g. *"What is the status of TM-2026-004521?"*)\n` +
      `• Guidance on reporting traffic bottlenecks, accidents, road craters, and parking violations\n` +
      `• DigiLocker citizen identity verification process\n` +
      `• Emergency helplines: Traffic Control (1095) / Police Emergency (112)`;
  }
}
