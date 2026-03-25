import { NextRequest, NextResponse } from 'next/server';
import { RememberMeService } from '../../../../services/remember-me.service';
import { authenticateToken } from '../../../../middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user first
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { deviceId, deviceInfo } = await request.json();

    // Validate required fields
    if (!deviceId || !deviceInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate remember me token
    const { token, expiresAt } = await RememberMeService.generateRememberMeToken(
      authResult.userId,
      deviceId,
      deviceInfo,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      message: 'Remember me token generated successfully'
    });

  } catch (error: any) {
    console.error('Remember me error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const sessions = await RememberMeService.getRememberMeSessions(userId);

    return NextResponse.json({
      success: true,
      sessions
    });

  } catch (error: any) {
    console.error('Get remember me sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const action = searchParams.get('action'); // 'single' or 'all'

    if (action === 'all') {
      const success = await RememberMeService.revokeAllRememberMeTokens(authResult.userId);

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'All remember me tokens revoked successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to revoke all tokens' },
          { status: 500 }
        );
      }
    } else if (action === 'single' && tokenId) {
      const success = await RememberMeService.revokeRememberMeToken(
        authResult.userId,
        tokenId
      );

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Remember me token revoked successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to revoke token' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing token ID' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Delete remember me token error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

