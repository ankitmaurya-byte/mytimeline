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
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated'
      }), { 
        status: HTTPSTATUS.UNAUTHORIZED,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!(user as any).isAdmin) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Forbidden',
        error: 'Admin access required'
      }), { 
        status: HTTPSTATUS.FORBIDDEN,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get comprehensive metrics with performance tracking
    const startTime = Date.now();
    const metrics = await adminMetricsService.getMetrics();
    const responseTime = Date.now() - startTime;

    // Add system performance metrics
    const systemMetrics = {
      responseTime,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development'
    };

    const response = {
      success: true,
      message: 'Comprehensive metrics retrieved successfully',
      data: {
        metrics,
        system: systemMetrics,
        performance: {
          dashboardResponseTime: responseTime,
          metricsGenerationTime: metrics.generatedAt ? Date.now() - new Date(metrics.generatedAt).getTime() : 0,
          cacheStatus: metrics.cached ? 'HIT' : 'MISS'
        }
      }
    };

    return new Response(JSON.stringify(response, null, 2), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
        'X-Metrics-Cache': metrics.cached ? 'HIT' : 'MISS'
      }
    });

  } catch (e: any) {
    console.error('[admin/metrics] Error:', e);
    
    const errorResponse = {
      success: false,
      message: 'Failed to retrieve comprehensive metrics',
      error: e?.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    };

    return new Response(JSON.stringify(errorResponse, null, 2), { 
      status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
