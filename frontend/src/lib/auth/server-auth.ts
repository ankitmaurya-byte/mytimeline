import { cookies } from 'next/headers';

// Server-side helper to fetch current user by forwarding auth_token as Authorization
export async function serverFetchCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return null;
    }

    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const base = apiBase ? apiBase.replace(/\/$/, '') : '';

    // Construct the URL to match client-side calls
    // Client uses baseURL: 'http://localhost:8000/api' and calls '/auth/me'
    // So server should call 'http://localhost:8000/api/auth/me'
    const url = base ? `${base}/api/auth/me` : '/api/auth/me';

    const res = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.user || null;
  } catch (error) {
    return null;
  }
}
