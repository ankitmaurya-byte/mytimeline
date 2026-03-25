import mongoose from 'mongoose';
import { config } from '../../../src/config/app.config';
import { logger } from '../../../src/api-lib/logger';
import '../../../src/models/index';
import { ensureAdminBootstrap } from '../../../src/utils/admin-bootstrap';

// Connection state management
let connectionPromise: Promise<void> | null = null;
let isConnecting = false;

export async function ensureDb() {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If connection is in progress, wait for it
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // If not connected and not connecting, create new connection
  if (mongoose.connection.readyState === 0) {
    isConnecting = true;

    connectionPromise = (async () => {
      try {
        if (!config.MONGO_URI) {
          throw new Error('MONGO_URI is not set at runtime; ensure environment variables are loaded before calling ensureDb()');
        }
        const options: mongoose.ConnectOptions = {
          maxPoolSize: 10,
          minPoolSize: 5,
          maxIdleTimeMS: 30000,
          bufferCommands: true, // Enable buffering to prevent "before initial connection" errors
          writeConcern: {
            w: 1,
            j: false,
          },
          readPreference: 'primary',
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          retryWrites: true,
          retryReads: true,
        };
        await mongoose.connect(config.MONGO_URI, options);

        logger.info({ mongo: 'connected' }, '[DB] Connected');
        // Run admin bootstrap (non-blocking)
        ensureAdminBootstrap();

        // Set up connection event handlers
        mongoose.connection.on('error', (err) => {
          logger.error({ err }, '[DB] Connection error');
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('[DB] Disconnected');
        });

        mongoose.connection.on('reconnected', () => {
          logger.info('[DB] Reconnected');
        });

        // Graceful shutdown
        const gracefulShutdown = async () => {
          try {
            await mongoose.connection.close();
            logger.info('[DB] Connection closed gracefully');
            process.exit(0);
          } catch (err) {
            logger.error({ err }, '[DB] Error during graceful shutdown');
            process.exit(1);
          }
        };

        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);

      } catch (err: any) {
        logger.error({ err }, '[DB] Connection error');
        throw err;
      } finally {
        isConnecting = false;
      }
    })();

    return connectionPromise;
  }

  // Handle other connection states
  switch (mongoose.connection.readyState) {
    case 2: // connecting
      logger.info('[DB] Already connecting...');
      break;
    case 3: // disconnecting
      logger.warn('[DB] Connection is disconnecting, waiting...');
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      return ensureDb();
    default:
      logger.warn(`[DB] Unexpected connection state: ${mongoose.connection.readyState}`);
  }
}

// Health check function
export async function isDbHealthy(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }

    // Test the connection with a simple query
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch (error) {
    logger.warn({ error }, '[DB] Health check failed');
    return false;
  }
}

// Force disconnect (useful for testing)
export async function forceDisconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('[DB] Force disconnected');
  }
}
