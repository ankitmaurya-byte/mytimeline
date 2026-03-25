/**
 * Optimization Configuration
 * Defines lazy loading patterns and bundle optimization strategies
 */

export const OPTIMIZATION_CONFIG = {
    // Lazy loading patterns for heavy components
    lazyComponents: {
        // Animation components (heavy Framer Motion dependencies)
        animations: [
            'AnimatedWorkflow',
            'BackgroundBeamsWithCollision',
            'TypewriterEffect',
            'AppleCardsCarousel',
            'MagneticCardGrid',
            'ContainerScrollAnimation'
        ],

        // UI components with heavy dependencies
        ui: [
            'EmojiPicker',
            'Calendar',
            'DatePicker',
            'RichTextEditor',
            'FileUpload',
            'VideoPlayer'
        ],

        // Feature components
        features: [
            'Analytics',
            'Settings',
            'AdminPanel',
            'AdvancedSearch',
            'ReportGenerator',
            'DataExport'
        ],

        // Onboarding components
        onboarding: [
            'TourStepsData',
            'AnimatedWorkflow',
            'WelcomeBanner'
        ]
    },

    // Route-based code splitting patterns
    routeSplitting: {
        // Workspace routes
        workspace: {
            dashboard: 'workspace/dashboard',
            analytics: 'workspace/analytics',
            tasks: 'workspace/tasks',
            projects: 'workspace/projects',
            members: 'workspace/members',
            settings: 'workspace/settings'
        },

        // Admin routes
        admin: {
            dashboard: 'admin/dashboard',
            users: 'admin/users',
            analytics: 'admin/analytics',
            settings: 'admin/settings'
        },

        // Auth routes
        auth: {
            signIn: 'auth/sign-in',
            signUp: 'auth/sign-up',
            forgotPassword: 'auth/forgot-password',
            resetPassword: 'auth/reset-password'
        }
    },

    // Bundle optimization settings
    bundleOptimization: {
        // Maximum chunk size (244KB recommended for optimal loading)
        maxChunkSize: 244000,

        // Vendor chunk optimization
        vendorChunks: [
            'react',
            'react-dom',
            '@radix-ui',
            'framer-motion',
            'lucide-react',
            'date-fns',
            'recharts'
        ],

        // Critical CSS classes (load immediately)
        criticalCSS: [
            'container',
            'flex',
            'grid',
            'hidden',
            'block',
            'text-center',
            'bg-white',
            'dark:bg-gray-900'
        ]
    },

    // Performance monitoring thresholds
    performanceThresholds: {
        // First Contentful Paint (FCP)
        fcp: 1800, // 1.8 seconds

        // Largest Contentful Paint (LCP)
        lcp: 2500, // 2.5 seconds

        // First Input Delay (FID)
        fid: 100, // 100ms

        // Cumulative Layout Shift (CLS)
        cls: 0.1, // 0.1

        // Time to Interactive (TTI)
        tti: 3500 // 3.5 seconds
    },

    // Preloading strategies
    preloading: {
        // Critical routes to preload
        criticalRoutes: [
            '/workspace',
            '/workspace/[workspaceId]',
            '/workspace/[workspaceId]/dashboard'
        ],

        // Components to preload on hover
        hoverPreload: [
            'EmojiPicker',
            'Calendar',
            'Settings',
            'Analytics'
        ],

        // Components to preload on intersection
        intersectionPreload: [
            'LazyDashboard',
            'LazyAnalytics',
            'LazySettings'
        ]
    }
};

// Utility functions for optimization
export const optimizationUtils = {
    // Check if component should be lazy loaded
    shouldLazyLoad: (componentName: string): boolean => {
        const allLazyComponents = [
            ...OPTIMIZATION_CONFIG.lazyComponents.animations,
            ...OPTIMIZATION_CONFIG.lazyComponents.ui,
            ...OPTIMIZATION_CONFIG.lazyComponents.features,
            ...OPTIMIZATION_CONFIG.lazyComponents.onboarding
        ];
        return allLazyComponents.includes(componentName);
    },

    // Get chunk name for component
    getChunkName: (componentName: string): string => {
        if (OPTIMIZATION_CONFIG.lazyComponents.animations.includes(componentName)) {
            return 'animations';
        }
        if (OPTIMIZATION_CONFIG.lazyComponents.ui.includes(componentName)) {
            return 'ui';
        }
        if (OPTIMIZATION_CONFIG.lazyComponents.features.includes(componentName)) {
            return 'features';
        }
        if (OPTIMIZATION_CONFIG.lazyComponents.onboarding.includes(componentName)) {
            return 'onboarding';
        }
        return 'common';
    },

    // Check if route should be preloaded
    shouldPreloadRoute: (route: string): boolean => {
        return OPTIMIZATION_CONFIG.preloading.criticalRoutes.includes(route);
    }
};

export default OPTIMIZATION_CONFIG;
