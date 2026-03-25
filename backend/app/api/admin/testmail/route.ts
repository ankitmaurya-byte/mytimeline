import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import testmailService from '../../../../src/services/testmail.service';
import { HTTPSTATUS } from '../../../../src/config/http.config';
import UserModel from '../../../../src/models/user.model';
import { withCORS } from '../../_lib/cors';

export const dynamic = 'force-dynamic';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const user = await getDbUserFromRequest(req);
    if (!user) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });
    if (!(user as any).isAdmin) {
      const existingAdmins = await UserModel.countDocuments({ isAdmin: true });
      if (existingAdmins === 0) {
        await UserModel.updateOne({ _id: (user as any)._id }, { $set: { isAdmin: true } });
        (user as any).isAdmin = true;
        console.log('[admin-bootstrap] Promoted first user to admin');
      }
    }
    if (!(user as any).isAdmin) return new Response(JSON.stringify({ message: 'Forbidden' }), { status: HTTPSTATUS.FORBIDDEN });

    const url = new URL(req.url);
    const tag = url.searchParams.get('tag') || undefined;

    try {
      const emails = await testmailService.listMessages(tag);
      return new Response(JSON.stringify({ message: 'ok', emails, tag, sampleInbox: tag ? testmailService.generateInboxAddress(tag) : undefined }), { status: HTTPSTATUS.OK });
    } catch (e: any) {
      return new Response(JSON.stringify({ message: e?.message || 'Testmail error' }), { status: HTTPSTATUS.BAD_REQUEST });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e?.message || 'Internal Error' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});
