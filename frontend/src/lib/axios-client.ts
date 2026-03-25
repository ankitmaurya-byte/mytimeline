import axios, { AxiosError } from "axios";

interface CustomError extends AxiosError {
  errorCode?: string;
}

function normalizeBase(u: string): string {
  if (!u) return '/api';
  let url = u.trim();

  // Ensure the URL has a protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // If no protocol, assume it's a relative path and add /api
    if (!url.startsWith('/')) {
      url = `/${url}`;
    }
    if (!url.endsWith('/api')) {
      url = url.endsWith('/') ? `${url}api` : `${url}/api`;
    }
    return url;
  }

  // Remove trailing slashes
  url = url.replace(/\/$/, '');
  // If already ends with /api (case-sensitive) leave; else append /api
  if (!/\/api$/.test(url)) url = `${url}/api`;
  return url;
}

const getBackendURLs = () => {
  // Get backend URL from environment variables
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  /* console.log('[axios] Environment variables:', {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NODE_ENV: process.env.NODE_ENV
  }); */

  // In production, use the proxy (relative /api path) to avoid CORS issues
  // In development, fall back to relative paths
  let finalUrl = backendUrl;

  if (!finalUrl || process.env.NODE_ENV === 'production') {
    // Use relative /api path which will be proxied to backend
    finalUrl = '/api';
    // console.log('[axios] Using proxy path /api for production');
  } else {
    // console.log('[axios] Using backend URL from environment:', finalUrl);
  }

  const list = finalUrl.split(',').map(s => s.trim()).filter(Boolean).map(normalizeBase);
  // console.log('[axios] Final backend URLs:', list);
  return list.length ? list : ['/api'];
};

// Helper function to get the primary backend URL
const getPrimaryBackendURL = () => getBackendURLs()[0];

const getBaseURL = () => {
  const url = getPrimaryBackendURL();
  // console.log('[axios] Base URL:', url);
  return url;
};

const baseURL = getBaseURL();

// Validate the base URL
if (baseURL && !baseURL.startsWith('http') && !baseURL.startsWith('/')) {
  // // throw new Error(`Invalid baseURL: ${baseURL}. Expected format: http://localhost:8000 or /api`);
}

let API: any;

try {
  API = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout
    headers: { 'Content-Type': 'application/json' }
  });

  // console.log('[axios] API instance created with baseURL:', API.defaults.baseURL);
} catch (error) {
  console.error('[axios] Failed to create API instance:', error);
  // Create a fallback API instance
  API = axios.create({
    baseURL: '/api',
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout
    headers: { 'Content-Type': 'application/json' }
  });
  // console.log('[axios] Fallback API instance created with baseURL: /api');
}

let getAuthToken: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (tokenGetter: () => Promise<string | null>) => {
  getAuthToken = tokenGetter;
};

if (API && API.interceptors) {
  API.interceptors.request.use(async (config) => {
    if (getAuthToken) {
      try {
        const token = await getAuthToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }
    return config;
  }, (error) => Promise.reject(error));
}

if (API && API.interceptors) {
  API.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {

      if (error.response?.status === 401 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up');
        const isInvitePage = currentPath.startsWith('/invite/');
        const isOAuthSuccess = window.location.search.includes('oauth=success') && window.location.search.includes('token=');

        // Avoid redirect storm: only redirect if not already headed there and no existing flag
        // Also don't redirect if we're on workspace page with OAuth success parameters or invite pages
        if (!isAuthPage && !isInvitePage && !isOAuthSuccess && !sessionStorage.getItem('redirectingToSignIn')) {
          sessionStorage.setItem('redirectingToSignIn', '1');
          window.location.href = '/sign-in';
        } else {
        }
      }

      const customError: CustomError = {
        ...error,
        errorCode: (error.response?.data as any)?.errorCode || "UNKNOWN_ERROR",
        message: (error.response?.data as any)?.message || error.message || "An error occurred",
      };

      return Promise.reject(customError);
    }
  );
}

export default API;
