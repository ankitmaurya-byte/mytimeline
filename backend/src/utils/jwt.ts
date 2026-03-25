import * as jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config/app.config';

const DEFAULT_EXPIRY = '7d';

function getSecret(): string | undefined {
  // Production must rely on explicit env var.
  if (process.env.NODE_ENV === 'production') {
    return process.env.JWT_SECRET || undefined;
  }
  // Respect provided env var in dev if present.
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  const g = globalThis as any;
  if (g.__DEV_JWT_SECRET) return g.__DEV_JWT_SECRET as string;

  // File-based persistence across full restarts (not just hot reload) to prevent invalidating existing cookies.
  try {
    const projectRoot = process.cwd();
    const secretFile = path.join(projectRoot, '.dev-jwt-secret');
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing) {
        g.__DEV_JWT_SECRET = existing;
        return existing;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, generated + '\n', { encoding: 'utf8' });
    g.__DEV_JWT_SECRET = generated;
    console.warn('[auth] Generated new dev JWT secret and wrote to .dev-jwt-secret (use JWT_SECRET env var for explicit override)');
    return generated;
  } catch {
    // Fallback to in-memory only if file operations fail.
    const fallback = crypto.randomBytes(32).toString('hex');
    g.__DEV_JWT_SECRET = fallback;
    console.warn('[auth] Generated in-memory dev JWT secret (file persistence failed). Set JWT_SECRET to avoid rotation.');
    return fallback;
  }
}

export interface JwtPayloadBase {
  sub: string; // user id
  email?: string;
  ws?: string; // current workspace id
}

export function signJwt(payload: JwtPayloadBase, options?: { expiresIn?: string }) {
  const secret = getSecret();
  if (!secret) throw new Error('JWT_SECRET not configured');
  // jsonwebtoken types expect StringValue but string literal is fine; cast to any to satisfy TS
  const signOpts: SignOptions = { expiresIn: (options?.expiresIn || DEFAULT_EXPIRY) as any };
  return jwt.sign(payload as any, secret as Secret, signOpts);
}

export function verifyJwt<T extends object = JwtPayloadBase>(token: string): (T & JwtPayloadBase) | null {
  const secret = getSecret();
  if (!secret) return null;
  try {
    return jwt.verify(token, secret as Secret) as any;
  } catch (e: any) {
    if (process.env.DEBUG_AUTH) {
      console.warn('[auth] JWT verify failed:', e?.message);
    }
    return null;
  }
}

export function buildAuthCookie(token: string, requestOrigin?: string) {
  // 7 days default
  const maxAge = 7 * 24 * 60 * 60; // seconds
  const origin = process.env.FRONTEND_ORIGIN || '';
  const useSecure = /^https:/i.test(origin) || process.env.NODE_ENV === 'production';
  // Chrome rejects SameSite=None without Secure -> use Lax for local http, None+Secure for https/prod
  const sameSite = useSecure ? 'None' : 'Lax';
  const securePart = useSecure ? 'Secure; ' : '';

  // For cross-domain setup (mytimeline.in -> api.timelline.tech)
  // We need to use a shared domain or no domain restriction
  let domain = '';

  if (process.env.NODE_ENV === 'production') {
    // For production cross-domain setup, use the root domain that both subdomains share
    // mytimeline.in and api.timelline.tech share the root domain .timelline.tech
    if (requestOrigin && (requestOrigin.includes('mytimeline.in') || requestOrigin.includes('timelline.tech'))) {
      // Both frontend and backend are on timelline.tech domain, set cookie for .timelline.tech domain
      domain = 'Domain=.timelline.tech; ';
    } else {
      // Fallback to configured domain or no domain restriction
      const cookieDomain = config.getCookieDomains();
      if (cookieDomain) {
        domain = `Domain=${cookieDomain}; `;
      }
    }
  } else {
    // Development: use localhost domain
    if (requestOrigin) {
      try {
        const url = new URL(requestOrigin);
        if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          domain = `Domain=${url.hostname}; `;
        } else {
          domain = 'Domain=localhost; ';
        }
      } catch (e) {
        domain = 'Domain=localhost; ';
      }
    } else {
      domain = 'Domain=localhost; ';
    }
  }

  // For cross-domain authentication, we need the frontend to be able to read the token
  // So we'll set both HttpOnly and non-HttpOnly cookies
  const httpOnlyCookie = `auth_token=${token}; Path=/; ${domain}HttpOnly; SameSite=${sameSite}; ${securePart}Max-Age=${maxAge};`;
  const jsAccessibleCookie = `auth_token_js=${token}; Path=/; ${domain}SameSite=${sameSite}; ${securePart}Max-Age=${maxAge};`;

  // Return the HttpOnly cookie as the primary cookie
  const cookie = httpOnlyCookie;
  return cookie;
}

