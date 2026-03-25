import { NextRequest } from 'next/server';
import { withCORS } from '../../../_lib/cors';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    try {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const githubClientId = process.env.GITHUB_CLIENT_ID;

        return new Response(JSON.stringify({
            message: 'OAuth endpoints are working',
            status: 'ok',
            configured: {
                google: !!googleClientId,
                github: !!githubClientId
            },
            endpoints: {
                google: {
                    init: '/api/auth/oauth/google/init',
                    callback: '/api/auth/oauth/google/callback'
                },
                github: {
                    init: '/api/auth/oauth/github/init',
                    callback: '/api/auth/oauth/github/callback'
                }
            },
            instructions: 'Set GOOGLE_CLIENT_ID and GITHUB_CLIENT_ID environment variables to enable OAuth'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            message: 'OAuth test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
