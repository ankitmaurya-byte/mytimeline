import 'server-only';

// Simple fallback logger for development environments
// Avoids worker process issues that can occur with pino in Next.js
const simpleFallbackLogger = {
  info: (data: any, message?: string) => {
    const timestamp = new Date().toISOString();
    if (typeof data === 'string' && !message) {
      console.log(`[${timestamp}] INFO: ${data}`);
    } else {
      console.log(`[${timestamp}] INFO: ${message || ''}`, data || '');
    }
  },
  
  warn: (data: any, message?: string) => {
    const timestamp = new Date().toISOString();
    if (typeof data === 'string' && !message) {
      console.warn(`[${timestamp}] WARN: ${data}`);
    } else {
      console.warn(`[${timestamp}] WARN: ${message || ''}`, data || '');
    }
  },
  
  error: (data: any, message?: string) => {
    const timestamp = new Date().toISOString();
    if (typeof data === 'string' && !message) {
      console.error(`[${timestamp}] ERROR: ${data}`);
    } else {
      console.error(`[${timestamp}] ERROR: ${message || ''}`, data || '');
    }
  },
  
  debug: (data: any, message?: string) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      if (typeof data === 'string' && !message) {
        console.debug(`[${timestamp}] DEBUG: ${data}`);
      } else {
        console.debug(`[${timestamp}] DEBUG: ${message || ''}`, data || '');
      }
    }
  }
};

export const logger = simpleFallbackLogger;


