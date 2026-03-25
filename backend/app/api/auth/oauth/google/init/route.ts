import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getGoogleOAuthConfig } from '../../_config/oauth-config';

export const OPTIONS = () => new Response(null, { status: 204 });

export const GET = async (req: NextRequest) => {
    try {
        const { clientId, redirectUri, isConfigured } = getGoogleOAuthConfig();

        console.log('[oauth/google/init] Configuration:', {
            clientId: clientId ? '***configured***' : 'NOT_CONFIGURED',
            redirectUri,
            baseUrl: process.env.BASE_URL,
            googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
            isConfigured
        });

        if (!isConfigured || !clientId || !redirectUri) {
            console.error('[oauth/google/init] GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not configured');
            return new Response(JSON.stringify({ message: 'OAuth not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate state for CSRF protection
        const state = crypto.randomUUID();
        const nonce = crypto.randomUUID();

        // Set short-lived state cookie for verification in callback
        const isProd = process.env.NODE_ENV === 'production';
        const cookie = `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300; ${isProd ? 'Secure' : ''}`;

        // Generate Google OAuth v2 authorization URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('nonce', nonce);

        console.log('[oauth/google/init] Generated auth URL:', authUrl.toString());

        return new Response(JSON.stringify({
            url: authUrl.toString(),
            message: 'Google OAuth authorization URL generated'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie }
        });

    } catch (error) {
        console.error('[oauth/google/init] Error:', error);
        return new Response(JSON.stringify({
            message: 'Failed to generate OAuth URL',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
