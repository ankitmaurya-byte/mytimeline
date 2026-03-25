export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { updateUserService } from '../../../../src/services/user.service';
import { withCORS } from '../../_lib/cors';

export const PUT = withCORS(async (req: NextRequest) => {
  await ensureDb();
  const authUser = await getDbUserFromRequest(req);
  if (!authUser) {
    return new Response(JSON.stringify({ message: 'Unauthorized', user: null }), { status: 401 });
  }

  const body = await req.json();
  const { name } = body ?? {};

  const { user } = await updateUserService(String((authUser as any)._id), { name });

  return new Response(JSON.stringify({ message: 'User updated', user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
