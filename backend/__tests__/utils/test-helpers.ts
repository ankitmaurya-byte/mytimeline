// Test utilities and helpers
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Database helpers
export const dbHelpers = {
    // Connect to test database
    connect: async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ankitmaurya2989_db_user:d7X9ena0VeHqy7Jo@cluster0.ytkeufu.mongodb.net/?appName=Cluster0');
        }
    },

    // Disconnect from database
    disconnect: async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    },

    // Clear all collections
    clearCollections: async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            if (collection && typeof collection.deleteMany === 'function') {
                await collection.deleteMany({});
            }
        }
    },

    // Drop all collections
    dropCollections: async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            if (collection && typeof collection.drop === 'function') {
                try {
                    await collection.drop();
                } catch (error) {
                    // Collection might not exist, ignore error
                }
            }
        }
    }
};

// Authentication helpers
export const authHelpers = {
    // Create a test user with hashed password
    createTestUser: async (userData = {}) => {
        const defaultUser = {
            name: 'Test User',
            email: `test-${Date.now()}@example.com`,
            password: 'password123',
            isEmailVerified: true,
            role: 'USER',
            ...userData
        };

        if (defaultUser.password) {
            defaultUser.password = await bcrypt.hash(defaultUser.password, 12);
        }

        return defaultUser;
    },

    // Generate JWT token
    generateToken: (payload = {}) => {
        return jwt.sign(
            {
                userId: new mongoose.Types.ObjectId(),
                email: 'test@example.com',
                ...payload
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '7d' }
        );
    },

    // Create authenticated request headers
    createAuthHeaders: (token?: string) => {
        const authToken = token || authHelpers.generateToken();
        return {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        };
    },

    // Create cookie headers
    createCookieHeaders: (cookies: Record<string, string> = {}) => {
        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');

        return {
            'Cookie': cookieString,
            'Content-Type': 'application/json',
        };
    }
};

// Request/Response helpers
export const requestHelpers = {
    // Create mock NextRequest
    createMockRequest: (options: {
        method?: string;
        url?: string;
        headers?: Record<string, string>;
        body?: any;
        cookies?: Record<string, string>;
    } = {}) => {
        const {
            method = 'GET',
            url = 'http://localhost:3001/api/test',
            headers = {},
            body = null,
            cookies = {}
        } = options;

        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');

        const requestHeaders = new Headers({
            'Content-Type': 'application/json',
            ...headers,
            ...(cookieString && { 'Cookie': cookieString })
        });

        return new NextRequest(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : null,
        });
    },

    // Create mock response
    createMockResponse: () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
            headers: new Headers(),
        };
        return res;
    }
};

// Data generation helpers
export const dataHelpers = {
    // Generate random string
    randomString: (length = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Generate random email
    randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,

    // Generate random ObjectId
    randomObjectId: () => new mongoose.Types.ObjectId(),

    // Generate random date
    randomDate: (start?: Date, end?: Date) => {
        const startDate = start || new Date(2020, 0, 1);
        const endDate = end || new Date();
        return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    },

    // Generate random number
    randomNumber: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,

    // Generate random boolean
    randomBoolean: () => Math.random() < 0.5,

    // Generate random array element
    randomElement: <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)],

    // Generate random array
    randomArray: <T>(generator: () => T, length = 5): T[] => {
        return Array.from({ length }, generator);
    }
};

// Test data factories
export const testData = {
    // User factory
    user: (overrides = {}) => ({
        name: 'Test User',
        email: dataHelpers.randomEmail(),
        password: 'password123',
        isEmailVerified: true,
        role: 'USER',
        ...overrides
    }),

    // Workspace factory
    workspace: (overrides = {}) => ({
        name: 'Test Workspace',
        description: 'Test workspace description',
        owner: dataHelpers.randomObjectId(),
        ...overrides
    }),

    // Project factory
    project: (overrides = {}) => ({
        name: 'Test Project',
        description: 'Test project description',
        emoji: '📊',
        workspace: dataHelpers.randomObjectId(),
        owner: dataHelpers.randomObjectId(),
        ...overrides
    }),

    // Task factory
    task: (overrides = {}) => ({
        title: 'Test Task',
        description: 'Test task description',
        status: 'TODO',
        priority: 'MEDIUM',
        project: dataHelpers.randomObjectId(),
        assignee: dataHelpers.randomObjectId(),
        ...overrides
    }),

    // Team member factory
    teamMember: (overrides = {}) => ({
        user: dataHelpers.randomObjectId(),
        workspace: dataHelpers.randomObjectId(),
        role: 'MEMBER',
        permissions: ['READ', 'WRITE'],
        ...overrides
    })
};

// Mock helpers
export const mockHelpers = {
    // Mock external API calls
    mockExternalAPI: (response: any, status = 200) => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: status >= 200 && status < 300,
                status,
                json: () => Promise.resolve(response),
                text: () => Promise.resolve(JSON.stringify(response)),
                headers: new Headers(),
                redirected: false,
                statusText: 'OK',
                type: 'basic',
                url: '',
                clone: () => ({} as Response),
                body: null,
                bodyUsed: false,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
                blob: () => Promise.resolve(new Blob()),
                formData: () => Promise.resolve(new FormData()),
            } as Response)
        );
    },

    // Mock email service
    mockEmailService: () => {
        return {
            sendEmail: jest.fn().mockResolvedValue({ success: true }),
            sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
            sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
        };
    },

    // Mock file storage
    mockFileStorage: () => {
        return {
            upload: jest.fn().mockResolvedValue({ url: 'https://example.com/file.jpg' }),
            delete: jest.fn().mockResolvedValue({ success: true }),
            getSignedUrl: jest.fn().mockResolvedValue('https://example.com/signed-url'),
        };
    },

    // Mock Redis
    mockRedis: () => {
        return {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
            exists: jest.fn().mockResolvedValue(0),
            expire: jest.fn().mockResolvedValue(1),
        };
    }
};

// Performance helpers
export const performanceHelpers = {
    // Measure execution time
    measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
        const start = Date.now();
        const result = await fn();
        const duration = Date.now() - start;
        return { result, duration };
    },

    // Wait for condition
    waitFor: (condition: () => boolean, timeout = 5000, interval = 100): Promise<void> => {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (condition()) {
                    resolve();
                } else if (Date.now() - start > timeout) {
                    reject(new Error(`Condition not met within ${timeout}ms`));
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    }
};

// Cleanup helpers
export const cleanupHelpers = {
    // Reset all mocks
    resetMocks: () => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    },

    // Clear test cache
    clearCache: () => {
        if (global.testCache) {
            global.testCache.clear();
        }
    },

    // Clean up test data
    cleanup: async () => {
        await dbHelpers.clearCollections();
        cleanupHelpers.clearCache();
        cleanupHelpers.resetMocks();
    }
};

// Export all helpers
export default {
    dbHelpers,
    authHelpers,
    requestHelpers,
    dataHelpers,
    testData,
    mockHelpers,
    performanceHelpers,
    cleanupHelpers
};




