// CORS middleware for Next.js API routes with explicit origin allowlist
import { NextRequest, NextResponse } from 'next/server';

function resolveAllowedOrigin(req: NextRequest): string | null {
  const requestOrigin = req.headers.get('origin');
  const requestPath = new URL(req.url).pathname;

  // Build allowed origins from environment variables (with fallbacks for build time)
  const primary = process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://mytimeline.in' : 'http://localhost:3000');
  const backend = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://api.timelline.tech' : 'http://localhost:8000');
  const extras = (process.env.CORS_ADDITIONAL_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

  // Combine all allowed origins
  const allowedOrigins = [primary, backend, ...extras].filter(Boolean);

  // In development, also allow localhost
  const isDev = process.env.NODE_ENV !== 'production';

  // Swagger and health endpoints: Allow same-origin or known domains
  if (requestPath.includes('/api/swagger') || requestPath.includes('/api/health')) {
    if (!requestOrigin) {
      // No origin header means same-origin request (e.g., direct browser navigation)
      return null; // Allow same-origin
    }

    // Check against allowed origins
    if (allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }

    // For localhost in development
    if (isDev && requestOrigin.includes('localhost')) {
      return requestOrigin;
    }

    // Default to first allowed origin for documentation endpoints
    return allowedOrigins[0] || null;
  }

  // For other API endpoints, use strict allowlist
  if (!requestOrigin) return null;
  if (allowedOrigins.length === 0) return null;

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
}

export function withCORS(handler: (req: NextRequest, ...args: any[]) => Promise<Response> | Response) {
  return async (req: NextRequest, ...args: any[]) => {
    const origin = resolveAllowedOrigin(req);
    const requestedHeaders = req.headers.get('access-control-request-headers') || 'Content-Type,Authorization,X-Requested-With,X-API-Key';
    const allowHeaders = requestedHeaders || 'Content-Type,Authorization,X-Requested-With,X-API-Key';
    const baseHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
      'Access-Control-Allow-Headers': allowHeaders,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Vary': 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method',
    };
    if (origin) baseHeaders['Access-Control-Allow-Origin'] = origin;

    try {
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: baseHeaders
        });
      }

      const response = await handler(req, ...args);

      // Add CORS headers to the existing response
      Object.entries(baseHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (err: any) {
      const message = err?.message || 'Internal Server Error';
      const errorHeaders = { ...baseHeaders, 'Content-Type': 'application/json' };
      return new Response(JSON.stringify({ message }), { status: 500, headers: errorHeaders });
    }
  };
}
