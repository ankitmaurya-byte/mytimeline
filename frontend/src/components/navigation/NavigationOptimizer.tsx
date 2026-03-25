"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Navigation optimizer component that preloads routes and optimizes navigation
 */
export function NavigationOptimizer() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Preload common routes after initial load
        const preloadRoutes = () => {
            const commonRoutes = [
                '/workspace',
                '/sign-in',
                '/sign-up',
            ];

            // Add workspace-specific routes if we're in a workspace
            if (pathname && pathname.includes('/workspace/')) {
                const workspaceId = pathname.split('/')[2];
                if (workspaceId && workspaceId !== 'undefined') {
                    commonRoutes.push(
                        `/workspace/${workspaceId}/tasks`,
                        `/workspace/${workspaceId}/projects`,
                        `/workspace/${workspaceId}/members`,
                        `/workspace/${workspaceId}/settings`,
                        `/workspace/${workspaceId}/analytics`
                    );
                }
            }

            // Preload routes with a delay to not interfere with initial load
            setTimeout(() => {
                commonRoutes.forEach(route => {
                    try {
                        router.prefetch(route);
                    } catch (error) {
                        // Silently ignore prefetch errors
                    }
                });
            }, 3000); // Wait 3 seconds after initial load
        };

        preloadRoutes();
    }, [router, pathname]);

    // Optimize link hover behavior
    useEffect(() => {
        const handleLinkHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[href]') as HTMLAnchorElement;

            if (link && link.href) {
                const url = new URL(link.href);
                if (url.origin === window.location.origin) {
                    // Prefetch on hover for internal links
                    try {
                        router.prefetch(url.pathname);
                    } catch (error) {
                        // Silently ignore prefetch errors
                    }
                }
            }
        };

        // Add hover listeners to all links
        document.addEventListener('mouseover', handleLinkHover, { passive: true });

        return () => {
            document.removeEventListener('mouseover', handleLinkHover);
        };
    }, [router]);

    return null; // This component doesn't render anything
}
