'use client';

import { useState, useEffect } from 'react';
import { logInfo, logError, logWarn, logDebug } from '@/lib/logger';

export function LoggerDemo() {
    const [count, setCount] = useState(0);
    const [appData, setAppData] = useState<any>({});

    // Get real application data
    useEffect(() => {
        // Capture real browser/environment data
        const realData = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            localStorage: Object.keys(localStorage),
            sessionStorage: Object.keys(sessionStorage),
        };
        setAppData(realData);
    }, []);

    const generateRealLogs = () => {
        // Log real application data
        logInfo('Application environment data captured', {
            timestamp: new Date().toISOString(),
            count: count + 1,
            environment: process.env.NODE_ENV || 'development',
            ...appData
        });

        logDebug('Browser capabilities detected', {
            component: 'LoggerDemo',
            action: 'capture_environment',
            capabilities: {
                localStorage: typeof localStorage !== 'undefined',
                sessionStorage: typeof sessionStorage !== 'undefined',
                indexedDB: typeof indexedDB !== 'undefined',
                serviceWorker: 'serviceWorker' in navigator,
                pushManager: 'PushManager' in window,
                geolocation: 'geolocation' in navigator,
            }
        });

        // Log real performance data
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (perfData) {
                logInfo('Page performance metrics', {
                    resource: 'performance',
                    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
                });
            }
        }

        // Log real memory usage if available
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            logWarn('Memory usage detected', {
                resource: 'memory',
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100 + ' MB',
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100 + ' MB',
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100 + ' MB',
                percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
            });
        }

        setCount(prev => prev + 1);
    };

    const generateConsoleLogs = () => {
        // Log real console data
        logError('Real browser error example', {
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString() 
        });
        console.warn('Real browser warnings:', {
            userAgent: navigator.userAgent,
            cookies: navigator.cookieEnabled
        });
        logError('Real browser error example', {
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        });
        logError('Real browser error example', {
            component: 'LoggerDemo',
            action: 'real_data_logging'
        });
    };

    const logNetworkStatus = () => {
        // Log real network status
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
            logInfo('Network connection info', {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            });
        }

        // Log real online/offline status
        logInfo('Network status', {
            online: navigator.onLine,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <div className="fixed top-4 left-4 bg-white border rounded-lg shadow-lg p-4 z-40 max-w-sm">
            <h3 className="font-semibold text-sm mb-3">Real Data Logger</h3>
            <div className="space-y-2">
                <button
                    onClick={generateRealLogs}
                    className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Capture Real App Data ({count})
                </button>
                <button
                    onClick={generateConsoleLogs}
                    className="w-full px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                    Log Real Console Data
                </button>
                <button
                    onClick={logNetworkStatus}
                    className="w-full px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                >
                    Network Status
                </button>
                <div className="text-xs text-gray-500 text-center">
                    Click the 📋 button to view logs
                </div>
                <div className="text-xs text-gray-400 text-center">
                    Using real application data
                </div>
            </div>
        </div>
    );
}
