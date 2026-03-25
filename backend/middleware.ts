import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Enhanced middleware with proper CORS handling for credentials
export function middleware(request: NextRequest) {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });

        // Get the origin from the request
        const origin = request.headers.get('origin');

        // Set CORS headers for preflight
        if (origin) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        // Removed legacy Clerk header (x-clerk-auth-token)
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

        return response;
    }

    // Handle actual requests
    const response = NextResponse.next();

    // Get the origin from the request
    const origin = request.headers.get('origin');

    // Set CORS headers for the response
    if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    // Removed legacy Clerk header (x-clerk-auth-token)
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - uploads (uploaded files)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
