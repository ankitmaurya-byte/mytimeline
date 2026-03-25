import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { registerUserService } from '@/src/services/auth.service';
import { HTTPSTATUS } from '@/src/config/http.config';
// (Email verification) Removed auto-login for unverified accounts
import { withCORS } from '../../_lib/cors';
import { sendEmail } from '@/src/services/email.service';
import { inboundService } from '@/src/services/inbound.service';
import UserModel from '@/src/models/user.model';
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const POST = withCORS(async (req: NextRequest) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[auth/register] [${requestId}] Starting registration request`);
  console.log(`[auth/register] [${requestId}] origin:`, req.headers.get('origin'));
  await ensureDb();
  const body = await req.json();
  const { email, name, password } = body || {};
  if (!email || !password) {
    console.log(`[auth/register] [${requestId}] Missing email or password`);
    return new Response(JSON.stringify({ message: 'Email & password required' }), { status: HTTPSTATUS.BAD_REQUEST });
  }
  try {
    console.log(`[auth/register] [${requestId}] Calling registerUserService for email:`, email);
    const { userId, emailVerificationToken } = await registerUserService({ email, name, password });

    // Build verification link
    const frontendUrl = process.env.FRONTEND_ORIGIN || process.env.APP_BASE_URL || 'http://localhost:3000';
    console.log(`[auth/register] [${requestId}] Using frontendUrl:`, frontendUrl);
    const verifyUrl = `${frontendUrl}/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(email)}`;

    // For now we do not auto-login until verified; optionally issue limited cookie

    // Optionally log out email send simulation (Testmail)
    console.log(`[auth/register] [${requestId}] verification link:`, verifyUrl);

    // Attempt to send email using Inbound service
    console.log(`[auth/register] [${requestId}] Sending verification email to:`, email);
    try {
      if (inboundService.isConfigured()) {
        await inboundService.sendVerificationEmail(email, verifyUrl, name);
        console.log(`[auth/register] [${requestId}] Inbound email sent successfully`);
      } else {
        // Fallback to original email service
        await sendEmail({ to: email, subject: 'Verify your account', text: `Click to verify: ${verifyUrl}` });
        console.log(`[auth/register] [${requestId}] Fallback email sent successfully`);
      }
    }
    catch (e) { console.warn(`[auth/register] [${requestId}] send email failed`, (e as any).message); }

    // Schedule auto-deletion after expiry if still unverified (best-effort, non-persistent)
    setTimeout(async () => {
      try {
        const u = await UserModel.findById(userId).select('emailVerified emailVerificationTokenExpires');
        if (u && !u.emailVerified && u.emailVerificationTokenExpires && u.emailVerificationTokenExpires < new Date()) {
          await UserModel.deleteOne({ _id: userId });
          console.log(`[auth/register] [${requestId}] auto-deleted unverified user`, userId.toString());
        }
      } catch (err) {
        console.warn(`[auth/register] [${requestId}] auto-delete check failed`, (err as any).message);
      }
    }, 1000 * 60 * 15 + 10000); // 15 minutes + buffer

    console.log(`[auth/register] [${requestId}] Registration completed successfully`);
    return new Response(JSON.stringify({
      message: 'Registered. Verify your email.',
      verifyUrl,
      user: { _id: userId }
    }), {
      status: HTTPSTATUS.CREATED,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.log(`[auth/register] [${requestId}] Registration failed:`, e.message);
    return new Response(JSON.stringify({ message: e.message || 'Registration failed' }), { status: e.statusCode || 500 });
  }
});
