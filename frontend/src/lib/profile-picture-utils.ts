/**
 * Utility functions for handling profile picture URLs with smart caching
 */

// Track profile picture changes to avoid unnecessary refreshes
const profilePictureCache = new Map<string, string>();

/**
 * Get the full profile picture URL with smart caching and responsive sizing
 */
export function getProfilePictureUrl(profilePicture?: string, size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): string | null {
  if (!profilePicture) return null;

  // If it's already a full URL (starts with http/https), return as is
  // This includes Cloudinary URLs which are already optimized
  if (profilePicture.startsWith('http')) {
    // For Cloudinary URLs, add responsive sizing if size is specified
    if (profilePicture.includes('cloudinary.com') && size) {
      const sizeMap = {
        xs: 'w_16,h_16,c_fill',
        sm: 'w_24,h_24,c_fill',
        md: 'w_32,h_32,c_fill',
        lg: 'w_40,h_40,c_fill',
        xl: 'w_48,h_48,c_fill',
        '2xl': 'w_64,h_64,c_fill'
      };

      // Insert size transformation into Cloudinary URL
      const urlParts = profilePicture.split('/upload/');
      if (urlParts.length === 2) {
        return `${urlParts[0]}/upload/${sizeMap[size]}/q_auto,f_auto/${urlParts[1]}`;
      }
    }
    return profilePicture;
  }

  // If it's a base64 data URL (data:image/...), return as is
  if (profilePicture.startsWith('data:')) {
    return profilePicture;
  }

  // Handle backward compatibility: if URL starts with /uploads but not /api/uploads, add /api prefix
  let processedUrl = profilePicture;
  if (profilePicture.startsWith('/uploads/') && !profilePicture.startsWith('/api/uploads/')) {
    processedUrl = `/api${profilePicture}`;
  }

  // For old file-based URLs that might not exist anymore, return null to show default avatar
  if (processedUrl.startsWith('/api/uploads/')) {
    return null; // This will show the default avatar instead of broken image
  }

  // Construct full URL with backend URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const fullUrl = `${backendUrl}${processedUrl}`;

  // Return URL without cache-busting for stable rendering
  return fullUrl;
}

/**
 * Get a profile picture URL with cache-busting (only use when you need to force refresh)
 * This should be used sparingly, like after profile picture updates
 */
export function getProfilePictureUrlWithCacheBusting(profilePicture?: string): string | null {
  if (!profilePicture) return null;

  const baseUrl = getProfilePictureUrl(profilePicture);
  if (!baseUrl) return null;

  // Add timestamp as query parameter to force browser cache refresh
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${Date.now()}`;
}

/**
 * Force refresh profile picture by invalidating browser cache
 * This can be used after profile picture updates
 */
export function refreshProfilePictureCache(profilePicture?: string): void {
  if (!profilePicture) return;

  const fullUrl = getProfilePictureUrlWithCacheBusting(profilePicture);
  if (!fullUrl) return; // Handle null case

  // Create a new image element to preload the fresh image
  const img = new Image();
  img.src = fullUrl;
}

/**
 * Get a stable profile picture URL that only changes when the actual image changes
 * This prevents unnecessary re-renders while maintaining proper caching
 */
export function getStableProfilePictureUrl(profilePicture?: string, userId?: string): string | null {
  if (!profilePicture) return null;
  if (!userId) return getProfilePictureUrl(profilePicture);

  const cacheKey = `${userId}:${profilePicture}`;
  const cachedUrl = profilePictureCache.get(cacheKey);

  if (cachedUrl) {
    return cachedUrl;
  }

  // For new or changed profile pictures, add a hash-based cache buster
  // This ensures the image refreshes when it actually changes, not on every render
  const baseUrl = getProfilePictureUrl(profilePicture);
  if (!baseUrl) return null;

  // Create a simple hash from the profile picture path to use as cache buster
  // This will be stable until the actual image changes
  const hash = profilePicture?.split('/').pop()?.split('.')[0] || 'default';
  const separator = baseUrl.includes('?') ? '&' : '?';
  const stableUrl = `${baseUrl}${separator}v=${hash}`;

  // Cache the stable URL
  profilePictureCache.set(cacheKey, stableUrl);

  return stableUrl;
}

/**
 * Clear the profile picture cache for a specific user
 * Use this when you know a user's profile picture has changed
 */
export function clearProfilePictureCache(userId: string): void {
  // Remove all cached URLs for this user
  for (const key of profilePictureCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      profilePictureCache.delete(key);
    }
  }
}

/**
 * Clear all profile picture caches
 * Use this sparingly, like during logout or major updates
 */
export function clearAllProfilePictureCaches(): void {
  profilePictureCache.clear();
}
