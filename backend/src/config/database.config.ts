import mongoose from "mongoose";
import { config } from "./app.config";

const connectDatabase = async () => {
  try {
    // Connection pooling and performance optimizations
    const mongooseOptions: mongoose.ConnectOptions = {
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      bufferCommands: true, // Enable buffering to prevent "before initial connection" errors

      // Performance optimizations
      // bufferCommands: false, // Disable mongoose buffering

      // Write concern for better performance
      writeConcern: {
        w: 1, // Acknowledge writes from primary only
        j: false, // Don't wait for journal commit
      },

      // Read preference for better performance (changed to primary for transactions)
      readPreference: 'primary',

      // Connection timeout settings
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000,         // Socket timeout
      connectTimeoutMS: 10000,        // Connection timeout

      // Retry settings
      retryWrites: true,
      retryReads: true,

      // Monitoring and debugging
      monitorCommands: process.env.NODE_ENV === 'development',
    };

    await mongoose.connect(config.MONGO_URI, mongooseOptions);

    // Set global mongoose options
    mongoose.set('debug', process.env.NODE_ENV === 'development');

    // Connection event handlers for monitoring
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
      // Note: poolSize is deprecated in newer mongoose versions
      console.log(`📊 Connection pool configured with max: ${mongooseOptions.maxPoolSize}, min: ${mongooseOptions.minPoolSize}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Add connection health monitoring
    mongoose.connection.on('open', () => {
      console.log('🔓 MongoDB connection opened');
    });

    mongoose.connection.on('close', () => {
      console.log('🔒 MongoDB connection closed');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Add health check function
export const isDatabaseHealthy = () => {
  const connection = mongoose.connection;
  return connection.readyState === 1; // 1 = connected
};

// Add connection stats function
export const getConnectionStats = () => {
  const connection = mongoose.connection;
  return {
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][connection.readyState] || 'unknown'
  };
};

export default connectDatabase;
