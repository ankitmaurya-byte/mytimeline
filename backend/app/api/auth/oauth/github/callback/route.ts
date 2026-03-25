import { NextRequest } from 'next/server';
import { withCORS } from '../../../../_lib/cors';
import { ensureDb } from '../../../../_lib/db';
import { loginOrCreateAccountService } from '@/src/services/auth.service';
import { signJwt, buildAuthCookie } from '@/src/utils/jwt';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    console.log('[oauth/github/callback] GET request received');
    console.log('[oauth/github/callback] URL:', req.url);
    console.log('[oauth/github/callback] Headers:', Object.fromEntries(req.headers.entries()));

    try {
        await ensureDb();

        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            console.error('[oauth/github/callback] OAuth error:', error);
            return new Response(JSON.stringify({ message: 'OAuth authorization failed' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!code) {
            console.error('[oauth/github/callback] No authorization code received');
            return new Response(JSON.stringify({ message: 'No authorization code received' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/oauth/github/callback`;

        if (!clientId || !clientSecret) {
            console.error('[oauth/github/callback] GitHub OAuth not properly configured');
            return new Response(JSON.stringify({ message: 'OAuth not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            console.log('[oauth/github/callback] Starting token exchange with:', {
                clientId: clientId ? '***configured***' : 'NOT_CONFIGURED',
                clientSecret: clientSecret ? '***configured***' : 'NOT_CONFIGURED',
                code: code ? '***received***' : 'NOT_RECEIVED',
                redirectUri
            });

            // Exchange authorization code for access token
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                    redirect_uri: redirectUri,
                }),
            });

            console.log('[oauth/github/callback] Token response status:', tokenResponse.status);
            console.log('[oauth/github/callback] Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

            const tokenData = await tokenResponse.json();
            console.log('[oauth/github/callback] Token response data:', tokenData);

            if (tokenData.error) {
                throw new Error(`GitHub token exchange failed: ${tokenData.error_description || tokenData.error}`);
            }

            const accessToken = tokenData.access_token;

            if (!accessToken) {
                throw new Error('No access token received from GitHub');
            }

            // Get user info from GitHub
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            const userData = await userResponse.json();

            if (userResponse.status !== 200) {
                throw new Error(`Failed to fetch GitHub user: ${userData.message || 'Unknown error'}`);
            }

            // Get user email from GitHub
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            const emailsData = await emailsResponse.json();
            const primaryEmail = emailsData.find((email: any) => email.primary)?.email || userData.email;

            console.log('[oauth/github/callback] User info from GitHub:', {
                id: userData.id,
                email: primaryEmail,
                name: userData.name || userData.login,
                picture: userData.avatar_url
            });

            if (!userData.avatar_url) {
                console.warn('[oauth/github/callback] No avatar URL received from GitHub');
            } else {
                console.log('[oauth/github/callback] Avatar URL:', userData.avatar_url);
            }

            // Create or login user
            console.log('[oauth/github/callback] Calling loginOrCreateAccountService with:', {
                provider: 'GITHUB',
                providerId: String(userData.id),
                displayName: userData.name || userData.login,
                email: primaryEmail,
                picture: userData.avatar_url
            });

            const result = await loginOrCreateAccountService({
                provider: 'GITHUB',
                providerId: String(userData.id),
                displayName: userData.name || userData.login,
                email: primaryEmail,
                picture: userData.avatar_url
            });

            console.log('[oauth/github/callback] loginOrCreateAccountService result:', result);
            console.log('[oauth/github/callback] result type:', typeof result);
            console.log('[oauth/github/callback] result keys:', Object.keys(result));

            const user = result.user;

            console.log('[oauth/github/callback] User object:', {
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

            console.log('[oauth/github/callback] JWT token payload:', {
                sub: String(user._id),
                email: user.email,
                ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined
            });

            // For cross-domain setup, pass token in URL instead of setting cookie
            const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

            // Redirect to OAuth callback page with success and token
            const redirectUrl = `${frontendUrl}/oauth-callback?oauth=success&token=${encodeURIComponent(token)}`;

            console.log('[oauth/github/callback] OAuth successful, redirecting to:', redirectUrl);
            console.log('[oauth/github/callback] Token passed in URL (length):', token.length);

            return new Response(null, {
                status: 302,
                headers: {
                    'Location': redirectUrl
                }
            });

        } catch (tokenError) {
            console.error('[oauth/github/callback] Token exchange failed:', tokenError);
            return new Response(JSON.stringify({ message: 'Failed to exchange authorization code' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('[oauth/github/callback] Error:', error);
        return new Response(JSON.stringify({
            message: 'OAuth callback failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
