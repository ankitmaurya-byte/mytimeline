import { API_BASE } from '../_lib/version';
import spec from './spec.json';

// CORS headers for Swagger documentation endpoints
// Note: Swagger docs are public and need to be accessible from the browser
// However, we restrict this to known frontend domains in production
function getCorsHeaders(req: Request): Record<string, string> {
    const requestOrigin = req.headers.get('origin');
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Build allowed origins from environment variables
    const allowedOrigins = [
        process.env.BACKEND_URL,
        process.env.FRONTEND_ORIGIN,
        ...(process.env.CORS_ADDITIONAL_ORIGINS || '').split(',').map(s => s.trim()),
    ].filter(Boolean) as string[];
    
    const defaultOrigin = allowedOrigins[0] || process.env.BACKEND_URL || '';
    let allowOrigin = requestOrigin || defaultOrigin;
    
    if (!isDev) {
        // In production, only allow whitelisted origins
        if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
            allowOrigin = defaultOrigin;
        }
    } else {
        // In development, allow localhost
        if (requestOrigin?.includes('localhost')) {
            allowOrigin = requestOrigin;
        } else {
            allowOrigin = defaultOrigin;
        }
    }
    
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
    };
}

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(req)
    });
}

export async function GET(req: Request) {
    // Derive server base from the incoming request to avoid double prefixing
    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;

    // Ensure we use the correct API base path
    const apiBase = API_BASE;

    // Use environment variable for backend URL, fallback to current request URL
    // For production, ensure we use the correct backend URL
    const isDev = process.env.NODE_ENV !== 'production';
    const backendUrl = isDev 
        ? (process.env.BACKEND_URL || base)
        : (process.env.BACKEND_URL || '');
    const serverUrl = backendUrl + apiBase;

    const body = JSON.stringify({
        ...spec,
        servers: [
            {
                url: serverUrl,
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
    });

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
        }
    });
}


