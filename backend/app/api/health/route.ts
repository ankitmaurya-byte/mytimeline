import { NextRequest } from 'next/server';
import { withCORS } from '../_lib/cors';
import { ensureDb, isDbHealthy } from '../_lib/db';
import { cache } from '../../../src/utils/cache';
import { logInfo, logError } from '../../../src/utils/logger';

/**
 * @swagger
 * /api/health:
 *   options:
 *     tags: [Health]
 *     summary: CORS preflight for health endpoint
 *     description: Handles CORS preflight requests for the health endpoint
 *     responses:
 *       204:
 *         description: No Content - CORS preflight successful
 */
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: System health check
 *     description: |
 *       Comprehensive health check endpoint that monitors:
 *       - Database connectivity and response time
 *       - Cache system (Redis/In-memory) status
 *       - System resources (memory, CPU)
 *       - Application uptime and version info
 *     responses:
 *       200:
 *         description: Health check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, timestamp, version, environment, uptime, responseTime, checks]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   example: healthy
 *                   description: Overall system health status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:45.123Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                   description: Application version
 *                 environment:
 *                   type: string
 *                   enum: [development, production, test]
 *                   example: development
 *                 uptime:
 *                   type: integer
 *                   example: 3600
 *                   description: Application uptime in seconds
 *                 responseTime:
 *                   type: integer
 *                   example: 45
 *                   description: Health check response time in milliseconds
 *                 checks:
 *                   type: object
 *                   required: [database, cache, system]
 *                   properties:
 *                     database:
 *                       type: object
 *                       required: [status, responseTime]
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, degraded, unhealthy]
 *                           example: healthy
 *                         responseTime:
 *                           type: integer
 *                           example: 25
 *                           description: Database response time in milliseconds
 *                         error:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                           description: Error message if database is unhealthy
 *                     cache:
 *                       type: object
 *                       required: [status, responseTime, type]
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, degraded, unhealthy]
 *                           example: healthy
 *                         responseTime:
 *                           type: integer
 *                           example: 5
 *                           description: Cache response time in milliseconds
 *                         type:
 *                           type: string
 *                           enum: [redis, memory]
 *                           example: redis
 *                           description: Type of cache system in use
 *                         error:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                           description: Error message if cache is unhealthy
 *                     system:
 *                       type: object
 *                       required: [status, memory, cpu]
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           example: healthy
 *                         memory:
 *                           type: object
 *                           properties:
 *                             used:
 *                               type: integer
 *                               example: 134217728
 *                               description: Used memory in bytes
 *                             total:
 *                               type: integer
 *                               example: 268435456
 *                               description: Total available memory in bytes
 *                             usage:
 *                               type: number
 *                               example: 50.5
 *                               description: Memory usage percentage
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             usage:
 *                               type: number
 *                               example: 15.3
 *                               description: CPU usage percentage
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Enhanced health check with comprehensive monitoring
export const GET = withCORS(async (req: NextRequest) => {
    const startTime = Date.now();

    const health = {
        status: 'healthy' as 'healthy' | 'unhealthy' | 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        responseTime: 0,
        checks: {
            database: {
                status: 'unknown' as 'healthy' | 'unhealthy' | 'degraded',
                responseTime: 0,
                error: undefined as string | undefined
            },
            cache: {
                status: 'unknown' as 'healthy' | 'unhealthy' | 'degraded',
                responseTime: 0,
                type: 'unknown',
                error: undefined as string | undefined
            },
            system: {
                status: 'healthy' as 'healthy' | 'unhealthy',
                memory: {} as any,
                cpu: {} as any
            }
        }
    };

    try {
        // Check if MONGO_URI is set
        if (!process.env.MONGO_URI) {
            health.checks.database = {
                status: 'unhealthy',
                responseTime: 0,
                error: 'MONGO_URI environment variable is not set'
            };
            health.status = 'degraded';
        } else {
            // Check database health
            const dbStart = Date.now();
            try {
                await ensureDb();
                const isHealthy = await isDbHealthy();
                health.checks.database = {
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    responseTime: Date.now() - dbStart,
                    error: undefined
                };

                if (!isHealthy) {
                    health.status = 'degraded';
                }
            } catch (error) {
                health.checks.database = {
                    status: 'unhealthy',
                    responseTime: Date.now() - dbStart,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
                health.status = 'unhealthy';
            }
        }

        // Check cache health
        const cacheStart = Date.now();
        try {
            const cacheStats = await cache.getStats();
            health.checks.cache = {
                status: cacheStats.connected ? 'healthy' : 'degraded',
                responseTime: Date.now() - cacheStart,
                type: cacheStats.type,
                error: cacheStats.error
            };

        } catch (error) {
            health.checks.cache = {
                status: 'unhealthy',
                responseTime: Date.now() - cacheStart,
                type: 'unknown',
                error: error instanceof Error ? error.message : 'Unknown cache error'
            };
        }

        // Check system resources
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        health.checks.system.memory = {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) // %
        };

        health.checks.system.cpu = {
            user: cpuUsage.user,
            system: cpuUsage.system
        };

        // Check if system resources are concerning
        if (health.checks.system.memory.usage > 98) {
            health.checks.system.status = 'unhealthy';
            health.status = 'degraded';
        }

        // Overall status determination
        if (health.checks.database.status === 'unhealthy') {
            health.status = 'unhealthy';
        } else if (
            health.checks.database.status === 'degraded' ||
            health.checks.cache.status === 'degraded' ||
            health.checks.system.status === 'unhealthy'
        ) {
            health.status = 'degraded';
        }

        health.responseTime = Date.now() - startTime;

        // Only log health check results in production or if there are issues
        const shouldLog = process.env.NODE_ENV === 'production' ||
            health.status !== 'healthy' ||
            health.responseTime > 1000; // Log if response time is high

        if (shouldLog) {
            logInfo('Health check completed', {
                status: health.status,
                responseTime: health.responseTime,
                database: health.checks.database.status,
                cache: health.checks.cache.status,
                memory: health.checks.system.memory.usage
            });
        }

        // Return appropriate HTTP status code
        const httpStatus = health.status === 'healthy' ? 200 :
            health.status === 'degraded' ? 503 : 500;

        return new Response(JSON.stringify(health, null, 2), {
            status: httpStatus,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        const errorResponse = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
        };

        logError('Health check failed', error as Error);

        return new Response(JSON.stringify(errorResponse, null, 2), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
});
