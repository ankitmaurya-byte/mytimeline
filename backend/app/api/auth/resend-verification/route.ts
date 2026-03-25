import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { withCORS } from '../../_lib/cors';
import UserModel from '@/src/models/user.model';
import { HTTPSTATUS } from '@/src/config/http.config';
import crypto from 'crypto';
import { sendEmail } from '@/src/services/email.service';
import { inboundService } from '@/src/services/inbound.service';

export const dynamic = 'force-dynamic';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const POST = withCORS(async (req: NextRequest) => {
  await ensureDb();
  const body = await req.json().catch(() => ({}));
  const { email } = body || {};
  if (!email) {
    return new Response(JSON.stringify({ message: 'Email required' }), { status: HTTPSTATUS.BAD_REQUEST });
  }
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return new Response(JSON.stringify({ message: 'If that account exists, an email will be sent.' }), { status: HTTPSTATUS.OK });
    }
    if (user.emailVerified) {
      return new Response(JSON.stringify({ message: 'Already verified' }), { status: HTTPSTATUS.OK });
    }
    if (!user.emailVerificationToken || !user.emailVerificationTokenExpires || user.emailVerificationTokenExpires < new Date()) {
      user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationTokenExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
      await user.save();
    }
    const frontendUrl = process.env.FRONTEND_ORIGIN || process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${user.emailVerificationToken}&email=${encodeURIComponent(user.email)}`;
    try {
      if (inboundService.isConfigured()) {
        await inboundService.sendVerificationEmail(user.email, verifyUrl, user.name);
        console.log('[auth/resend-verification] Inbound email sent successfully');
      } else {
        // Fallback to original email service
        await sendEmail({ to: user.email, subject: 'Verify your account', text: `Click to verify: ${verifyUrl}` });
        console.log('[auth/resend-verification] Fallback email sent successfully');
      }
    } catch (e) { console.warn('[auth/resend-verification] send mail failed', (e as any).message); }
    return new Response(JSON.stringify({ message: 'Verification email sent', verifyUrl }), { status: HTTPSTATUS.OK });
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e?.message || 'Failed' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});
