import mongoose from 'mongoose';
import UserModel, { UserDocument, BiometricSession, RememberMeSession } from '../../src/models/user.model';
import { dbHelpers, authHelpers, dataHelpers, cleanupHelpers } from '../utils/test-helpers';

describe('User Model', () => {
    beforeAll(async () => {
        await dbHelpers.connect();
    });

    afterAll(async () => {
        await dbHelpers.disconnect();
    });

    beforeEach(async () => {
        await dbHelpers.clearCollections();
        cleanupHelpers.resetMocks();
    });

    describe('User Creation', () => {
        it('should create user with required fields', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user._id).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(user.name).toBe('Test User');
            expect(user.isActive).toBe(true);
            expect(user.isAdmin).toBe(false);
            expect(user.superAdmin).toBe(false);
            expect(user.profilePicture).toBeNull();
            expect(user.currentWorkspace).toBeNull();
            expect(user.emailVerified).toBeNull();
            expect(user.lastLogin).toBeNull();
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
        });

        it('should create user with all optional fields', async () => {
            const workspaceId = dataHelpers.randomObjectId();
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123',
                profilePicture: 'https://example.com/avatar.jpg',
                currentWorkspace: workspaceId,
                isAdmin: true,
                superAdmin: false,
                emailVerified: new Date(),
                emailVerificationToken: 'token123',
                emailVerificationTokenExpires: new Date(Date.now() + 3600000),
                isActive: true,
                lastLogin: new Date()
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.email).toBe('test@example.com');
            expect(user.name).toBe('Test User');
            expect(user.profilePicture).toBe('https://example.com/avatar.jpg');
            expect(user.currentWorkspace?.toString()).toBe(workspaceId.toString());
            expect(user.isAdmin).toBe(true);
            expect(user.superAdmin).toBe(false);
            expect(user.emailVerified).toBeDefined();
            expect(user.emailVerificationToken).toBe('token123');
            expect(user.emailVerificationTokenExpires).toBeDefined();
            expect(user.isActive).toBe(true);
            expect(user.lastLogin).toBeDefined();
        });

        it('should enforce unique email constraint', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user1 = new UserModel(userData);
            await user1.save();

            const user2 = new UserModel(userData);
            await expect(user2.save()).rejects.toThrow(/duplicate key error/i);
        });

        it('should convert email to lowercase', async () => {
            const userData = {
                email: 'TEST@EXAMPLE.COM',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.email).toBe('test@example.com');
        });

        it('should trim whitespace from name and email', async () => {
            const userData = {
                email: '  test@example.com  ',
                name: '  Test User  '
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.email).toBe('test@example.com');
            expect(user.name).toBe('Test User');
        });
    });

    describe('Password Handling', () => {
        it('should hash password before saving', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123'
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.password).toBeDefined();
            expect(user.password).not.toBe('password123');
            expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
        });

        it('should not rehash password if not modified', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123'
            };

            const user = new UserModel(userData);
            await user.save();

            const originalPassword = user.password;

            // Update non-password field
            user.name = 'Updated Name';
            await user.save();

            expect(user.password).toBe(originalPassword);
        });

        it('should rehash password when modified', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123'
            };

            const user = new UserModel(userData);
            await user.save();

            const originalPassword = user.password;

            // Update password
            user.password = 'newpassword456';
            await user.save();

            expect(user.password).not.toBe(originalPassword);
            expect(user.password).not.toBe('newpassword456');
        });

        it('should handle empty password', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: ''
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.password).toBe('');
        });
    });

    describe('Instance Methods', () => {
        it('should omit password from object', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123'
            };

            const user = new UserModel(userData);
            await user.save();

            const userWithoutPassword = user.omitPassword();

            expect(userWithoutPassword.password).toBeUndefined();
            expect(userWithoutPassword.email).toBe('test@example.com');
            expect(userWithoutPassword.name).toBe('Test User');
            expect(userWithoutPassword._id).toBeDefined();
        });

        it('should compare password correctly', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123'
            };

            const user = new UserModel(userData);
            await user.save();

            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });

        it('should handle password comparison with empty password', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: ''
            };

            const user = new UserModel(userData);
            await user.save();

            const isMatch = await user.comparePassword('');
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('anypassword');
            expect(isNotMatch).toBe(false);
        });
    });

    describe('Biometric Sessions', () => {
        it('should add biometric session', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            const biometricSession: BiometricSession = {
                deviceId: 'device123',
                deviceFingerprint: 'fingerprint123',
                biometricType: 'fingerprint',
                lastUsed: new Date(),
                deviceInfo: 'iPhone 12',
                createdAt: new Date()
            };

            user.biometricSessions = [biometricSession];
            await user.save();

            const savedUser = await UserModel.findById(user._id);
            expect(savedUser?.biometricSessions).toHaveLength(1);
            expect(savedUser?.biometricSessions?.[0].deviceId).toBe('device123');
            expect(savedUser?.biometricSessions?.[0].biometricType).toBe('fingerprint');
        });

        it('should validate biometric session enum values', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            const biometricSession = {
                deviceId: 'device123',
                deviceFingerprint: 'fingerprint123',
                biometricType: 'invalid-type', // Invalid enum value
                lastUsed: new Date(),
                deviceInfo: 'iPhone 12',
                createdAt: new Date()
            };

            user.biometricSessions = [biometricSession as any];
            await expect(user.save()).rejects.toThrow();
        });

        it('should handle multiple biometric sessions', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            const sessions: BiometricSession[] = [
                {
                    deviceId: 'device1',
                    deviceFingerprint: 'fingerprint1',
                    biometricType: 'fingerprint',
                    lastUsed: new Date(),
                    deviceInfo: 'iPhone 12',
                    createdAt: new Date()
                },
                {
                    deviceId: 'device2',
                    deviceFingerprint: 'fingerprint2',
                    biometricType: 'face',
                    lastUsed: new Date(),
                    deviceInfo: 'iPad Pro',
                    createdAt: new Date()
                }
            ];

            user.biometricSessions = sessions;
            await user.save();

            const savedUser = await UserModel.findById(user._id);
            expect(savedUser?.biometricSessions).toHaveLength(2);
        });
    });

    describe('Remember Me Sessions', () => {
        it('should add remember me session', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            const rememberMeSession: RememberMeSession = {
                tokenId: 'token123',
                deviceId: 'device123',
                deviceInfo: 'Chrome Browser',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
                lastUsed: new Date(),
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 86400000) // 24 hours
            };

            user.rememberMeSessions = [rememberMeSession];
            await user.save();

            const savedUser = await UserModel.findById(user._id);
            expect(savedUser?.rememberMeSessions).toHaveLength(1);
            expect(savedUser?.rememberMeSessions?.[0].tokenId).toBe('token123');
            expect(savedUser?.rememberMeSessions?.[0].deviceId).toBe('device123');
        });

        it('should handle multiple remember me sessions', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            const sessions: RememberMeSession[] = [
                {
                    tokenId: 'token1',
                    deviceId: 'device1',
                    deviceInfo: 'Chrome Browser',
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0...',
                    lastUsed: new Date(),
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 86400000)
                },
                {
                    tokenId: 'token2',
                    deviceId: 'device2',
                    deviceInfo: 'Safari Browser',
                    ipAddress: '192.168.1.2',
                    userAgent: 'Mozilla/5.0...',
                    lastUsed: new Date(),
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 86400000)
                }
            ];

            user.rememberMeSessions = sessions;
            await user.save();

            const savedUser = await UserModel.findById(user._id);
            expect(savedUser?.rememberMeSessions).toHaveLength(2);
        });

        it('should require all remember me session fields', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            const incompleteSession = {
                tokenId: 'token123',
                deviceId: 'device123',
                // Missing required fields
                deviceInfo: 'Chrome Browser'
            };

            user.rememberMeSessions = [incompleteSession as any];
            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Timestamps', () => {
        it('should set createdAt and updatedAt automatically', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt when document is modified', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await user.save();

            const originalUpdatedAt = user.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            user.name = 'Updated Name';
            await user.save();

            expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });

    describe('Validation', () => {
        it('should require email field', async () => {
            const userData = {
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await expect(user.save()).rejects.toThrow(/email.*required/i);
        });

        it('should validate email format', async () => {
            const userData = {
                email: 'invalid-email',
                name: 'Test User'
            };

            const user = new UserModel(userData);
            await expect(user.save()).rejects.toThrow(/validation failed/i);
        });

        it('should allow null profilePicture', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                profilePicture: null
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.profilePicture).toBeNull();
        });

        it('should allow empty name', async () => {
            const userData = {
                email: 'test@example.com',
                name: ''
            };

            const user = new UserModel(userData);
            await user.save();

            expect(user.name).toBe('');
        });
    });

    describe('Indexes', () => {
        it('should have indexes for common query patterns', async () => {
            const indexes = await UserModel.collection.getIndexes();

            // Check for common indexes
            const indexNames = Object.keys(indexes);
            expect(indexNames).toContain('email_1'); // Unique email index
            expect(indexNames).toContain('currentWorkspace_1');
            expect(indexNames).toContain('isActive_1');
            expect(indexNames).toContain('isAdmin_1');
        });
    });
});
