import { NextRequest } from 'next/server';
import { verifyJwt } from '@/src/utils/jwt';
import { BiometricAuthService } from '@/src/services/biometric-auth.service';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
  authType?: 'jwt' | 'biometric';
}

/**
 * Universal authentication middleware that supports both JWT and biometric tokens
 * This can be used across all protected API routes
 */
export async function authenticateUser(req: NextRequest): Promise<AuthResult> {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) :
        req.cookies.get('auth_token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // First, try regular JWT authentication
    try {
      const decoded = verifyJwt(token);
      if (decoded && decoded.sub) {
        console.log('✅ [Universal Auth] Regular JWT authentication successful');
        return { success: true, userId: decoded.sub, authType: 'jwt' };
      }
    } catch (jwtError) {
      console.log('⚠️ [Universal Auth] JWT authentication failed, trying biometric...');
    }

    // If JWT fails, try biometric authentication
    try {
      const biometricResult = await BiometricAuthService.validateBiometricToken(token);
      if (biometricResult.isValid && biometricResult.userId) {
        console.log('✅ [Universal Auth] Biometric authentication successful');
        return { success: true, userId: biometricResult.userId, authType: 'biometric' };
      } else {
        console.log('❌ [Universal Auth] Biometric authentication failed:', biometricResult.error);
        return { success: false, error: biometricResult.error || 'Invalid biometric token' };
      }
    } catch (biometricError) {
      console.log('❌ [Universal Auth] Biometric authentication error:', biometricError);
      return { success: false, error: 'Invalid authentication token' };
    }

  } catch (error) {
    console.error('❌ [Universal Auth] Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Higher-order function to wrap API routes with universal authentication
 * Usage: export const POST = withAuth(async (req, userId) => { ... });
 */
export function withAuth(
  handler: (req: NextRequest, userId: string, authType: 'jwt' | 'biometric') => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const authResult = await authenticateUser(req);
    
    if (!authResult.success) {
      return new Response(JSON.stringify({ message: authResult.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(req, authResult.userId!, authResult.authType!);
  };
}


























