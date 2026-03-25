import { NextRequest } from 'next/server';
import { withCORS } from '../../../_lib/cors';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    try {
        const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/oauth/google/callback`;
        const githubRedirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/oauth/github/callback`;

        return new Response(JSON.stringify({
            message: 'OAuth redirect URIs configuration',
            google: {
                configured_uri: process.env.GOOGLE_REDIRECT_URI || 'Not set',
                computed_uri: googleRedirectUri,
                client_id: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'
            },
            github: {
                configured_uri: process.env.GITHUB_REDIRECT_URI || 'Not set',
                computed_uri: githubRedirectUri,
                client_id: process.env.GITHUB_CLIENT_ID ? 'Configured' : 'Not configured'
            },
            base_url: process.env.BASE_URL,
            instructions: {
                google: 'Make sure this URI is added to your Google OAuth app: ' + googleRedirectUri,
                github: 'Make sure this URI is added to your GitHub OAuth app: ' + githubRedirectUri
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[oauth/debug] Error:', error);
        return new Response(JSON.stringify({
            message: 'Failed to get OAuth configuration',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
