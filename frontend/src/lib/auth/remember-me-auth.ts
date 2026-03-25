import API from '@/lib/axios-client';

/**
 * Check if user has a remember me token and attempt automatic login
 */
export async function attemptRememberMeLogin(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
}> {
    try {
        // Check if we have a remember me cookie
        const rememberMeToken = getRememberMeToken();

        if (!rememberMeToken) {
            return { success: false, error: 'No remember me token found' };
        }


        // Exchange remember me token for auth token
        const response = await API.post('/auth/remember-me/login', {
            rememberMeToken
        });

        if (response.data.success) {
            return {
                success: true,
                user: response.data.user
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Automatic login failed'
            };
        }

    } catch (error: any) {
        console.error('[Remember Me] Automatic login error:', error);

        // Clear invalid remember me token
        clearRememberMeToken();

        return {
            success: false,
            error: error?.response?.data?.error || 'Automatic login failed'
        };
    }
}

/**
 * Get remember me token from cookie
 */
export function getRememberMeToken(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const rememberMeCookie = cookies.find(cookie =>
        cookie.trim().startsWith('remember_me=')
    );

    if (rememberMeCookie) {
        return rememberMeCookie.split('=')[1];
    }

    return null;
}

/**
 * Clear remember me token from cookie
 */
export function clearRememberMeToken(): void {
    if (typeof document === 'undefined') return;

    // Clear the cookie by setting it to expire in the past
    document.cookie = 'remember_me=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure';
}

/**
 * Check if remember me is available (has token)
 */
export function hasRememberMeToken(): boolean {
    return getRememberMeToken() !== null;
}
