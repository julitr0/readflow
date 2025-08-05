import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import fs from 'fs/promises';

export interface DeliveryResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export class KindleDeliveryService {
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
   * Send EPUB file to Kindle email address
   */
  async sendToKindle(
    filePath: string,
    kindleEmail: string,
    title: string
  ): Promise<DeliveryResult> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Read the file
        const fileBuffer = await fs.readFile(filePath);
        const fileName = `${this.sanitizeFileName(title)}.epub`;

        // Send email with attachment
        const result = await this.transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: kindleEmail,
          subject: `ReadFlow: ${title}`,
          text: `Your article "${title}" has been converted and is ready to read on your Kindle.\n\nEnjoy distraction-free reading!\n\n-- ReadFlow`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2>Your article is ready! 📚</h2>
              <p>We've converted "<strong>${title}</strong>" and it's attached to this email.</p>
              <p>The file will automatically appear in your Kindle library shortly.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">
                Enjoy distraction-free reading!<br>
                <strong>ReadFlow</strong> - Transform newsletters into Kindle reading
              </p>
            </div>
          `,
          attachments: [
            {
              filename: fileName,
              content: fileBuffer,
              contentType: 'application/epub+zip',
            },
          ],
        });

        console.log(`Kindle delivery successful: ${result.messageId}`);
        return {
          success: true,
          messageId: result.messageId,
        };

      } catch (error) {
        console.error(`Kindle delivery attempt ${attempt} failed:`, error);

        if (attempt === maxAttempts) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Delivery failed',
          };
        }

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    return {
      success: false,
      error: 'Max delivery attempts exceeded',
    };
  }

  /**
   * Validate Kindle email address format
   */
  validateKindleEmail(email: string): boolean {
    const kindleEmailRegex = /^[a-zA-Z0-9._%+-]+@kindle\.com$/;
    return kindleEmailRegex.test(email);
  }

  /**
   * Sanitize filename for safe use
   */
  private sanitizeFileName(title: string): string {
    return title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .slice(0, 50) // Limit length
      .trim();
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const kindleDelivery = new KindleDeliveryService();

// Convenience function for backward compatibility
export async function sendToKindle(
  filePath: string,
  kindleEmail: string,
  title: string
): Promise<DeliveryResult> {
  return kindleDelivery.sendToKindle(filePath, kindleEmail, title);
}