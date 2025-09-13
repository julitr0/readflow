import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { usageTracker } from '@/lib/usage-tracker';
import { contentConverter } from '@/lib/conversion';
import crypto from 'crypto';

// Mock dependencies
vi.mock('@/db/drizzle');
vi.mock('@/lib/usage-tracker');
vi.mock('@/lib/conversion');
vi.mock('crypto');

const mockDb = vi.mocked(db);
const mockUsageTracker = vi.mocked(usageTracker);
const mockContentConverter = vi.mocked(contentConverter);

describe('/api/email/receive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock crypto.randomUUID
    vi.mocked(crypto.randomUUID).mockReturnValue('12345678-1234-1234-1234-123456789012');
    
    // Mock environment variables
    process.env.AWS_SES_WEBHOOK_SECRET = 'test-webhook-secret';
  });

  const createMockRequest = (formData: Record<string, string>, headers: Record<string, string> = {}) => {
    const mockFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      mockFormData.append(key, value);
    });

    return {
      formData: vi.fn().mockResolvedValue(mockFormData),
      headers: {
        get: vi.fn((name: string) => headers[name] || null),
      },
    } as unknown as NextRequest;
  };

  const mockValidHeaders = {
    'X-Amz-Sns-Message-Type': 'Notification',
    'X-Amz-Sns-Message-Id': 'test-message-id',
    'X-Amz-Sns-Topic-Arn': 'arn:aws:sns:us-east-1:123456789012:ses-topic',
  };

  it.skip('should successfully process valid email - TODO: Update for AWS SES', async () => {
    const request = createMockRequest({
      recipient: 'user123@linktoreader.com',
      sender: 'newsletter@example.com',
      'body-html': '<html><body><h1>Test Article</h1><p>Content here with enough words to pass validation checks.</p></body></html>',
    }, mockValidHeaders);

    // Mock signature verification
    const hmacMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('valid-signature'),
    };
    // @ts-expect-error - mocking crypto for testing
    vi.spyOn(crypto, 'createHmac').mockReturnValue(hmacMock);

    // Mock database queries
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        userId: 'test-user-id',
        kindleEmail: 'test@kindle.com',
        personalEmail: 'user123@linktoreader.com',
      }]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: '12345678-1234-1234-1234-123456789012' }]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Mock usage tracker
    mockUsageTracker.canUserConvert.mockResolvedValue({ canConvert: true });
    mockUsageTracker.trackConversion.mockResolvedValue();
    mockUsageTracker.checkAndSendUsageAlerts.mockResolvedValue();

    // Mock content converter
    mockContentConverter.validateContent.mockReturnValue({
      isValid: true,
      errors: [],
    });
    mockContentConverter.extractMetadata.mockReturnValue({
      title: 'Test Article',
      author: 'Unknown Author',
      date: new Date().toISOString(),
      source: 'newsletter@example.com',
      wordCount: 10,
      readingTime: 1,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.conversionId).toBe('12345678-1234-1234-1234-123456789012');
    expect(mockUsageTracker.canUserConvert).toHaveBeenCalledWith('test-user-id');
    expect(mockUsageTracker.trackConversion).toHaveBeenCalledWith('test-user-id', '12345678-1234-1234-1234-123456789012');
  });

  it.skip('should reject invalid signature - TODO: Update for AWS SES', async () => {
    const request = createMockRequest({
      recipient: 'user123@linktoreader.com',
      sender: 'newsletter@example.com',
      'body-html': '<html><body><h1>Test</h1></body></html>',
    }, {
      'X-Amz-Sns-Message-Type': 'Notification',
      'X-Amz-Sns-Message-Id': 'invalid-message-id',
      'X-Amz-Sns-Topic-Arn': 'arn:aws:sns:us-east-1:123456789012:ses-topic',
    });

    // Mock signature verification failure
    const hmacMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('different-signature'),
    };
    // @ts-expect-error - mocking crypto for testing
    vi.spyOn(crypto, 'createHmac').mockReturnValue(hmacMock);

    const response = await POST(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid signature');
  });

  it.skip('should reject when user not found - TODO: Update for AWS SES', async () => {
    const request = createMockRequest({
      recipient: 'nonexistent@linktoreader.com',
      sender: 'newsletter@example.com',
      'body-html': '<html><body><h1>Test</h1></body></html>',
    }, mockValidHeaders);

    // Mock valid signature
    const hmacMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('valid-signature'),
    };
    // @ts-expect-error - mocking crypto for testing
    vi.spyOn(crypto, 'createHmac').mockReturnValue(hmacMock);

    // Mock user not found
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No user found
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const response = await POST(request);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  it.skip('should reject when Kindle email not configured - TODO: Update for AWS SES', async () => {
    const request = createMockRequest({
      recipient: 'user123@linktoreader.com',
      sender: 'newsletter@example.com',
      'body-html': '<html><body><h1>Test</h1></body></html>',
    }, mockValidHeaders);

    // Mock valid signature
    const hmacMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('valid-signature'),
    };
    // @ts-expect-error - mocking crypto for testing
    vi.spyOn(crypto, 'createHmac').mockReturnValue(hmacMock);

    // Mock user without Kindle email
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        userId: 'test-user-id',
        kindleEmail: null, // No Kindle email configured
        personalEmail: 'user123@linktoreader.com',
      }]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Kindle email not configured');
  });

  it.skip('should reject when usage limit exceeded - TODO: Update for AWS SES', async () => {
    const request = createMockRequest({
      recipient: 'user123@linktoreader.com',
      sender: 'newsletter@example.com',
      'body-html': '<html><body><h1>Test</h1></body></html>',
    }, mockValidHeaders);

    // Mock valid signature
    const hmacMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('valid-signature'),
    };
    // @ts-expect-error - mocking crypto for testing
    vi.spyOn(crypto, 'createHmac').mockReturnValue(hmacMock);

    // Mock user
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        userId: 'test-user-id',
        kindleEmail: 'test@kindle.com',
        personalEmail: 'user123@linktoreader.com',
      }]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Mock usage limit exceeded
    mockUsageTracker.canUserConvert.mockResolvedValue({
      canConvert: false,
      reason: 'Usage limit exceeded',
    });

    const response = await POST(request);
    
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe('Usage limit exceeded');
  });

  it.skip('should reject invalid content - TODO: Update for AWS SES', async () => {
    const request = createMockRequest({
      recipient: 'user123@linktoreader.com',
      sender: 'newsletter@example.com',
      'body-html': '<html><body><p>Short</p></body></html>', // Too short
    }, mockValidHeaders);

    // Mock valid signature
    const hmacMock = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('valid-signature'),
    };
    // @ts-expect-error - mocking crypto for testing
    vi.spyOn(crypto, 'createHmac').mockReturnValue(hmacMock);

    // Mock user
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        userId: 'test-user-id',
        kindleEmail: 'test@kindle.com',
        personalEmail: 'user123@linktoreader.com',
      }]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Mock usage check passes
    mockUsageTracker.canUserConvert.mockResolvedValue({ canConvert: true });

    // Mock content validation failure
    mockContentConverter.validateContent.mockReturnValue({
      isValid: false,
      errors: ['Content is too short (minimum 10 words)'],
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Content is too short');
  });

  it.skip('should handle missing required fields - TODO: Update for AWS SES', async () => {
    const request = createMockRequest({
      recipient: 'user123@linktoreader.com',
      // Missing body-html
    }, mockValidHeaders);

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');
  });
});