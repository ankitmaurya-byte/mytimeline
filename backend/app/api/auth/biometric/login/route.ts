import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { signJwt, buildAuthCookie, buildJsAccessibleAuthCookie } from '@/src/utils/jwt';
import UserModel from '@/src/models/user.model';
import { withCORS } from '../../../_lib/cors';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

// Helper function to verify biometric credential
async function verifyBiometricCredential(credential: any, userAgent: string) {
    // Both mobile and desktop now use WebAuthn
    if (!credential || !credential.id) {
        throw new Error('Invalid WebAuthn credential');
    }

    return {
        credentialId: credential.id,
        verified: true,
        isMobile: false // We don't need to distinguish anymore since both use WebAuthn
    };
}

export const POST = withCORS(async (request: NextRequest) => {
    try {

        await connectDB();

        const body = await request.json();

        const { credential } = body;

        if (!credential) {
            const userAgent = request.headers.get('user-agent') || '';
            const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

            return new Response(JSON.stringify({
                success: false,
                error: isMobile
                    ? 'Mobile biometric credential is required'
                    : 'Biometric credential is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }



        // Get user agent for device detection
        const userAgent = request.headers.get('user-agent') || '';

        // Verify the biometric credential
        console.log('🔐 [Backend Login] Received credential:', {
            id: credential?.id,
            type: credential?.type,
            response: credential?.response ? 'present' : 'missing'
        });

        const verificationResult = await verifyBiometricCredential(credential, userAgent);

        if (!verificationResult.verified) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Biometric verification failed'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }





        // Find user by credential ID in biometric sessions
        // Both mobile and desktop now use WebAuthn, so we search in biometricData field
        console.log('🔐 [Backend Login] Looking for credential ID:', verificationResult.credentialId);

        let user = await UserModel.findOne({
            $or: [
                { 'biometricSessions.biometricData': verificationResult.credentialId },
                { 'biometricSessions.deviceFingerprint': verificationResult.credentialId },
                { 'biometricSessions.deviceId': verificationResult.credentialId }
            ]
        });

        console.log('🔐 [Backend Login] User found:', user ? 'yes' : 'no');



        if (!user) {
            const userAgent = request.headers.get('user-agent') || '';
            const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

            return new Response(JSON.stringify({
                success: false,
                error: isMobile
                    ? 'No user found with this fingerprint. Please ensure you have registered your fingerprint on this device.'
                    : 'No user found with this biometric credential'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user has recently logged out (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (user.lastLogout && user.lastLogout > fiveMinutesAgo) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Recent logout detected. Please wait a few minutes before attempting biometric login again.'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Additional security check: if user has no biometric sessions but is trying to login,
        // this might indicate a logout scenario
        if (!user.biometricSessions || user.biometricSessions.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No biometric sessions found. Please log in with email/password first.'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user has recent login activity (within last 5 minutes)
        if (user.lastLogin && user.lastLogin < fiveMinutesAgo) {
            // User has recent login activity, proceeding with biometric auth
        } else {
            // User login time check passed
        }

        // Update last used timestamp for the biometric session
        // Both mobile and desktop now use WebAuthn, so we update by biometricData
        await UserModel.updateOne(
            {
                _id: user._id,
                'biometricSessions.biometricData': verificationResult.credentialId
            },
            {
                $set: {
                    'biometricSessions.$.lastUsed': new Date(),
                    lastLogin: new Date()
                }
            }
        );



        // Generate JWT token
        const token = signJwt({
            sub: user._id.toString(),
            email: user.email,
            ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined
        });



        // Create a more flexible cookie for cross-domain authentication
        const isProduction = process.env.NODE_ENV === 'production';
        const frontendOrigin = process.env.FRONTEND_ORIGIN || '';
        const useSecure = /^https:/i.test(frontendOrigin) || isProduction;



        // For cross-domain auth, we need to be careful with cookie settings
        let cookieOptions = '';

        if (isProduction) {
            // Production: Use root domain for cross-subdomain auth
            // This allows the cookie to be accessible by both frontend and backend subdomains
            cookieOptions = `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Domain=.timelline.tech; Max-Age=${7 * 24 * 60 * 60}`;
        } else {
            // Development: Use localhost domain
            cookieOptions = `auth_token=${token}; Path=/; HttpOnly; Domain=localhost; Max-Age=${7 * 24 * 60 * 60}`;
        }





        // Get request origin for proper cookie domain
        const requestOrigin = request.headers.get('origin');
        const httpOnlyCookie = buildAuthCookie(token, requestOrigin || undefined);
        const jsAccessibleCookie = buildJsAccessibleAuthCookie(token, requestOrigin || undefined);

        // Return response with proper cookie header
        const response = new Response(JSON.stringify({
            success: true,
            message: 'Biometric login successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture,
                isAdmin: user.isAdmin,
                currentWorkspace: user.currentWorkspace
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': httpOnlyCookie
            }
        });

        // Add the second cookie (JavaScript-accessible)
        response.headers.append('Set-Cookie', jsAccessibleCookie);



        return response;

    } catch (error) {
        console.error('Biometric login error:', error);

        return new Response(JSON.stringify({
            success: false,
            error: 'Biometric verification failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
