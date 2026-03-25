import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from './universal-auth';
import UserModel from '../models/user.model';
// Note: ensureDb will be imported by the calling route

/**
 * Admin authentication middleware
 * Protects admin-only routes and dashboard access
 */
export async function requireAdminAuth(req: NextRequest): Promise<NextResponse | null> {
  try {
    // Database connection should be ensured by the calling route

        // First authenticate the user
        const authResult = await authenticateUser(req);

        if (!authResult.success || !authResult.userId) {
            return NextResponse.json(
                {
                    error: 'Authentication required',
                    message: 'Please log in to access admin features'
                },
                { status: 401 }
            );
        }

        // Get user from database to check admin status
        const user = await UserModel.findById(authResult.userId).select('isAdmin email name');

        if (!user) {
            return NextResponse.json(
                {
                    error: 'User not found',
                    message: 'User account does not exist'
                },
                { status: 404 }
            );
        }

        // Check if user is admin
        if (!user.isAdmin) {
            return NextResponse.json(
                {
                    error: 'Admin access required',
                    message: 'You do not have permission to access admin features'
                },
                { status: 403 }
            );
        }

        // User is authenticated and is admin - continue
        return null;

    } catch (error) {
        console.error('Admin auth error:', error);
        return NextResponse.json(
            {
                error: 'Authentication failed',
                message: 'Unable to verify admin access'
            },
            { status: 500 }
        );
    }
}

/**
 * Higher-order function to wrap admin routes
 * Usage: export const GET = withAdminAuth(async (req, user) => { ... });
 */
export function withAdminAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const authError = await requireAdminAuth(req);
        if (authError) {
            return authError;
        }

        // Get user info for the handler
        const authResult = await authenticateUser(req);
        const user = await UserModel.findById(authResult.userId).select('isAdmin email name');

        return handler(req, user);
    };
}

/**
 * Check if current user is admin (for client-side use)
 */
export async function checkAdminStatus(req: NextRequest): Promise<{ isAdmin: boolean; user?: any }> {
  try {
    // Database connection should be ensured by the calling route

        const authResult = await authenticateUser(req);
        if (!authResult.success || !authResult.userId) {
            return { isAdmin: false };
        }

        const user = await UserModel.findById(authResult.userId).select('isAdmin email name');
        if (!user) {
            return { isAdmin: false };
        }

        return { isAdmin: !!user.isAdmin, user };

    } catch (error) {
        console.error('Admin status check error:', error);
        return { isAdmin: false };
    }
}
