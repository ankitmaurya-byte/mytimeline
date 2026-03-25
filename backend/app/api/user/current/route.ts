import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { withCORS } from '../../_lib/cors';
import * as jwt from 'jsonwebtoken';
import { verifyJwt } from '@/src/utils/jwt';

/**
 * @swagger
 * /api/user/current:
 *   options:
 *     tags: [Users]
 *     summary: CORS preflight for current user endpoint
 *     description: Handles CORS preflight requests for the current user endpoint
 *     responses:
 *       204:
 *         description: No Content - CORS preflight successful
 */
// OPTIONS handler for CORS
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

/**
 * @swagger
 * /api/user/current:
 *   get:
 *     tags: [Users]
 *     summary: Get current authenticated user
 *     description: |
 *       Retrieves the current authenticated user's information.
 *       This is a legacy endpoint - prefer /api/auth/me for new implementations.
 *       Supports both cookie-based and Bearer token authentication.
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Current user information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required or token invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *                 reason:
 *                   type: string
 *                   enum: [no-token, verify-failed, verify-failed-bearer, user-not-found]
 *                   example: "no-token"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Backward-compatible shim for legacy /api/user/current clients.
// Prefer /api/auth/me for new code. Kept intentionally minimal (no rate limit/cache wrappers).
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
    return new Response(JSON.stringify({ message: 'Unauthorized', user: null, debug: { reason, hasCookie: !!cookieAuth, hasAuthz: !!authz, verifyOk: !!decoded, rawDecoded } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ message: 'Current user fetched', user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
