import { NextRequest } from 'next/server';
import { withCORS } from '../../_lib/cors';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { deleteUserService } from '../../../../src/services/user.service';
import { HTTPSTATUS } from '../../../../src/config/http.config';
import mongoose from 'mongoose';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const DELETE = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const user = await getDbUserFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: HTTPSTATUS.UNAUTHORIZED
      });
    }

    const userId = String((user as any)._id);

    // Start a transaction to ensure all related data is deleted
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      // Delete user account and all related data
      const result = await deleteUserService(userId);

      await session.commitTransaction();

      console.log(`[auth/delete-account] User account deleted: ${userId}`);

      return new Response(JSON.stringify({
        ...result,
        message: 'Account deleted successfully'
      }), {
        status: HTTPSTATUS.OK,
        headers: {
          'Set-Cookie': 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error: any) {
    console.error('[auth/delete-account] Error deleting account:', error);

    if (error.statusCode) {
      return new Response(JSON.stringify({
        message: error.message
      }), { status: error.statusCode });
    }

    return new Response(JSON.stringify({
      message: 'Failed to delete account'
    }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});
