import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { verifyUserService } from '@/src/services/auth.service';
import UserModel from '@/src/models/user.model';
import { HTTPSTATUS } from '@/src/config/http.config';
import { signJwt, buildAuthCookie, buildJsAccessibleAuthCookie } from '@/src/utils/jwt';
import { withCORS } from '../../_lib/cors';
import { logger } from '../../_lib/logger';

export const OPTIONS = withCORS(() => new Response(null, { status: HTTPSTATUS.NO_CONTENT }));

export const POST = withCORS(async (req: NextRequest) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { message: 'Invalid request body' },
      { status: HTTPSTATUS.BAD_REQUEST }
    );
  }

  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return Response.json(
      { message: 'Email and password are required' },
      { status: HTTPSTATUS.BAD_REQUEST }
    );
  }

  let user: any;
  try {
    user = await verifyUserService({ email, password });
  } catch (err: any) {
    logger.warn({ err, email }, 'Login failed');
    return Response.json(
      { message: err.message || 'Login failed' },
      { status: err.statusCode || HTTPSTATUS.UNAUTHORIZED }
    );
  }

  try {
    await ensureDb();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database');
    return Response.json(
      { message: 'Service temporarily unavailable' },
      { status: HTTPSTATUS.INTERNAL_SERVER_ERROR }
    );
  }

  const dbUser = await UserModel.findById(user._id).select('emailVerified emailVerificationTokenExpires');
  if (!dbUser.emailVerified) {
    if (dbUser.emailVerificationTokenExpires && dbUser.emailVerificationTokenExpires < new Date()) {
      await UserModel.deleteOne({ _id: dbUser._id });
      return Response.json(
        { message: 'Verification expired. Account removed. Please register again.' },
        { status: HTTPSTATUS.UNAUTHORIZED }
      );
    }
    return Response.json(
      { message: 'Email not verified.' },
      { status: HTTPSTATUS.UNAUTHORIZED }
    );
  }

  const requestOrigin = req.headers.get('origin') ?? undefined;
  const token = signJwt({
    sub: String(user._id),
    email: user.email,
    ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined,
  });

  const httpOnlyCookie = buildAuthCookie(token, requestOrigin);
  const jsAccessibleCookie = buildJsAccessibleAuthCookie(token, requestOrigin);

  const response = Response.json(
    {
      message: 'Login successful',
      user: { _id: user._id, currentWorkspace: user.currentWorkspace },
    },
    {
      status: HTTPSTATUS.OK,
      headers: {
        'Set-Cookie': httpOnlyCookie,
        'Content-Type': 'application/json',
      },
    }
  );
  response.headers.append('Set-Cookie', jsAccessibleCookie);

  return response;
});
