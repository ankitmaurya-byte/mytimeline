import { NextRequest, NextResponse } from 'next/server';
import { swaggerSpec } from '../../../src/config/swagger.config';
import { env } from '../../../src/config/env.config';
import { logInfo } from '../../../src/utils/logger';

// Get allowed origins for documentation endpoints
function getAllowedOrigin(request: NextRequest): string {
  const requestOrigin = request.headers.get('origin');
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Build allowed origins from environment variables
  const allowedOrigins = [
    process.env.BACKEND_URL,
    process.env.FRONTEND_ORIGIN,
    ...(process.env.CORS_ADDITIONAL_ORIGINS || '').split(',').map(s => s.trim()),
  ].filter(Boolean) as string[];
  
  const defaultOrigin = allowedOrigins[0] || process.env.BACKEND_URL || '';
  
  if (!isDev) {
    // In production, only allow whitelisted origins
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    return defaultOrigin;
  } else {
    // In development, allow localhost
    if (requestOrigin?.includes('localhost')) {
      return requestOrigin;
    }
    return defaultOrigin;
  }
}

export const OPTIONS = (request: NextRequest) => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
});

/**
 * @swagger
 * /api/docs:
 *   get:
 *     tags: [Documentation]
 *     summary: Get API documentation in JSON format
 *     description: Returns the OpenAPI specification in JSON format
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(request: NextRequest) {
  try {
    // Allow docs in production for API documentation
    // if (env?.NODE_ENV === 'production') {
    //   return NextResponse.json(
    //     { message: 'API documentation is not available in production' },
    //     { status: 404 }
    //   );
    // }

    logInfo('API documentation accessed', {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json(swaggerSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin',
      }
    });
  } catch (error) {
    console.error('Error serving API documentation:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
