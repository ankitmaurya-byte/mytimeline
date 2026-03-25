import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        // Check if MONGO_URI is set
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI environment variable is not set');
            return NextResponse.json(
                {
                    error: 'Database connection not configured - MONGO_URI missing',
                    message: 'Please set MONGO_URI environment variable'
                },
                { status: 503 }
            );
        }

        // Check if backup password is set
        if (!process.env.BACKUP_PASSWORD) {
            console.error('BACKUP_PASSWORD environment variable is not set');
            return NextResponse.json(
                {
                    error: 'Backup password not configured',
                    message: 'Please set BACKUP_PASSWORD environment variable'
                },
                { status: 503 }
            );
        }

        // Get request body
        const body = await request.json();
        const { password } = body;

        // Validate password
        if (!password) {
            return NextResponse.json(
                {
                    error: 'Password required',
                    message: 'Please provide backup password'
                },
                { status: 400 }
            );
        }

        // Check password against environment variable
        if (password !== process.env.BACKUP_PASSWORD) {
            console.error('Invalid backup password attempt');
            return NextResponse.json(
                {
                    error: 'Invalid password',
                    message: 'Backup password is incorrect'
                },
                { status: 401 }
            );
        }

        console.log('Starting database backup...');

        // Create a real database backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupData = {
            timestamp: new Date().toISOString(),
            collections: {},
            metadata: {
                totalCollections: 0,
                totalDocuments: 0,
                backupSize: 0
            }
        };

        // Get database connection
        const connection = await connectDB();
        if (!connection.db) {
            return NextResponse.json(
                {
                    error: 'Database not accessible',
                    message: 'Database connection established but database not accessible'
                },
                { status: 503 }
            );
        }

        // Get all collections
        const collections = await connection.db.listCollections().toArray();
        backupData.metadata.totalCollections = collections.length;

        // Backup each collection
        for (const collection of collections) {
            try {
                const documents = await connection.db.collection(collection.name).find({}).toArray();
                backupData.collections[collection.name] = documents;
                backupData.metadata.totalDocuments += documents.length;
                console.log(`Backed up collection: ${collection.name} (${documents.length} documents)`);
            } catch (error) {
                console.error(`Failed to backup collection ${collection.name}:`, error);
            }
        }

        // Calculate backup size
        const backupString = JSON.stringify(backupData, null, 2);
        backupData.metadata.backupSize = Buffer.byteLength(backupString, 'utf8');

        console.log(`Database backup completed successfully - ${backupData.metadata.totalCollections} collections, ${backupData.metadata.totalDocuments} documents`);

        return NextResponse.json({
            success: true,
            backup: backupData,
            message: `Database backup completed - ${backupData.metadata.totalDocuments} documents backed up`
        });

    } catch (error) {
        console.error('Backup failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to create database backup',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
