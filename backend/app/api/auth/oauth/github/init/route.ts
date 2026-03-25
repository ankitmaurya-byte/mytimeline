import { NextRequest } from 'next/server';

export const OPTIONS = () => new Response(null, { status: 204 });

export const GET = async (req: NextRequest) => {
    try {
        const clientId = process.env.GITHUB_CLIENT_ID;

        const redirectUri = process.env.GITHUB_REDIRECT_URI;

        console.log('[oauth/github/init] Configuration:', {
            clientId: clientId ? '***configured***' : 'NOT_CONFIGURED',
            redirectUri,
            baseUrl: process.env.BASE_URL,
            githubRedirectUri: process.env.GITHUB_REDIRECT_URI
        });

        if (!clientId || !redirectUri) {
            console.error('[oauth/github/init] GITHUB_CLIENT_ID or GITHUB_REDIRECT_URI not configured');
            return new Response(JSON.stringify({ message: 'OAuth not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate GitHub OAuth authorization URL
        const authUrl = new URL('https://github.com/login/oauth/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'read:user user:email');
        authUrl.searchParams.set('response_type', 'code');

        console.log('[oauth/github/init] Generated auth URL:', authUrl.toString());

        return new Response(JSON.stringify({
            url: authUrl.toString(),
            message: 'GitHub OAuth authorization URL generated'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[oauth/github/init] Error:', error);
        return new Response(JSON.stringify({
            message: 'Failed to generate OAuth URL',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
