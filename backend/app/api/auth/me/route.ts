import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { HTTPSTATUS } from '@/src/config/http.config';
import { withCORS } from '../../_lib/cors';
import { clearAuthCookie } from '@/src/utils/jwt';
import { logger } from '../../_lib/logger';

export const OPTIONS = withCORS(() => new Response(null, { status: HTTPSTATUS.NO_CONTENT }));

export const GET = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database');
    return Response.json(
      { message: 'Service temporarily unavailable' },
      { status: HTTPSTATUS.INTERNAL_SERVER_ERROR }
    );
  }

  const user = await getDbUserFromRequest(req);
  if (!user) {
    const cookieToken = req.cookies.get('auth_token')?.value;
    if (cookieToken) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      headers['Set-Cookie'] = clearAuthCookie(req.headers.get('origin') ?? undefined);
      logger.info('Clearing stale auth cookie');
      return Response.json({ message: 'Unauthorized' }, { status: HTTPSTATUS.UNAUTHORIZED, headers });
    }
    return Response.json(
      { message: 'Unauthorized' },
      { status: HTTPSTATUS.UNAUTHORIZED }
    );
  }

  const optimizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    currentWorkspace: user.currentWorkspace,
    isAdmin: (user as any).isAdmin,
    superAdmin: (user as any).superAdmin,
    emailVerified: (user as any).emailVerified,
    createdAt: (user as any).createdAt,
    updatedAt: (user as any).updatedAt,
  };

  return Response.json(
    { message: 'Current user fetched', user: optimizedUser },
    {
      status: HTTPSTATUS.OK,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    }
  );
});
