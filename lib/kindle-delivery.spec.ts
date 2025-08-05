import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KindleDeliveryService } from './kindle-delivery';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';

// Mock dependencies
vi.mock('nodemailer');
vi.mock('fs/promises');

const mockTransporter = {
  sendMail: vi.fn(),
  verify: vi.fn(),
};

// @ts-expect-error - mocking transporter for testing
vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter);

describe('KindleDeliveryService', () => {
  let service: KindleDeliveryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new KindleDeliveryService();
  });

  describe('sendToKindle', () => {
    it('should successfully send EPUB to Kindle', async () => {
      const mockFileBuffer = Buffer.from('epub content');
      vi.mocked(fs.readFile).mockResolvedValue(mockFileBuffer);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await service.sendToKindle(
        '/path/to/file.epub',
        'test@kindle.com',
        'Test Article'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMTP_USER,
        to: 'test@kindle.com',
        subject: 'ReadFlow: Test Article',
        text: expect.stringContaining('Test Article'),
        html: expect.stringContaining('Test Article'),
        attachments: [{
          filename: 'Test_Article.epub',
          content: mockFileBuffer,
          contentType: 'application/epub+zip',
        }],
      });
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFileBuffer = Buffer.from('epub content');
      vi.mocked(fs.readFile).mockResolvedValue(mockFileBuffer);
      
      // First call fails, second succeeds
      mockTransporter.sendMail
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ messageId: 'success-id' });

      const result = await service.sendToKindle(
        '/path/to/file.epub',
        'test@kindle.com',
        'Test Article'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('success-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const mockFileBuffer = Buffer.from('epub content');
      vi.mocked(fs.readFile).mockResolvedValue(mockFileBuffer);
      mockTransporter.sendMail.mockRejectedValue(new Error('Persistent error'));

      const result = await service.sendToKindle(
        '/path/to/file.epub',
        'test@kindle.com',
        'Test Article'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent error');
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3); // Max retries
    }, 10000); // 10 second timeout

    it('should handle file read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const result = await service.sendToKindle(
        '/path/to/nonexistent.epub',
        'test@kindle.com',
        'Test Article'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    }, 10000); // 10 second timeout

    it('should sanitize filename correctly', async () => {
      const mockFileBuffer = Buffer.from('epub content');
      vi.mocked(fs.readFile).mockResolvedValue(mockFileBuffer);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendToKindle(
        '/path/to/file.epub',
        'test@kindle.com',
        'Test: Article & More!'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [{
            filename: 'Test_Article_More.epub',
            content: mockFileBuffer,
            contentType: 'application/epub+zip',
          }],
        })
      );
    });
  });

  describe('validateKindleEmail', () => {
    it('should validate correct Kindle email', () => {
      expect(service.validateKindleEmail('user@kindle.com')).toBe(true);
      expect(service.validateKindleEmail('test123@kindle.com')).toBe(true);
      expect(service.validateKindleEmail('user.name@kindle.com')).toBe(true);
    });

    it('should reject invalid Kindle emails', () => {
      expect(service.validateKindleEmail('user@gmail.com')).toBe(false);
      expect(service.validateKindleEmail('user@kindle.co.uk')).toBe(false);
      expect(service.validateKindleEmail('invalid-email')).toBe(false);
      expect(service.validateKindleEmail('')).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await service.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await service.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize special characters', () => {
      const service = new KindleDeliveryService();
      // @ts-expect-error - accessing private method for testing
      const sanitize = service.sanitizeFileName;
      
      expect(sanitize('Test: Article')).toBe('Test_Article');
      expect(sanitize('Article & More!')).toBe('Article_More');
      expect(sanitize('Very/Long\\Title')).toBe('VeryLongTitle');
    });

    it('should limit filename length', () => {
      const service = new KindleDeliveryService();
      // @ts-expect-error - accessing private method for testing
      const sanitize = service.sanitizeFileName;
      
      const longTitle = 'Very long article title that exceeds the maximum allowed length';
      const result = sanitize(longTitle);
      
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should handle empty strings', () => {
      const service = new KindleDeliveryService();
      // @ts-expect-error - accessing private method for testing
      const sanitize = service.sanitizeFileName;
      
      expect(sanitize('')).toBe('');
    });
  });
});