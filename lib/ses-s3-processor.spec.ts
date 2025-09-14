import { describe, it, expect, vi, beforeEach } from "vitest";
import { SESS3EmailProcessor } from "./ses-s3-processor";
import { S3Client } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";

// Mock AWS SDK
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

// Mock mailparser
vi.mock("mailparser", () => ({
  simpleParser: vi.fn(),
}));

describe("SESS3EmailProcessor", () => {
  let processor: SESS3EmailProcessor;
  let mockS3Send: ReturnType<typeof vi.fn>;

  const mockEmailBuffer = Buffer.from(`From: sender@example.com
To: user123@linktoreader.com
Subject: Test Newsletter
Content-Type: text/html; charset=UTF-8
Date: Mon, 14 Sep 2025 10:00:00 GMT

<html><body><h1>Test Article</h1><p>This is test content with at least 100 words to pass validation. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p></body></html>`);

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables
    process.env.AWS_S3_EMAIL_BUCKET = "test-bucket";
    process.env.AWS_REGION = "us-east-1";

    // Mock S3 client
    mockS3Send = vi.fn();
    (S3Client as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      send: mockS3Send,
    }));

    processor = new SESS3EmailProcessor();
  });

  describe("fetchAndParseEmail", () => {
    it("should fetch and parse email from S3 successfully", async () => {
      // Mock S3 response
      const mockStream = {
        on: vi.fn((event: string, callback: (data?: Buffer) => void) => {
          if (event === "data") {
            callback(mockEmailBuffer);
          } else if (event === "end") {
            callback();
          }
          return mockStream;
        }),
      };

      mockS3Send.mockResolvedValue({
        Body: mockStream,
      });

      // Mock mailparser
      (simpleParser as ReturnType<typeof vi.fn>).mockResolvedValue({
        from: { text: "sender@example.com" },
        to: { text: "user123@linktoreader.com" },
        subject: "Test Newsletter",
        html: "<html><body><h1>Test Article</h1><p>Test content...</p></body></html>",
        text: "Test Article\nTest content...",
        date: new Date("2025-09-14T10:00:00Z"),
        attachments: [],
      });

      const result = await processor.fetchAndParseEmail({
        bucket: "test-bucket",
        key: "test-message-id",
      });

      expect(result).toBeTruthy();
      expect(result?.from).toBe("sender@example.com");
      expect(result?.to).toBe("user123@linktoreader.com");
      expect(result?.subject).toBe("Test Newsletter");
      expect(result?.htmlBody).toContain("<h1>Test Article</h1>");
      expect(result?.messageId).toBe("test-message-id");
    });

    it("should handle S3 fetch errors gracefully", async () => {
      mockS3Send.mockRejectedValue(new Error("S3 fetch failed"));

      const result = await processor.fetchAndParseEmail({
        bucket: "test-bucket",
        key: "test-message-id",
      });

      expect(result).toBeNull();
    });

    it("should handle malformed emails gracefully", async () => {
      const mockStream = {
        on: vi.fn((event: string, callback: (data?: Buffer) => void) => {
          if (event === "data") {
            callback(Buffer.from("invalid email content"));
          } else if (event === "end") {
            callback();
          }
          return mockStream;
        }),
      };

      mockS3Send.mockResolvedValue({
        Body: mockStream,
      });

      (simpleParser as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Invalid MIME"));

      const result = await processor.fetchAndParseEmail({
        bucket: "test-bucket",
        key: "test-message-id",
      });

      expect(result).toBeNull();
    });
  });

  describe("validateEmailForProcessing", () => {
    it("should validate email with valid content", () => {
      const emailData = {
        messageId: "test-id",
        from: "sender@example.com",
        to: "user@linktoreader.com",
        subject: "Valid Newsletter",
        htmlBody: "<p>Content</p>",
        textBody: "Content",
        date: new Date(),
        attachments: [],
      };

      const result = processor.validateEmailForProcessing(emailData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject email without content", () => {
      const emailData = {
        messageId: "test-id",
        from: "sender@example.com",
        to: "user@linktoreader.com",
        subject: "Empty Newsletter",
        htmlBody: "",
        textBody: "",
        date: new Date(),
        attachments: [],
      };

      const result = processor.validateEmailForProcessing(emailData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Email has no content");
    });

    it("should reject email not addressed to linktoreader.com", () => {
      const emailData = {
        messageId: "test-id",
        from: "sender@example.com",
        to: "user@otherdomain.com",
        subject: "Wrong Domain",
        htmlBody: "<p>Content</p>",
        textBody: "Content",
        date: new Date(),
        attachments: [],
      };

      const result = processor.validateEmailForProcessing(emailData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Email not addressed to linktoreader.com",
      );
    });

    it("should reject spam emails", () => {
      const emailData = {
        messageId: "test-id",
        from: "spammer@example.com",
        to: "user@linktoreader.com",
        subject: "[SPAM] Buy Now!",
        htmlBody: "<p>Spam content</p>",
        textBody: "Spam content",
        date: new Date(),
        attachments: [],
      };

      const result = processor.validateEmailForProcessing(emailData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Email marked as spam");
    });
  });

  describe("deleteEmail", () => {
    it("should delete email from S3 successfully", async () => {
      mockS3Send.mockResolvedValue({});

      const result = await processor.deleteEmail({
        bucket: "test-bucket",
        key: "test-message-id",
      });

      expect(result).toBe(true);
      expect(mockS3Send).toHaveBeenCalled();
    });

    it("should handle deletion errors gracefully", async () => {
      mockS3Send.mockRejectedValue(new Error("Delete failed"));

      const result = await processor.deleteEmail({
        bucket: "test-bucket",
        key: "test-message-id",
      });

      expect(result).toBe(false);
    });
  });

  describe("extractS3LocationFromSESEvent", () => {
    it("should extract S3 location from SES event", () => {
      const sesEvent = {
        mail: {
          messageId: "test-message-id-123",
        },
      };

      const result = processor.extractS3LocationFromSESEvent(sesEvent);

      expect(result).toEqual({
        bucket: "test-bucket",
        key: "test-message-id-123",
        region: "us-east-1",
      });
    });

    it("should handle alternative SES event structure", () => {
      const sesEvent = {
        Mail: {
          MessageId: "test-message-id-456",
        },
      };

      const result = processor.extractS3LocationFromSESEvent(sesEvent);

      expect(result).toEqual({
        bucket: "test-bucket",
        key: "test-message-id-456",
        region: "us-east-1",
      });
    });

    it("should return null for invalid SES event", () => {
      const sesEvent = {
        invalid: "structure",
      };

      const result = processor.extractS3LocationFromSESEvent(sesEvent);

      expect(result).toBeNull();
    });
  });
});
