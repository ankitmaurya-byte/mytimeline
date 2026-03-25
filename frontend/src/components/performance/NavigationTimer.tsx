"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationTimer() {
    const pathname = usePathname();
    const [navigationTime, setNavigationTime] = useState<number>(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const startTime = performance.now();

        const handleLoad = () => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            setNavigationTime(duration);

            // Show timer if navigation took more than 500ms
            if (duration > 500) {
                setIsVisible(true);
                setTimeout(() => setIsVisible(false), 3000);
            }
        };

        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            window.addEventListener('load', handleLoad);
        }

        return () => {
            window.removeEventListener('load', handleLoad);
        };
    }, [pathname]);

    // Only show in development
    if (process.env.NODE_ENV !== 'development' || !isVisible) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-mono z-50">
            Slow navigation: {navigationTime.toFixed(0)}ms
        </div>
    );
}





