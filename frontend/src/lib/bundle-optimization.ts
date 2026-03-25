/**
 * Bundle Optimization Configuration
 * This file contains strategies to reduce the main bundle size
 */

// Heavy dependencies that should be lazy-loaded
export const HEAVY_DEPENDENCIES = {
    // Animation libraries (very heavy)
    framerMotion: 'framer-motion',

    // Chart libraries
    recharts: 'recharts',

    // Code highlighting
    syntaxHighlighter: 'react-syntax-highlighter',

    // Emoji picker
    emojiMart: '@emoji-mart/react',
    emojiData: '@emoji-mart/data',

    // Drag and drop
    pragmaticDnd: '@atlaskit/pragmatic-drag-and-drop',

    // Swagger/API docs
    swagger: 'swagger-ui-react',

    // Date picker
    datePicker: 'react-day-picker',

    // Command palette
    cmdk: 'cmdk',

    // Drawer component
    vaul: 'vaul',

    // Noise generation
    simplexNoise: 'simplex-noise'
};

// Components that should be lazy-loaded
export const LAZY_COMPONENTS = {
    // Analytics and charts
    analytics: [
        'WorkspaceAnalytics',
        'AdminAnalytics',
        'ProjectAnalytics',
        'TaskAnalytics',
        'MemberAnalytics'
    ],

    // Rich text and editors
    editors: [
        'RichTextEditor',
        'CodeEditor',
        'MarkdownEditor'
    ],

    // File handling
    fileHandlers: [
        'FileUpload',
        'FilePreview',
        'ImageUpload',
        'VideoPlayer'
    ],

    // Advanced UI components
    advancedUI: [
        'EmojiPicker',
        'DatePicker',
        'Calendar',
        'ColorPicker',
        'AdvancedSearch',
        'CommandPalette'
    ],

    // Animation components
    animations: [
        'AnimatedWorkflow',
        'BackgroundBeamsWithCollision',
        'TypewriterEffect',
        'AppleCardsCarousel',
        'MagneticCardGrid',
        'ContainerScrollAnimation',
        'HeroScrollDemo'
    ],

    // Onboarding and tours
    onboarding: [
        'EnhancedOnboardingTour',
        'WorkspaceTourWrapper',
        'WelcomeBanner',
        'TourStepsData'
    ],

    // Admin and settings
    admin: [
        'AdminPanel',
        'UserManagement',
        'SystemSettings',
        'AdvancedSettings'
    ]
};

// Route-based code splitting
export const ROUTE_CHUNKS = {
    // Workspace routes
    workspace: {
        dashboard: 'workspace-dashboard',
        tasks: 'workspace-tasks',
        projects: 'workspace-projects',
        members: 'workspace-members',
        analytics: 'workspace-analytics',
        settings: 'workspace-settings'
    },

    // Admin routes
    admin: {
        dashboard: 'admin-dashboard',
        users: 'admin-users',
        analytics: 'admin-analytics',
        settings: 'admin-settings'
    },

    // Auth routes
    auth: {
        signIn: 'auth-signin',
        signUp: 'auth-signup',
        forgotPassword: 'auth-forgot',
        resetPassword: 'auth-reset'
    },

    // Landing pages
    landing: {
        main: 'landing-main',
        features: 'landing-features',
        showcase: 'landing-showcase'
    }
};

// Dynamic import configurations
export const DYNAMIC_IMPORT_CONFIG = {
    // Analytics components (heavy charts)
    analytics: {
        ssr: false,
        loading: 'analytics-loading'
    },

    // Animation components (very heavy)
    animations: {
        ssr: false,
        loading: 'animations-loading'
    },

    // Editor components
    editors: {
        ssr: false,
        loading: 'editors-loading'
    },

    // File components
    files: {
        ssr: false,
        loading: 'files-loading'
    },

    // UI components
    ui: {
        ssr: false,
        loading: 'ui-loading'
    }
};

// Bundle analysis helpers
export const BUNDLE_ANALYSIS = {
    // Expected chunk sizes (in KB)
    maxChunkSize: 200, // 200KB max per chunk
    targetChunkSize: 100, // 100KB target per chunk

    // Critical path components (load immediately)
    critical: [
        'AuthProvider',
        'ThemeProvider',
        'ReactQueryProvider',
        'SidebarProvider',
        'BasicUIComponents'
    ],

    // Non-critical components (can be lazy-loaded)
    nonCritical: [
        'Analytics',
        'Animations',
        'Editors',
        'FileHandlers',
        'AdvancedUI',
        'Onboarding',
        'Admin'
    ]
};

// Webpack optimization settings
export const WEBPACK_OPTIMIZATION = {
    splitChunks: {
        chunks: 'all',
        maxSize: 200000, // 200KB
        minSize: 20000,  // 20KB
        cacheGroups: {
            // React core (critical)
            react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-is)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 40,
                enforce: true,
            },

            // Next.js core
            nextjs: {
                test: /[\\/]node_modules[\\/]next[\\/]/,
                name: 'nextjs',
                chunks: 'all',
                priority: 35,
                enforce: true,
            },

            // Heavy animation library (lazy load)
            framer: {
                test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
                name: 'framer-motion',
                chunks: 'async',
                priority: 30,
                enforce: true,
            },

            // Chart libraries (lazy load)
            charts: {
                test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
                name: 'charts',
                chunks: 'async',
                priority: 25,
                enforce: true,
            },

            // Radix UI components
            radix: {
                test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                name: 'radix-ui',
                chunks: 'all',
                priority: 20,
                enforce: true,
            },

            // UI utilities
            ui: {
                test: /[\\/]node_modules[\\/](lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
                name: 'ui-utils',
                chunks: 'all',
                priority: 15,
                enforce: true,
            },

            // Data fetching
            data: {
                test: /[\\/]node_modules[\\/](@tanstack|axios|socket\.io-client)[\\/]/,
                name: 'data-libs',
                chunks: 'all',
                priority: 10,
                enforce: true,
            },

            // Other vendors
            vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 5,
                enforce: true,
            },
        },
    },

    // Enable tree shaking
    usedExports: true,
    sideEffects: false,

    // Optimize module IDs
    chunkIds: 'deterministic',
    moduleIds: 'deterministic',
};
