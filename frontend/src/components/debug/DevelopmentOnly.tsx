'use client';

import { useEffect, useState } from 'react';

interface DevelopmentOnlyProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function DevelopmentOnly({ children, fallback = null }: DevelopmentOnlyProps) {
    const [isDevelopment, setIsDevelopment] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if we're in development mode
        const checkEnvironment = () => {
            // For testing purposes, we'll use a simpler approach
            // In a real browser, this will work correctly
            const isDev =
                // Check NODE_ENV (available during build time)
                (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ||
                // Check if we're on localhost or local IP
                (typeof window !== 'undefined' && (
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1'
                ));

            setIsDevelopment(isDev);
            setIsLoaded(true);
        };

        checkEnvironment();
    }, []);

    // Don't render anything until we've determined the environment
    if (!isLoaded) {
        return null;
    }

    // Only render children in development
    if (isDevelopment) {
        return <>{children}</>;
    }

    // Render fallback in production
    return <>{fallback}</>;
}
