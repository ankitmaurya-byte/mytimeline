import mongoose from 'mongoose';
import { redis } from '../api-lib/cache';
import { cleanupRateLimit } from '../api-lib/rate-limit';
import { logger } from '../api-lib/logger';

interface ShutdownOptions {
    timeout?: number;
    force?: boolean;
}

export class GracefulShutdown {
    private isShuttingDown = false;
    private shutdownTimeout: NodeJS.Timeout | null = null;

    constructor(private options: ShutdownOptions = {}) {
        this.options = {
            timeout: 30000, // 30 seconds default
            force: false,
            ...options
        };

        this.setupSignalHandlers();
    }

    private setupSignalHandlers() {
        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            logger.info('SIGINT received, starting graceful shutdown...');
            this.shutdown();
        });

        // Handle SIGTERM (termination signal)
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, starting graceful shutdown...');
            this.shutdown();
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error({ error }, 'Uncaught exception, starting emergency shutdown...');
            this.emergencyShutdown(error);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error({ reason, promise }, 'Unhandled promise rejection, starting emergency shutdown...');
            this.emergencyShutdown(new Error(`Unhandled promise rejection: ${reason}`));
        });
    }

    async shutdown() {
        if (this.isShuttingDown) {
            logger.warn('Shutdown already in progress...');
            return;
        }

        this.isShuttingDown = true;
        logger.info('Starting graceful shutdown...');

        // Set shutdown timeout
        if (this.options.timeout) {
            this.shutdownTimeout = setTimeout(() => {
                logger.error(`Shutdown timeout reached (${this.options.timeout}ms), forcing exit...`);
                this.forceExit();
            }, this.options.timeout);
        }

        try {
            // 1. Stop accepting new requests (if applicable)
            logger.info('Stopping new request acceptance...');
            // Add your server shutdown logic here if needed

            // 2. Close database connections
            logger.info('Closing database connections...');
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                logger.info('Database connections closed');
            }

            // 3. Close Redis connections
            logger.info('Closing Redis connections...');
            if (redis) {
                await redis.quit();
                logger.info('Redis connections closed');
            }

            // 4. Cleanup rate limiting
            logger.info('Cleaning up rate limiting...');
            cleanupRateLimit();

            // 5. Clear any remaining timeouts/intervals
            logger.info('Cleaning up timers...');
            if (this.shutdownTimeout) {
                clearTimeout(this.shutdownTimeout);
            }

            logger.info('Graceful shutdown completed successfully');
            process.exit(0);

        } catch (error) {
            logger.error({ error }, 'Error during graceful shutdown');
            this.forceExit();
        }
    }

    private emergencyShutdown(error: Error) {
        logger.error({ error }, 'Emergency shutdown initiated');

        // Try to close critical connections quickly
        Promise.allSettled([
            mongoose.connection.close(),
            redis?.quit()
        ]).finally(() => {
            logger.error('Emergency shutdown completed');
            process.exit(1);
        });
    }

    private forceExit() {
        logger.error('Force exit initiated');
        process.exit(1);
    }

    // Manual shutdown method
    async manualShutdown() {
        await this.shutdown();
    }

    // Check if shutdown is in progress
    get isShutdownInProgress(): boolean {
        return this.isShuttingDown;
    }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdown();

// Export for manual use
export default GracefulShutdown;






