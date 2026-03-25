import { NextRequest } from 'next/server';
import { withCORS } from '../../../../_lib/cors';
import { OAuth2Client } from 'google-auth-library';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/oauth/google/callback`;

        console.log('[oauth/google/verify] Checking OAuth configuration...');

        // Basic configuration check
        const configCheck = {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            redirectUri,
            clientIdFormat: clientId ? (clientId.includes('.apps.googleusercontent.com') ? 'Valid format' : 'Invalid format') : 'Missing',
            clientSecretFormat: clientSecret ? (clientSecret.startsWith('GOCSPX-') ? 'Valid format' : 'Invalid format') : 'Missing'
        };

        // Try to create OAuth client (this will fail if credentials are invalid)
        let oauth2ClientTest: OAuth2Client | null = null;
        let clientCreationError: string | null = null;

        try {
            oauth2ClientTest = new OAuth2Client(clientId, clientSecret, redirectUri);
            console.log('[oauth/google/verify] OAuth2Client created successfully');
        } catch (error) {
            clientCreationError = error instanceof Error ? error.message : 'Unknown error';
            console.error('[oauth/google/verify] Failed to create OAuth2Client:', error);
        }

        return new Response(JSON.stringify({
            message: 'Google OAuth Configuration Verification',
            status: configCheck.hasClientId && configCheck.hasClientSecret ? 'Configured' : 'Incomplete',
            config: configCheck,
            oauth2Client: {
                created: !!oauth2ClientTest,
                error: clientCreationError
            },
            instructions: [
                '1. Verify client ID and secret match in Google Console',
                '2. Ensure redirect URI is exactly: ' + redirectUri,
                '3. Try regenerating the client secret if issues persist',
                '4. Make sure the OAuth consent screen is configured'
            ],
            troubleshooting: {
                invalidClient: 'Usually means client ID and secret don\'t match',
                redirectUriMismatch: 'Redirect URI must match exactly (including http/https)',
                accessDenied: 'User denied permission or OAuth consent screen issues'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[oauth/google/verify] Verification failed:', error);
        return new Response(JSON.stringify({
            message: 'Configuration verification failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
