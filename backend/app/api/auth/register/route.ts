import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { registerUserService } from '@/src/services/auth.service';
import { HTTPSTATUS } from '@/src/config/http.config';
import { withCORS } from '../../_lib/cors';
import { sendEmail } from '@/src/services/email.service';
import { inboundService } from '@/src/services/inbound.service';
import UserModel from '@/src/models/user.model';
import { logger } from '../../_lib/logger';

export const OPTIONS = withCORS(() => new Response(null, { status: HTTPSTATUS.NO_CONTENT }));

export const POST = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database');
    return Response.json(
      { message: 'Service temporarily unavailable' },
      { status: HTTPSTATUS.INTERNAL_SERVER_ERROR }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { message: 'Invalid request body' },
      { status: HTTPSTATUS.BAD_REQUEST }
    );
  }

  const email = body.email as string | undefined;
  const name = body.name as string | undefined;
  const password = body.password as string | undefined;

  if (!email || !password) {
    return Response.json(
      { message: 'Email and password are required' },
      { status: HTTPSTATUS.BAD_REQUEST }
    );
  }

  let userId: string;
  let emailVerificationToken: string;

  try {
    const result = await registerUserService({ email, name: name ?? '', password });
    userId = String((result as any).userId);
    emailVerificationToken = result.emailVerificationToken;
  } catch (err: any) {
    logger.warn({ err, email }, 'Registration failed');
    return Response.json(
      { message: err.message || 'Registration failed' },
      { status: err.statusCode || HTTPSTATUS.BAD_REQUEST }
    );
  }

  const frontendUrl = process.env.FRONTEND_ORIGIN || process.env.APP_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(email)}`;

  try {
    if (inboundService.isConfigured()) {
      await inboundService.sendVerificationEmail(email, verifyUrl, name ?? '');
    } else {
      await sendEmail({ to: email, subject: 'Verify your account', text: `Click to verify: ${verifyUrl}` });
    }
  } catch (err) {
    logger.warn({ err, email }, 'Failed to send verification email');
  }

  const uid = userId;
  setTimeout(async () => {
    try {
      const u = await UserModel.findById(uid).select('emailVerified emailVerificationTokenExpires');
      if (u && !u.emailVerified && u.emailVerificationTokenExpires && u.emailVerificationTokenExpires < new Date()) {
        await UserModel.deleteOne({ _id: uid });
        logger.info({ userId: uid }, 'Auto-deleted unverified expired account');
      }
    } catch (err) {
      logger.warn({ err, userId: uid }, 'Auto-delete check failed');
    }
  }, 15 * 60 * 1000 + 10_000);

  return Response.json(
    { message: 'Registered. Verify your email.', user: { _id: userId } },
    { status: HTTPSTATUS.CREATED }
  );
});
