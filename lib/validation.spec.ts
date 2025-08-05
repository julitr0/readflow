import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  emailSchema,
  uuidSchema,
  urlSchema,
  emailReceiveSchema,
  conversionRequestSchema,
  userSettingsSchema,
  conversionFiltersSchema,
  validateRequest,
  validateMailgunSignature,
} from './validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow();
      expect(() => emailSchema.parse('user@domain.co.uk')).not.toThrow();
      expect(() => emailSchema.parse('name+tag@example.org')).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
      expect(() => emailSchema.parse('test@')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
      expect(() => emailSchema.parse('')).toThrow();
    });
  });

  describe('uuidSchema', () => {
    it('should validate correct UUIDs', () => {
      const uuid = '12345678-1234-1234-1234-123456789012';
      expect(() => uuidSchema.parse(uuid)).not.toThrow();
    });

    it('should reject invalid UUIDs', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
      expect(() => uuidSchema.parse('12345678-1234-1234-1234')).toThrow();
      expect(() => uuidSchema.parse('')).toThrow();
    });
  });

  describe('urlSchema', () => {
    it('should validate correct URLs', () => {
      expect(() => urlSchema.parse('https://example.com')).not.toThrow();
      expect(() => urlSchema.parse('http://test.co.uk/path?query=1')).not.toThrow();
    });

    it('should reject invalid URLs', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow();
      expect(() => urlSchema.parse('ftp://example.com')).toThrow();
      expect(() => urlSchema.parse('')).toThrow();
    });
  });

  describe('emailReceiveSchema', () => {
    it('should validate correct Mailgun webhook data', () => {
      const validData = {
        'From': 'sender@example.com',
        'To': 'recipient@example.com',
        'Subject': 'Test Subject',
        'body-html': '<p>Test content with enough characters</p>',
        'timestamp': '1234567890',
        'token': 'test-token',
        'signature': 'test-signature',
      };

      expect(() => emailReceiveSchema.parse(validData)).not.toThrow();
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        'From': 'sender@example.com',
        'Subject': 'Test Subject',
        // Missing 'To', 'body-html', etc.
      };

      expect(() => emailReceiveSchema.parse(invalidData)).toThrow();
    });

    it('should reject data with short body content', () => {
      const invalidData = {
        'From': 'sender@example.com',
        'To': 'recipient@example.com',
        'Subject': 'Test Subject',
        'body-html': 'short', // Too short
        'timestamp': '1234567890',
        'token': 'test-token',
        'signature': 'test-signature',
      };

      expect(() => emailReceiveSchema.parse(invalidData)).toThrow();
    });
  });

  describe('conversionRequestSchema', () => {
    it('should validate correct conversion request', () => {
      const validData = {
        htmlContent: '<p>Test content with enough characters for validation</p>',
        sourceUrl: 'https://example.com/article',
        customMetadata: {
          title: 'Custom Title',
          author: 'Test Author',
        },
      };

      expect(() => conversionRequestSchema.parse(validData)).not.toThrow();
    });

    it('should reject data with short HTML content', () => {
      const invalidData = {
        htmlContent: 'short', // Too short
      };

      expect(() => conversionRequestSchema.parse(invalidData)).toThrow();
    });

    it('should accept minimal valid data', () => {
      const minimalData = {
        htmlContent: '<p>Valid content length for testing purposes</p>',
      };

      expect(() => conversionRequestSchema.parse(minimalData)).not.toThrow();
    });
  });

  describe('userSettingsSchema', () => {
    it('should validate correct user settings', () => {
      const validData = {
        kindleEmail: 'user@kindle.com',
        personalEmail: 'user@example.com',
        notificationsEnabled: true,
        autoDelivery: false,
      };

      expect(() => userSettingsSchema.parse(validData)).not.toThrow();
    });

    it('should apply default values', () => {
      const minimalData = {
        kindleEmail: 'user@kindle.com',
      };

      const result = userSettingsSchema.parse(minimalData);
      expect(result.notificationsEnabled).toBe(true);
      expect(result.autoDelivery).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      const invalidData = {
        kindleEmail: 'invalid-email',
      };

      expect(() => userSettingsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('conversionFiltersSchema', () => {
    it('should validate correct filter parameters', () => {
      const validData = {
        page: '2',
        limit: '50',
        status: 'completed',
        search: 'test query',
      };

      const result = conversionFiltersSchema.parse(validData);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.status).toBe('completed');
      expect(result.search).toBe('test query');
    });

    it('should apply default values', () => {
      const result = conversionFiltersSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should reject invalid status values', () => {
      const invalidData = {
        status: 'invalid-status',
      };

      expect(() => conversionFiltersSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid page/limit values', () => {
      expect(() => conversionFiltersSchema.parse({ page: '0' })).toThrow();
      expect(() => conversionFiltersSchema.parse({ page: 'abc' })).toThrow();
      expect(() => conversionFiltersSchema.parse({ limit: '101' })).toThrow();
    });
  });
});

describe('Validation Middleware', () => {
  describe('validateRequest', () => {
    it('should validate JSON body correctly', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          htmlContent: '<p>Valid HTML content for testing purposes</p>',
        }),
      } as unknown as NextRequest;

      const validator = validateRequest(conversionRequestSchema, 'body');
      const result = await validator(mockRequest);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.htmlContent).toBe('<p>Valid HTML content for testing purposes</p>');
      }
    });

    it('should validate query parameters correctly', async () => {
      const mockRequest = {
        url: 'https://example.com/api?page=2&limit=10&status=completed',
      } as NextRequest;

      const validator = validateRequest(conversionFiltersSchema, 'query');
      const result = await validator(mockRequest);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
        expect(result.data.status).toBe('completed');
      }
    });

    it('should return validation error for invalid data', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          htmlContent: 'short', // Too short
        }),
      } as unknown as NextRequest;

      const validator = validateRequest(conversionRequestSchema, 'body');
      const result = await validator(mockRequest);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
      }
    });

    it('should handle JSON parsing errors', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const validator = validateRequest(conversionRequestSchema, 'body');
      const result = await validator(mockRequest);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
      }
    });
  });
});

describe('validateMailgunSignature', () => {
  it('should validate correct Mailgun signature', () => {
    // This is a simplified test - in real usage, you'd test with actual signature calculation
    const timestamp = '1234567890';
    const token = 'test-token';
    const webhookKey = 'test-webhook-key';
    
    // Calculate the expected signature using the same logic
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const data = timestamp + token;
    const expectedSignature = crypto
      .createHmac('sha256', webhookKey)
      .update(data)
      .digest('hex');

    const result = validateMailgunSignature(timestamp, token, expectedSignature, webhookKey);
    expect(result).toBe(true);
  });

  it('should reject incorrect Mailgun signature', () => {
    const timestamp = '1234567890';
    const token = 'test-token';
    const wrongSignature = 'definitely-wrong-signature';
    const webhookKey = 'test-webhook-key';

    const result = validateMailgunSignature(timestamp, token, wrongSignature, webhookKey);
    expect(result).toBe(false);
  });

  it('should handle crypto errors gracefully', () => {
    // Test with invalid webhook key to trigger error handling
    const timestamp = '1234567890';
    const token = 'test-token';
    const signature = 'test-signature';
    const invalidWebhookKey = ''; // Empty key should cause issues

    const result = validateMailgunSignature(timestamp, token, signature, invalidWebhookKey);
    // Should return false rather than throwing
    expect(typeof result).toBe('boolean');
  });
});