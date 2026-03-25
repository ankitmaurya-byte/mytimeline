/**
 * Performance Monitoring Utility
 * Tracks bundle loading, component performance, and optimization metrics
 */

import { OPTIMIZATION_CONFIG } from './optimization-config';

interface PerformanceMetrics {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    tti: number;
    bundleSize: number;
    loadTime: number;
}

interface ComponentLoadMetrics {
    componentName: string;
    loadTime: number;
    bundleSize: number;
    chunkName: string;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        tti: 0,
        bundleSize: 0,
        loadTime: 0
    };

    private componentMetrics: Map<string, ComponentLoadMetrics> = new Map();

    constructor() {
        this.initializeObservers();
    }

    private initializeObservers() {
        // Web Vitals observers
        if (typeof window !== 'undefined') {
            this.observeWebVitals();
            this.observeBundleMetrics();
        }
    }

    private observeWebVitals() {
        // First Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const fcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
                    if (fcpEntry) {
                        this.metrics.fcp = fcpEntry.startTime;
                        this.logMetric('FCP', fcpEntry.startTime);
                    }
                });
                fcpObserver.observe({ entryTypes: ['paint'] });
            } catch (e) {
                console.warn('FCP observer failed:', e);
            }

            // Largest Contentful Paint
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lcpEntry = entries[entries.length - 1];
                    if (lcpEntry) {
                        this.metrics.lcp = lcpEntry.startTime;
                        this.logMetric('LCP', lcpEntry.startTime);
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP observer failed:', e);
            }

            // First Input Delay
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        this.metrics.fid = entry.processingStart - entry.startTime;
                        this.logMetric('FID', this.metrics.fid);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID observer failed:', e);
            }

            // Cumulative Layout Shift
            try {
                const clsObserver = new PerformanceObserver((list) => {
                    let clsValue = 0;
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    this.metrics.cls = clsValue;
                    this.logMetric('CLS', clsValue);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('CLS observer failed:', e);
            }
        }
    }

    private observeBundleMetrics() {
        // Monitor bundle loading performance
        if ('PerformanceObserver' in window) {
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
                            this.trackBundleLoad(entry);
                        }
                    });
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
            } catch (e) {
                console.warn('Resource observer failed:', e);
            }
        }
    }

    private trackBundleLoad(entry: PerformanceEntry) {
        const loadTime = entry.duration;
        const transferSize = (entry as any).transferSize || 0;

        this.metrics.loadTime = Math.max(this.metrics.loadTime, loadTime);
        this.metrics.bundleSize += transferSize;

        // Check if this is a lazy-loaded chunk
        if (entry.name.includes('chunk') || entry.name.includes('lazy')) {
            this.logMetric('Bundle Load', loadTime, `${(transferSize / 1024).toFixed(2)}KB`);
        }
    }

    public trackComponentLoad(componentName: string, loadTime: number, bundleSize: number = 0) {
        const chunkName = OPTIMIZATION_CONFIG.lazyComponents.animations.includes(componentName) ? 'animations' :
            OPTIMIZATION_CONFIG.lazyComponents.ui.includes(componentName) ? 'ui' :
                OPTIMIZATION_CONFIG.lazyComponents.features.includes(componentName) ? 'features' :
                    OPTIMIZATION_CONFIG.lazyComponents.onboarding.includes(componentName) ? 'onboarding' : 'common';

        const metrics: ComponentLoadMetrics = {
            componentName,
            loadTime,
            bundleSize,
            chunkName
        };

        this.componentMetrics.set(componentName, metrics);
        this.logMetric(`Component: ${componentName}`, loadTime, `${(bundleSize / 1024).toFixed(2)}KB`);
    }

    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public getComponentMetrics(): ComponentLoadMetrics[] {
        return Array.from(this.componentMetrics.values());
    }

    public checkPerformanceThresholds(): { passed: boolean; issues: string[] } {
        const issues: string[] = [];
        const thresholds = OPTIMIZATION_CONFIG.performanceThresholds;

        if (this.metrics.fcp > thresholds.fcp) {
            issues.push(`FCP (${this.metrics.fcp}ms) exceeds threshold (${thresholds.fcp}ms)`);
        }
        if (this.metrics.lcp > thresholds.lcp) {
            issues.push(`LCP (${this.metrics.lcp}ms) exceeds threshold (${thresholds.lcp}ms)`);
        }
        if (this.metrics.fid > thresholds.fid) {
            issues.push(`FID (${this.metrics.fid}ms) exceeds threshold (${thresholds.fid}ms)`);
        }
        if (this.metrics.cls > thresholds.cls) {
            issues.push(`CLS (${this.metrics.cls}) exceeds threshold (${thresholds.cls})`);
        }

        return {
            passed: issues.length === 0,
            issues
        };
    }

    public generateReport(): string {
        const metrics = this.getMetrics();
        const componentMetrics = this.getComponentMetrics();
        const performanceCheck = this.checkPerformanceThresholds();

        let report = '🚀 Performance Report\n\n';
        report += `📊 Web Vitals:\n`;
        report += `  • FCP: ${metrics.fcp.toFixed(0)}ms\n`;
        report += `  • LCP: ${metrics.lcp.toFixed(0)}ms\n`;
        report += `  • FID: ${metrics.fid.toFixed(0)}ms\n`;
        report += `  • CLS: ${metrics.cls.toFixed(3)}\n`;
        report += `  • Bundle Size: ${(metrics.bundleSize / 1024).toFixed(2)}KB\n`;
        report += `  • Load Time: ${metrics.loadTime.toFixed(0)}ms\n\n`;

        if (componentMetrics.length > 0) {
            report += `🧩 Component Metrics:\n`;
            componentMetrics.forEach(metric => {
                report += `  • ${metric.componentName}: ${metric.loadTime.toFixed(0)}ms (${metric.chunkName})\n`;
            });
            report += '\n';
        }

        if (!performanceCheck.passed) {
            report += `⚠️  Performance Issues:\n`;
            performanceCheck.issues.forEach(issue => {
                report += `  • ${issue}\n`;
            });
        } else {
            report += `✅ All performance thresholds met!\n`;
        }

        return report;
    }

    private logMetric(name: string, value: number, unit: string = 'ms') {
        if (process.env.NODE_ENV === 'development') {
            }
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export const usePerformanceMonitor = () => {
    return {
        trackComponentLoad: performanceMonitor.trackComponentLoad.bind(performanceMonitor),
        getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
        generateReport: performanceMonitor.generateReport.bind(performanceMonitor)
    };
};

export default performanceMonitor;
