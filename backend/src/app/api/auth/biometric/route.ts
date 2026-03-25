import { NextRequest, NextResponse } from 'next/server';
import { BiometricAuthService } from '../../../../services/biometric-auth.service';
import { authenticateToken } from '../../../../middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user first
    const authResult = await authenticateToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, deviceId, biometricType, biometricData } = await request.json();

    // Validate required fields
    if (!userId || !deviceId || !biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate biometric type
    if (!['fingerprint', 'face', 'touch'].includes(biometricType)) {
      return NextResponse.json(
        { error: 'Invalid biometric type' },
        { status: 400 }
      );
    }

    // Generate biometric token
    const token = await BiometricAuthService.generateBiometricToken(
      userId,
      deviceId,
      biometricType
    );

    return NextResponse.json({
      success: true,
      token,
      message: 'Biometric authentication token generated successfully'
    });

  } catch (error: any) {
    console.error('Biometric auth error:', error);
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
    const sessions = await BiometricAuthService.getBiometricSessions(userId);

    return NextResponse.json({
      success: true,
      sessions
    });

  } catch (error: any) {
    console.error('Get biometric sessions error:', error);
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
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const success = await BiometricAuthService.revokeBiometricAuth(
      authResult.userId,
      deviceId
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Biometric authentication revoked successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to revoke biometric authentication' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Revoke biometric auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

