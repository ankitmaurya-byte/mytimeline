/**
 * Simple fallback logger for development environments
 * Avoids worker process issues that can occur with pino in Next.js
 */

export const simpleFallbackLogger = {
  info: (data: any, message: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, data || '');
  },
  
  warn: (data: any, message: string) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, data || '');
  },
  
  error: (data: any, message: string) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, data || '');
  },
  
  debug: (data: any, message: string) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] DEBUG: ${message}`, data || '');
    }
  }
};

// Environment check for worker issues
export const hasWorkerIssues = () => {
  // In development with Next.js, we often get worker exit issues
  return process.env.NODE_ENV === 'development' && 
         (process.env.NEXT_PHASE === 'phase-development-server' ||
          process.env.npm_lifecycle_event === 'dev');
};
