import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

export interface LogContext {
  correlationId: string;
  userId?: string;
  operation: string;
  metadata?: Record<string, unknown>;
}

export class StructuredLogger {
  private static instance: StructuredLogger;
  
  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  generateCorrelationId(): string {
    return randomUUID();
  }

  createContext(operation: string, userId?: string, metadata?: Record<string, unknown>): LogContext {
    return {
      correlationId: this.generateCorrelationId(),
      userId,
      operation,
      metadata
    };
  }

  private formatLog(level: string, message: string, context: LogContext, error?: Error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: context.correlationId,
      userId: context.userId,
      operation: context.operation,
      metadata: context.metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    return JSON.stringify(logEntry);
  }

  info(message: string, context: LogContext) {
    console.log(this.formatLog('INFO', message, context));
  }

  warn(message: string, context: LogContext) {
    console.warn(this.formatLog('WARN', message, context));
  }

  error(message: string, context: LogContext, error?: Error) {
    console.error(this.formatLog('ERROR', message, context, error));
  }

  debug(message: string, context: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('DEBUG', message, context));
    }
  }
}

// Helper to extract correlation ID from request headers
export function getCorrelationId(request?: NextRequest): string {
  if (request?.headers.get('X-Correlation-ID')) {
    return request.headers.get('X-Correlation-ID')!;
  }
  return StructuredLogger.getInstance().generateCorrelationId();
}

// Global logger instance
export const logger = StructuredLogger.getInstance();