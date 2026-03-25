import API from '../axios-client';

let cachedUser: any = null;
let loaded = false;

export async function fetchCurrentUser(force = false) {
  if (loaded && !force) return cachedUser;

  // Check if OAuth is in progress - if so, wait a bit for the cookie to be set
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth') === 'success';
    const oauthToken = urlParams.get('token');

    if (oauthSuccess && oauthToken) {
      // Wait for the WorkspaceRedirect component to set the cookie
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  try {
    const res = await API.get('/auth/me');
    cachedUser = res.data.user;
    loaded = true;
    return cachedUser;
  } catch (error: any) {
    // Clear cache on authentication errors
    cachedUser = null;
    loaded = true;

    // If it's a 401 error, don't log it (expected when not authenticated)
    if (error?.response?.status !== 401) {
      console.error('[auth] fetchCurrentUser error:', error?.response?.status, error?.response?.data);
    }

    return null;
  }
}

export async function login(email: string, password: string) {

  try {

    const res = await API.post('/auth/login', { email, password });
    cachedUser = res.data.user;
    return res.data.user;
  } catch (error: any) {
    console.error('[auth] login() error:', error);
    console.error('[auth] login() error response:', error.response?.status, error.response?.data);
    console.error('[auth] login() error message:', error.message);
    console.error('[auth] login() error code:', error.code);
    console.error('[auth] login() error type:', typeof error);
    console.error('[auth] login() full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function register(name: string, email: string, password: string) {
  const res = await API.post('/auth/register', { name, email, password });
  // Don't auto-login after registration - user must verify email first
  return res.data;
}

export async function logout() {
  await API.post('/auth/logout');
  cachedUser = null;
}

export function isAuthenticated() {
  return !!cachedUser;
}
