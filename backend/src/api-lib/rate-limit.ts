type RateLimitOptions = {
  windowMs: number;
  max: number;
  key?: (req: Request) => string | Promise<string>;
};

// Enhanced memory store with automatic cleanup
class MemoryRateLimitStore {
  private store = new Map<string, { count: number; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  get(key: string) {
    return this.store.get(key);
  }

  set(key: string, value: { count: number; expiresAt: number }) {
    this.store.set(key, value);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

const memoryStore = new MemoryRateLimitStore();
import { redis, isRedisHealthy } from './cache';

export function withRateLimit(handler: (req: Request | any, ...args: any[]) => Promise<Response>, options: RateLimitOptions) {
  const { windowMs, max, key } = options;

  return async (req: Request | any, ...args: any[]) => {
    try {
      const clientKey = (key ? await key(req) : req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'global') as string;

      // Try Redis first if available and healthy
      if (redis && await isRedisHealthy()) {
        try {
          const redisKey = `ratelimit:${clientKey}:${Math.floor(Date.now() / windowMs)}`;
          const count = await redis.incr(redisKey);

          if (count === 1) {
            await redis.pexpire(redisKey, windowMs);
          }

          if (count > max) {
            // Get remaining time for retry-after header
            const ttlMs = await redis.pttl(redisKey);
            const retryAfter = Math.max(1, Math.ceil(ttlMs / 1000));

            return new Response(JSON.stringify({
              message: 'Too Many Requests',
              retryAfter,
              limit: max,
              remaining: 0
            }), {
              status: 429,
              headers: {
                'Retry-After': String(retryAfter),
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': String(max),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Date.now() + ttlMs)
              },
            });
          }

          // Add rate limit headers
          const remaining = Math.max(0, max - count);
          const response = await handler(req, ...args);
          response.headers.set('X-RateLimit-Limit', String(max));
          response.headers.set('X-RateLimit-Remaining', String(remaining));
          response.headers.set('X-RateLimit-Reset', String(Date.now() + windowMs));

          return response;

        } catch (redisError) {
          // Fall back to memory store if Redis fails
          console.warn('Redis rate limiting failed, falling back to memory store:', redisError);
        }
      }

      // Fallback to memory store
      const now = Date.now();
      const record = memoryStore.get(clientKey);

      if (!record || record.expiresAt < now) {
        memoryStore.set(clientKey, { count: 1, expiresAt: now + windowMs });
      } else {
        record.count += 1;
        if (record.count > max) {
          const retryAfter = Math.max(0, Math.ceil((record.expiresAt - now) / 1000));

          return new Response(JSON.stringify({
            message: 'Too Many Requests',
            retryAfter,
            limit: max,
            remaining: 0
          }), {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(max),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(record.expiresAt)
            },
          });
        }
        memoryStore.set(clientKey, record);
      }

      // Add rate limit headers
      const remaining = Math.max(0, max - (record?.count || 1));
      const response = await handler(req, ...args);
      response.headers.set('X-RateLimit-Limit', String(max));
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      response.headers.set('X-RateLimit-Reset', String(record?.expiresAt || now + windowMs));

      return response;

    } catch (error) {
      // If rate limiting fails completely, log and continue
      console.error('Rate limiting error:', error);
      return handler(req, ...args);
    }
  };
}

// Cleanup function for graceful shutdown
export function cleanupRateLimit() {
  memoryStore.destroy();
}


