"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
    navigationTime: number;
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
}

export function PerformanceMonitor() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show in development
        if (process.env.NODE_ENV !== 'development') return;

        const measurePerformance = () => {
            if (typeof window === 'undefined') return;

            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paint = performance.getEntriesByType('paint');

            const navigationTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
            const loadTime = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

            // Memory usage (if available)
            const memory = (performance as any).memory;
            const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB

            setMetrics({
                navigationTime,
                loadTime,
                renderTime: Date.now() - performance.timeOrigin,
                memoryUsage,
            });
        };

        // Measure after page load
        if (document.readyState === 'complete') {
            measurePerformance();
        } else {
            window.addEventListener('load', measurePerformance);
        }

        // Keyboard shortcut to toggle visibility (Ctrl+Shift+P)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('load', measurePerformance);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (process.env.NODE_ENV !== 'development' || !isVisible || !metrics) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
            <div className="mb-2 font-bold">Performance Metrics</div>
            <div>Navigation: {metrics.navigationTime.toFixed(0)}ms</div>
            <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
            <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
            <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
            <div className="mt-2 text-gray-400 text-xs">
                Press Ctrl+Shift+P to toggle
            </div>
        </div>
    );
}





