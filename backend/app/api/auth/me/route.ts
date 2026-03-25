import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { HTTPSTATUS } from '@/src/config/http.config';
import { withCORS } from '../../_lib/cors';
import { verifyJwt, clearAuthCookie } from '@/src/utils/jwt';
import * as jwt from 'jsonwebtoken';
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
  await ensureDb();
  const cookieAuth = req.cookies.get('auth_token')?.value;
  const authz = req.headers.get('authorization');
  let decoded: any = null;
  let rawDecoded: any = null;
  let reason: string | undefined;
  if (cookieAuth) {
    decoded = verifyJwt(cookieAuth);
    if (!decoded) reason = 'verify-failed';
    try { rawDecoded = jwt.decode(cookieAuth); } catch { /* ignore */ }
  } else if (authz?.startsWith('Bearer ')) {
    const token = authz.slice(7);
    decoded = verifyJwt(token);
    if (!decoded) reason = 'verify-failed-bearer';
    try { rawDecoded = jwt.decode(token); } catch { /* ignore */ }
  } else {
    reason = 'no-token';
  }
  const user = await getDbUserFromRequest(req);
  if (!user) {
    const debug = {
      hasCookie: !!cookieAuth,
      hasAuthz: !!authz,
      verifyOk: !!decoded,
      decodedSub: decoded?.sub,
      rawDecoded: rawDecoded ? { ...rawDecoded, iat: rawDecoded['iat'], exp: rawDecoded['exp'] } : null,
      reason
    };
    console.warn('[auth/me] Unauthorized', debug);
    // If we had a cookie or bearer token that failed verification, proactively clear the auth cookie to break stale-token loops.
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cookieAuth && (reason === 'verify-failed' || reason === 'verify-failed-bearer')) {
      headers['Set-Cookie'] = clearAuthCookie();
    }
    return new Response(JSON.stringify({ message: 'Unauthorized', debug }), { status: HTTPSTATUS.UNAUTHORIZED, headers });
  }

  // Optimize user response to reduce size
  const optimizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    currentWorkspace: user.currentWorkspace,
    isAdmin: user.isAdmin,
    superAdmin: user.superAdmin,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
    // Exclude: biometricSessions, rememberMeSessions, emailVerificationToken, emailVerificationTokenExpires
  };


  return new Response(JSON.stringify({ message: 'Current user fetched', user: optimizedUser }), {
    status: HTTPSTATUS.OK,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});
