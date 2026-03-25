import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
    try {
        // Check if MONGO_URI is set
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI environment variable is not set');
            return NextResponse.json(
                {
                    error: 'Database connection not configured - MONGO_URI missing',
                    collections: 0,
                    documents: 0,
                    indexes: 0,
                    size: 'N/A',
                    message: 'Please set MONGO_URI environment variable'
                },
                { status: 503 }
            );
        }

        const connection = await connectDB();

        // Check if connection.db is available
        if (!connection.db) {
            return NextResponse.json(
                {
                    error: 'Database not accessible',
                    collections: 0,
                    documents: 0,
                    indexes: 0,
                    size: 'N/A',
                    message: 'Database connection established but database not accessible'
                },
                { status: 503 }
            );
        }

        // Get database statistics
        const stats = await connection.db.stats();

        // Get collection information
        const collections = await connection.db.listCollections().toArray();

        // Get index information
        let totalIndexes = 0;
        for (const collection of collections) {
            try {
                const indexStats = await connection.db.collection(collection.name).indexes();
                totalIndexes += indexStats.length;
            } catch (error) {
                // Collection might not exist or be accessible
                console.log(`Could not get indexes for collection: ${collection.name}`);
            }
        }

        // Calculate database size in human-readable format
        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const response = {
            collections: collections.length,
            documents: stats.objects || 0,
            indexes: totalIndexes,
            size: formatBytes(stats.dataSize || 0),
            storageSize: formatBytes(stats.storageSize || 0),
            indexesSize: formatBytes(stats.indexSize || 0),
            avgObjSize: formatBytes(stats.avgObjSize || 0),
            lastUpdated: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Database stats error:', error);

        // Check if it's a connection error
        if (error instanceof Error && error.message.includes('MONGO_URI')) {
            return NextResponse.json(
                {
                    error: 'Database connection not configured',
                    collections: 0,
                    documents: 0,
                    indexes: 0,
                    size: 'N/A',
                    message: 'Please set MONGO_URI environment variable'
                },
                { status: 503 }
            );
        }

        // Check if it's a connection timeout or network error
        if (error instanceof Error && (
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ENOTFOUND') ||
            error.message.includes('timeout')
        )) {
            return NextResponse.json(
                {
                    error: 'Cannot connect to database',
                    collections: 0,
                    documents: 0,
                    indexes: 0,
                    size: 'N/A',
                    message: 'Database server is not accessible. Please check if MongoDB is running.'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch database statistics',
                collections: 0,
                documents: 0,
                indexes: 0,
                size: 'N/A',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
