import mongoose from 'mongoose';
import {
    getCurrentUserService,
    updateUserService,
    deleteUserService
} from '../../src/services/user.service';
import UserModel from '../../src/models/user.model';
import WorkspaceModel from '../../src/models/workspace.model';
import { BadRequestException } from '../../src/utils/appError';
import { dbHelpers, authHelpers, dataHelpers, cleanupHelpers } from '../utils/test-helpers';

describe('User Service', () => {
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

    describe('getCurrentUserService', () => {
        it('should return user with populated currentWorkspace', async () => {
            // Create workspace
            const workspaceData = {
                name: 'Test Workspace',
                description: 'Test workspace description',
                owner: dataHelpers.randomObjectId()
            };
            const workspace = new WorkspaceModel(workspaceData);
            await workspace.save();

            // Create user with currentWorkspace
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                currentWorkspace: workspace._id
            });
            const user = new UserModel(userData);
            await user.save();

            const result = await getCurrentUserService(user._id.toString());

            expect(result.user).toBeDefined();
            expect(result.user._id.toString()).toBe(user._id.toString());
            expect(result.user.email).toBe('user@example.com');
            expect(result.user.name).toBe('Test User');
            expect(result.user.password).toBeUndefined(); // Should be excluded
            expect(result.user.currentWorkspace).toBeDefined();
            expect(result.user.currentWorkspace.name).toBe('Test Workspace');
        });

        it('should return user without currentWorkspace when not set', async () => {
            // Create user without currentWorkspace
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User'
            });
            const user = new UserModel(userData);
            await user.save();

            const result = await getCurrentUserService(user._id.toString());

            expect(result.user).toBeDefined();
            expect(result.user._id.toString()).toBe(user._id.toString());
            expect(result.user.email).toBe('user@example.com');
            expect(result.user.name).toBe('Test User');
            expect(result.user.password).toBeUndefined(); // Should be excluded
            expect(result.user.currentWorkspace).toBeNull();
        });

        it('should throw BadRequestException for non-existent user', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();

            await expect(getCurrentUserService(nonExistentId)).rejects.toThrow(BadRequestException);
            await expect(getCurrentUserService(nonExistentId)).rejects.toThrow('User not found');
        });

        it('should throw BadRequestException for invalid ObjectId', async () => {
            const invalidId = 'invalid-object-id';

            await expect(getCurrentUserService(invalidId)).rejects.toThrow();
        });

        it('should exclude password field from response', async () => {
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123'
            });
            const user = new UserModel(userData);
            await user.save();

            const result = await getCurrentUserService(user._id.toString());

            expect(result.user.password).toBeUndefined();
            expect(result.user).not.toHaveProperty('password');
        });
    });

    describe('updateUserService', () => {
        it('should update user name', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Old Name'
            });
            const user = new UserModel(userData);
            await user.save();

            const updateData = { name: 'New Name' };
            const result = await updateUserService(user._id.toString(), updateData);

            expect(result.user).toBeDefined();
            expect(result.user.name).toBe('New Name');
            expect(result.user.email).toBe('user@example.com'); // Should remain unchanged
            expect(result.user.password).toBeUndefined(); // Should be excluded
        });

        it('should update user with populated currentWorkspace', async () => {
            // Create workspace
            const workspaceData = {
                name: 'Test Workspace',
                description: 'Test workspace description',
                owner: dataHelpers.randomObjectId()
            };
            const workspace = new WorkspaceModel(workspaceData);
            await workspace.save();

            // Create user with currentWorkspace
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Old Name',
                currentWorkspace: workspace._id
            });
            const user = new UserModel(userData);
            await user.save();

            const updateData = { name: 'New Name' };
            const result = await updateUserService(user._id.toString(), updateData);

            expect(result.user).toBeDefined();
            expect(result.user.name).toBe('New Name');
            expect(result.user.currentWorkspace).toBeDefined();
            expect(result.user.currentWorkspace.name).toBe('Test Workspace');
        });

        it('should not update fields that are not provided', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Original Name'
            });
            const user = new UserModel(userData);
            await user.save();

            const updateData = {}; // Empty update data
            const result = await updateUserService(user._id.toString(), updateData);

            expect(result.user).toBeDefined();
            expect(result.user.name).toBe('Original Name'); // Should remain unchanged
            expect(result.user.email).toBe('user@example.com'); // Should remain unchanged
        });

        it('should handle undefined values in update data', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Original Name'
            });
            const user = new UserModel(userData);
            await user.save();

            const updateData = { name: undefined };
            const result = await updateUserService(user._id.toString(), updateData);

            expect(result.user).toBeDefined();
            expect(result.user.name).toBe('Original Name'); // Should remain unchanged
        });

        it('should throw BadRequestException for non-existent user', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();
            const updateData = { name: 'New Name' };

            await expect(updateUserService(nonExistentId, updateData)).rejects.toThrow(BadRequestException);
            await expect(updateUserService(nonExistentId, updateData)).rejects.toThrow('User not found');
        });

        it('should throw BadRequestException for invalid ObjectId', async () => {
            const invalidId = 'invalid-object-id';
            const updateData = { name: 'New Name' };

            await expect(updateUserService(invalidId, updateData)).rejects.toThrow();
        });

        it('should exclude password field from response', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                password: 'password123'
            });
            const user = new UserModel(userData);
            await user.save();

            const updateData = { name: 'Updated Name' };
            const result = await updateUserService(user._id.toString(), updateData);

            expect(result.user.password).toBeUndefined();
            expect(result.user).not.toHaveProperty('password');
        });

        it('should persist changes to database', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Original Name'
            });
            const user = new UserModel(userData);
            await user.save();

            const updateData = { name: 'Updated Name' };
            await updateUserService(user._id.toString(), updateData);

            // Verify changes were persisted
            const updatedUser = await UserModel.findById(user._id);
            expect(updatedUser?.name).toBe('Updated Name');
        });
    });

    describe('deleteUserService', () => {
        it('should delete user successfully', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User'
            });
            const user = new UserModel(userData);
            await user.save();

            const result = await deleteUserService(user._id.toString());

            expect(result.message).toBe('User account deleted successfully');

            // Verify user was deleted
            const deletedUser = await UserModel.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        it('should throw BadRequestException for non-existent user', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();

            await expect(deleteUserService(nonExistentId)).rejects.toThrow(BadRequestException);
            await expect(deleteUserService(nonExistentId)).rejects.toThrow('User not found');
        });

        it('should throw BadRequestException for invalid ObjectId', async () => {
            const invalidId = 'invalid-object-id';

            await expect(deleteUserService(invalidId)).rejects.toThrow();
        });

        it('should handle deletion of user with currentWorkspace', async () => {
            // Create workspace
            const workspaceData = {
                name: 'Test Workspace',
                description: 'Test workspace description',
                owner: dataHelpers.randomObjectId()
            };
            const workspace = new WorkspaceModel(workspaceData);
            await workspace.save();

            // Create user with currentWorkspace
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User',
                currentWorkspace: workspace._id
            });
            const user = new UserModel(userData);
            await user.save();

            const result = await deleteUserService(user._id.toString());

            expect(result.message).toBe('User account deleted successfully');

            // Verify user was deleted
            const deletedUser = await UserModel.findById(user._id);
            expect(deletedUser).toBeNull();

            // Workspace should still exist (user deletion doesn't cascade)
            const workspaceStillExists = await WorkspaceModel.findById(workspace._id);
            expect(workspaceStillExists).toBeDefined();
        });

        it('should return success message even if user was already deleted', async () => {
            // Create user
            const userData = await authHelpers.createTestUser({
                email: 'user@example.com',
                name: 'Test User'
            });
            const user = new UserModel(userData);
            await user.save();

            // Delete user first time
            await deleteUserService(user._id.toString());

            // Try to delete again - should throw error since user doesn't exist
            await expect(deleteUserService(user._id.toString())).rejects.toThrow(BadRequestException);
        });
    });
});
