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
                    total: 0,
                    active: 0,
                    newToday: 0,
                    premium: 0,
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
                    total: 0,
                    active: 0,
                    newToday: 0,
                    premium: 0,
                    message: 'Database connection established but database not accessible'
                },
                { status: 503 }
            );
        }

        const usersCollection = connection.db.collection('users');

        const total = await usersCollection.countDocuments();

        // Check what fields exist in user documents
        const sampleUser = await usersCollection.findOne({});
        const availableFields = sampleUser ? Object.keys(sampleUser) : [];

        let active = 0;
        let newToday = 0;
        let premium = 0;

        // Calculate active users based on available fields
        if (availableFields.includes('lastLoginAt')) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            active = await usersCollection.countDocuments({
                lastLoginAt: { $gte: thirtyDaysAgo }
            });
        } else if (availableFields.includes('updatedAt')) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            active = await usersCollection.countDocuments({
                updatedAt: { $gte: thirtyDaysAgo }
            });
        } else {
            active = Math.floor(total * 0.8); // Estimate 80% active
        }

        // Calculate new users today
        if (availableFields.includes('createdAt')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            newToday = await usersCollection.countDocuments({
                createdAt: { $gte: today }
            });
        }

        // Calculate premium users
        if (availableFields.includes('isPremium')) {
            premium = await usersCollection.countDocuments({
                isPremium: true
            });
        } else if (availableFields.includes('premium')) {
            premium = await usersCollection.countDocuments({
                premium: true
            });
        }

        // Simple fallback endpoint for basic user counting
        return NextResponse.json({
            total,
            active,
            newToday,
            premium,
            availableFields,
            message: 'Basic user count endpoint with field detection'
        });
    } catch (error) {
        console.error('User count error:', error);

        // Check if it's a connection error
        if (error instanceof Error && error.message.includes('MONGO_URI')) {
            return NextResponse.json(
                {
                    error: 'Database connection not configured',
                    total: 0,
                    active: 0,
                    newToday: 0,
                    premium: 0,
                    message: 'Please set MONGO_URI environment variable'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch user count',
                total: 0,
                active: 0,
                newToday: 0,
                premium: 0,
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
