import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/auth/remember-me/route';
import UserModel from '@/src/models/user.model';
import { connectDB } from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/src/models/user.model');
jest.mock('@/src/utils/jwt');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('Remember Me Revoke Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should revoke a specific device by tokenId', async () => {
        // Mock successful authentication
        const mockDecoded = { sub: 'user123' };
        jest.doMock('@/app/api/_lib/auth', () => ({
            verifyAuthToken: jest.fn().mockResolvedValue(mockDecoded)
        }));

        // Mock database operations
        mockConnectDB.mockResolvedValue({} as any);
        mockUserModel.updateOne.mockResolvedValue({ modifiedCount: 1 } as any);

        // Create request with tokenId
        const request = new NextRequest('http://localhost:3000/api/auth/remember-me?tokenId=token123');

        // Mock cookies and headers
        Object.defineProperty(request, 'cookies', {
            value: {
                get: jest.fn().mockReturnValue({ value: 'mock-auth-token' })
            }
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Remember me session removed successfully');

        // Verify the correct database operation was called
        expect(mockUserModel.updateOne).toHaveBeenCalledWith(
            { _id: 'user123' },
            { $pull: { rememberMeSessions: { tokenId: 'token123' } } }
        );
    });

    it('should revoke all devices when action=all', async () => {
        // Mock successful authentication
        const mockDecoded = { sub: 'user123' };
        jest.doMock('@/app/api/_lib/auth', () => ({
            verifyAuthToken: jest.fn().mockResolvedValue(mockDecoded)
        }));

        // Mock database operations
        mockConnectDB.mockResolvedValue({} as any);
        mockUserModel.updateOne.mockResolvedValue({ modifiedCount: 1 } as any);

        // Create request with action=all
        const request = new NextRequest('http://localhost:3000/api/auth/remember-me?action=all');

        // Mock cookies and headers
        Object.defineProperty(request, 'cookies', {
            value: {
                get: jest.fn().mockReturnValue({ value: 'mock-auth-token' })
            }
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('All remember me sessions removed successfully');

        // Verify the correct database operation was called
        expect(mockUserModel.updateOne).toHaveBeenCalledWith(
            { _id: 'user123' },
            { $set: { rememberMeSessions: [] } }
        );
    });

    it('should return error when no tokenId or action provided', async () => {
        // Mock successful authentication
        const mockDecoded = { sub: 'user123' };
        jest.doMock('@/app/api/_lib/auth', () => ({
            verifyAuthToken: jest.fn().mockResolvedValue(mockDecoded)
        }));

        // Mock database operations
        mockConnectDB.mockResolvedValue({} as any);

        // Create request without tokenId or action
        const request = new NextRequest('http://localhost:3000/api/auth/remember-me');

        // Mock cookies and headers
        Object.defineProperty(request, 'cookies', {
            value: {
                get: jest.fn().mockReturnValue({ value: 'mock-auth-token' })
            }
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Either tokenId or action=all is required');
    });

    it('should return error when no sessions found to remove', async () => {
        // Mock successful authentication
        const mockDecoded = { sub: 'user123' };
        jest.doMock('@/app/api/_lib/auth', () => ({
            verifyAuthToken: jest.fn().mockResolvedValue(mockDecoded)
        }));

        // Mock database operations
        mockConnectDB.mockResolvedValue({} as any);
        mockUserModel.updateOne.mockResolvedValue({ modifiedCount: 0 } as any);

        // Create request with tokenId
        const request = new NextRequest('http://localhost:3000/api/auth/remember-me?tokenId=token123');

        // Mock cookies and headers
        Object.defineProperty(request, 'cookies', {
            value: {
                get: jest.fn().mockReturnValue({ value: 'mock-auth-token' })
            }
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.error).toBe('No sessions found to remove');
    });
});
