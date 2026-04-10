import mongoose from 'mongoose';

// MongoDB connection state
let isConnected = false;
let connectionPromise: Promise<mongoose.Connection> | null = null;

/**
 * Connect to MongoDB database
 * @returns Promise<mongoose.Connection>
 */
export async function connectDB(): Promise<mongoose.Connection> {
    // If already connected, return existing connection
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // If connection is in progress, wait for it
    if (connectionPromise) {
        return connectionPromise;
    }

    // Create new connection
    connectionPromise = connectToDatabase();
    return connectionPromise;
}

/**
 * Internal function to establish database connection
 */
async function connectToDatabase(): Promise<mongoose.Connection> {
    try {
        // Debug environment variables
        /*     console.log('🔍 Environment Debug Info:');
            console.log('NODE_ENV:', process.env.NODE_ENV);
            console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
            console.log('MONGO_URI length:', process.env.MONGO_URI?.length || 0);
            console.log('MONGO_URI preview:', process.env.MONGO_URI?.substring(0, 50) + '...');
     */
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            /*   console.error('❌ MONGO_URI environment variable is not set');
              console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO'))); */
            throw new Error('MONGO_URI environment variable is not set. Please check your .env.local file.');
        }

        // Check if the URI is valid
        if (mongoUri.includes('\n') || mongoUri.includes('\r')) {
            // console.error('❌ MONGO_URI contains line breaks - this will cause connection issues');
            throw new Error('MONGO_URI contains line breaks. Please ensure it is on a single line in your .env.local file.');
        }

        // Connection options for better performance

        const options: mongoose.ConnectOptions = {
            // -------------------------------
            // 🧵 Connection Pooling
            // -------------------------------
            maxPoolSize: 20,
            // Maximum number of connections in the pool
            // Increase for high traffic apps (e.g., 50–100 in large systems)

            minPoolSize: 5,
            // Keeps minimum connections ready (reduces latency spikes)

            // -------------------------------
            // ⏱️ Connection Lifecycle
            // -------------------------------
            maxIdleTimeMS: 30000,
            // Close connections idle for >30s (frees unused resources)

            connectTimeoutMS: 10000,
            // Fail if initial connection takes more than 10s

            socketTimeoutMS: 45000,
            // Kill queries taking more than 45s (prevents hanging requests)

            serverSelectionTimeoutMS: 5000,
            // Max time to find a MongoDB server before throwing error

            // -------------------------------
            // 📦 Query Buffering
            // -------------------------------
            bufferCommands: false,
            // ❗ Recommended OFF in production
            // Prevents silent queuing of queries before DB connects
            // Helps catch connection issues early

            // -------------------------------
            // ✍️ Write Concern (Durability vs Speed)
            // -------------------------------
            writeConcern: {
                w: 1,
                // Acknowledge write from primary node only (fast)

                j: true,
                // Wait for write to be committed to journal (safer)
            },

            // -------------------------------
            // 📖 Read Preference
            // -------------------------------
            readPreference: 'primary',
            // Always read from primary (strong consistency)
            // Use 'secondary' for read-heavy apps with replicas

            // -------------------------------
            // 🔁 Retry Logic
            // -------------------------------
            retryWrites: true,
            // Automatically retry failed writes (network issues)

            retryReads: true,
            // Automatically retry failed reads

            // -------------------------------
            // 🧪 Debug / Monitoring
            // -------------------------------
            monitorCommands: process.env.NODE_ENV === 'development',
            // Logs all MongoDB commands in development mode only
        };


        // Connect to MongoDB
        console.log('🔌 Attempting to connect to MongoDB...');
        await mongoose.connect(mongoUri, options);

        isConnected = true;
        console.log('✅ MongoDB connected successfully via connectDB');

        // Set up connection event handlers
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connection established');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB connection disconnected');
            isConnected = false;
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

        return mongoose.connection;

    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        isConnected = false;
        connectionPromise = null;
        throw error;
    }
}

/**
 * Check if database is connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
    try {
        const connection = await connectDB();
        return connection.readyState === 1;
    } catch (error) {
        return false;
    }
}

/**
 * Get database connection status
 */
export function getDatabaseStatus(): string {
    if (!mongoose.connection) return 'disconnected';

    switch (mongoose.connection.readyState) {
        case 0: return 'disconnected';
        case 1: return 'connected';
        case 2: return 'connecting';
        case 3: return 'disconnecting';
        default: return 'unknown';
    }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            isConnected = false;
            connectionPromise = null;
            console.log('✅ MongoDB connection closed');
        }
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
    }
}

export default connectDB;
