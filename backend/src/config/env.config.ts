import { z } from 'zod';

// Helper to handle empty strings as undefined for optional fields
const emptyStringAsUndefined = z
  .string()
  .transform(val => val === '' ? undefined : val)
  .optional();

// Environment variable validation schema
const environmentSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default(8000),

  // Database
  MONGO_URI: z.string().min(1, 'MongoDB URI is required'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters long').optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Session & Security
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters long'),
  SESSION_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(32, 'Cookie secret must be at least 32 characters long').optional(),
  BCRYPT_SALT_ROUNDS: z.string().regex(/^\d+$/).transform(Number).default(12),

  // OAuth - Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // OAuth - GitHub
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),

  // Redis (Optional)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Email Configuration
  EMAIL_SMTP_HOST: z.string().optional().or(z.literal('')),
  EMAIL_SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  EMAIL_SMTP_SECURE: z.string().transform(val => val === 'true').optional(),
  EMAIL_SMTP_USER: z.string().email().or(z.literal('')).optional(),
  EMAIL_SMTP_PASS: z.string().optional().or(z.literal('')),
  EMAIL_FROM: z.string().or(z.literal('')).optional(), // Allow any string format for email sender
  EMAIL_FROM_NAME: z.string().optional().or(z.literal('')),

  // Application URLs
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  BACKEND_URL: z.string().url().default('http://localhost:8000'),
  CORS_ADDITIONAL_ORIGINS: z.string().optional(), // Comma-separated list of additional origins

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(100),

  // Admin Bootstrap
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional().or(z.literal('')).refine(
    val => !val || val === '' || val.length >= 8,
    { message: "Admin password must be at least 8 characters if provided" }
  ),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // AI Services (Optional)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // File Upload
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default(10485760), // 10MB
  UPLOAD_DIR: z.string().default('uploads'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  ANALYTICS_API_KEY: z.string().optional(),
});

// Validate and parse environment variables
function validateEnv() {
  // Skip validation during build if SKIP_ENV_VALIDATION is set
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.log('⏭️ Skipping environment validation during build');
    return {} as z.infer<typeof environmentSchema>;
  }

  try {
    const env = environmentSchema.parse(process.env);

    // Additional validation for OAuth
    if (env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_SECRET) {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new Error('Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google OAuth');
      }
    }

    if (env.GITHUB_CLIENT_ID || env.GITHUB_CLIENT_SECRET) {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        throw new Error('Both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required for GitHub OAuth');
      }
    }

    // Email configuration validation
    const emailFields = [env.EMAIL_SMTP_HOST, env.EMAIL_SMTP_USER, env.EMAIL_SMTP_PASS];
    const hasAnyEmailField = emailFields.some(field => field !== undefined);
    const hasAllEmailFields = emailFields.every(field => field !== undefined);

    if (hasAnyEmailField && !hasAllEmailFields) {
      console.warn('⚠️  Email configuration is incomplete. Email features will be disabled.');
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    } else {
      console.error('❌ Environment validation error:', error);
    }

    // Don't exit in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

// Export validated environment
export const env = validateEnv();

// Helper functions for feature detection
export const isEmailEnabled = () => {
  return !!(env?.EMAIL_SMTP_HOST && env?.EMAIL_SMTP_USER && env?.EMAIL_SMTP_PASS);
};

export const isGoogleOAuthEnabled = () => {
  return !!(env?.GOOGLE_CLIENT_ID && env?.GOOGLE_CLIENT_SECRET);
};

export const isGitHubOAuthEnabled = () => {
  return !!(env?.GITHUB_CLIENT_ID && env?.GITHUB_CLIENT_SECRET);
};

export const isRedisEnabled = () => {
  return !!env?.REDIS_URL;
};

export const isProductionMode = () => {
  return env?.NODE_ENV === 'production';
};

export const isDevelopmentMode = () => {
  return env?.NODE_ENV === 'development';
};

export const isTestMode = () => {
  return env?.NODE_ENV === 'test';
};

// Type export for TypeScript
export type Environment = z.infer<typeof environmentSchema>;
