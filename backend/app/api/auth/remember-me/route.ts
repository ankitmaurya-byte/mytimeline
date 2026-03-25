import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/src/models/user.model';
import { verifyJwt } from '@/src/utils/jwt';
import { RememberMeService } from '@/src/services/remember-me.service';
import crypto from 'crypto';

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

// GET /api/auth/remember-me - Get user's remember me sessions
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const decoded = await verifyAuthToken(request);

        // Connect to database
        await connectDB();

        // Get user with remember me sessions
        const user = await UserModel.findById(decoded.sub)
            .select('rememberMeSessions')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Type assertion to handle the lean() result
        const userData = user as any;

        // Filter out expired sessions
        const now = new Date();
        const activeSessions = (userData.rememberMeSessions || []).filter(
            session => new Date(session.expiresAt) > now
        );

        return NextResponse.json({
            success: true,
            sessions: activeSessions
        });

    } catch (error) {
        console.error('Error fetching remember me sessions:', error);
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/auth/remember-me - Create new remember me session
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const decoded = await verifyAuthToken(request);

        // Parse request body
        const body = await request.json();
        const { deviceId, deviceInfo } = body;

        if (!deviceId || !deviceInfo) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Get client IP and user agent
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown';
        const userAgent = request.headers.get('user-agent') || 'Unknown';

        // Generate unique token ID
        const tokenId = crypto.randomBytes(32).toString('hex');

        // Set expiration to 1 year from now
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Create new remember me session
        const newSession = {
            tokenId,
            deviceId,
            deviceInfo,
            ipAddress: ip,
            userAgent,
            lastUsed: new Date(),
            createdAt: new Date(),
            expiresAt
        };

        // Add session to user (limit to 5 devices)
        const user = await UserModel.findById(decoded.sub);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove old sessions if limit exceeded
        if (user.rememberMeSessions && user.rememberMeSessions.length >= 3) {
            user.rememberMeSessions.shift(); // Remove oldest session
        }

        // Add new session
        if (!user.rememberMeSessions) {
            user.rememberMeSessions = [];
        }
        user.rememberMeSessions.push(newSession);

        await user.save();

        // Generate remember me token for cookie storage
        const rememberMeToken = await RememberMeService.generateRememberMeToken(
            decoded.sub,
            deviceId,
            deviceInfo,
            ip,
            userAgent
        );

        // Build remember me cookie (14 days expiry)
        const isProd = process.env.NODE_ENV === 'production';
        const rememberMeCookie = `remember_me=${rememberMeToken.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600; ${isProd ? 'Secure' : ''}`;

        return NextResponse.json({
            success: true,
            message: 'Remember me session created successfully',
            session: newSession
        }, {
            headers: {
                'Set-Cookie': rememberMeCookie,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error creating remember me session:', error);
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/auth/remember-me - Remove remember me session(s)
export async function DELETE(request: NextRequest) {
    try {
        // Verify authentication
        const decoded = await verifyAuthToken(request);

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const tokenId = searchParams.get('tokenId');
        const action = searchParams.get('action');

        // Connect to database
        await connectDB();

        let result;

        if (action === 'all') {
            // Remove all sessions
            result = await UserModel.updateOne(
                { _id: decoded.sub },
                { $set: { rememberMeSessions: [] } }
            );
        } else if (tokenId) {
            // Remove specific session
            result = await UserModel.updateOne(
                { _id: decoded.sub },
                { $pull: { rememberMeSessions: { tokenId } } }
            );
        } else {
            return NextResponse.json(
                { error: 'Either tokenId or action=all is required' },
                { status: 400 }
            );
        }

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'No sessions found to remove' },
                { status: 404 }
            );
        }

        // Clear remember me cookie when revoking sessions
        const isProd = process.env.NODE_ENV === 'production';
        const clearCookie = `remember_me=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${isProd ? 'Secure' : ''}`;

        return NextResponse.json({
            success: true,
            message: action === 'all'
                ? 'All remember me sessions removed successfully'
                : 'Remember me session removed successfully'
        }, {
            headers: {
                'Set-Cookie': clearCookie,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error removing remember me session:', error);
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