export function buildJsAccessibleAuthCookie(token: string, requestOrigin?: string) {
  // 7 days default
  const maxAge = 7 * 24 * 60 * 60; // seconds
  const origin = process.env.FRONTEND_ORIGIN || '';
  const useSecure = /^https:/i.test(origin) || process.env.NODE_ENV === 'production';
  // Chrome rejects SameSite=None without Secure -> use Lax for local http, None+Secure for https/prod
  const sameSite = useSecure ? 'None' : 'Lax';
  const securePart = useSecure ? 'Secure; ' : '';

  // For cross-domain setup (mytimeline.in -> api.timelline.tech)
  // We need to use a shared domain or no domain restriction
  let domain = '';

  if (process.env.NODE_ENV === 'production') {
    // For production cross-domain setup, use the root domain that both subdomains share
    // mytimeline.in and api.timelline.tech share the root domain .timelline.tech
    if (requestOrigin && (requestOrigin.includes('mytimeline.in') || requestOrigin.includes('timelline.tech'))) {
      // Both frontend and backend are on timelline.tech domain, set cookie for .timelline.tech domain
      domain = 'Domain=.timelline.tech; ';
    } else {
      // Fallback to configured domain or no domain restriction
      const cookieDomain = config.getCookieDomains();
      if (cookieDomain) {
        domain = `Domain=${cookieDomain}; `;
      }
    }
  } else {
    // Development: use localhost domain
    if (requestOrigin) {
      try {
        const url = new URL(requestOrigin);
        if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          domain = `Domain=${url.hostname}; `;
        } else {
          domain = 'Domain=localhost; ';
        }
      } catch (e) {
        domain = 'Domain=localhost; ';
      }
    } else {
      domain = 'Domain=localhost; ';
    }
  }

  // JavaScript-accessible cookie (no HttpOnly flag)
  const cookie = `auth_token_js=${token}; Path=/; ${domain}SameSite=${sameSite}; ${securePart}Max-Age=${maxAge};`;
  return cookie;
}

export function clearAuthCookie(requestOrigin?: string) {
  const origin = process.env.FRONTEND_ORIGIN || '';
  const useSecure = /^https:/i.test(origin) || process.env.NODE_ENV === 'production';
  const sameSite = useSecure ? 'None' : 'Lax';
  const securePart = useSecure ? 'Secure; ' : '';

  // For cross-domain setup (mytimeline.in -> api.timelline.tech)
  // We need to use a shared domain or no domain restriction
  let domain = '';

  if (process.env.NODE_ENV === 'production') {
    // For production cross-domain setup, use the root domain that both subdomains share
    // mytimeline.in and api.timelline.tech share the root domain .timelline.tech
    if (requestOrigin && requestOrigin.includes('mytimeline.in')) {
      // Frontend is on mytimeline.in, clear cookie for .timelline.tech domain
      domain = 'Domain=.timelline.tech; ';
    } else if (requestOrigin && requestOrigin.includes('timelline.tech')) {
      // Backend is on api.timelline.tech, clear cookie for .timelline.tech domain
      domain = 'Domain=.timelline.tech; ';
    } else {
      // Fallback to configured domain or no domain restriction
      const cookieDomain = config.getCookieDomains();
      if (cookieDomain) {
        domain = `Domain=${cookieDomain}; `;
      }
    }
  } else {
    // Development: use localhost domain
    if (requestOrigin) {
      try {
        const url = new URL(requestOrigin);
        if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          domain = `Domain=${url.hostname}; `;
        } else {
          domain = 'Domain=localhost; ';
        }
      } catch (e) {
        domain = 'Domain=localhost; ';
      }
    } else {
      domain = 'Domain=localhost; ';
    }
  }

  return `auth_token=; Path=/; ${domain}Max-Age=0; SameSite=${sameSite}; ${securePart}`;
}
