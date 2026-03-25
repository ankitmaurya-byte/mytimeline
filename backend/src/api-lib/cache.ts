import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;

// Enhanced Redis configuration with error handling
let redis: Redis | null = null;

if (redisUrl) {
    try {
        redis = new Redis(redisUrl, {
            connectTimeout: 10000,
            commandTimeout: 5000,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        // Connection event handlers
        redis.on('connect', () => {
            logger.info('Redis connected successfully');
        });

        redis.on('ready', () => {
            logger.info('Redis ready to accept commands');
        });

        redis.on('error', (err) => {
            logger.error({ err }, 'Redis connection error');
            // Don't set redis to null here, let it try to reconnect
        });

        redis.on('close', () => {
            logger.warn('Redis connection closed');
        });

        redis.on('reconnecting', () => {
            logger.info('Redis reconnecting...');
        });

        redis.on('end', () => {
            logger.warn('Redis connection ended');
        });

        // Test connection
        redis.ping().catch(err => {
            logger.error({ err }, 'Redis ping failed');
        });

    } catch (error) {
        logger.error({ error }, 'Failed to create Redis connection');
        redis = null;
    }
}

// Health check function
export async function isRedisHealthy(): Promise<boolean> {
    if (!redis) return false;

    try {
        await redis.ping();
        return true;
    } catch (error) {
        logger.warn({ error }, 'Redis health check failed');
        return false;
    }
}

export { redis };

export function withCache(
    handler: (req: Request | any, ...args: any[]) => Promise<Response>,
    options: { ttlSeconds: number; buildKey?: (req: Request) => string }
) {
    const { ttlSeconds, buildKey } = options;

    return async (req: Request | any, ...args: any[]) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return handler(req, ...args);
        }

        // Check if Redis is healthy before using it
        if (!redis || !(await isRedisHealthy())) {
            return handler(req, ...args);
        }

        const key = buildKey ? buildKey(req) : req.url;

        try {
            // Try to get from cache
            const cached = await redis.get(key);
            if (cached) {
                logger.info({ key }, 'Cache HIT');
                return new Response(cached, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Cache': 'HIT',
                        'Cache-Control': `public, max-age=${ttlSeconds}`
                    },
                });
            }
        } catch (err) {
            logger.warn({ err, key }, 'Redis get failed, falling back to handler');
            // Continue to handler on cache failure
        }

        // Execute handler
        const response = await handler(req, ...args);

        // Only cache successful responses
        if (response.ok && response.status === 200) {
            try {
                const body = await response.clone().text();

                // Validate response body before caching
                if (body && body.length > 0 && body !== 'null' && body !== 'undefined') {
                    await redis.set(key, body, 'EX', ttlSeconds);
                    logger.info({ key, ttl: ttlSeconds }, 'Cached response');
                }
            } catch (err) {
                logger.warn({ err, key }, 'Redis set failed');
                // Don't fail the response if caching fails
            }
        }

        return response;
    };
}
