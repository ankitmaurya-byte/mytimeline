import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { redisUtils } from '@/lib/redis';
import { logger } from '@/lib/logger';

interface CachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
    queryFn: () => Promise<T>;
    cacheKey: string;
    ttl?: number; // Time to live in seconds
    enableCache?: boolean;
}

export function useCachedQuery<T>({
    queryFn,
    cacheKey,
    ttl = 300, // 5 minutes default
    enableCache = true,
    ...queryOptions
}: CachedQueryOptions<T>) {
    const enhancedQueryFn = async (): Promise<T> => {
        if (!enableCache) {
            return queryFn();
        }

        try {
            // Try to get from Redis cache first
            const cached = await redisUtils.get(cacheKey);
            if (cached) {
                logger.debug({ cacheKey }, 'Cache hit');
                return JSON.parse(cached);
            }

            // If not in cache, fetch from API
            logger.debug({ cacheKey }, 'Cache miss, fetching from API');
            const data = await queryFn();

            // Store in Redis cache
            await redisUtils.setEx(cacheKey, JSON.stringify(data), ttl);
            logger.debug({ cacheKey, ttl }, 'Data cached');

            return data;
        } catch (error) {
            logger.error({ cacheKey, error: error.message }, 'Error in cached query');
            // Fallback to direct API call if caching fails
            return queryFn();
        }
    };

    return useQuery({
        ...queryOptions,
        queryFn: enhancedQueryFn,
    });
}

// Utility hook for invalidating cache
export function useCacheInvalidation() {
    const invalidateCache = async (pattern: string) => {
        try {
            // Note: Redis pattern matching for deletion would require additional setup
            // For now, we'll use the existing cache key
            await redisUtils.del(pattern);
            logger.info({ pattern }, 'Cache invalidated');
        } catch (error) {
            logger.error({ pattern, error: error.message }, 'Cache invalidation failed');
        }
    };

    return { invalidateCache };
}
