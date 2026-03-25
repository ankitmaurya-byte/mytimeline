import { NextRequest } from 'next/server';
import { getDbUserFromRequest } from '../../app/api/_lib/auth';

export interface AuthResult {
    success: boolean;
    userId?: string;
    error?: string;
}

/**
 * Authenticate user using the existing real authentication system
 */
export async function authenticateToken(request: NextRequest): Promise<AuthResult> {
    try {
        const user = await getDbUserFromRequest(request);

        if (!user) {
            return {
                success: false,
                error: 'Unauthorized - Invalid or missing Authentication token'
            };
        }

        return {
            success: true,
            userId: user._id.toString()
        };

    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            error: 'Authentication failed'
        };
    }
}

/**
 * Middleware to check if user has required permissions
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
    const authResult = await authenticateToken(request);

    if (!authResult.success) {
        return authResult;
    }

    return authResult;
}
