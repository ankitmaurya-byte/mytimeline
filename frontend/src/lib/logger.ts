// Browser-friendly logging system with Pino-like API
const isBrowser = typeof window !== 'undefined';

// Create logger instance
let logger: any;

if (isBrowser) {
    // Browser environment - use console with structured logging
    logger = {
        info: (message: string, data?: any) => {
            console.group(`ℹ️ INFO [${new Date().toISOString()}]`);
            if (data !== undefined) {
            }
            console.groupEnd();
        },
        error: (message: string, data?: any) => {
            console.group(`❌ ERROR [${new Date().toISOString()}]`);
            console.error('Message:', message);
            if (data !== undefined) {
                console.error('Data:', data);
            }
            console.groupEnd();
        },
        warn: (message: string, data?: any) => {
            console.group(`⚠️ WARN [${new Date().toISOString()}]`);
            console.warn('Message:', message);
            if (data !== undefined) {
                console.warn('Data:', data);
            }
            console.groupEnd();
        },
        debug: (message: string, data?: any) => {
            console.group(`🔍 DEBUG [${new Date().toISOString()}]`);
            if (data !== undefined) {
            }
            console.groupEnd();
        }
    };
} else {
    // Server environment - use Pino
    const pino = require('pino');
    logger = pino({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV === 'development' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        } : undefined,
    });
}

// Export the logger object for direct usage
export { logger };

// Convenience methods
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);

// Example usage:
// logInfo('User logged in', { userId: 123, timestamp: new Date() });
// logError('API call failed', { endpoint: '/api/users', status: 500 });
