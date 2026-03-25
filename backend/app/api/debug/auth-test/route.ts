import { NextRequest } from 'next/server';
import { withCORS } from '../../_lib/cors';
import { ensureDb } from '../../_lib/db';
import UserModel from '@/src/models/user.model';
import { verifyJwt } from '@/src/utils/jwt';
import { HTTPSTATUS } from '@/src/config/http.config';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    try {
        await ensureDb();

        // Get authentication details
        const authHeader = req.headers.get('authorization');
        const cookieToken = req.cookies.get('auth_token')?.value;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

        const debugInfo = {
            timestamp: new Date().toISOString(),
            request: {
                origin: req.headers.get('origin'),
                host: req.headers.get('host'),
                userAgent: req.headers.get('user-agent'),
                referer: req.headers.get('referer'),
            },
            authentication: {
                authHeader: authHeader ? 'Present' : 'Missing',
                cookieToken: cookieToken ? 'Found' : 'Missing',
                finalToken: token ? 'Using' : 'None',
                allCookies: req.cookies.getAll().map(c => ({
                    name: c.name,
                    hasValue: !!c.value,
                    value: c.value ? '***' : 'empty'
                }))
            },
            tokenValidation: null as any,
            user: null as any
        };

        if (token) {
            try {
                const decoded = verifyJwt(token);
                debugInfo.tokenValidation = {
                    valid: !!decoded,
                    hasSub: !!(decoded && decoded.sub),
                    sub: decoded?.sub || null
                };

                if (decoded && decoded.sub) {
                    const user = await UserModel.findById(decoded.sub);
                    debugInfo.user = {
                        found: !!user,
                        id: user?._id || null,
                        email: user?.email || null,
                        name: user?.name || null,
                        hasProfilePicture: !!user?.profilePicture,
                        profilePictureType: user?.profilePicture ? 
                            (user.profilePicture.startsWith('data:') ? 'base64' :
                             user.profilePicture.startsWith('http') ? 'external' :
                             user.profilePicture.startsWith('/api/uploads/') ? 'old-file' : 'unknown') : 'none'
                    };
                }
            } catch (error) {
                debugInfo.tokenValidation = {
                    valid: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }

        return new Response(JSON.stringify(debugInfo, null, 2), {
            status: HTTPSTATUS.OK,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Debug auth test error:', error);
        return new Response(JSON.stringify({ 
            error: 'Debug test failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
