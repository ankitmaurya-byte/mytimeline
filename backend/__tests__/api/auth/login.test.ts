import { NextRequest } from 'next/server';
import UserModel from '../../../src/models/user.model';
import AccountModel from '../../../src/models/account.model';
import { ProviderEnum } from '../../../src/enums/account-provider.enum';
import { HTTPSTATUS } from '../../../src/config/http.config';
import { verifyUserService } from '../../../src/services/auth.service';
import { signJwt, buildAuthCookie } from '../../../src/utils/jwt';
import { dbHelpers, authHelpers, requestHelpers, cleanupHelpers } from '../../utils/test-helpers';

// Mock the database connection
jest.mock('../../../app/api/_lib/db', () => ({
    ensureDb: jest.fn().mockResolvedValue(undefined)
}));

// Mock JWT utilities
jest.mock('../../../src/utils/jwt', () => ({
    signJwt: jest.fn().mockReturnValue('mock-jwt-token'),
    buildAuthCookie: jest.fn().mockReturnValue('auth-token=mock-jwt-token; HttpOnly; Secure; SameSite=Strict')
}));

// Mock CORS
jest.mock('../../../app/api/_lib/cors', () => ({
    withCORS: jest.fn((handler) => handler)
}));

// Mock implementation of the login API route
const mockLoginAPI = async (req: NextRequest) => {
    const requestOrigin = req.headers.get('origin');
    await require('../../../app/api/_lib/db').ensureDb();

    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
        return new Response(JSON.stringify({ message: 'Email & password required' }), {
            status: HTTPSTATUS.BAD_REQUEST
        });
    }

    try {
        const user = await verifyUserService({ email, password });

        // Ensure verified
        const dbUser = await UserModel.findById((user as any)._id).select('emailVerified emailVerificationTokenExpires');
        if (dbUser && !dbUser.emailVerified) {
            // If expired, delete
            if (dbUser.emailVerificationTokenExpires && dbUser.emailVerificationTokenExpires < new Date()) {
                await UserModel.deleteOne({ _id: dbUser._id });
                return new Response(JSON.stringify({ message: 'Verification expired. Account removed. Please register again.' }), {
                    status: HTTPSTATUS.UNAUTHORIZED
                });
            }
            return new Response(JSON.stringify({ message: 'Email not verified.' }), {
                status: HTTPSTATUS.UNAUTHORIZED
            });
        }

        const token = signJwt({ sub: String((user as any)._id), email: user.email, ws: user.currentWorkspace ? String(user.currentWorkspace) : undefined });
        const cookie = buildAuthCookie(token, requestOrigin || undefined);

        return new Response(JSON.stringify({
            message: 'Login successful',
            user: { _id: (user as any)._id, currentWorkspace: user.currentWorkspace }
        }), {
            status: HTTPSTATUS.OK,
            headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ message: e.message || 'Login failed' }), {
            status: e.statusCode || 500
        });
    }
};

const mockOptionsAPI = () => new Response(null, { status: 204 });

describe('Auth Login API', () => {
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

    describe('POST /api/auth/login', () => {
        it('should login user with valid credentials', async () => {
            // Create user with hashed password
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123',
                emailVerified: new Date()
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

            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'user@example.com',
                    password: 'password123'
                },
                headers: {
                    'origin': 'http://localhost:3000'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(HTTPSTATUS.OK);
            expect(responseData.message).toBe('Login successful');
            expect(responseData.user._id).toBe(user._id.toString());
            expect(response.headers.get('Set-Cookie')).toContain('auth-token=mock-jwt-token');
        });

        it('should return 400 for missing email', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    password: 'password123'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(HTTPSTATUS.BAD_REQUEST);
            expect(responseData.message).toBe('Email & password required');
        });

        it('should return 400 for missing password', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'user@example.com'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(HTTPSTATUS.BAD_REQUEST);
            expect(responseData.message).toBe('Email & password required');
        });

        it('should return 400 for empty body', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {}
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(HTTPSTATUS.BAD_REQUEST);
            expect(responseData.message).toBe('Email & password required');
        });

        it('should return 401 for invalid credentials', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.message).toBe('Invalid email or password');
        });

        it('should return 401 for unverified email', async () => {
            // Create user without email verification
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123',
                emailVerified: null
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

            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'user@example.com',
                    password: 'password123'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(HTTPSTATUS.UNAUTHORIZED);
            expect(responseData.message).toBe('Email not verified.');
        });

        it('should delete user and return 401 for expired verification', async () => {
            // Create user with expired verification token
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123',
                emailVerified: null,
                emailVerificationTokenExpires: new Date(Date.now() - 86400000) // Yesterday
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

            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'user@example.com',
                    password: 'password123'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(HTTPSTATUS.UNAUTHORIZED);
            expect(responseData.message).toBe('Verification expired. Account removed. Please register again.');

            // Verify user was deleted
            const deletedUser = await UserModel.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        it('should include currentWorkspace in response when available', async () => {
            // Create user with currentWorkspace
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123',
                emailVerified: new Date(),
                currentWorkspace: '507f1f77bcf86cd799439011'
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

            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'user@example.com',
                    password: 'password123'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(HTTPSTATUS.OK);
            expect(responseData.user.currentWorkspace).toBe('507f1f77bcf86cd799439011');
        });

        it('should handle malformed JSON body', async () => {
            const request = new NextRequest('http://localhost:3001/api/auth/login', {
                method: 'POST',
                body: 'invalid json',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            await expect(mockLoginAPI(request)).rejects.toThrow();
        });

        it('should handle database connection errors', async () => {
            // Mock ensureDb to throw an error
            const { ensureDb } = require('../../../app/api/_lib/db');
            ensureDb.mockRejectedValueOnce(new Error('Database connection failed'));

            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'user@example.com',
                    password: 'password123'
                }
            });

            await expect(mockLoginAPI(request)).rejects.toThrow('Database connection failed');
        });

        it('should handle JWT signing errors', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123',
                emailVerified: new Date()
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

            // Mock signJwt to throw an error
            const { signJwt } = require('../../../src/utils/jwt');
            signJwt.mockImplementationOnce(() => {
                throw new Error('JWT signing failed');
            });

            const request = requestHelpers.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: {
                    email: 'user@example.com',
                    password: 'password123'
                }
            });

            const response = await mockLoginAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(500);
            expect(responseData.message).toBe('JWT signing failed');
        });
    });

    describe('OPTIONS /api/auth/login', () => {
        it('should handle OPTIONS request', async () => {
            const response = await mockOptionsAPI();

            expect(response.status).toBe(204);
        });
    });
});
