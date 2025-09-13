import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface NotificationData {
  userId: string;
  userEmail: string;
  userName?: string;
  type: 'conversion_failed' | 'usage_limit_warning' | 'usage_limit_reached';
  data: Record<string, unknown>;
}

export class NotificationService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send conversion failure notification
   */
  async sendConversionFailureNotification(notification: NotificationData): Promise<void> {
    if (notification.type !== 'conversion_failed') return;

    const { userEmail, userName, data } = notification;
    const articleTitle = data.title || 'Unknown Article';
    const errorMessage = data.error || 'Unknown error occurred';

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: 'Link to Reader: Conversion Failed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc3545; margin: 0;">Conversion Failed ❌</h2>
            </div>
            
            <div style="padding: 20px 0;">
              <p>Hi ${userName || 'there'},</p>
              
              <p>We encountered an issue converting your article to EPUB format:</p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <strong>Article:</strong> ${articleTitle}<br>
                <strong>Error:</strong> ${errorMessage}
              </div>
              
              <p><strong>What to do next:</strong></p>
              <ul>
                <li>Try sharing the article again - sometimes temporary issues resolve themselves</li>
                <li>Make sure the article content is complete and properly formatted</li>
                <li>If the issue persists, please reply to this email for support</li>
              </ul>
              
              <p>We apologize for the inconvenience and appreciate your patience.</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px;">
              <p>Best regards,<br><strong>Link to Reader Team</strong></p>
              <p>Transform newsletters into distraction-free Kindle reading</p>
            </div>
          </div>
        `,
        text: `
Link to Reader: Conversion Failed

Hi ${userName || 'there'},

We encountered an issue converting your article "${articleTitle}" to EPUB format.

Error: ${errorMessage}

What to do next:
- Try sharing the article again - sometimes temporary issues resolve themselves
- Make sure the article content is complete and properly formatted  
- If the issue persists, please reply to this email for support

We apologize for the inconvenience and appreciate your patience.

Best regards,
Link to Reader Team
        `.trim(),
      });

      console.log(`Conversion failure notification sent to: ${userEmail}`);
    } catch (error) {
      console.error('Failed to send conversion failure notification:', error);
    }
  }

  /**
   * Send usage limit warning notification
   */
  async sendUsageLimitWarning(notification: NotificationData): Promise<void> {
    if (notification.type !== 'usage_limit_warning') return;

    const { userEmail, userName, data } = notification;
    const usagePercentage = data.usagePercentage || 0;
    const articlesUsed = data.articlesUsed || 0;
    const articlesLimit = data.articlesLimit || 0;
    const subscriptionTier = (data.subscriptionTier as string) || 'starter';

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: 'Link to Reader: Approaching Monthly Limit',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0;">Approaching Monthly Limit ⚠️</h2>
            </div>
            
            <div style="padding: 20px 0;">
              <p>Hi ${userName || 'there'},</p>
              
              <p>You're approaching your monthly article conversion limit:</p>
              
              <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <strong>Usage:</strong> ${articlesUsed} of ${articlesLimit} articles (${usagePercentage}%)<br>
                <strong>Current Plan:</strong> ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
              </div>
              
              <p>To continue converting articles this month, consider upgrading your plan:</p>
              <ul>
                <li><strong>Pro Plan:</strong> 300 articles/month for $7/month</li>
                <li><strong>Better Value:</strong> More articles per dollar</li>
              </ul>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/payment" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Upgrade Now
                </a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px;">
              <p>Best regards,<br><strong>Link to Reader Team</strong></p>
            </div>
          </div>
        `,
        text: `
Link to Reader: Approaching Monthly Limit

Hi ${userName || 'there'},

You're approaching your monthly article conversion limit:
- Usage: ${articlesUsed} of ${articlesLimit} articles (${usagePercentage}%)
- Current Plan: ${subscriptionTier}

To continue converting articles this month, consider upgrading to Pro:
- 300 articles/month for $7/month
- Better value with more articles per dollar

Upgrade at: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/payment

Best regards,
Link to Reader Team
        `.trim(),
      });

      console.log(`Usage warning notification sent to: ${userEmail}`);
    } catch (error) {
      console.error('Failed to send usage warning notification:', error);
    }
  }

  /**
   * Send usage limit reached notification
   */
  async sendUsageLimitReached(notification: NotificationData): Promise<void> {
    if (notification.type !== 'usage_limit_reached') return;

    const { userEmail, userName, data } = notification;
    const articlesLimit = data.articlesLimit || 0;
    const daysUntilReset = data.daysUntilReset || 0;
    const subscriptionTier = (data.subscriptionTier as string) || 'starter';

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: 'Link to Reader: Monthly Limit Reached',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #721c24; margin: 0;">Monthly Limit Reached 🚫</h2>
            </div>
            
            <div style="padding: 20px 0;">
              <p>Hi ${userName || 'there'},</p>
              
              <p>You've reached your monthly limit of ${articlesLimit} article conversions.</p>
              
              <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <strong>Current Plan:</strong> ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}<br>
                <strong>Limit Resets In:</strong> ${daysUntilReset} days
              </div>
              
              <p><strong>Options to continue reading:</strong></p>
              <ul>
                <li><strong>Upgrade to Pro:</strong> Get 300 articles/month immediately</li>
                <li><strong>Wait for reset:</strong> Your limit resets in ${daysUntilReset} days</li>
              </ul>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/payment" 
                   style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Upgrade to Pro
                </a>
              </div>
              
              <p>Thank you for being a Link to Reader user!</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px;">
              <p>Best regards,<br><strong>Link to Reader Team</strong></p>
            </div>
          </div>
        `,
        text: `
Link to Reader: Monthly Limit Reached

Hi ${userName || 'there'},

You've reached your monthly limit of ${articlesLimit} article conversions.

Current Plan: ${subscriptionTier}
Limit Resets In: ${daysUntilReset} days

Options to continue reading:
- Upgrade to Pro: Get 300 articles/month immediately  
- Wait for reset: Your limit resets in ${daysUntilReset} days

Upgrade at: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/payment

Thank you for being a Link to Reader user!

Best regards,
Link to Reader Team
        `.trim(),
      });

      console.log(`Usage limit reached notification sent to: ${userEmail}`);
    } catch (error) {
      console.error('Failed to send usage limit notification:', error);
    }
  }

  /**
   * Send notification based on type
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    switch (notification.type) {
      case 'conversion_failed':
        await this.sendConversionFailureNotification(notification);
        break;
      case 'usage_limit_warning':
        await this.sendUsageLimitWarning(notification);
        break;
      case 'usage_limit_reached':
        await this.sendUsageLimitReached(notification);
        break;
      default:
        console.warn(`Unknown notification type: ${notification.type}`);
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();