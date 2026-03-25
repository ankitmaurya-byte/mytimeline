import { NextRequest } from 'next/server';
import { withCORS } from '../../_lib/cors';
import { clearAuthCookie } from '@/src/utils/jwt';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/src/models/user.model';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const POST = withCORS(async (request: NextRequest) => {
    try {
        // Get the auth token from the request to identify the user
        const authHeader = request.headers.get('authorization');
        const cookieToken = request.cookies.get('auth_token')?.value;

        let token: string | undefined;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (cookieToken) {
            token = cookieToken;
        }

        if (token) {
            try {
                await connectDB();

                // Only set logout timestamp - DON'T clear biometric sessions from database
                // Biometric sessions should persist for future logins
                await UserModel.updateMany(
                    { 'biometricSessions.0': { $exists: true } },
                    {
                        $set: {
                            lastLogout: new Date() // Add logout timestamp only
                        }
                    }
                );

            } catch (dbError) {
                console.warn('Failed to set logout timestamp:', dbError);
                // Continue with logout even if setting timestamp fails
            }
        }

        // Clear the auth cookie with proper domain settings
        // Use the same domain logic as biometric login for consistency
        const isProduction = process.env.NODE_ENV === 'production';
        const frontendOrigin = process.env.FRONTEND_ORIGIN || '';

        // Get request origin for proper cookie domain
        const requestOrigin = request.headers.get('origin');
        const clearCookieOptions = clearAuthCookie(requestOrigin || undefined);



        // Return response with cleared cookie
        // Use multiple Set-Cookie headers to ensure cookie is cleared from all domains
        const response = new Response(JSON.stringify({
            message: 'Logged out successfully',
            biometricSessionsPreserved: !!token, // Sessions are preserved, not cleared
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Clear-Biometric-Credentials': 'true' // Instruct frontend to clear stored credentials
            },
        });

        // Add multiple Set-Cookie headers to ensure cookie is cleared from all possible domains
        response.headers.append('Set-Cookie', clearCookieOptions);

        // Clear cookies for production domain
        response.headers.append('Set-Cookie', `auth_token=; Path=/; HttpOnly; Secure; SameSite=None; Domain=.timelline.tech; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        response.headers.append('Set-Cookie', `auth_token_js=; Path=/; Secure; SameSite=None; Domain=.timelline.tech; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

        // Clear cookies for localhost (development)
        response.headers.append('Set-Cookie', `auth_token=; Path=/; HttpOnly; SameSite=Lax; Domain=localhost; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        response.headers.append('Set-Cookie', `auth_token_js=; Path=/; SameSite=Lax; Domain=localhost; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

        // Clear cookies without domain (fallback)
        response.headers.append('Set-Cookie', `auth_token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        response.headers.append('Set-Cookie', `auth_token_js=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);



        return response;

    } catch (error) {
        console.error('Logout error:', error);

        // Even if there's an error, try to clear the cookie with proper domain
        const requestOrigin = request.headers.get('origin');
        const clearCookieOptions = clearAuthCookie(requestOrigin || undefined);

        const errorResponse = new Response(JSON.stringify({
            message: 'Logout completed with warnings',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Clear-Biometric-Credentials': 'true' // Instruct frontend to clear stored credentials
            },
        });

        // Add multiple Set-Cookie headers to ensure cookie is cleared from all possible domains
        errorResponse.headers.append('Set-Cookie', clearCookieOptions);

        // Clear cookies for production domain
        errorResponse.headers.append('Set-Cookie', `auth_token=; Path=/; HttpOnly; Secure; SameSite=None; Domain=.timelline.tech; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        errorResponse.headers.append('Set-Cookie', `auth_token_js=; Path=/; Secure; SameSite=None; Domain=.timelline.tech; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

        // Clear cookies for localhost (development)
        errorResponse.headers.append('Set-Cookie', `auth_token=; Path=/; HttpOnly; SameSite=Lax; Domain=localhost; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        errorResponse.headers.append('Set-Cookie', `auth_token_js=; Path=/; SameSite=Lax; Domain=localhost; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

        // Clear cookies without domain (fallback)
        errorResponse.headers.append('Set-Cookie', `auth_token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        errorResponse.headers.append('Set-Cookie', `auth_token_js=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);



        return errorResponse;
    }
});


