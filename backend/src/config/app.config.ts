import { getEnv } from "../utils/get-env";

const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "8000"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  // MONGO_URI is made non-fatal at build time to avoid Next.js build crashes when
  // secrets aren't injected yet (e.g. container build phase). Runtime code that
  // actually connects will validate presence.
  MONGO_URI: process.env.MONGO_URI || "",

  // Secrets made non-fatal at build time; validated at runtime via validateCriticalEnv().
  SESSION_SECRET: process.env.SESSION_SECRET || "",
  SESSION_EXPIRES_IN: process.env.SESSION_EXPIRES_IN || "",

  // Clerk removed

  FRONTEND_ORIGIN: getEnv(
    "FRONTEND_ORIGIN",
    process.env.NODE_ENV === "production"
      ? "https://mytimeline.in"
      : "http://localhost:3000"
  ),

  // Helper function to get multiple frontend origins
  getFrontendOrigins: () => {
    const frontendOrigin = getEnv(
      "FRONTEND_ORIGIN",
      process.env.NODE_ENV === "production"
        ? "https://mytimeline.in"
        : "http://localhost:3000"
    );

    // Split by comma and trim whitespace
    return frontendOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
  },

  // Helper function to get multiple cookie domains
  getCookieDomains: () => {
    const cookieDomain = process.env.COOKIE_DOMAIN;

    if (!cookieDomain) {
      return undefined; // No domain restriction
    }

    // Split by comma and trim whitespace
    const domains = cookieDomain.split(',').map(domain => domain.trim()).filter(Boolean);

    // Return the first domain (cookies can only have one domain)
    // But log all domains for debugging
    if (domains.length > 1) {
      console.log('🍪 Multiple cookie domains configured:', domains);
      console.log(' Using first domain for cookies:', domains[0]);
    }

    return domains[0] || undefined;
  },
});

export const config = appConfig();

// Validate required env vars at runtime (call this early in server start or first request path).
export function validateCriticalEnv() {
  const missing: string[] = [];
  if (!config.MONGO_URI) missing.push('MONGO_URI');
  if (!config.SESSION_SECRET) missing.push('SESSION_SECRET');
  if (missing.length) {
    // Intentionally throw to surface misconfiguration at runtime rather than build.
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
  }
}
