/**
 * Utility functions for handling authentication tokens
 */

/**
 * Get the authentication token from cookies
 * @returns The auth token or null if not found
 */
export const getAuthTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;

  const authTokenCookieName = process.env.NEXT_PUBLIC_AUTH_TOKEN_COOKIE_NAME || 'auth_token';
  const cookies = document.cookie.split(';');

  // Debug logs removed

  // Try to find the auth token cookie (both HttpOnly and JS-accessible versions)
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if ((name === authTokenCookieName || name === 'auth_token_js') && value) {
      const token = decodeURIComponent(value);
      return token;
    }
  }

  // Fallback: try to find any cookie that might contain the token
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name.includes('auth') && value && value.length > 20) {
      const token = decodeURIComponent(value);
      return token;
    }
  }
  return null;
};

/**
 * Create headers with authentication token for API requests
 * @param additionalHeaders Optional additional headers to include
 * @returns Headers object with authentication
 */
export const createAuthHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = { ...additionalHeaders };

  let token = getAuthTokenFromCookie();
  
  // Fallback: try to get token from localStorage or sessionStorage
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Setup axios client with auth token getter
 * This should be called once during app initialization
 */
export const setupAxiosAuth = async () => {
  const { setAuthTokenGetter } = await import('./axios-client');
  setAuthTokenGetter(async () => getAuthTokenFromCookie());
};
