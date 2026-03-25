import { Inbound } from '@inboundemail/sdk';

// Email template utilities
const getBaseEmailStyles = () => `
  /* Reset and base styles */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
    line-height: 1.6; 
    color: #1a1a1a; 
    background-color: #f8fafc;
    margin: 0;
    padding: 0;
  }
  
  /* Container */
  .email-container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  /* Header */
  .header { 
    background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); 
    color: white; 
    padding: 40px 30px; 
    text-align: center; 
    position: relative;
  }
  
  .header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.3;
  }
  
  .header-content { position: relative; z-index: 1; }
  
  .logo { 
    font-size: 32px; 
    font-weight: 700; 
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  
  .header-subtitle { 
    font-size: 16px; 
    opacity: 0.9; 
    font-weight: 400;
  }
  
  /* Content */
  .content { 
    padding: 40px 30px; 
    background: #ffffff;
  }
  
  .greeting {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
  }
  
  .message {
    font-size: 16px;
    color: #475569;
    margin-bottom: 32px;
    line-height: 1.7;
  }
  
  /* CTA Button */
  .cta-container {
    text-align: center;
    margin: 32px 0;
  }
  
  .cta-button { 
    display: inline-block; 
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white; 
    padding: 16px 32px; 
    text-decoration: none; 
    border-radius: 12px; 
    font-weight: 600;
    font-size: 16px;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease;
    border: none;
  }
  
  .cta-button:hover { 
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
  
  /* Footer */
  .footer { 
    background: #f8fafc;
    padding: 30px;
    text-align: center; 
    border-top: 1px solid #e2e8f0;
  }
  
  .footer-text {
    color: #64748b; 
    font-size: 14px; 
    line-height: 1.6;
  }
  
  .footer-brand {
    font-weight: 600;
    color: #1e293b;
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    body { background-color: #0f172a; }
    .email-container { background-color: #1e293b; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); }
    .content { background: #1e293b; }
    .greeting { color: #f1f5f9; }
    .message { color: #cbd5e1; }
    .footer { background: #0f172a; border-color: #334155; }
    .footer-text { color: #94a3b8; }
    .footer-brand { color: #f1f5f9; }
  }
  
  /* Responsive */
  @media (max-width: 600px) {
    .email-container { margin: 0; border-radius: 0; }
    .header, .content, .footer { padding: 24px 20px; }
    .greeting { font-size: 20px; }
    .cta-button { padding: 14px 28px; font-size: 15px; }
  }
`;

const getEmailHeader = (title: string, subtitle: string, badge?: string) => `
  <div class="header">
    <div class="header-content">
      <div class="logo">⏰ Timeline</div>
      <div class="header-subtitle">${subtitle}</div>
      ${badge ? `<div class="success-badge">${badge}</div>` : ''}
    </div>
  </div>
`;

const getEmailFooter = () => `
  <div class="footer">
    <div class="footer-text">
      <p>Best regards,<br><span class="footer-brand">The Timeline Team</span></p>
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
        This email was sent by Timeline - Your Personal Task Management System
      </p>
    </div>
  </div>
`;

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  tags?: Array<{ name: string; value: string }>;
}

class InboundService {
  private inbound: Inbound | null = null;

  constructor() {
    const apiKey = process.env.INBOUND_API_KEY;
    if (apiKey) {
      this.inbound = new Inbound(apiKey);
    }
  }

