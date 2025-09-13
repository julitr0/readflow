import { describe, it, expect, vi, beforeEach } from "vitest";
import { contentConverter, ConversionMetadata } from "./conversion";
import fs from "fs/promises";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import type { ChildProcess } from "child_process";

// Mock process interface
interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

// Mock dependencies
vi.mock("fs/promises");
vi.mock("child_process");
vi.mock("os", () => ({
  default: {
    tmpdir: () => "/tmp",
  },
  tmpdir: () => "/tmp",
}));
vi.mock("./constants", () => ({
  SYSTEM_FONT_STACK:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  MONOSPACE_FONT_STACK: '"Courier New", monospace',
}));

// Mock spawn to return a controllable EventEmitter
const mockSpawn = vi.mocked(spawn);

describe("ContentConverter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractMetadata", () => {
    it("should extract basic metadata from HTML", () => {
      const html = `
        <html>
          <head>
            <title>Test Article</title>
            <meta name="author" content="John Doe">
            <meta name="date" content="2025-01-01">
          </head>
          <body>
            <p>This is a test article with some content to count words.</p>
          </body>
        </html>
      `;

      const result = contentConverter.extractMetadata(html);

      expect(result.title).toBe("Test Article");
      expect(result.author).toBe("John Doe");
      expect(result.date).toBe("2025-01-01");
      expect(result.wordCount).toBe(11);
      expect(result.readingTime).toBe(1);
    });

    it("should handle missing title gracefully", () => {
      const html = `
        <html>
          <body>
            <h1>Fallback Title</h1>
            <p>Content here.</p>
          </body>
        </html>
      `;

      const result = contentConverter.extractMetadata(html);
      expect(result.title).toBe("Fallback Title");
    });

    it("should calculate reading time correctly", () => {
      const longContent = "word ".repeat(400); // 400 words
      const html = `
        <html>
          <head><title>Long Article</title></head>
          <body><p>${longContent}</p></body>
        </html>
      `;

      const result = contentConverter.extractMetadata(html);
      expect(result.wordCount).toBe(400);
      expect(result.readingTime).toBe(2); // 400/200 = 2 minutes
    });

    it("should handle empty content", () => {
      const html =
        "<html><head><title>Empty</title></head><body></body></html>";

      const result = contentConverter.extractMetadata(html);
      expect(result.wordCount).toBe(1);
      expect(result.readingTime).toBe(1); // Minimum 1 minute
    });
  });

  describe("validateContent", () => {
    it("should validate correct content", () => {
      const html = `
        <html>
          <body>
            <p>This is valid content with enough words to pass validation checks.</p>
          </body>
        </html>
      `;

      const result = contentConverter.validateContent(html);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty content", () => {
      const result = contentConverter.validateContent("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Content is empty");
    });

    it("should reject content that is too large", () => {
      const largeContent = "a".repeat(1000001); // Over 1MB
      const result = contentConverter.validateContent(largeContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Content is too large");
    });

    it("should reject content that is too short", () => {
      const html = "<html><body><p>Short</p></body></html>";
      const result = contentConverter.validateContent(html);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Content is too short (minimum 10 words)",
      );
    });

    it("should accumulate multiple errors", () => {
      const result = contentConverter.validateContent("");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("convertHtmlToKindle", () => {
    const mockMetadata: ConversionMetadata = {
      title: "Test Article",
      author: "Test Author",
      date: "2025-01-01",
      source: "test-source",
      wordCount: 100,
      readingTime: 1,
    };

    beforeEach(() => {
      // Mock fs operations
      vi.mocked(fs.mkdtemp).mockResolvedValue("/tmp/readflow-test");
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("epub content"));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue();
      vi.mocked(fs.rm).mockResolvedValue();
      vi.mocked(fs.mkdtemp).mockResolvedValue("/tmp/readflow-test");
    });

    it("should successfully convert HTML to EPUB", async () => {
      // Mock successful Calibre execution
      const mockProcess = new EventEmitter() as MockChildProcess;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockSpawn.mockReturnValue(mockProcess as ChildProcess);

      const html =
        "<html><body><p>Test content for conversion</p></body></html>";

      // Start the conversion
      const conversionPromise = contentConverter.convertHtmlToKindle(
        html,
        mockMetadata,
      );

      // Simulate successful Calibre execution
      setTimeout(() => {
        mockProcess.emit("close", 0);
      }, 10);

      const result = await conversionPromise;

      expect(result.success).toBe(true);
      expect(result.fileUrl).toContain("Test_Article.epub");
      expect(result.metadata).toEqual(mockMetadata);
      expect(result.fileSize).toBe(12); // Length of 'epub content'
    });

    it("should handle Calibre conversion failure", async () => {
      // Mock failed Calibre execution
      const mockProcess = new EventEmitter() as MockChildProcess;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockSpawn.mockReturnValue(mockProcess as ChildProcess);

      const html = "<html><body><p>Test content</p></body></html>";

      const conversionPromise = contentConverter.convertHtmlToKindle(
        html,
        mockMetadata,
      );

      // Simulate failed Calibre execution
      setTimeout(() => {
        mockProcess.stderr.emit("data", "Calibre error message");
        mockProcess.emit("close", 1);
      }, 10);

      const result = await conversionPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unable to convert article format");
    });

    it("should handle filesystem errors", async () => {
      // Mock filesystem error
      vi.mocked(fs.mkdtemp).mockRejectedValue(new Error("Filesystem error"));

      const html = "<html><body><p>Test content</p></body></html>";
      const result = await contentConverter.convertHtmlToKindle(
        html,
        mockMetadata,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Filesystem error");
    });

    it("should clean up temporary files even on error", async () => {
      // Mock error after temp directory creation
      vi.mocked(fs.mkdtemp).mockResolvedValue("/tmp/readflow-test");
      vi.mocked(fs.writeFile).mockRejectedValue(new Error("Write error"));

      const html = "<html><body><p>Test content</p></body></html>";
      await contentConverter.convertHtmlToKindle(html, mockMetadata);

      // Verify cleanup was attempted
      expect(fs.rm).toHaveBeenCalledWith("/tmp/readflow-test", {
        recursive: true,
        force: true,
      });
    });
  });

  describe("sanitizeFileName", () => {
    it("should sanitize special characters", () => {
      const converter = contentConverter;
      const result = converter.sanitizeFileName("Test: Article & More!");
      expect(result).toBe("Test_Article_More");
    });

    it("should limit filename length", () => {
      const converter = contentConverter;
      const longTitle =
        "Very long title that exceeds the maximum length limit for filenames";
      const result = converter.sanitizeFileName(longTitle);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it("should handle empty strings", () => {
      const converter = contentConverter;
      const result = converter.sanitizeFileName("");
      expect(result).toBe("");
    });
  });
});
