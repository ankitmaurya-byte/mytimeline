import { NextRequest } from 'next/server';
import { withCORS } from '../../_lib/cors';
import { clearAuthCookie, clearJsAuthCookie } from '@/src/utils/jwt';
import { logger } from '../../_lib/logger';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

function buildLogoutResponse(message: string, status = 200) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Clear-Biometric-Credentials': 'true',
  };

  const response = Response.json(
    { message, timestamp: new Date().toISOString() },
    { status, headers }
  );

  return response;
}

export const POST = withCORS(async (req: NextRequest) => {
  const requestOrigin = req.headers.get('origin') ?? undefined;
  const authCookie = clearAuthCookie(requestOrigin);
  const jsCookie = clearJsAuthCookie(requestOrigin);

  const addClearanceHeaders = (response: Response): Response => {
    response.headers.append('Set-Cookie', authCookie);
    response.headers.append('Set-Cookie', jsCookie);
    return response;
  };

  try {
    const response = buildLogoutResponse('Logged out successfully');
    return addClearanceHeaders(response);
  } catch (error) {
    logger.error({ error }, 'Logout error');
    const response = buildLogoutResponse('Logged out successfully', 200);
    return addClearanceHeaders(response);
  }
});
