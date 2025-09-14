import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { simpleParser, ParsedMail, Attachment } from "mailparser";
import type { Readable } from "stream";

export interface SESEmailData {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  date: Date;
  attachments: Attachment[];
}

export interface S3EmailLocation {
  bucket: string;
  key: string;
  region?: string;
}

export class SESS3EmailProcessor {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    const region = process.env.AWS_REGION || "us-east-1";
    this.bucketName = process.env.AWS_S3_EMAIL_BUCKET || "";

    if (!this.bucketName) {
      throw new Error("AWS_S3_EMAIL_BUCKET environment variable is required");
    }

    this.s3Client = new S3Client({
      region,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  /**
   * Fetch and parse an email from S3
   * RF-1: Handle malformed HTML gracefully and log conversion failures
   */
  async fetchAndParseEmail(
    location: S3EmailLocation,
  ): Promise<SESEmailData | null> {
    try {
      console.log(`Fetching email from S3: ${location.bucket}/${location.key}`);

      // Fetch the raw email from S3
      const command = new GetObjectCommand({
        Bucket: location.bucket || this.bucketName,
        Key: location.key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        console.error("No email body found in S3 object");
        return null;
      }

      // Convert the S3 stream to a buffer
      const emailBuffer = await this.streamToBuffer(response.Body as Readable);

      // Parse the MIME email
      const parsed = await this.parseEmail(emailBuffer);

      if (!parsed) {
        return null;
      }

      return this.extractEmailData(parsed, location.key);
    } catch (error) {
      console.error("Error fetching email from S3:", error);
      // RF-1: Log conversion failures gracefully
      if (error instanceof Error) {
        console.error(
          `Failed to process email ${location.key}: ${error.message}`,
        );
      }
      return null;
    }
  }

  /**
   * Parse raw MIME email content
   * RF-3: Support major newsletter platforms
   */
  private async parseEmail(emailBuffer: Buffer): Promise<ParsedMail | null> {
    try {
      const parsed = await simpleParser(emailBuffer);
      return parsed;
    } catch (error) {
      console.error("Error parsing MIME email:", error);
      return null;
    }
  }

  /**
   * Extract structured data from parsed email
   * RF-2: Preserve article metadata (title, author, date)
   */
  private extractEmailData(
    parsed: ParsedMail,
    messageId: string,
  ): SESEmailData {
    // Extract sender
    let from = "unknown@unknown.com";
    if (parsed.from) {
      if (Array.isArray(parsed.from)) {
        from = parsed.from[0]?.text || from;
      } else {
        from = parsed.from.text || from;
      }
    }

    // Extract recipient
    let to = "";
    if (parsed.to) {
      if (Array.isArray(parsed.to)) {
        to = parsed.to[0]?.text || "";
      } else {
        to = parsed.to.text || "";
      }
    }

    // Get HTML body, fallback to text if HTML not available
    let htmlBody = parsed.html || "";

    // If no HTML body, convert text to HTML
    if (!htmlBody && parsed.text) {
      htmlBody = this.textToHtml(parsed.text);
    }

    // Clean up the HTML for better processing
    htmlBody = this.cleanHtmlContent(htmlBody);

    return {
      messageId: messageId.replace(".eml", ""),
      from,
      to,
      subject: parsed.subject || "No Subject",
      htmlBody,
      textBody: parsed.text || "",
      date: parsed.date || new Date(),
      attachments: parsed.attachments || [],
    };
  }

  /**
   * Convert plain text to basic HTML
   */
  private textToHtml(text: string): string {
    const paragraphs = text.split(/\n\n+/);
    const htmlParagraphs = paragraphs.map(
      (p) => `<p>${p.replace(/\n/g, "<br>")}</p>`,
    );
    return htmlParagraphs.join("\n");
  }

  /**
   * Clean HTML content for processing
   * RF-3: Handle newsletter platform-specific formatting
   */
  private cleanHtmlContent(html: string): string {
    // Remove tracking pixels
    html = html.replace(/<img[^>]*\bheight=["']?1["']?[^>]*>/gi, "");
    html = html.replace(/<img[^>]*\bwidth=["']?1["']?[^>]*>/gi, "");

    // Remove common newsletter footer tracking elements
    html = html.replace(
      /<!-- tracking-pixel -->[\s\S]*?<!-- \/tracking-pixel -->/gi,
      "",
    );

    // Clean up excessive whitespace
    html = html.replace(/\s+/g, " ");
    html = html.replace(/>\s+</g, "><");

    return html.trim();
  }

  /**
   * Delete an email from S3 after successful processing
   * RF-11: Never store email content permanently
   */
  async deleteEmail(location: S3EmailLocation): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: location.bucket || this.bucketName,
        Key: location.key,
      });

      await this.s3Client.send(command);
      console.log(`Deleted email from S3: ${location.key}`);
      return true;
    } catch (error) {
      console.error("Error deleting email from S3:", error);
      return false;
    }
  }

  /**
   * Convert S3 stream to buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  /**
   * Extract S3 location from SES event
   */
  extractS3LocationFromSESEvent(sesEvent: any): S3EmailLocation | null {
    try {
      // Handle both direct SES events and SNS-wrapped SES events
      const mail = sesEvent.mail || sesEvent.Mail;
      const messageId = mail?.messageId || mail?.MessageId;

      if (!messageId) {
        console.error("No messageId found in SES event");
        return null;
      }

      // SES stores emails with messageId as the key
      return {
        bucket: this.bucketName,
        key: messageId,
        region: process.env.AWS_REGION || "us-east-1",
      };
    } catch (error) {
      console.error("Error extracting S3 location from SES event:", error);
      return null;
    }
  }

  /**
   * Validate that the email should be processed
   */
  validateEmailForProcessing(emailData: SESEmailData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for minimum content
    if (!emailData.htmlBody && !emailData.textBody) {
      errors.push("Email has no content");
    }

    // Check for valid recipient (should be @linktoreader.com)
    if (!emailData.to.includes("@linktoreader.com")) {
      errors.push("Email not addressed to linktoreader.com");
    }

    // Check for spam indicators
    if (emailData.subject.toLowerCase().includes("[spam]")) {
      errors.push("Email marked as spam");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance - lazy initialization
let _instance: SESS3EmailProcessor | null = null;

export const sesS3Processor = {
  get instance(): SESS3EmailProcessor {
    if (!_instance) {
      _instance = new SESS3EmailProcessor();
    }
    return _instance;
  },

  // Proxy methods to maintain backward compatibility
  fetchAndParseEmail: (location: S3EmailLocation) =>
    sesS3Processor.instance.fetchAndParseEmail(location),

  deleteEmail: (location: S3EmailLocation) =>
    sesS3Processor.instance.deleteEmail(location),

  extractS3LocationFromSESEvent: (sesEvent: any) =>
    sesS3Processor.instance.extractS3LocationFromSESEvent(sesEvent),

  validateEmailForProcessing: (emailData: SESEmailData) =>
    sesS3Processor.instance.validateEmailForProcessing(emailData),
};
