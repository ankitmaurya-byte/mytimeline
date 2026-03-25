import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { verifyUserService } from '@/src/services/auth.service';
import UserModel from '@/src/models/user.model';
import { HTTPSTATUS } from '@/src/config/http.config';
import { signJwt, buildAuthCookie, buildJsAccessibleAuthCookie } from '@/src/utils/jwt';
import { withCORS } from '../../_lib/cors';
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const POST = withCORS(async (req: NextRequest) => {
  const requestOrigin = req.headers.get('origin');
  console.log('[auth/login] origin:', requestOrigin);
  await ensureDb();
  const body = await req.json();
  const { email, password } = body || {};
  if (!email || !password) {
    return new Response(JSON.stringify({ message: 'Email & password required' }), { status: HTTPSTATUS.BAD_REQUEST });
  }
  try {
    const user = await verifyUserService({ email, password });
    // Ensure verified
    const dbUser = await UserModel.findById((user as any)._id).select('emailVerified emailVerificationTokenExpires');
    if (dbUser && !dbUser.emailVerified) {
      // If expired, delete
      if (dbUser.emailVerificationTokenExpires && dbUser.emailVerificationTokenExpires < new Date()) {
        await UserModel.deleteOne({ _id: dbUser._id });
        return new Response(JSON.stringify({ message: 'Verification expired. Account removed. Please register again.' }), { status: HTTPSTATUS.UNAUTHORIZED });
      }
      return new Response(JSON.stringify({ message: 'Email not verified.' }), { status: HTTPSTATUS.UNAUTHORIZED });
    }
    const token = signJwt({ sub: String((user as any)._id), email: user.email, ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined });
    const httpOnlyCookie = buildAuthCookie(token, requestOrigin || undefined);
    const jsAccessibleCookie = buildJsAccessibleAuthCookie(token, requestOrigin || undefined);
    // Login successful, setting cookies
    const response = new Response(JSON.stringify({ message: 'Login successful', user: { _id: (user as any)._id, currentWorkspace: user.currentWorkspace } }), {
      status: HTTPSTATUS.OK,
      headers: { 
        'Set-Cookie': httpOnlyCookie, 
        'Content-Type': 'application/json' 
      }
    });
    
    // Add the second cookie
    response.headers.append('Set-Cookie', jsAccessibleCookie);
    
    return response;
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e.message || 'Login failed' }), { status: e.statusCode || 500 });
  }
});
