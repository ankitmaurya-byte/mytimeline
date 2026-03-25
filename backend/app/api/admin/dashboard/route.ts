import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { adminMetricsService } from '../../../../src/services/admin-metrics.service';
import UserModel from '../../../../src/models/user.model';
import { HTTPSTATUS } from '../../../../src/config/http.config';
import { withCORS } from '../../_lib/cors';

export const dynamic = 'force-dynamic';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const user = await getDbUserFromRequest(req);

    if (!user) {
      return new Response(JSON.stringify({
        message: 'Unauthorized',
        error: 'User not authenticated'
      }), {
        status: HTTPSTATUS.UNAUTHORIZED,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Bootstrap: if no admin exists yet, promote the first authenticated user
    if (!(user as any).isAdmin) {
      const existingAdmins = await UserModel.countDocuments({ isAdmin: true });
      if (existingAdmins === 0) {
        await UserModel.updateOne(
          { _id: (user as any)._id },
          { $set: { isAdmin: true } }
        );
        (user as any).isAdmin = true;
        console.log('[admin-bootstrap] Promoted first user to admin:', (user as any).email);
      }
    }

    if (!(user as any).isAdmin) {
      return new Response(JSON.stringify({
        message: 'Forbidden',
        error: 'Admin access required'
      }), {
        status: HTTPSTATUS.FORBIDDEN,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get comprehensive metrics
    const startTime = Date.now();
    const metrics = await adminMetricsService.getMetrics();
    const responseTime = Date.now() - startTime;

    // Add response metadata
    const response = {
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: {
        metrics,
        metadata: {
          generatedAt: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
          admin: {
            id: (user as any)._id,
            email: (user as any).email,
            name: (user as any).name
          }
        }
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (e: any) {
    console.error('[admin/dashboard] Error:', e);

    const errorResponse = {
      success: false,
      message: 'Failed to retrieve dashboard metrics',
      error: e?.message || 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
