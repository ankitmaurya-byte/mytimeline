import Redis from 'ioredis';
import { env, isRedisEnabled } from '../config/env.config';
import { logInfo, logWarn, logError } from '../utils/logger';

// Cache configuration
const CACHE_CONFIG = {
  // TTL (Time To Live) in seconds
  TTL: {
    SHORT: 300,    // 5 minutes
    MEDIUM: 1800,  // 30 minutes
    LONG: 3600,    // 1 hour
    DAILY: 86400,  // 24 hours
  },

  // Cache keys
  KEYS: {
    USER_PROFILE: (userId: string) => `user:profile:${userId}`,
    WORKSPACE_MEMBERS: (workspaceId: string) => `workspace:members:${workspaceId}`,
    WORKSPACE_PROJECTS: (workspaceId: string) => `workspace:projects:${workspaceId}`,
    PROJECT_TASKS: (projectId: string) => `project:tasks:${projectId}`,
    USER_WORKSPACES: (userId: string) => `user:workspaces:${userId}`,
    WORKSPACE_STATS: (workspaceId: string) => `workspace:stats:${workspaceId}`,
    PROJECT_STATS: (projectId: string) => `project:stats:${projectId}`,
    USER_PERMISSIONS: (userId: string, workspaceId: string) => `user:permissions:${userId}:${workspaceId}`,
  }
};

class CacheManager {
  private redis: Redis | null = null;
  private isConnected = false;
  private inMemoryCache = new Map<string, { data: any; expires: number }>();

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    if (!isRedisEnabled()) {
      logWarn('Redis not configured, using in-memory cache fallback');
      return;
    }

    try {
      this.redis = new Redis(env?.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      // Add event listeners
      this.redis.on('ready', () => {
        this.isConnected = true;
        logInfo('✅ Redis cache connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logError('Redis connection error', error);
      });

      this.redis.on('reconnecting', () => {
        logWarn('🔄 Reconnecting to Redis...');
      });
    } catch (error) {
      logError('Failed to initialize Redis', error as Error);
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis && this.isConnected) {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
      } else {
        // Fallback to in-memory cache
        return this.getFromMemory<T>(key);
      }
      return null;
    } catch (error) {
      logError(`Cache get failed for key: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set(key: string, data: any, ttlSeconds: number = CACHE_CONFIG.TTL.MEDIUM): Promise<void> {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
      } else {
        // Fallback to in-memory cache
        this.setInMemory(key, data, ttlSeconds);
      }
    } catch (error) {
      logError(`Cache set failed for key: ${key}`, error as Error);
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.del(key);
      } else {
        this.inMemoryCache.delete(key);
      }
    } catch (error) {
      logError(`Cache delete failed for key: ${key}`, error as Error);
    }
  }

  /**
   * Delete multiple keys with pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.redis && this.isConnected) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Clear matching keys from in-memory cache
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.inMemoryCache.keys()) {
          if (regex.test(key)) {
            this.inMemoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      logError(`Cache pattern delete failed for pattern: ${pattern}`, error as Error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = CACHE_CONFIG.TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute function and cache result
    const data = await fetchFunction();
    await this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Invalidate cache for specific entities
   */
  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.delete(CACHE_CONFIG.KEYS.USER_PROFILE(userId)),
      this.delete(CACHE_CONFIG.KEYS.USER_WORKSPACES(userId)),
      this.deletePattern(`user:permissions:${userId}:*`)
    ]);
  }

  async invalidateWorkspace(workspaceId: string): Promise<void> {
    await Promise.all([
      this.delete(CACHE_CONFIG.KEYS.WORKSPACE_MEMBERS(workspaceId)),
      this.delete(CACHE_CONFIG.KEYS.WORKSPACE_PROJECTS(workspaceId)),
      this.delete(CACHE_CONFIG.KEYS.WORKSPACE_STATS(workspaceId)),
      this.deletePattern(`user:permissions:*:${workspaceId}`),
      this.deletePattern(`user:workspaces:*`) // Invalidate all user workspace lists
    ]);
  }

  async invalidateProject(projectId: string, workspaceId?: string): Promise<void> {
    await Promise.all([
      this.delete(CACHE_CONFIG.KEYS.PROJECT_TASKS(projectId)),
      this.delete(CACHE_CONFIG.KEYS.PROJECT_STATS(projectId)),
      ...(workspaceId ? [
        this.delete(CACHE_CONFIG.KEYS.WORKSPACE_PROJECTS(workspaceId)),
        this.delete(CACHE_CONFIG.KEYS.WORKSPACE_STATS(workspaceId))
      ] : [])
    ]);
  }

  /**
   * In-memory cache fallback methods
   */
  private getFromMemory<T>(key: string): T | null {
    const item = this.inMemoryCache.get(key);
    if (item && Date.now() < item.expires) {
      return item.data;
    }
    if (item) {
      this.inMemoryCache.delete(key); // Remove expired item
    }
    return null;
  }

  private setInMemory(key: string, data: any, ttlSeconds: number): void {
    // Prevent memory leaks by limiting cache size
    if (this.inMemoryCache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.inMemoryCache.entries());
      entries.slice(0, 200).forEach(([key]) => this.inMemoryCache.delete(key));
    }

    const expires = Date.now() + (ttlSeconds * 1000);
    this.inMemoryCache.set(key, { data, expires });
  }

  /**
   * Cache statistics
   */
  async getStats(): Promise<any> {
    try {
      if (this.redis && this.isConnected) {
        const info = await this.redis.info('memory');
        return {
          type: 'redis',
          connected: this.isConnected,
          memory: info
        };
      } else {
        return {
          type: 'in-memory',
          connected: true,
          size: this.inMemoryCache.size,
          keys: Array.from(this.inMemoryCache.keys()).slice(0, 10) // Show first 10 keys
        };
      }
    } catch (error) {
      logError('Failed to get cache stats', error as Error);
      return { type: 'unknown', error: (error as Error).message };
    }
  }

  /**
   * Cleanup expired in-memory cache entries
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of this.inMemoryCache.entries()) {
      if (now >= item.expires) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Start periodic cleanup for in-memory cache
   */
  startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      logInfo('🔌 Redis connection closed');
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();
export { CACHE_CONFIG };

// Start cleanup interval
cache.startCleanupInterval();

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await cache.close();
});

process.on('SIGTERM', async () => {
  await cache.close();
});
