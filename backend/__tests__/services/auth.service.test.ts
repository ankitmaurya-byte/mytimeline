import mongoose from 'mongoose';
import {
    loginOrCreateAccountService,
    registerUserService,
    verifyUserService
} from '../../src/services/auth.service';
import UserModel from '../../src/models/user.model';
import AccountModel from '../../src/models/account.model';
import MemberModel from '../../src/models/member.model';
import { ProviderEnum } from '../../src/enums/account-provider.enum';
import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException
} from '../../src/utils/appError';
import { dbHelpers, authHelpers, dataHelpers, cleanupHelpers } from '../utils/test-helpers';

// Mock the default project service
jest.mock('../../src/services/default-project.service', () => ({
    createDefaultProjectForWorkspace: jest.fn()
}));

describe('Auth Service', () => {
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

    describe('loginOrCreateAccountService', () => {
        it('should create new user and account for OAuth login', async () => {
            const oauthData = {
                provider: 'google',
                displayName: 'John Doe',
                providerId: 'google123',
                email: 'john@example.com',
                picture: 'https://example.com/avatar.jpg'
            };

            const result = await loginOrCreateAccountService(oauthData);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('john@example.com');
            expect(result.user.name).toBe('John Doe');
            expect(result.user.profilePicture).toBe('https://example.com/avatar.jpg');
            expect(result.user.emailVerified).toBeDefined();

            // Check that account was created
            const account = await AccountModel.findOne({
                provider: 'google',
                providerId: 'google123'
            });
            expect(account).toBeDefined();
            expect(account?.userId.toString()).toBe(result.user._id.toString());
        });

        it('should create new user without profile picture', async () => {
            const oauthData = {
                provider: 'github',
                displayName: 'Jane Smith',
                providerId: 'github456',
                email: 'jane@example.com'
            };

            const result = await loginOrCreateAccountService(oauthData);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('jane@example.com');
            expect(result.user.name).toBe('Jane Smith');
            expect(result.user.profilePicture).toBeNull();
        });

        it('should update existing user profile information', async () => {
            // Create existing user
            const existingUser = await authHelpers.createTestUser({
                email: 'existing@example.com',
                name: 'Old Name',
                profilePicture: 'https://old-avatar.com/avatar.jpg'
            });
            const user = new UserModel(existingUser);
            await user.save();

            const oauthData = {
                provider: 'google',
                displayName: 'New Name',
                providerId: 'google789',
                email: 'existing@example.com',
                picture: 'https://new-avatar.com/avatar.jpg'
            };

            const result = await loginOrCreateAccountService(oauthData);

            expect(result.user.name).toBe('New Name');
            expect(result.user.profilePicture).toBe('https://new-avatar.com/avatar.jpg');
        });

        it('should not update profile picture if unchanged', async () => {
            const existingPicture = 'https://example.com/avatar.jpg';
            const existingUser = await authHelpers.createTestUser({
                email: 'existing@example.com',
                name: 'John Doe',
                profilePicture: existingPicture
            });
            const user = new UserModel(existingUser);
            await user.save();

            const oauthData = {
                provider: 'google',
                displayName: 'John Doe',
                providerId: 'google123',
                email: 'existing@example.com',
                picture: existingPicture
            };

            const result = await loginOrCreateAccountService(oauthData);

            expect(result.user.profilePicture).toBe(existingPicture);
        });

        it('should verify email for OAuth users', async () => {
            const oauthData = {
                provider: 'google',
                displayName: 'John Doe',
                providerId: 'google123',
                email: 'john@example.com'
            };

            const result = await loginOrCreateAccountService(oauthData);

            expect(result.user.emailVerified).toBeDefined();
            expect(result.user.emailVerificationToken).toBeNull();
            expect(result.user.emailVerificationTokenExpires).toBeNull();
        });

        it('should link additional OAuth provider to existing user', async () => {
            // Create user with email account
            const existingUser = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'John Doe'
            });
            const user = new UserModel(existingUser);
            await user.save();

            // Create email account
            const emailAccount = new AccountModel({
                userId: user._id,
                provider: ProviderEnum.EMAIL,
                providerId: 'user@example.com'
            });
            await emailAccount.save();

            // Login with Google OAuth
            const oauthData = {
                provider: 'google',
                displayName: 'John Doe',
                providerId: 'google123',
                email: 'user@example.com'
            };

            const result = await loginOrCreateAccountService(oauthData);

            expect(result.user._id.toString()).toBe(user._id.toString());

            // Check that Google account was created
            const googleAccount = await AccountModel.findOne({
                provider: 'google',
                providerId: 'google123'
            });
            expect(googleAccount).toBeDefined();
            expect(googleAccount?.userId.toString()).toBe(user._id.toString());
        });

        it('should set currentWorkspace from existing membership', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'John Doe'
            });
            const user = new UserModel(userData);
            await user.save();

            // Create workspace and membership
            const workspaceId = dataHelpers.randomObjectId();
            const member = new MemberModel({
                userId: user._id,
                workspaceId: workspaceId,
                role: 'MEMBER'
            });
            await member.save();

            const oauthData = {
                provider: 'google',
                displayName: 'John Doe',
                providerId: 'google123',
                email: 'user@example.com'
            };

            const result = await loginOrCreateAccountService(oauthData);

            expect(result.user.currentWorkspace?.toString()).toBe(workspaceId.toString());
        });

        it('should handle transaction rollback on error', async () => {
            // Mock UserModel.save to throw an error
            const originalSave = UserModel.prototype.save;
            UserModel.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

            const oauthData = {
                provider: 'google',
                displayName: 'John Doe',
                providerId: 'google123',
                email: 'john@example.com'
            };

            await expect(loginOrCreateAccountService(oauthData)).rejects.toThrow('Database error');

            // Verify no user was created
            const user = await UserModel.findOne({ email: 'john@example.com' });
            expect(user).toBeNull();

            // Restore original method
            UserModel.prototype.save = originalSave;
        });
    });

    describe('registerUserService', () => {
        it('should register new user with email and password', async () => {
            const userData = {
                email: 'newuser@example.com',
                name: 'New User',
                password: 'password123'
            };

            const result = await registerUserService(userData);

            expect(result.userId).toBeDefined();
            expect(result.emailVerificationToken).toBeDefined();
            expect(result.emailVerificationToken).toHaveLength(64); // 32 bytes = 64 hex chars

            // Verify user was created
            const user = await UserModel.findById(result.userId);
            expect(user).toBeDefined();
            expect(user?.email).toBe('newuser@example.com');
            expect(user?.name).toBe('New User');
            expect(user?.emailVerified).toBeNull();
            expect(user?.emailVerificationToken).toBe(result.emailVerificationToken);
            expect(user?.emailVerificationTokenExpires).toBeDefined();

            // Verify account was created
            const account = await AccountModel.findOne({
                provider: ProviderEnum.EMAIL,
                providerId: 'newuser@example.com'
            });
            expect(account).toBeDefined();
            expect(account?.userId.toString()).toBe(result.userId.toString());
        });

        it('should throw error if email already exists', async () => {
            // Create existing user
            const existingUser = await authHelpers.createTestUser({
                email: 'existing@example.com',
                name: 'Existing User'
            });
            const user = new UserModel(existingUser);
            await user.save();

            const userData = {
                email: 'existing@example.com',
                name: 'New User',
                password: 'password123'
            };

            await expect(registerUserService(userData)).rejects.toThrow(BadRequestException);
            await expect(registerUserService(userData)).rejects.toThrow('Email already exists');
        });

        it('should set email verification token expiration', async () => {
            const userData = {
                email: 'newuser@example.com',
                name: 'New User',
                password: 'password123'
            };

            const result = await registerUserService(userData);
            const user = await UserModel.findById(result.userId);

            expect(user?.emailVerificationTokenExpires).toBeDefined();

            const expirationTime = user?.emailVerificationTokenExpires?.getTime() || 0;
            const expectedExpiration = Date.now() + (15 * 60 * 1000); // 15 minutes
            const timeDifference = Math.abs(expirationTime - expectedExpiration);

            // Allow 5 second tolerance
            expect(timeDifference).toBeLessThan(5000);
        });

        it('should handle transaction rollback on error', async () => {
            // Mock AccountModel.save to throw an error
            const originalSave = AccountModel.prototype.save;
            AccountModel.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

            const userData = {
                email: 'newuser@example.com',
                name: 'New User',
                password: 'password123'
            };

            await expect(registerUserService(userData)).rejects.toThrow('Database error');

            // Verify no user was created
            const user = await UserModel.findOne({ email: 'newuser@example.com' });
            expect(user).toBeNull();

            // Restore original method
            AccountModel.prototype.save = originalSave;
        });
    });

    describe('verifyUserService', () => {
        it('should verify user with correct email and password', async () => {
            // Create user with hashed password
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123'
            });
            const user = new UserModel(userData);
            await user.save();

            // Create account
            const account = new AccountModel({
                userId: user._id,
                provider: ProviderEnum.EMAIL,
                providerId: 'user@example.com'
            });
            await account.save();

            const result = await verifyUserService({
                email: 'user@example.com',
                password: 'password123'
            });

            expect(result).toBeDefined();
            expect(result._id.toString()).toBe(user._id.toString());
            expect(result.email).toBe('user@example.com');
            expect(result.name).toBe('Test User');
            // Password should be omitted
            expect(result.password).toBeUndefined();
        });

        it('should throw NotFoundException for non-existent email', async () => {
            await expect(verifyUserService({
                email: 'nonexistent@example.com',
                password: 'password123'
            })).rejects.toThrow(NotFoundException);
            await expect(verifyUserService({
                email: 'nonexistent@example.com',
                password: 'password123'
            })).rejects.toThrow('Invalid email or password');
        });

        it('should throw UnauthorizedException for incorrect password', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'correctpassword'
            });
            const user = new UserModel(userData);
            await user.save();

            // Create account
            const account = new AccountModel({
                userId: user._id,
                provider: ProviderEnum.EMAIL,
                providerId: 'user@example.com'
            });
            await account.save();

            await expect(verifyUserService({
                email: 'user@example.com',
                password: 'wrongpassword'
            })).rejects.toThrow(UnauthorizedException);
            await expect(verifyUserService({
                email: 'user@example.com',
                password: 'wrongpassword'
            })).rejects.toThrow('Invalid email or password');
        });

        it('should throw NotFoundException when user not found for account', async () => {
            // Create account without user
            const account = new AccountModel({
                userId: dataHelpers.randomObjectId(),
                provider: ProviderEnum.EMAIL,
                providerId: 'orphan@example.com'
            });
            await account.save();

            await expect(verifyUserService({
                email: 'orphan@example.com',
                password: 'password123'
            })).rejects.toThrow(NotFoundException);
            await expect(verifyUserService({
                email: 'orphan@example.com',
                password: 'password123'
            })).rejects.toThrow('User not found for the given account');
        });

        it('should work with custom provider', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123'
            });
            const user = new UserModel(userData);
            await user.save();

            // Create account with custom provider
            const account = new AccountModel({
                userId: user._id,
                provider: 'custom',
                providerId: 'user@example.com'
            });
            await account.save();

            const result = await verifyUserService({
                email: 'user@example.com',
                password: 'password123',
                provider: 'custom'
            });

            expect(result).toBeDefined();
            expect(result._id.toString()).toBe(user._id.toString());
        });

        it('should use default EMAIL provider when not specified', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123'
            });
            const user = new UserModel(userData);
            await user.save();

            // Create account with EMAIL provider
            const account = new AccountModel({
                userId: user._id,
                provider: ProviderEnum.EMAIL,
                providerId: 'user@example.com'
            });
            await account.save();

            const result = await verifyUserService({
                email: 'user@example.com',
                password: 'password123'
                // provider not specified, should default to EMAIL
            });

            expect(result).toBeDefined();
            expect(result._id.toString()).toBe(user._id.toString());
        });
    });
});
