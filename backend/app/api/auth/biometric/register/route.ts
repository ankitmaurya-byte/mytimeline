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
        const { rpId: rpIdFromBody, userEmail, userName } = body;

        // Derive rpId from request origin when possible to avoid mismatches
        const origin = request.headers.get('origin') || '';
        let derivedRpId = '';
        try {
            if (origin) {
                derivedRpId = new URL(origin).hostname;
            }
        } catch { }

        const finalRpId = (derivedRpId || rpIdFromBody || new URL(request.url).hostname).trim();

        if (!finalRpId || !userEmail) {
            return NextResponse.json({
                success: false,
                error: 'rpId and userEmail are required'
            }, { status: 400 });
        }

        // Generate a random challenge for registration
        const challenge = crypto.randomBytes(32);

        // Generate a random user ID
        const userId = crypto.randomBytes(16);

        // Create registration options
        const registrationOptions = {
            challenge: Array.from(challenge), // Convert to array for JSON serialization
            rp: {
                name: "Timeline App",
                id: finalRpId,
            },
            user: {
                id: Array.from(userId),
                name: userEmail,
                displayName: userName || userEmail,
            },
            pubKeyCredParams: [
                {
                    type: "public-key",
                    alg: -7, // ES256
                },
                {
                    type: "public-key",
                    alg: -257, // RS256
                },
            ],
            authenticatorSelection: {
                userVerification: "required",
                authenticatorAttachment: "platform", // Prefer built-in authenticators
                // Ensure discoverable (resident) credential so usernameless auth works without allowCredentials
                residentKey: 'required' as const,
                requireResidentKey: true,
            },
            // Attestation not needed for development; avoids extra prompts
            attestation: 'none' as const,
            timeout: 60000,
        };

        console.log('🔐 [Backend Registration] Using rpId:', finalRpId);

        return NextResponse.json({
            success: true,
            options: registrationOptions
        });

    } catch (error) {
        console.error('Error generating registration options:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
});
