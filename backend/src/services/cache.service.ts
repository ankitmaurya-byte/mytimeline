import Redis from 'ioredis';
import { config } from '../config/app.config';

// Redis client configuration
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
});

// Cache configuration
const CACHE_TTL = {
    SHORT: 300,      // 5 minutes
    MEDIUM: 1800,    // 30 minutes
    LONG: 3600,      // 1 hour
    VERY_LONG: 86400, // 24 hours
};

class CacheService {
    private redis: Redis;

    constructor() {
        this.redis = redis;
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        this.redis.on('error', (err) => {
            // Only log Redis errors once per minute to reduce spam
            if (!this.lastErrorTime || Date.now() - this.lastErrorTime > 60000) {
                console.warn('⚠️ Redis not available - using fallback cache');
                this.lastErrorTime = Date.now();
            }
        });

        this.redis.on('ready', () => {
            console.log('🚀 Redis is ready');
        });
    }

    private lastErrorTime: number = 0;

    /**
     * Set cache with TTL
     */
    async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);
            await this.redis.setex(key, ttl, serializedValue);
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    /**
     * Get cache value
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Delete cache key
     */
    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    /**
     * Delete multiple cache keys by pattern
     */
    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache pattern delete error:', error);
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }

    /**
     * Set cache if not exists (atomic operation)
     */
    async setNX(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
        try {
            const serializedValue = JSON.stringify(value);
            const result = await this.redis.set(key, serializedValue, 'EX', ttl, 'NX');
            return result === 'OK';
        } catch (error) {
            console.error('Cache setNX error:', error);
            return false;
        }
    }

    /**
     * Increment counter
     */
    async incr(key: string): Promise<number> {
        try {
            return await this.redis.incr(key);
        } catch (error) {
            console.error('Cache incr error:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<any> {
        try {
            const info = await this.redis.info();
            const keyspace = await this.redis.info('keyspace');
            return { info, keyspace };
        } catch (error) {
            console.error('Cache stats error:', error);
            return null;
        }
    }

    /**
     * Clear all cache
     */
    async flushAll(): Promise<void> {
        try {
            await this.redis.flushall();
        } catch (error) {
            console.error('Cache flush error:', error);
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.redis.ping();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Cache key generators for consistent naming
export const cacheKeys = {
    workspace: (id: string) => `workspace:${id}`,
    workspaceMembers: (id: string) => `workspace:${id}:members`,
    workspaceProjects: (id: string) => `workspace:${id}:projects`,
    workspaceTasks: (id: string) => `workspace:${id}:tasks`,
    user: (id: string) => `user:${id}`,
    project: (id: string) => `project:${id}`,
    task: (id: string) => `task:${id}`,
    member: (userId: string, workspaceId: string) => `member:${userId}:${workspaceId}`,
};

export const cacheService = new CacheService();
export default cacheService;
