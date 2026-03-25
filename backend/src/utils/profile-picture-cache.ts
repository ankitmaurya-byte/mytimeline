/**
 * Profile Picture Cache - Session-based caching for profile pictures
 * This prevents repeated database queries for the same profile pictures
 */

interface CachedProfilePicture {
  profilePicture: string | null;
  timestamp: number;
  userId: string;
}

class ProfilePictureCache {
  private cache = new Map<string, CachedProfilePicture>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Maximum number of cached entries

  /**
   * Get profile pictures from cache
   */
  get(userIds: string[]): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    const now = Date.now();
    
    for (const userId of userIds) {
      const cached = this.cache.get(userId);
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        result[userId] = cached.profilePicture;
      }
    }
    
    return result;
  }

  /**
   * Set profile pictures in cache
   */
  set(profilePictures: Record<string, string | null>): void {
    const now = Date.now();
    
    for (const [userId, profilePicture] of Object.entries(profilePictures)) {
      // Clean up old entries if cache is getting too large
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        this.cleanup();
      }
      
      this.cache.set(userId, {
        profilePicture,
        timestamp: now,
        userId
      });
    }
  }

  /**
   * Check which user IDs are missing from cache
   */
  getMissingUserIds(userIds: string[]): string[] {
    const now = Date.now();
    const missing: string[] = [];
    
    for (const userId of userIds) {
      const cached = this.cache.get(userId);
      if (!cached || (now - cached.timestamp) >= this.CACHE_DURATION) {
        missing.push(userId);
      }
    }
    
    return missing;
  }

  /**
   * Invalidate cache for specific user (useful when profile picture is updated)
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, value] of this.cache.entries()) {
      if ((now - value.timestamp) >= this.CACHE_DURATION) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; duration: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      duration: this.CACHE_DURATION
    };
  }
}

// Singleton instance
export const profilePictureCache = new ProfilePictureCache();

/**
 * Utility function to get profile pictures with caching
 */
export async function getProfilePicturesWithCache(
  userIds: string[],
  fetchFromDb: (userIds: string[]) => Promise<Record<string, string | null>>
): Promise<Record<string, string | null>> {
  // Get cached results
  const cachedResults = profilePictureCache.get(userIds);
  
  // Find missing user IDs
  const missingUserIds = profilePictureCache.getMissingUserIds(userIds);
  
  // If all are cached, return cached results
  if (missingUserIds.length === 0) {
    return cachedResults;
  }
  
  // Fetch missing ones from database
  const dbResults = await fetchFromDb(missingUserIds);
  
  // Cache the new results
  profilePictureCache.set(dbResults);
  
  // Combine cached and new results
  return {
    ...cachedResults,
    ...dbResults
  };
}





