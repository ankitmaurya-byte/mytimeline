import { cookies } from 'next/headers';

// Server-side function to validate if user is a member of a specific workspace
export async function validateWorkspaceMembership(workspaceId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return null;
    }

    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const base = apiBase ? apiBase.replace(/\/$/, '') : '';

    // Call the workspace members endpoint to check if user has access
    const url = base ? `${base}/api/workspace/members/${workspaceId}` : `/api/workspace/members/${workspaceId}`;

    const res = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Workspace membership validation error:', error);
    return null;
  }
}

// Server-side function to get user and validate workspace membership
// Server-side function to get all workspaces a user is a member of
export async function serverGetUserWorkspaces() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return { workspaces: [] };
    }

    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const base = apiBase ? apiBase.replace(/\/$/, '') : '';

    const workspacesUrl = base ? `${base}/api/workspace` : '/api/workspace';
    const workspacesRes = await fetch(workspacesUrl, {
      cache: 'force-cache',
      next: { revalidate: 300 },
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!workspacesRes.ok) {
      return { workspaces: [] };
    }

    const workspacesData = await workspacesRes.json();
    return { workspaces: workspacesData.workspaces || [] };
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    return { workspaces: [] };
  }
}

export async function serverFetchUserWithWorkspaceValidation(workspaceId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return { user: null, hasAccess: false };
    }

    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const base = apiBase ? apiBase.replace(/\/$/, '') : '';

    // First get user info
    const userUrl = base ? `${base}/api/auth/me` : '/api/auth/me';
    const userRes = await fetch(userUrl, {
      cache: 'force-cache', // Cache user info for 5 minutes
      next: { revalidate: 300 },
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userRes.ok) {
      return { user: null, hasAccess: false };
    }

    const userData = await userRes.json();
    const user = userData.user || null;

    if (!user) {
      return { user: null, hasAccess: false };
    }

    // Then validate workspace membership
    const workspaceUrl = base ? `${base}/api/workspace/members/${workspaceId}` : `/api/workspace/members/${workspaceId}`;
    const workspaceRes = await fetch(workspaceUrl, {
      cache: 'force-cache', // Cache workspace membership for 5 minutes
      next: { revalidate: 300 },
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Handle different error cases
    let hasAccess = false;
    if (workspaceRes.ok) {
      hasAccess = true;
    } else if (workspaceRes.status === 404) {
      // Workspace not found or user not a member
      hasAccess = false;
    } else if (workspaceRes.status === 500) {
      // Server error - likely user not a member
      hasAccess = false;
    } else {
      // Other errors
      hasAccess = false;
    }

    return { user, hasAccess };
  } catch (error) {
    console.error('User and workspace validation error:', error);
    return { user: null, hasAccess: false };
  }
}
