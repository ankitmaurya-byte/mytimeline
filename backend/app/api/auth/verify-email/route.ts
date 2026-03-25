import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { withCORS } from '../../_lib/cors';
import UserModel from '@/src/models/user.model';
import { HTTPSTATUS } from '@/src/config/http.config';
import { signJwt, buildAuthCookie } from '@/src/utils/jwt';
import { inboundService } from '@/src/services/inbound.service';

export const dynamic = 'force-dynamic';

export const GET = withCORS(async (req: NextRequest) => {
  await ensureDb();
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');
  if (!token || !email) {
    return new Response(JSON.stringify({ message: 'Missing token/email' }), { status: HTTPSTATUS.BAD_REQUEST });
  }
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase(), emailVerificationToken: token });
    if (!user) {
      return new Response(JSON.stringify({ message: 'Invalid token' }), { status: HTTPSTATUS.BAD_REQUEST });
    }
    if (user.emailVerified) {
      return new Response(JSON.stringify({ message: 'Already verified' }), { status: HTTPSTATUS.OK });
    }
    if (user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date()) {
      return new Response(JSON.stringify({ message: 'Token expired' }), { status: HTTPSTATUS.BAD_REQUEST });
    }
    user.emailVerified = new Date();
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await user.save();


    // Auto-login (issue auth cookie)
    const authToken = signJwt({ sub: String(user._id), email: user.email, ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined });
    const requestOrigin = req.headers.get('origin');
    const cookie = buildAuthCookie(authToken, requestOrigin || undefined);
    return new Response(JSON.stringify({ message: 'Email verified', user: { _id: user._id, currentWorkspace: user.currentWorkspace } }), { status: HTTPSTATUS.OK, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e?.message || 'Verification failed' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});
