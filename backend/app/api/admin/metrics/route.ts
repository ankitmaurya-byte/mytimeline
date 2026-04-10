import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { adminMetricsService } from '../../../../src/services/admin-metrics.service';
import { HTTPSTATUS } from '../../../../src/config/http.config';
import { withCORS } from '../../_lib/cors';
import { logger } from '../../_lib/logger';

export const dynamic = 'force-dynamic';

export const OPTIONS = withCORS(() => new Response(null, { status: HTTPSTATUS.NO_CONTENT }));

export const GET = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
  } catch (err) {
    logger.error({ err }, 'Database connection failed');
    return Response.json(
      { message: 'Service temporarily unavailable' },
      { status: HTTPSTATUS.INTERNAL_SERVER_ERROR }
    );
  }

  const user = await getDbUserFromRequest(req);
  if (!user) {
    return Response.json(
      { message: 'Unauthorized' },
      { status: HTTPSTATUS.UNAUTHORIZED }
    );
  }

  if (!(user as any).isAdmin) {
    return Response.json(
      { message: 'Forbidden' },
      { status: HTTPSTATUS.FORBIDDEN }
    );
  }

  const startTime = Date.now();
  let metrics: ReturnType<typeof adminMetricsService.getMetrics> extends Promise<infer T> ? T : never;

  try {
    metrics = await adminMetricsService.getMetrics();
  } catch (err: any) {
    logger.error({ err }, 'Failed to retrieve metrics');
    return Response.json(
      { message: 'Failed to retrieve metrics', error: err?.message },
      { status: HTTPSTATUS.INTERNAL_SERVER_ERROR }
    );
  }

  const responseTime = Date.now() - startTime;

  return Response.json(
    {
      success: true,
      message: 'Metrics retrieved successfully',
      data: {
        metrics,
        performance: {
          responseTime,
          generatedAt: metrics.generatedAt ? Date.now() - new Date(metrics.generatedAt).getTime() : 0,
          cacheStatus: metrics.cached ? 'HIT' : 'MISS',
        },
      },
    },
    {
      status: HTTPSTATUS.OK,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    }
  );
});
