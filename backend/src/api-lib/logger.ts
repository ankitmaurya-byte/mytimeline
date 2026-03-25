// Simple logger without Pino to avoid memory issues
const level = process.env.LOG_LEVEL || 'info';
const isDev = process.env.NODE_ENV !== 'production';

class SimpleLogger {
    private level: string;

    constructor(level: string) {
        this.level = level;
    }

    info(data: any, message?: string) {
        if (this.shouldLog('info')) {
            const timestamp = new Date().toISOString();
            if (isDev) {
                console.log(`\x1b[36m[${timestamp}] INFO:\x1b[0m ${message || ''}`, data || '');
            } else {
                console.log(JSON.stringify({ time: timestamp, level: 'info', msg: message, ...data }));
            }
        }
    }

    error(data: any, message?: string) {
        if (this.shouldLog('error')) {
            const timestamp = new Date().toISOString();
            if (isDev) {
                console.log(`\x1b[31m[${timestamp}] ERROR:\x1b[0m ${message || ''}`, data || '');
            } else {
                console.log(JSON.stringify({ time: timestamp, level: 'error', msg: message, ...data }));
            }
        }
    }

    warn(data: any, message?: string) {
        if (this.shouldLog('warn')) {
            const timestamp = new Date().toISOString();
            if (isDev) {
                console.log(`\x1b[33m[${timestamp}] WARN:\x1b[0m ${message || ''}`, data || '');
            } else {
                console.log(JSON.stringify({ time: timestamp, level: 'warn', msg: message, ...data }));
            }
        }
    }

    private shouldLog(level: string): boolean {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        return levels[level as keyof typeof levels] <= levels[this.level as keyof typeof levels];
    }
}

export const logger = new SimpleLogger(level);


