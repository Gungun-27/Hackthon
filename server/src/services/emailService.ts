export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: string;
  type: 'TICKET_CREATED' | 'STATUS_CHANGED' | 'OFFICER_ASSIGNED' | 'TOW_DISPATCHED' | 'OTP_VERIFICATION';
}

export const emailHistory: EmailLog[] = [];

export class EmailService {
  /**
   * Send Ticket Creation Confirmation
   */
  public static async sendTicketConfirmation(
    email: string,
    ticketId: string,
    issueType: string,
    location: string
  ): Promise<void> {
    const subject = `[TrafficMitra] Complaint Registered: ${ticketId} (${issueType.toUpperCase()})`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">TrafficMitra Nagpur</h1>
          <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Nagpur Municipal Corporation & Traffic Police</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Dear Citizen,</p>
          <p style="font-size: 15px; color: #334155;">Your civic grievance has been officially registered with the Nagpur Traffic & Municipal Control Room.</p>
          
          <div style="background-color: #f1f5f9; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Ticket Reference ID:</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0f172a; font-family: monospace;">${ticketId}</p>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: #334155;"><strong>Category:</strong> ${issueType.replace(/_/g, ' ').toUpperCase()}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155;"><strong>Location:</strong> ${location}</p>
          </div>

          <p style="font-size: 14px; color: #475569;">You can track real-time inspection, officer assignment, and resolution history directly online without requiring login.</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:5173/track/${ticketId}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">Track Complaint Timeline</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Nagpur Smart & Sustainable City Development Corp. Ltd. | Traffic Command Hotline: 1095 / 112
          </p>
        </div>
      </div>
    `;

    emailHistory.unshift({
      id: Math.random().toString(36).substring(2, 9),
      to: email,
      subject,
      html,
      sentAt: new Date().toISOString(),
      type: 'TICKET_CREATED'
    });
    console.log(`✉️ Email dispatched to ${email}: ${subject}`);
  }

  /**
   * Send Status Update Notification
   */
  public static async sendStatusUpdate(
    email: string,
    ticketId: string,
    newStatus: string,
    officerNote?: string
  ): Promise<void> {
    const subject = `[TrafficMitra] Status Update on Ticket ${ticketId}: ${newStatus.toUpperCase()}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">TrafficMitra Nagpur</h1>
          <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Official Status Notification</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Dear Citizen,</p>
          <p style="font-size: 15px; color: #334155;">The status of your registered grievance <strong>${ticketId}</strong> has been updated by Nagpur authorities:</p>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #047857; text-transform: uppercase; font-weight: 600;">Updated Status</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #065f46;">${newStatus.replace(/_/g, ' ').toUpperCase()}</p>
            ${officerNote ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #1e293b;"><strong>Officer Remarks:</strong> ${officerNote}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:5173/track/${ticketId}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">View Audit Timeline</a>
          </div>
        </div>
      </div>
    `;

    emailHistory.unshift({
      id: Math.random().toString(36).substring(2, 9),
      to: email,
      subject,
      html,
      sentAt: new Date().toISOString(),
      type: 'STATUS_CHANGED'
    });
    console.log(`✉️ Status email dispatched to ${email}: ${subject}`);
  }
}
