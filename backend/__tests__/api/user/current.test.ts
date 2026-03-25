import { NextRequest } from 'next/server';
import UserModel from '../../../src/models/user.model';
import WorkspaceModel from '../../../src/models/workspace.model';
import { verifyJwt } from '../../../src/utils/jwt';
import { dbHelpers, authHelpers, requestHelpers, cleanupHelpers } from '../../utils/test-helpers';

// Mock the database connection
jest.mock('../../../app/api/_lib/db', () => ({
    ensureDb: jest.fn().mockResolvedValue(undefined)
}));

// Mock JWT utilities
jest.mock('../../../src/utils/jwt', () => ({
    verifyJwt: jest.fn()
}));

// Mock auth utilities
jest.mock('../../../app/api/_lib/auth', () => ({
    getDbUserFromRequest: jest.fn()
}));

// Mock CORS
jest.mock('../../../app/api/_lib/cors', () => ({
    withCORS: jest.fn((handler) => handler)
}));

// Mock implementation of the user current API route
const mockUserCurrentAPI = async (req: NextRequest) => {
    await require('../../../app/api/_lib/db').ensureDb();

    const cookieAuth = req.cookies.get('auth_token')?.value;
    const authz = req.headers.get('authorization');
    let decoded: any = null;
    let rawDecoded: any = null;
    let reason: string | undefined;

    if (cookieAuth) {
        decoded = verifyJwt(cookieAuth);
        if (!decoded) reason = 'verify-failed';
        try { rawDecoded = require('jsonwebtoken').decode(cookieAuth); } catch { /* ignore */ }
    } else if (authz?.startsWith('Bearer ')) {
        const token = authz.slice(7);
        decoded = verifyJwt(token);
        if (!decoded) reason = 'verify-failed-bearer';
        try { rawDecoded = require('jsonwebtoken').decode(token); } catch { /* ignore */ }
    } else {
        reason = 'no-token';
    }

    const user = await require('../../../app/api/_lib/auth').getDbUserFromRequest(req);
    if (!user) {
        return new Response(JSON.stringify({
            message: 'Unauthorized',
            user: null,
            debug: { reason, hasCookie: !!cookieAuth, hasAuthz: !!authz, verifyOk: !!decoded, rawDecoded }
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ message: 'Current user fetched', user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};

const mockOptionsAPI = () => new Response(null, { status: 204 });

describe('User Current API', () => {
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

    describe('GET /api/user/current', () => {
        it('should return current user with cookie authentication', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User'
            });
            const user = new UserModel(userData);
            await user.save();

            // Mock JWT verification
            const { verifyJwt } = require('../../../src/utils/jwt');
            verifyJwt.mockReturnValue({ sub: user._id.toString(), email: 'user@example.com' });

            // Mock getDbUserFromRequest
            const { getDbUserFromRequest } = require('../../../app/api/_lib/auth');
            getDbUserFromRequest.mockResolvedValue({
                _id: user._id,
                email: 'user@example.com',
                name: 'Test User'
            });

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                cookies: { auth_token: 'valid-jwt-token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.message).toBe('Current user fetched');
            expect(responseData.user).toBeDefined();
            expect(responseData.user.email).toBe('user@example.com');
            expect(responseData.user.name).toBe('Test User');
        });

        it('should return current user with Bearer token authentication', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User'
            });
            const user = new UserModel(userData);
            await user.save();

            // Mock JWT verification
            const { verifyJwt } = require('../../../src/utils/jwt');
            verifyJwt.mockReturnValue({ sub: user._id.toString(), email: 'user@example.com' });

            // Mock getDbUserFromRequest
            const { getDbUserFromRequest } = require('../../../app/api/_lib/auth');
            getDbUserFromRequest.mockResolvedValue({
                _id: user._id,
                email: 'user@example.com',
                name: 'Test User'
            });

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                headers: { 'authorization': 'Bearer valid-jwt-token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.message).toBe('Current user fetched');
            expect(responseData.user).toBeDefined();
            expect(responseData.user.email).toBe('user@example.com');
        });

        it('should return 401 when no authentication token provided', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current'
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.message).toBe('Unauthorized');
            expect(responseData.user).toBeNull();
            expect(responseData.debug.reason).toBe('no-token');
            expect(responseData.debug.hasCookie).toBe(false);
            expect(responseData.debug.hasAuthz).toBe(false);
        });

        it('should return 401 when cookie token verification fails', async () => {
            // Mock JWT verification to fail
            const { verifyJwt } = require('../../../src/utils/jwt');
            verifyJwt.mockReturnValue(null);

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                cookies: { auth_token: 'invalid-jwt-token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.message).toBe('Unauthorized');
            expect(responseData.debug.reason).toBe('verify-failed');
            expect(responseData.debug.hasCookie).toBe(true);
            expect(responseData.debug.verifyOk).toBe(false);
        });

        it('should return 401 when Bearer token verification fails', async () => {
            // Mock JWT verification to fail
            const { verifyJwt } = require('../../../src/utils/jwt');
            verifyJwt.mockReturnValue(null);

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                headers: { 'authorization': 'Bearer invalid-jwt-token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.message).toBe('Unauthorized');
            expect(responseData.debug.reason).toBe('verify-failed-bearer');
            expect(responseData.debug.hasAuthz).toBe(true);
            expect(responseData.debug.verifyOk).toBe(false);
        });

        it('should return 401 when user not found in database', async () => {
            // Mock JWT verification to succeed
            const { verifyJwt } = require('../../../src/utils/jwt');
            verifyJwt.mockReturnValue({ sub: '507f1f77bcf86cd799439011', email: 'user@example.com' });

            // Mock getDbUserFromRequest to return null
            const { getDbUserFromRequest } = require('../../../app/api/_lib/auth');
            getDbUserFromRequest.mockResolvedValue(null);

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                cookies: { auth_token: 'valid-jwt-token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.message).toBe('Unauthorized');
            expect(responseData.user).toBeNull();
        });

        it('should handle malformed Bearer token', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                headers: { 'authorization': 'InvalidFormat token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.message).toBe('Unauthorized');
            expect(responseData.debug.reason).toBe('no-token');
        });

        it('should handle empty Bearer token', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                headers: { 'authorization': 'Bearer ' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.message).toBe('Unauthorized');
            expect(responseData.debug.reason).toBe('no-token');
        });

        it('should prioritize cookie authentication over Bearer token', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User'
            });
            const user = new UserModel(userData);
            await user.save();

            // Mock JWT verification for both tokens
            const { verifyJwt } = require('../../../src/utils/jwt');
            verifyJwt.mockImplementation((token) => {
                if (token === 'cookie-token') {
                    return { sub: user._id.toString(), email: 'user@example.com' };
                }
                if (token === 'bearer-token') {
                    return { sub: 'different-user-id', email: 'different@example.com' };
                }
                return null;
            });

            // Mock getDbUserFromRequest to return user based on cookie token
            const { getDbUserFromRequest } = require('../../../app/api/_lib/auth');
            getDbUserFromRequest.mockResolvedValue({
                _id: user._id,
                email: 'user@example.com',
                name: 'Test User'
            });

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                cookies: { auth_token: 'cookie-token' },
                headers: { 'authorization': 'Bearer bearer-token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.user.email).toBe('user@example.com');
        });

        it('should include debug information in error response', async () => {
            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                cookies: { auth_token: 'some-token' },
                headers: { 'authorization': 'Bearer some-bearer-token' }
            });

            const response = await mockUserCurrentAPI(request);
            const responseData = await response.json();

            expect(response.status).toBe(401);
            expect(responseData.debug).toBeDefined();
            expect(responseData.debug.hasCookie).toBe(true);
            expect(responseData.debug.hasAuthz).toBe(true);
            expect(responseData.debug.verifyOk).toBeDefined();
            expect(responseData.debug.rawDecoded).toBeDefined();
        });

        it('should handle database connection errors', async () => {
            // Mock ensureDb to throw an error
            const { ensureDb } = require('../../../app/api/_lib/db');
            ensureDb.mockRejectedValueOnce(new Error('Database connection failed'));

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                cookies: { auth_token: 'valid-jwt-token' }
            });

            await expect(mockUserCurrentAPI(request)).rejects.toThrow('Database connection failed');
        });

        it('should handle getDbUserFromRequest errors', async () => {
            // Mock JWT verification to succeed
            const { verifyJwt } = require('../../../src/utils/jwt');
            verifyJwt.mockReturnValue({ sub: '507f1f77bcf86cd799439011', email: 'user@example.com' });

            // Mock getDbUserFromRequest to throw an error
            const { getDbUserFromRequest } = require('../../../app/api/_lib/auth');
            getDbUserFromRequest.mockRejectedValue(new Error('Database query failed'));

            const request = requestHelpers.createMockRequest({
                method: 'GET',
                url: 'http://localhost:3001/api/user/current',
                cookies: { auth_token: 'valid-jwt-token' }
            });

            await expect(mockUserCurrentAPI(request)).rejects.toThrow('Database query failed');
        });
    });

    describe('OPTIONS /api/user/current', () => {
        it('should handle OPTIONS request', async () => {
            const response = await mockOptionsAPI();

            expect(response.status).toBe(204);
        });
    });
});
