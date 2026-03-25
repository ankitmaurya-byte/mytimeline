import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logError } from './logger';
import { HTTPSTATUS } from '../config/http.config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HTTPSTATUS.BAD_REQUEST);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, HTTPSTATUS.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, HTTPSTATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, HTTPSTATUS.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, HTTPSTATUS.CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, HTTPSTATUS.TOO_MANY_REQUESTS);
  }
}

// Enhanced error handler for Next.js API routes
export function withError<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, args[0] as NextRequest);
    }
  };
}

function handleApiError(error: unknown, req: NextRequest): Response {
  // Log the error with context
  const context = {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  };

  if (error instanceof AppError) {
    logError(`API Error: ${error.message}`, error, context);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (error instanceof ZodError) {
    const validationErrors = error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    logError('Validation Error', error as Error, { ...context, validationErrors });

    return new Response(JSON.stringify({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      statusCode: HTTPSTATUS.BAD_REQUEST,
      timestamp: new Date().toISOString()
    }), {
      status: HTTPSTATUS.BAD_REQUEST,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (error instanceof SyntaxError) {
    logError('JSON Syntax Error', error, context);

    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid JSON format',
      statusCode: HTTPSTATUS.BAD_REQUEST,
      timestamp: new Date().toISOString()
    }), {
      status: HTTPSTATUS.BAD_REQUEST,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle MongoDB errors
  if (error && typeof error === 'object' && 'code' in error) {
    const mongoError = error as any;
    
    if (mongoError.code === 11000) {
      logError('MongoDB Duplicate Key Error', mongoError, context);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Duplicate entry found',
        statusCode: HTTPSTATUS.CONFLICT,
        timestamp: new Date().toISOString()
      }), {
        status: HTTPSTATUS.CONFLICT,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Unknown error - log and return generic message
  logError('Unexpected Error', error as Error, context);

  return new Response(JSON.stringify({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? (error as Error)?.message || 'Unknown error occurred'
      : 'Internal server error',
    statusCode: HTTPSTATUS.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: (error as Error)?.stack 
    })
  }), {
    status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Global error boundary for catching unhandled promise rejections
export function setupGlobalErrorHandlers() {
  process.on('unhandledRejection', (reason: any) => {
    logError('Unhandled Promise Rejection', reason, {
      type: 'unhandledRejection',
      timestamp: new Date().toISOString()
    });
    
    // Don't exit the process in production, just log
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    logError('Uncaught Exception', error, {
      type: 'uncaughtException',
      timestamp: new Date().toISOString()
    });
    
    // Exit gracefully
    process.exit(1);
  });
}