  async sendEmail(opts: SendEmailOptions) {
    const { to, subject, text, html, tags = [] } = opts;

    if (!this.inbound) {
      console.log('[inbound.service] Inbound API key not configured. Falling back to console log.');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log(text || html || '');
      return { queued: true, simulated: true };
    }

    try {
      const from = process.env.INBOUND_FROM_EMAIL || process.env.EMAIL_FROM || `no-reply@${process.env.EMAIL_DOMAIN || 'localhost'}`;

      const { data, error } = await this.inbound.emails.send({
        from,
        to,
        subject,
        html: html || `<p>${text || ''}</p>`,
        text: text || '',
        tags: [
          { name: 'service', value: 'email-verification' },
          ...tags
        ]
      });

      if (error) {
        console.error('[inbound.service] Error sending email:', error);
        throw new Error(`Failed to send email: ${typeof error === 'string' ? error : 'Unknown error'}`);
      }

      console.log(`[inbound.service] Email sent successfully: ${data?.id}`);
      return {
        queued: true,
        messageId: data?.id,
        inboundId: data?.id,
        awsMessageId: data?.messageId
      };
    } catch (error: any) {
      console.error('[inbound.service] Failed to send email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(to: string, verificationUrl: string, userName?: string) {
    const subject = 'Verify your email address';
    const html = this.generateVerificationEmailHTML(verificationUrl, userName);
    const text = this.generateVerificationEmailText(verificationUrl, userName);

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'verification' },
        { name: 'user', value: to }
      ]
    });
  }


  private generateVerificationEmailHTML(verificationUrl: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <style>
            /* Reset and base styles */
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #1a1a1a; 
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            
            /* Container */
            .email-container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            
            /* Header */
            .header { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
              position: relative;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
              opacity: 0.3;
            }
            
            .header-content { position: relative; z-index: 1; }
            
            .logo { 
              font-size: 32px; 
              font-weight: 700; 
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            
            .header-subtitle { 
              font-size: 16px; 
              opacity: 0.9; 
              font-weight: 400;
            }
            
            /* Content */
            .content { 
              padding: 40px 30px; 
              background: #ffffff;
            }
            
            .greeting {
              font-size: 24px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 16px;
            }
            
            .message {
              font-size: 16px;
              color: #475569;
              margin-bottom: 32px;
              line-height: 1.7;
            }
            
            /* CTA Button */
            .cta-container {
              text-align: center;
              margin: 32px 0;
            }
            
            .cta-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 12px; 
              font-weight: 600;
              font-size: 16px;
              letter-spacing: 0.5px;
              box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
              transition: all 0.3s ease;
              border: none;
            }
            
            .cta-button:hover { 
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }
            
            /* Security notice */
            .security-notice {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
              text-align: center;
            }
            
            .security-notice .icon {
              font-size: 20px;
              margin-bottom: 8px;
            }
            
            .security-notice .text {
              font-size: 14px;
              color: #92400e;
              font-weight: 500;
            }
            
            /* Link fallback */
            .link-fallback {
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
            }
            
            .link-fallback .label {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 8px;
              font-weight: 500;
            }
            
            .link-fallback .url {
              word-break: break-all;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
              font-size: 12px;
              color: #475569;
              background: #ffffff;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            
            /* Footer */
            .footer { 
              background: #f8fafc;
              padding: 30px;
              text-align: center; 
              border-top: 1px solid #e2e8f0;
            }
            
            .footer-text {
              color: #64748b; 
              font-size: 14px; 
              line-height: 1.6;
            }
            
            .footer-brand {
              font-weight: 600;
              color: #1e293b;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              body { background-color: #0f172a; }
              .email-container { background-color: #1e293b; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); }
              .content { background: #1e293b; }
              .greeting { color: #f1f5f9; }
              .message { color: #cbd5e1; }
              .security-notice { background: #451a03; border-color: #d97706; }
              .security-notice .text { color: #fed7aa; }
              .link-fallback { background: #334155; border-color: #475569; }
              .link-fallback .label { color: #94a3b8; }
              .link-fallback .url { background: #1e293b; border-color: #475569; color: #cbd5e1; }
              .footer { background: #0f172a; border-color: #334155; }
              .footer-text { color: #94a3b8; }
              .footer-brand { color: #f1f5f9; }
            }
            
            /* Responsive */
            @media (max-width: 600px) {
              .email-container { margin: 0; border-radius: 0; }
              .header, .content, .footer { padding: 24px 20px; }
              .greeting { font-size: 20px; }
              .cta-button { padding: 14px 28px; font-size: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="header-content">
                <div class="logo">⏰ Timeline</div>
                <div class="header-subtitle">Your Personal Task Management System</div>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hi${userName ? ` ${userName}` : ''}! 👋</div>
              
              <div class="message">
                Welcome to Timeline! We're excited to have you on board. To complete your registration and start organizing your tasks like a pro, please verify your email address.
              </div>
              
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <div style="font-size: 16px; font-weight: 600; color: #0c4a6e; margin-bottom: 8px;">🚀 What's waiting for you:</div>
                <div style="font-size: 14px; color: #0369a1; line-height: 1.6;">
                  AI insights • Real-time collaboration • Smart task management • Biometric security
                </div>
              </div>
              
              <div class="cta-container">
                <a href="${verificationUrl}" class="cta-button">✨ Verify My Email</a>
              </div>
              
              <div class="security-notice">
                <div class="icon">🔒</div>
                <div class="text">This verification link will expire in 15 minutes for your security</div>
              </div>
              
              <div class="link-fallback">
                <div class="label">Button not working? Copy and paste this link:</div>
                <div class="url">${verificationUrl}</div>
              </div>
              
              <div class="message">
                If you didn't create an account with Timeline, you can safely ignore this email. No further action is required.
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                <p>Best regards,<br><span class="footer-brand">The Timeline Team</span></p>
                <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
                  This email was sent by Timeline - Your Personal Task Management System
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateVerificationEmailText(verificationUrl: string, userName?: string): string {
    return `
Hi${userName ? ` ${userName}` : ''}!

Thank you for signing up for Timeline. To complete your registration and start managing your tasks, please verify your email address by visiting this link:

${verificationUrl}

This link will expire in 15 minutes for security reasons.

If you didn't create an account with Timeline, you can safely ignore this email.

Best regards,
The Timeline Team

This email was sent by Timeline - Your Personal Task Management System
    `.trim();
  }



  isConfigured(): boolean {
    return !!this.inbound;
  }
}

export const inboundService = new InboundService();
export default inboundService;
