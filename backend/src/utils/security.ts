import { NextRequest, NextResponse } from 'next/server';
import { env } from '../config/env.config';
import { logWarn, logError } from './logger';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Strict-Transport-Security': string;
  'Content-Security-Policy': string;
  'Permissions-Policy': string;
}

// Security headers configuration
export const getSecurityHeaders = (): SecurityHeaders => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.github.com https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; '),
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', ')
});

// CORS headers
export const getCorsHeaders = (origin: string = env?.CORS_ORIGIN || 'http://localhost:3000') => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
});

// Rate limiting function
export function rateLimit(windowMs: number = env?.RATE_LIMIT_WINDOW_MS || 900000, maxRequests: number = env?.RATE_LIMIT_MAX_REQUESTS || 100) {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;

    // Clean expired entries
    if (rateLimitStore.size > 10000) { // Prevent memory leaks
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
          rateLimitStore.delete(k);
        }
      }
    }

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: record.resetTime
      };
    }

    if (record.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime
    };
  };
}

// Get client identifier for rate limiting
export function getClientIdentifier(req: NextRequest): string {
  // Try to get IP from various headers (for reverse proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip'); // Cloudflare

  let ip = forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || 'unknown';

  // For authenticated requests, use user ID if available
  // This would need to be implemented based on your auth system
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from token if needed
    // For now, just use IP
  }

  return ip;
}

// Security middleware wrapper
export function withSecurity<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  options?: {
    rateLimit?: boolean;
    cors?: boolean;
    securityHeaders?: boolean;
    windowMs?: number;
    maxRequests?: number;
  }
) {
  const {
    rateLimit: enableRateLimit = true,
    cors = true,
    securityHeaders = true,
    windowMs = env?.RATE_LIMIT_WINDOW_MS || 900000,
    maxRequests = env?.RATE_LIMIT_MAX_REQUESTS || 100
  } = options || {};

  const rateLimiter = rateLimit(windowMs, maxRequests);

  return async (...args: T): Promise<Response> => {
    const req = args[0] as NextRequest;

    try {
      // Apply rate limiting
      if (enableRateLimit) {
        const clientId = getClientIdentifier(req);
        const rateLimitResult = rateLimiter(clientId);

        if (!rateLimitResult.allowed) {
          logWarn('Rate limit exceeded', {
            clientId,
            url: req.url,
            method: req.method,
            userAgent: req.headers.get('user-agent'),
            resetTime: new Date(rateLimitResult.resetTime).toISOString()
          });

          const response = new Response(JSON.stringify({
            success: false,
            message: 'Too many requests',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          });

          // Add security headers
          if (securityHeaders) {
            Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
          }

          return response;
        }

        // Add rate limit headers to successful responses later
      }

      // Call the actual handler
      const response = await handler(...args);

      // Add security headers
      if (securityHeaders) {
        Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      // Add CORS headers
      if (cors) {
        const origin = req.headers.get('origin') || env?.CORS_ORIGIN || 'http://localhost:3000';
        Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      // Add rate limit headers
      if (enableRateLimit) {
        const clientId = getClientIdentifier(req);
        const rateLimitResult = rateLimiter(clientId);

        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      }

      return response;

    } catch (error) {
      logError('Security middleware error', error as Error, {
        url: req.url,
        method: req.method,
        userAgent: req.headers.get('user-agent')
      });

      // Return a secure error response
      const errorResponse = new Response(JSON.stringify({
        success: false,
        message: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });

      // Add security headers even to error responses
      if (securityHeaders) {
        Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });
      }

      return errorResponse;
    }
  };
}

// Input validation and sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// SQL injection prevention (for raw queries)
export function escapeSQL(input: string): string {
  return input.replace(/'/g, "''").replace(/;/g, '');
}

// XSS prevention
export function escapeHtml(input: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };

  return input.replace(/[&<>"'\/]/g, (s) => map[s]);
}

// Check for suspicious patterns
export function detectSuspiciousActivity(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent') || '';
  const url = req.url;

  // Common attack patterns
  const suspiciousPatterns = [
    /\.\.\//,  // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript protocol
    /eval\(/i, // Code execution attempts
    /(wget|curl|python|perl|php)/i // Command injection
  ];

  // Check URL and user agent
  const checkString = `${url} ${userAgent}`;

  return suspiciousPatterns.some(pattern => pattern.test(checkString));
}

// Honeypot middleware (detects bots)
export function honeyPotCheck(req: NextRequest): boolean {
  // Check for honeypot field in form data
  if (req.method === 'POST') {
    // This would need to be implemented based on your forms
    // Return true if honeypot field is filled (indicating a bot)
  }

  return false;
}
