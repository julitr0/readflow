import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// Webhook replay protection - store recent webhook timestamps
const webhookTimestamps = new Map<string, number>();
const WEBHOOK_TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5 minutes

export function preventReplayAttack(signature: string, timestamp: number): boolean {
  const now = Date.now();
  
  // Check if timestamp is too old
  if (now - timestamp > WEBHOOK_TIMESTAMP_TOLERANCE) {
    return false;
  }
  
  // Check if we've seen this signature + timestamp combo before
  const key = `${signature}-${timestamp}`;
  if (webhookTimestamps.has(key)) {
    return false;
  }
  
  // Store this signature + timestamp combo
  webhookTimestamps.set(key, now);
  
  // Clean up old entries (every 100 requests)
  if (webhookTimestamps.size > 1000) {
    const cutoff = now - WEBHOOK_TIMESTAMP_TOLERANCE;
    for (const [key, time] of webhookTimestamps.entries()) {
      if (time < cutoff) {
        webhookTimestamps.delete(key);
      }
    }
  }
  
  return true;
}

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const urlSchema = z.string().url('Invalid URL format').refine(
  (url) => url.startsWith('http://') || url.startsWith('https://'),
  'URL must use HTTP or HTTPS protocol'
);

// Email receive validation schema
export const emailReceiveSchema = z.object({
  // Mailgun webhook fields
  'From': emailSchema,
  'To': emailSchema,
  'Subject': z.string().min(1, 'Subject is required'),
  'body-html': z.string().min(10, 'Email body must contain at least 10 characters'),
  'body-plain': z.string().optional(),
  'timestamp': z.string(),
  'token': z.string(),
  'signature': z.string(),
  // Optional fields
  'Date': z.string().optional(),
  'Message-Id': z.string().optional(),
  'Sender': z.string().optional(),
});

// Conversion request validation schema  
export const conversionRequestSchema = z.object({
  // URL-based conversion
  url: urlSchema.optional(),
  sendToKindle: z.boolean().optional().default(false),
  // HTML content-based conversion (legacy)
  htmlContent: z.string().min(10, 'HTML content must be at least 10 characters long').optional(),
  sourceUrl: urlSchema.optional(),
  customMetadata: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    date: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
}).refine(
  (data) => data.url || data.htmlContent,
  { message: "Either URL or HTML content must be provided" }
);

// User settings validation schema
export const userSettingsSchema = z.object({
  kindleEmail: emailSchema.optional(),
  personalEmail: emailSchema.optional(),
  onboardingComplete: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional().default(true),
  autoDelivery: z.boolean().optional().default(true),
  conversionPreferences: z.string().optional(),
  notificationPreferences: z.string().optional(),
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => val ?? '1',
    z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).refine(n => n > 0, 'Page must be positive')
  ),
  limit: z.preprocess(
    (val) => val ?? '20', 
    z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
  ),
});

export const conversionFiltersSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  search: z.string().min(1).optional(),
}).merge(paginationSchema);

// Validation middleware factory
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' | 'form' = 'body'
) {
  return async (request: NextRequest): Promise<{ data: T } | NextResponse> => {
    try {
      let data: unknown;
      
      switch (source) {
        case 'body':
          data = await request.json();
          break;
        case 'query':
          data = Object.fromEntries(new URL(request.url).searchParams.entries());
          break;
        case 'form':
          const formData = await request.formData();
          data = Object.fromEntries(formData.entries());
          break;
      }

      const validated = schema.parse(data);
      return { data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Invalid request format',
      }, { status: 400 });
    }
  };
}

// Helper for validating Mailgun webhook signatures with replay protection
export function validateAwsSesSignature(
  request: NextRequest,
  webhookSecret: string
): boolean {
  try {
    // For AWS SES SNS notifications, validate the signature from headers
    const messageType = request.headers.get('x-amz-sns-message-type');
    const messageId = request.headers.get('x-amz-sns-message-id');
    const topicArn = request.headers.get('x-amz-sns-topic-arn');
    
    // Basic validation that this is a proper SNS notification
    if (!messageType || !messageId || !topicArn) {
      return false;
    }
    
    // For now, we'll validate based on the webhook secret
    // In production, you'd want to verify the SNS signature properly
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export function validateMailgunSignature(
  timestamp: string,
  token: string,
  signature: string,
  webhookSigningKey: string
): boolean {
  try {
    // Check for replay attacks first
    const timestampMs = parseInt(timestamp) * 1000;
    if (!preventReplayAttack(signature, timestampMs)) {
      return false;
    }

    const data = timestamp + token;
    const hash = crypto
      .createHmac('sha256', webhookSigningKey)
      .update(data)
      .digest('hex');
    
    return hash === signature;
  } catch (error) {
    console.error('Mailgun signature validation error:', error);
    return false;
  }
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  identifier: z.string(), // User ID or IP address
  windowMs: z.number().default(60000), // 1 minute
  maxRequests: z.number().default(60), // 60 requests per minute
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().refine(
    (type) => ['text/html', 'application/pdf', 'text/plain'].includes(type),
    'Unsupported file type'
  ),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

// API key validation for external integrations
export const apiKeySchema = z.object({
  key: z.string().min(32, 'API key must be at least 32 characters'),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).optional(),
});

// Webhook validation schema
export const webhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.enum(['conversion.completed', 'conversion.failed', 'usage.limit_reached'])),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters'),
  active: z.boolean().default(true),
});

// Export validation middleware instances for common use cases
export const validateEmailReceive = validateRequest(emailReceiveSchema, 'form');
export const validateConversionRequest = validateRequest(conversionRequestSchema, 'body');
export const validateUserSettings = validateRequest(userSettingsSchema, 'body');
export const validateConversionFilters = validateRequest(conversionFiltersSchema, 'query');