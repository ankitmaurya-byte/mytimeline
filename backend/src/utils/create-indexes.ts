import mongoose from 'mongoose';
import TaskModel from '../models/task.model';
import UserModel from '../models/user.model';
import WorkspaceModel from '../models/workspace.model';
import ProjectModel from '../models/project.model';
import MemberModel from '../models/member.model';
import InsightsNoteModel from '../models/insights-note.model';
import { logInfo, logError } from '../utils/logger';

/**
 * Enhanced database index management with performance optimization
 */

// Database indexes configuration
const ENHANCED_INDEXES = {
  tasks: [
    { fields: { project: 1, status: 1 } },
    { fields: { workspace: 1, status: 1 } },
    { fields: { assignedTo: 1, status: 1 } },
    { fields: { project: 1, priority: 1 } },
    { fields: { workspace: 1, dueDate: 1 } },
    { fields: { assignedTo: 1, dueDate: 1 } },
    { fields: { createdAt: -1 } },
    { fields: { updatedAt: -1 } },
    { fields: { title: 'text', description: 'text' } }
  ],
  users: [
    { fields: { email: 1 }, options: { unique: true } },
    { fields: { isEmailVerified: 1 } },
    { fields: { lastLoginAt: -1 } },
    { fields: { isAdmin: 1 } },
    { fields: { createdAt: -1 } }
  ],
  workspaces: [
    { fields: { owner: 1 } },
    { fields: { inviteCode: 1 }, options: { unique: true } },
    { fields: { createdAt: -1 } }
  ],
  projects: [
    { fields: { workspace: 1, createdAt: -1 } },
    { fields: { workspace: 1, name: 1 } },
    { fields: { workspace: 1, updatedAt: -1 } }
  ],
  members: [
    { fields: { user: 1, workspace: 1 }, options: { unique: true } },
    { fields: { workspace: 1, role: 1 } }
  ]
};

/**
 * Create all database indexes for optimal performance
 */
export const createAllIndexes = async () => {
    try {
        console.log('🚀 Creating database indexes for optimal performance...');

        // Task indexes
        console.log('📋 Creating Task indexes...');
        await TaskModel.createIndexes();

        // User indexes
        console.log('👤 Creating User indexes...');
        await UserModel.createIndexes();

        // Workspace indexes
        console.log('🏢 Creating Workspace indexes...');
        await WorkspaceModel.createIndexes();

        // Project indexes
        console.log('📊 Creating Project indexes...');
        await ProjectModel.createIndexes();

        // Member indexes
        console.log('👥 Creating Member indexes...');
        await MemberModel.createIndexes();

        // Insights Note indexes
console.log('💡 Creating Insights Note indexes...');
await InsightsNoteModel.createIndexes();

        console.log('✅ All database indexes created successfully!');

        // Get index information
        const collections = ['tasks', 'users', 'workspaces', 'projects', 'members', 'insightsnotes'];

        for (const collectionName of collections) {
            try {
                if (mongoose.connection.db) {
                    const indexes = await mongoose.connection.db
                        .collection(collectionName)
                        .indexes();

                    console.log(`📊 ${collectionName} indexes:`, indexes.length);
                    indexes.forEach((index: any) => {
                        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
                    });
                }
            } catch (error: any) {
                console.log(`⚠️ Could not get indexes for ${collectionName}:`, error?.message || 'Unknown error');
            }
        }

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        throw error;
    }
};

/**
 * Drop all indexes (use with caution - only for development/testing)
 */
export const dropAllIndexes = async () => {
    try {
        console.log('🗑️ Dropping all database indexes...');

        const collections = ['tasks', 'users', 'workspaces', 'projects', 'members', 'insightsnotes'];

        for (const collectionName of collections) {
            try {
                if (mongoose.connection.db) {
                    await mongoose.connection.db
                        .collection(collectionName)
                        .dropIndexes();
                    console.log(`✅ Dropped indexes for ${collectionName}`);
                }
            } catch (error: any) {
                console.log(`⚠️ Could not drop indexes for ${collectionName}:`, error?.message || 'Unknown error');
            }
        }

        console.log('✅ All indexes dropped successfully!');
    } catch (error) {
        console.error('❌ Error dropping indexes:', error);
        throw error;
    }
};

/**
 * Analyze index usage and performance
 */
export const analyzeIndexes = async () => {
    try {
        console.log('🔍 Analyzing database indexes...');

        const collections = ['tasks', 'users', 'workspaces', 'projects', 'members', 'insightsnotes'];
        const analysis: any = {};

        for (const collectionName of collections) {
            try {
                if (mongoose.connection.db) {
                    // Get indexes
                    const indexes = await mongoose.connection.db
                        .collection(collectionName)
                        .indexes();

                    analysis[collectionName] = {
                        documentCount: 'N/A', // stats() method not available in this version
                        size: 'N/A',
                        avgObjSize: 'N/A',
                        indexCount: indexes.length,
                        indexes: indexes.map((idx: any) => ({
                            name: idx.name,
                            key: idx.key,
                            unique: idx.unique,
                            sparse: idx.sparse,
                        })),
                    };
                }
            } catch (error: any) {
                analysis[collectionName] = { error: error?.message || 'Unknown error' };
            }
        }

        console.log('📊 Index Analysis Results:');
        console.log(JSON.stringify(analysis, null, 2));

        return analysis;
    } catch (error) {
        console.error('❌ Error analyzing indexes:', error);
        throw error;
    }
};

// If running directly
if (require.main === module) {
    const connectDatabase = require('../config/database.config').default;

    (async () => {
        try {
            await connectDatabase();

            const command = process.argv[2];

            switch (command) {
                case 'create':
                    await createAllIndexes();
                    break;
                case 'drop':
                    await dropAllIndexes();
                    break;
                case 'analyze':
                    await analyzeIndexes();
                    break;
                default:
                    console.log('Usage: npm run create-indexes [create|drop|analyze]');
                    console.log('  create  - Create all indexes');
                    console.log('  drop    - Drop all indexes (development only)');
                    console.log('  analyze - Analyze index usage');
            }

            process.exit(0);
        } catch (error) {
            console.error('Script failed:', error);
            process.exit(1);
        }
    })();
}
