import { NextRequest, NextResponse } from 'next/server';
import { checkAdminStatus } from '../../../../src/middleware/admin-auth';
import { withCORS } from '../../_lib/cors';
import { ensureDb } from '../../_lib/db';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    try {
        await ensureDb();
        const { isAdmin, user } = await checkAdminStatus(req);

        return NextResponse.json({
            success: true,
            isAdmin,
            user: user ? {
                id: user._id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin
            } : null,
            message: isAdmin ? 'Admin access granted' : 'Admin access required'
        });

    } catch (error) {
        console.error('Admin check error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check admin status',
                message: 'Unable to verify admin access'
            },
            { status: 500 }
        );
    }
});
