/**
 * Temporary utility to manually set auth cookie for testing
 * This should only be used for debugging authentication issues
 */

import { createAuthHeaders, getAuthTokenFromCookie } from './auth-utils';

/**
 * Manually set an auth token in cookies for testing
 * WARNING: This is a temporary debugging function
 */
export const setTestAuthCookie = () => {
  // This is a debugging function - we'll get the token from the user object
  const user = (window as any).__USER_DATA__ || null;

  if (user && user._id) {
    // Create a temporary token (this won't actually work but helps with debugging)
    const testToken = `temp_${user._id}_${Date.now()}`;
    document.cookie = `auth_token=${testToken}; path=/; domain=localhost; max-age=3600`;
    return testToken;
  }

  return null;
};

/**
 * Check current authentication status and attempt to fix missing cookie
 */
export const debugAuthStatus = async () => {
  // Check if user exists in auth context
  const userExists = !!(window as any).__USER_DATA__ ||
    document.querySelector('[data-user-id]') ||
    localStorage.getItem('user') ||
    sessionStorage.getItem('user');

  // Check cookies
  const authToken = getAuthTokenFromCookie();
  // Test API call
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const headers = createAuthHeaders();

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      credentials: 'include',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
    } else {
    }
  } catch (error) {
  }
};

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugAuth = {
    setTestCookie: setTestAuthCookie,
    checkStatus: debugAuthStatus,
    getToken: getAuthTokenFromCookie,
    createHeaders: createAuthHeaders
  };
}
