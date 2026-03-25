import { NextRequest } from 'next/server';
import { withCORS } from '../../../../_lib/cors';
import { OAuth2Client } from 'google-auth-library';
import { ensureDb } from '../../../../_lib/db';
import { loginOrCreateAccountService } from '@/src/services/auth.service';
import { signJwt, buildAuthCookie } from '@/src/utils/jwt';
import { HTTPSTATUS } from '@/src/config/http.config';
import { getGoogleOAuthConfig } from '../../_config/oauth-config';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    console.log('[oauth/google/callback] GET request received');
    console.log('[oauth/google/callback] URL:', req.url);
    console.log('[oauth/google/callback] Headers:', Object.fromEntries(req.headers.entries()));

    try {
        await ensureDb();

        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            console.error('[oauth/google/callback] OAuth error:', error);
            return new Response(JSON.stringify({ message: 'OAuth authorization failed' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!code) {
            console.error('[oauth/google/callback] No authorization code received');
            return new Response(JSON.stringify({ message: 'No authorization code received' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { clientId, clientSecret, redirectUri, isConfigured } = getGoogleOAuthConfig();

        console.log('[oauth/google/callback] Configuration check:', {
            clientId: clientId ? '***configured***' : 'NOT_CONFIGURED',
            clientSecret: clientSecret ? '***configured***' : 'NOT_CONFIGURED',
            redirectUri,
            code: code ? '***received***' : 'NOT_RECEIVED',
            isConfigured
        });

        if (!isConfigured || !clientId || !clientSecret) {
            console.error('[oauth/google/callback] Google OAuth not properly configured');
            return new Response(JSON.stringify({ message: 'OAuth not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Exchange authorization code for tokens
        const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

        try {
            console.log('[oauth/google/callback] Starting token exchange...');
            const { tokens } = await oauth2Client.getToken(code);
            console.log('[oauth/google/callback] Token exchange successful');

            if (!tokens.access_token) {
                throw new Error('No access token received from Google');
            }

            // Get user info from Google
            oauth2Client.setCredentials(tokens);
            const userInfoResponse = await oauth2Client.request({
                url: 'https://www.googleapis.com/oauth2/v2/userinfo'
            });

            const userInfo = userInfoResponse.data as any;
            console.log('[oauth/google/callback] User info from Google:', {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            });

            if (!userInfo.picture) {
                console.warn('[oauth/google/callback] No profile picture received from Google');
            } else {
                console.log('[oauth/google/callback] Profile picture URL:', userInfo.picture);
            }

            // Create or login user
            console.log('[oauth/google/callback] Calling loginOrCreateAccountService with:', {
                provider: 'GOOGLE',
                providerId: userInfo.id,
                displayName: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture
            });

            const result = await loginOrCreateAccountService({
                provider: 'GOOGLE',
                providerId: userInfo.id,
                displayName: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture
            });

            console.log('[oauth/google/callback] loginOrCreateAccountService result:', result);
            console.log('[oauth/google/callback] result type:', typeof result);
            console.log('[oauth/google/callback] result keys:', Object.keys(result));

            const user = result.user;

            console.log('[oauth/google/callback] User object:', {
                _id: user._id,
                email: user.email,
                currentWorkspace: user.currentWorkspace,
                name: user.name
            });

            // Generate JWT token
            const token = signJwt({
                sub: String(user._id),
                email: user.email,
                ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined
            });

            console.log('[oauth/google/callback] JWT token payload:', {
                sub: String(user._id),
                email: user.email,
                ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined
            });

            // For cross-domain setup, pass token in URL instead of setting cookie
            const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

            // Redirect to OAuth callback page with success and token
            const redirectUrl = `${frontendUrl}/oauth-callback?oauth=success&token=${encodeURIComponent(token)}`;

            console.log('[oauth/google/callback] OAuth successful, redirecting to:', redirectUrl);
            console.log('[oauth/google/callback] Token passed in URL (length):', token.length);

            return new Response(null, {
                status: 302,
                headers: {
                    'Location': redirectUrl
                }
            });

        } catch (tokenError) {
            console.error('[oauth/google/callback] Token exchange failed:', tokenError);
            console.error('[oauth/google/callback] Token error details:', {
                message: tokenError instanceof Error ? tokenError.message : 'Unknown error',
                stack: tokenError instanceof Error ? tokenError.stack : undefined,
                name: tokenError instanceof Error ? tokenError.name : undefined
            });

            // Return more detailed error for debugging
            return new Response(JSON.stringify({
                message: 'Failed to exchange authorization code',
                details: tokenError instanceof Error ? tokenError.message : 'Unknown error',
                debug: process.env.NODE_ENV === 'development' ? {
                    redirectUri,
                    hasCode: !!code,
                    hasClientId: !!clientId,
                    hasClientSecret: !!clientSecret
                } : undefined
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('[oauth/google/callback] Error:', error);
        return new Response(JSON.stringify({
            message: 'OAuth callback failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
