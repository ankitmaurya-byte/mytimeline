/**
 * Performance optimization hooks and utilities
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to optimize navigation performance
 * Preloads critical resources and manages loading states
 */
export function useNavigationOptimization() {
    const router = useRouter();
    const preloadCache = useRef<Set<string>>(new Set());

    // Preload critical routes
    const preloadRoute = useCallback((href: string) => {
        if (preloadCache.current.has(href)) return;

        // Preload the route
        router.prefetch(href);
        preloadCache.current.add(href);
    }, [router]);

    // Preload common navigation routes
    useEffect(() => {
        const commonRoutes = [
            '/workspace',
            '/workspace/[workspaceId]/tasks',
            '/workspace/[workspaceId]/projects',
            '/workspace/[workspaceId]/members',
            '/workspace/[workspaceId]/settings',
        ];

        // Preload routes after initial load
        const timer = setTimeout(() => {
            commonRoutes.forEach(route => {
                if (route.includes('[workspaceId]')) {
                    // Skip dynamic routes for now
                    return;
                }
                preloadRoute(route);
            });
        }, 2000); // Wait 2 seconds after initial load

        return () => clearTimeout(timer);
    }, [preloadRoute]);

    return { preloadRoute };
}

/**
 * Hook to debounce expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout>();

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        }) as T,
        [callback, delay]
    );
}

/**
 * Hook to throttle expensive operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const lastCallRef = useRef<number>(0);

    return useCallback(
        ((...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastCallRef.current >= delay) {
                lastCallRef.current = now;
                callback(...args);
            }
        }) as T,
        [callback, delay]
    );
}

/**
 * Hook to optimize React Query performance
 */
export function useOptimizedQueryConfig() {
    return {
        // Optimized default options for better performance
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                refetchOnMount: false,
                refetchOnReconnect: false,
                retry: 1,
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000, // 10 minutes
                refetchInterval: false,
            },
            mutations: {
                retry: 0,
            },
        },
    };
}

/**
 * Hook to manage loading states efficiently
 */
export function useLoadingState() {
    const loadingRef = useRef<boolean>(false);
    const loadingTimeoutRef = useRef<NodeJS.Timeout>();

    const setLoading = useCallback((isLoading: boolean) => {
        if (isLoading) {
            loadingRef.current = true;
            // Auto-clear loading after 10 seconds to prevent stuck states
            loadingTimeoutRef.current = setTimeout(() => {
                loadingRef.current = false;
            }, 10000);
        } else {
            loadingRef.current = false;
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        }
    }, []);

    const isLoading = loadingRef.current;

    return { isLoading, setLoading };
}





