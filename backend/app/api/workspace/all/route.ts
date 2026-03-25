import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { getAllWorkspacesUserIsMemberService } from '@/src/services/workspace.service';
import { HTTPSTATUS } from '@/src/config/http.config';
import { withCORS } from '../../_lib/cors';
import { withError } from '@/src/api-lib/error';
import { withRateLimit } from '@/src/api-lib/rate-limit';
import { withCache } from '@/src/api-lib/cache';

export const GET = withError(withCORS(withRateLimit(async (req: NextRequest) => {
  await ensureDb();
  const authUser = await getDbUserFromRequest(req);
  if (!authUser) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });

  // console.log('[workspace/all] Fetching workspaces for user:', (authUser as any)._id);
  const { workspaces } = await getAllWorkspacesUserIsMemberService(String((authUser as any)._id));
  // console.log('[workspace/all] Found workspaces:', workspaces?.length, workspaces?.map(w => ({ id: w._id, name: w.name })));

  return new Response(JSON.stringify({ message: 'User workspaces fetched successfully', workspaces }), {
    status: HTTPSTATUS.OK,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable cache for debugging
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}, { windowMs: 60_000, max: 60 })));

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));
