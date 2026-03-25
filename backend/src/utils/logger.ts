import { simpleFallbackLogger, hasWorkerIssues } from './simple-logger';

// Build-friendly and worker-safe logger configuration
const createLogger = () => {
  // Always use simple console logger to avoid worker issues in Next.js
  // console.log('[LOGGER] Using simple fallback logger to avoid pino worker issues');
  return simpleFallbackLogger;
};

// Create logger instance
const logger = createLogger();

// Helper functions for structured logging with error handling
export const logError = (message: string, error?: Error, context?: any) => {
  try {
    if (error) {
      logger.error({
        err: error,
        context,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, message);
    } else {
      logger.error({ context, timestamp: new Date().toISOString() }, message);
    }
  } catch (logErr) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error || context || '');
    if (error?.stack) {
      console.error('Stack:', error.stack);
    }
  }
};

export const logInfo = (message: string, data?: any) => {
  try {
    // Try to use the logger first
    logger.info({
      data,
      timestamp: new Date().toISOString()
    }, message);
  } catch (logErr) {
    // If logger fails (worker exited), fall back to console
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] INFO: ${message}`, data || '');
  }
};

export const logWarn = (message: string, data?: any) => {
  try {
    logger.warn({
      data,
      timestamp: new Date().toISOString()
    }, message);
  } catch (logErr) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, data || '');
  }
};

export const logDebug = (message: string, data?: any) => {
  try {
    logger.debug({
      data,
      timestamp: new Date().toISOString()
    }, message);
  } catch (logErr) {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`, data || '');
  }
};

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    try {
      const duration = Date.now() - start;
      logger.info({
        req,
        res,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      }, `${req.method} ${req.originalUrl} - ${res.statusCode}`);
    } catch (logErr) {
      console.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (logger error)`);
    }
  });
  
  next();
};

export default logger;
