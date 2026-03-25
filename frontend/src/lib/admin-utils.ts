import { useState, useEffect } from 'react';
import API from './axios-client';

export interface AdminCheckResponse {
    success: boolean;
    isAdmin: boolean;
    user?: {
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    } | null;
    message: string;
    error?: string;
}

/**
 * Check if the current user has admin privileges
 * @returns Promise<AdminCheckResponse>
 */
export async function checkAdminStatus(): Promise<AdminCheckResponse> {
    try {
        const response = await API.get('/admin/check');
        return response.data;
    } catch (error: any) {
        console.error('Admin check failed:', error);

        // If it's a 401/403 error, user is not admin
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            return {
                success: false,
                isAdmin: false,
                message: 'Admin access required',
                error: error?.response?.data?.message || 'Unauthorized'
            };
        }

        // For other errors, return a generic error
        return {
            success: false,
            isAdmin: false,
            message: 'Failed to check admin status',
            error: error?.message || 'Unknown error'
        };
    }
}

/**
 * Hook to check admin status with loading state
 */
export function useAdminCheck() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                setLoading(true);
                const result = await checkAdminStatus();
                setIsAdmin(result.isAdmin);
                setError(result.error || null);
            } catch (err) {
                setIsAdmin(false);
                setError('Failed to check admin status');
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, []);

    return { isAdmin, loading, error };
}
