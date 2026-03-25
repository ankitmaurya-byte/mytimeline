import Redis from 'ioredis';
import { logger } from './logger';

// Redis configuration
const redisConfig = {
    host: process.env.NEXT_PUBLIC_REDIS_HOST || 'localhost',
    port: parseInt(process.env.NEXT_PUBLIC_REDIS_PORT || '6379'),
    password: process.env.NEXT_PUBLIC_REDIS_PASSWORD,
    db: parseInt(process.env.NEXT_PUBLIC_REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    showFriendlyErrorStack: process.env.NODE_ENV === 'development',
};

// Create Redis client
export const redis = new Redis(redisConfig);

// Connection event handlers
redis.on('connect', () => {
    logger.info(null, 'Redis client connected');
});

redis.on('ready', () => {
    logger.info(null, 'Redis client ready');
});

redis.on('error', (error) => {
    logger.error({ error: error.message }, 'Redis client error');
});

redis.on('close', () => {
    logger.warn(null, 'Redis client connection closed');
});

redis.on('reconnecting', () => {
    logger.info(null, 'Redis client reconnecting...');
});

// Utility functions
export const redisUtils = {
    // Set with expiration
    setEx: async (key: string, value: string, ttl: number) => {
        try {
            await redis.setex(key, ttl, value);
            return true;
        } catch (error) {
            logger.error({ key, error: error.message }, 'Redis setEx error');
            return false;
        }
    },

    // Get value
    get: async (key: string) => {
        try {
            return await redis.get(key);
        } catch (error) {
            logger.error({ key, error: error.message }, 'Redis get error');
            return null;
        }
    },

    // Delete key
    del: async (key: string) => {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            logger.error({ key, error: error.message }, 'Redis del error');
            return false;
        }
    },

    // Check if key exists
    exists: async (key: string) => {
        try {
            return await redis.exists(key);
        } catch (error) {
            logger.error({ key, error: error.message }, 'Redis exists error');
            return false;
        }
    },

    // Set multiple values
    mset: async (keyValuePairs: Record<string, string>) => {
        try {
            await redis.mset(keyValuePairs);
            return true;
        } catch (error) {
            logger.error({ error: error.message }, 'Redis mset error');
            return false;
        }
    },

    // Get multiple values
    mget: async (keys: string[]) => {
        try {
            return await redis.mget(keys);
        } catch (error) {
            logger.error({ keys, error: error.message }, 'Redis mget error');
            return [];
        }
    },
};

export default redis;
