import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/src/models/user.model';
import { withCORS } from '../../../_lib/cors';
import crypto from 'crypto';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const POST = withCORS(async (request: NextRequest) => {
    try {
        await connectDB();

        const body = await request.json();
        const { rpId: rpIdFromBody } = body || {};

        // Derive rpId from request origin when possible to avoid mismatches
        const origin = request.headers.get('origin') || '';
        let derivedRpId = '';
        try {
            if (origin) {
                derivedRpId = new URL(origin).hostname;
            }
        } catch { }

        const rpId = (derivedRpId || rpIdFromBody || new URL(request.url).hostname).trim();

        if (!rpId) {
            return NextResponse.json({
                success: false,
                error: 'rpId is required'
            }, { status: 400 });
        }

        // Generate a random challenge
        const challenge = crypto.randomBytes(32);

        // For WebAuthn authentication, we need to provide the credential IDs that the browser should look for
        // Since this is a login endpoint, we don't know which user is trying to log in yet
        // So we'll return an empty allowCredentials list, which will allow the browser to show ALL available credentials for this domain
        // This is actually the correct approach for a login flow where we don't know the user yet

        const allowCredentials: any[] = [];

        // Alternative approach: If you want to be more specific and only show credentials for a specific user,
        // you would need to know the user's email or identifier before authentication
        // This would require a two-step process:
        // 1. User enters email first
        // 2. Server looks up their credential IDs
        // 3. Server returns those specific credential IDs

        // For now, we'll use the simpler approach that shows all available credentials
        // This is how most WebAuthn implementations work for login flows

        // Let's try a different approach - don't specify allowCredentials at all
        // This should allow the browser to show any available credentials for this domain

        console.log('🔐 [Auth Options] Generated options:', {
            rpId,
            challengeLength: challenge.length,
            allowCredentialsCount: allowCredentials.length,
            timeout: 60000
        });

        const responseData: any = {
            success: true,
            challenge: Array.from(challenge), // Convert to array for JSON serialization
            timeout: 60000,
            rpId
        };

        // Only include allowCredentials if we have some
        if (allowCredentials && allowCredentials.length > 0) {
            responseData.allowCredentials = allowCredentials;
        }

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error generating biometric options:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
});

