/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable telemetry
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },

  // API configuration for App Router
  experimental: {
    // Increase body size limit for API routes
    serverComponentsExternalPackages: [],
  },

  // Note: Using Turbopack instead of Webpack for better performance
  // This eliminates the "Webpack is configured while Turbopack is not" warning

  async rewrites() {
    // Map versioned path to app/api handlers
    const base = process.env.API_PREFIX || '/api';
    const version = process.env.API_VERSION || 'v1';
    const from = `${base}/${version}/:path*`;
    return [{ source: from, destination: `/api/:path*` }];
  },

  // Serve static files from uploads directory
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Disable trailing slash redirects for API routes
  trailingSlash: false,

  // TypeScript routes configuration
  typedRoutes: false,

  // Memory and performance optimization
  experimental: {
    // Optimize package imports to reduce bundle size
    // optimizePackageImports: ['mongoose', 'bcryptjs', 'jsonwebtoken'],
    // Disable unnecessary features for API-only backend
    ppr: false,
  },

  // Webpack configuration for handling dynamic imports during build
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (isServer) {
      // Handle any remaining native modules
      config.externals = config.externals || [];
    }
    return config;
  },

  // Turbopack configuration (replaces webpack config)
  turbopack: {
    rules: {
      // Handle HTML files (ignore them)
      '*.html': {
        loaders: ['ignore-loader'],
        as: '*.js',
      },
    },
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Output configuration for production
  output: 'standalone',
};

module.exports = nextConfig;
