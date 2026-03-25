import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import UserModel from '../../../../src/models/user.model';
import { HTTPSTATUS } from '../../../../src/config/http.config';
import { withCORS } from '../../_lib/cors';

export const dynamic = 'force-dynamic';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const POST = withCORS(async (req: NextRequest) => {
    try {
        await ensureDb();
        const admin = await getDbUserFromRequest(req);
        if (!admin) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });
        if (!(admin as any).isAdmin) {
            return new Response(JSON.stringify({ message: 'Forbidden' }), { status: HTTPSTATUS.FORBIDDEN });
        }

        const body = await req.json().catch(() => ({}));
        const { action } = body || {};

        if (action === 'cleanup-expired') {
            // Find and delete expired unverified accounts
            const expiredUsers = await UserModel.find({
                emailVerified: null,
                emailVerificationTokenExpires: { $lt: new Date() }
            }).select('_id email createdAt');

            if (expiredUsers.length === 0) {
                return new Response(JSON.stringify({
                    message: 'No expired unverified accounts found',
                    deletedCount: 0
                }), { status: HTTPSTATUS.OK });
            }

            const expiredUserIds = expiredUsers.map(u => u._id);
            const result = await UserModel.deleteMany({ _id: { $in: expiredUserIds } });

            console.log(`[admin/cleanup] Cleaned up ${result.deletedCount} expired unverified accounts by admin ${(admin as any)._id}`);

            return new Response(JSON.stringify({
                message: `Successfully cleaned up ${result.deletedCount} expired unverified accounts`,
                deletedCount: result.deletedCount,
                deletedUsers: expiredUsers.map(u => ({
                    id: u._id,
                    email: u.email,
                    createdAt: u.createdAt
                }))
            }), { status: HTTPSTATUS.OK });
        }

        if (action === 'cleanup-unverified') {
            // Find and delete all unverified accounts (regardless of expiration)
            const unverifiedUsers = await UserModel.find({
                emailVerified: null
            }).select('_id email createdAt emailVerificationTokenExpires');

            if (unverifiedUsers.length === 0) {
                return new Response(JSON.stringify({
                    message: 'No unverified accounts found',
                    deletedCount: 0
                }), { status: HTTPSTATUS.OK });
            }

            const unverifiedUserIds = unverifiedUsers.map(u => u._id);
            const result = await UserModel.deleteMany({ _id: { $in: unverifiedUserIds } });

            console.log(`[admin/cleanup] Cleaned up ${result.deletedCount} unverified accounts by admin ${(admin as any)._id}`);

            return new Response(JSON.stringify({
                message: `Successfully cleaned up ${result.deletedCount} unverified accounts`,
                deletedCount: result.deletedCount,
                deletedUsers: unverifiedUsers.map(u => ({
                    id: u._id,
                    email: u.email,
                    createdAt: u.createdAt,
                    expired: u.emailVerificationTokenExpires ? u.emailVerificationTokenExpires < new Date() : true
                }))
            }), { status: HTTPSTATUS.OK });
        }

        return new Response(JSON.stringify({
            message: 'Invalid action. Use "cleanup-expired" or "cleanup-unverified"',
            availableActions: ['cleanup-expired', 'cleanup-unverified']
        }), { status: HTTPSTATUS.BAD_REQUEST });

    } catch (e: any) {
        console.error('[admin/cleanup] error:', e);
        return new Response(JSON.stringify({ message: e?.message || 'Internal Error' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
    }
});

export const GET = withCORS(async (req: NextRequest) => {
    try {
        await ensureDb();
        const admin = await getDbUserFromRequest(req);
        if (!admin) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });
        if (!(admin as any).isAdmin) {
            return new Response(JSON.stringify({ message: 'Forbidden' }), { status: HTTPSTATUS.FORBIDDEN });
        }

        // Get cleanup statistics
        const now = new Date();

        const expiredUnverifiedCount = await UserModel.countDocuments({
            emailVerified: null,
            emailVerificationTokenExpires: { $lt: now }
        });

        const totalUnverifiedCount = await UserModel.countDocuments({
            emailVerified: null
        });

        const totalUsersCount = await UserModel.countDocuments({});

        return new Response(JSON.stringify({
            message: 'Cleanup statistics',
            statistics: {
                expiredUnverified: expiredUnverifiedCount,
                totalUnverified: totalUnverifiedCount,
                totalUsers: totalUsersCount,
                currentTime: now.toISOString()
            },
            availableActions: [
                {
                    action: 'cleanup-expired',
                    description: 'Delete expired unverified accounts',
                    count: expiredUnverifiedCount
                },
                {
                    action: 'cleanup-unverified',
                    description: 'Delete all unverified accounts',
                    count: totalUnverifiedCount
                }
            ]
        }), { status: HTTPSTATUS.OK });

    } catch (e: any) {
        console.error('[admin/cleanup] GET error:', e);
        return new Response(JSON.stringify({ message: e?.message || 'Internal Error' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
    }
});
