import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/src/models/user.model';
import { verifyJwt } from '@/src/utils/jwt';

// Helper function to extract and verify JWT token
async function verifyAuthToken(request: NextRequest) {
    // Verify JWT token from either Authorization header or cookie
    let token: string | undefined;
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth_token')?.value;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (cookieToken) {
        token = cookieToken;
    }

    if (!token) {
        throw new Error('Unauthorized - No token provided');
    }

    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.sub) {
        throw new Error('Invalid token');
    }

    return decoded;
}

// GET /api/auth/biometric - Get user's biometric sessions
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const decoded = await verifyAuthToken(request);

        // Connect to database
        await connectDB();

        // Get user with biometric sessions
        const user = await UserModel.findById(decoded.sub)
            .select('biometricSessions')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Type assertion to handle the lean() result
        const userData = user as any;

        return NextResponse.json({
            success: true,
            sessions: userData.biometricSessions || []
        });

    } catch (error) {
        console.error('Error fetching biometric sessions:', error);
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/auth/biometric - Create new biometric session
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const decoded = await verifyAuthToken(request);

        // Parse request body
        const body = await request.json();
        const { deviceId, biometricType, biometricData } = body;

        console.log('🔐 [Backend Registration] Received data:', {
            deviceId,
            biometricType,
            biometricData: biometricData ? biometricData.substring(0, 30) + '...' : 'undefined',
            biometricDataType: typeof biometricData
        });

        if (!deviceId || !biometricType || !biometricData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate biometric type
        const validTypes = ['fingerprint', 'face', 'touch'];
        if (!validTypes.includes(biometricType)) {
            return NextResponse.json(
                { error: 'Invalid biometric type' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Get device info from request
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const deviceInfo = getDeviceInfo(userAgent);

        // Create new biometric session
        // For mobile devices, store fingerprint in biometricData
        // For desktop devices, store WebAuthn credential in deviceId
        const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

        const newSession = {
            deviceId: isMobile ? `mobile_${Date.now()}` : biometricData, // Mobile gets unique ID, desktop gets WebAuthn credential
            deviceFingerprint: biometricData, // Keep for backward compatibility
            biometricData: biometricData, // Store actual biometric data (fingerprint hash for mobile, WebAuthn for desktop)
            biometricType,
            deviceInfo,
            lastUsed: new Date(),
            createdAt: new Date()
        };

        console.log('🔐 [Backend Registration] Creating session:', {
            deviceId: newSession.deviceId,
            biometricData: newSession.biometricData ? newSession.biometricData.substring(0, 30) + '...' : 'undefined',
            biometricType: newSession.biometricType
        });

        // Add session to user (limit to 5 devices)
        const user = await UserModel.findById(decoded.sub);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove old sessions if limit exceeded
        if (user.biometricSessions && user.biometricSessions.length >= 5) {
            user.biometricSessions.shift(); // Remove oldest session
        }

        // Add new session
        if (!user.biometricSessions) {
            user.biometricSessions = [];
        }
        user.biometricSessions.push(newSession);

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Biometric session created successfully',
            session: newSession
        });

    } catch (error) {
        console.error('Error creating biometric session:', error);
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/auth/biometric - Remove biometric session(s)
export async function DELETE(request: NextRequest) {
    try {
        // Verify authentication
        const decoded = await verifyAuthToken(request);

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');
        const action = searchParams.get('action');

        // Connect to database
        await connectDB();

        let result;
        let message;

        if (action === 'all' || !deviceId) {
            // Remove all biometric sessions
            result = await UserModel.updateOne(
                { _id: decoded.sub },
                { $set: { biometricSessions: [] } }
            );
            message = 'All biometric sessions removed successfully';
        } else {
            // Remove specific session
            result = await UserModel.updateOne(
                { _id: decoded.sub },
                { $pull: { biometricSessions: { deviceId } } }
            );
            message = 'Biometric session removed successfully';
        }

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'No sessions found to remove' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: message
        });

    } catch (error) {
        console.error('Error removing biometric session:', error);
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to determine device type from user agent
function getDeviceInfo(userAgent: string): string {
    if (userAgent.includes('Mobile')) {
        return 'Mobile Device';
    } else if (userAgent.includes('Tablet')) {
        return 'Tablet Device';
    } else if (userAgent.includes('Mac')) {
        return 'Mac Computer';
    } else if (userAgent.includes('Windows')) {
        return 'Windows Computer';
    } else if (userAgent.includes('Linux')) {
        return 'Linux Computer';
    } else {
        return 'Unknown Device';
    }
}
