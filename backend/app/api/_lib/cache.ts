import 'server-only';
import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;
export const redis = redisUrl ? new Redis(redisUrl) : null;

export function withCache(
    handler: (req: Request, ...args: any[]) => Promise<Response>,
    options: { ttlSeconds: number; buildKey?: (req: Request) => string }
) {
    const { ttlSeconds, buildKey } = options;
    return async (req: Request, ...args: any[]) => {
        if (!redis || req.method !== 'GET') {
            return handler(req, ...args);
        }
        const key = buildKey ? buildKey(req) : req.url;
        try {
            const cached = await redis.get(key);
            if (cached) {
                return new Response(cached, {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
                });
            }
        } catch (err) {
            logger.warn({ err }, 'Redis get failed');
        }

        const response = await handler(req, ...args);
        try {
            if (response.ok) {
                const body = await response.clone().text();
                await redis.set(key, body, 'EX', ttlSeconds);
            }
        } catch (err) {
            logger.warn({ err }, 'Redis set failed');
        }
        return response;
    };
}


