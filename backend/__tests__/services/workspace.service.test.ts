import mongoose from 'mongoose';
import {
    createWorkspaceService,
    getAllWorkspacesUserIsMemberService,
    getWorkspaceByIdService,
    getWorkspaceMembersService,
    getWorkspaceAnalyticsService,
    changeMemberRoleService,
    updateWorkspaceByIdService,
    deleteWorkspaceService
} from '../../src/services/workspace.service';
import UserModel from '../../src/models/user.model';
import WorkspaceModel from '../../src/models/workspace.model';
import MemberModel from '../../src/models/member.model';
import RoleModel from '../../src/models/roles-permission.model';
import TaskModel from '../../src/models/task.model';
import ProjectModel from '../../src/models/project.model';
import InsightsNoteModel from '../../src/models/insights-note.model';
import { Roles } from '../../src/enums/role.enum';
import { TaskStatusEnum } from '../../src/enums/task.enum';
import { BadRequestException, NotFoundException } from '../../src/utils/appError';
import { dbHelpers, authHelpers, dataHelpers, cleanupHelpers } from '../utils/test-helpers';

// Mock the default project service
jest.mock('../../src/services/default-project.service', () => ({
    createDefaultProjectForWorkspace: jest.fn().mockResolvedValue(undefined)
}));

// Mock the cache
jest.mock('../../src/utils/lru-cache', () => ({
    globalCache: {
        get: jest.fn(),
        set: jest.fn()
    }
}));

describe('Workspace Service', () => {
    let testUser: any;
    let ownerRole: any;
    let memberRole: any;

    beforeAll(async () => {
        await dbHelpers.connect();
    });

    afterAll(async () => {
        await dbHelpers.disconnect();
    });

    beforeEach(async () => {
        await dbHelpers.clearCollections();
        cleanupHelpers.resetMocks();

        // Create test user
        const userData = await authHelpers.createTestUser({
            email: 'user@example.com',
            name: 'Test User'
        });
        testUser = new UserModel(userData);
        await testUser.save();

        // Create roles
        ownerRole = new RoleModel({
            name: Roles.OWNER,
            permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
        });
        await ownerRole.save();

        memberRole = new RoleModel({
            name: Roles.MEMBER,
            permissions: ['READ', 'WRITE']
        });
        await memberRole.save();
    });

    describe('createWorkspaceService', () => {
        it('should create workspace with owner membership', async () => {
            const workspaceData = {
                name: 'Test Workspace',
                description: 'Test workspace description'
            };

            const result = await createWorkspaceService(testUser._id.toString(), workspaceData);

            expect(result.workspace).toBeDefined();
            expect(result.workspace.name).toBe('Test Workspace');
            expect(result.workspace.description).toBe('Test workspace description');
            expect(result.workspace.owner.toString()).toBe(testUser._id.toString());

            // Check that member was created
            const member = await MemberModel.findOne({
                userId: testUser._id,
                workspaceId: result.workspace._id
            });
            expect(member).toBeDefined();
            expect(member?.role.toString()).toBe(ownerRole._id.toString());

            // Check that user's currentWorkspace was updated
            const updatedUser = await UserModel.findById(testUser._id);
            expect(updatedUser?.currentWorkspace?.toString()).toBe(result.workspace._id.toString());
        });

        it('should create workspace without description', async () => {
            const workspaceData = {
                name: 'Test Workspace'
            };

            const result = await createWorkspaceService(testUser._id.toString(), workspaceData);

            expect(result.workspace).toBeDefined();
            expect(result.workspace.name).toBe('Test Workspace');
            expect(result.workspace.description).toBeUndefined();
        });

        it('should throw NotFoundException for non-existent user', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();
            const workspaceData = {
                name: 'Test Workspace'
            };

            await expect(createWorkspaceService(nonExistentId, workspaceData)).rejects.toThrow(NotFoundException);
            await expect(createWorkspaceService(nonExistentId, workspaceData)).rejects.toThrow('User not found');
        });

        it('should throw NotFoundException when owner role not found', async () => {
            // Delete the owner role
            await RoleModel.deleteOne({ name: Roles.OWNER });

            const workspaceData = {
                name: 'Test Workspace'
            };

            await expect(createWorkspaceService(testUser._id.toString(), workspaceData)).rejects.toThrow(NotFoundException);
            await expect(createWorkspaceService(testUser._id.toString(), workspaceData)).rejects.toThrow('Owner role not found');
        });

        it('should handle default project creation failure gracefully', async () => {
            // Mock the default project service to throw an error
            const { createDefaultProjectForWorkspace } = require('../../src/services/default-project.service');
            createDefaultProjectForWorkspace.mockRejectedValueOnce(new Error('Project creation failed'));

            const workspaceData = {
                name: 'Test Workspace'
            };

            // Should not throw error even if default project creation fails
            const result = await createWorkspaceService(testUser._id.toString(), workspaceData);
            expect(result.workspace).toBeDefined();
        });
    });

    describe('getAllWorkspacesUserIsMemberService', () => {
        it('should return workspaces user is member of', async () => {
            // Create workspaces
            const workspace1 = new WorkspaceModel({
                name: 'Workspace 1',
                description: 'First workspace',
                owner: testUser._id
            });
            await workspace1.save();

            const workspace2 = new WorkspaceModel({
                name: 'Workspace 2',
                description: 'Second workspace',
                owner: testUser._id
            });
            await workspace2.save();

            // Create memberships
            const member1 = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace1._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member1.save();

            const member2 = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace2._id,
                role: memberRole._id,
                joinedAt: new Date()
            });
            await member2.save();

            const result = await getAllWorkspacesUserIsMemberService(testUser._id.toString());

            expect(result.workspaces).toHaveLength(2);
            expect(result.workspaces[0].name).toBe('Workspace 2'); // Newest first
            expect(result.workspaces[1].name).toBe('Workspace 1');
        });

        it('should return empty array for user with no memberships', async () => {
            const result = await getAllWorkspacesUserIsMemberService(testUser._id.toString());
            expect(result.workspaces).toHaveLength(0);
        });

        it('should filter out null workspaces', async () => {
            // Create membership with non-existent workspace
            const member = new MemberModel({
                userId: testUser._id,
                workspaceId: dataHelpers.randomObjectId(),
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member.save();

            const result = await getAllWorkspacesUserIsMemberService(testUser._id.toString());
            expect(result.workspaces).toHaveLength(0);
        });
    });

    describe('getWorkspaceByIdService', () => {
        it('should return workspace with members', async () => {
            // Create workspace
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                description: 'Test description',
                owner: testUser._id
            });
            await workspace.save();

            // Create member
            const member = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member.save();

            const result = await getWorkspaceByIdService(workspace._id.toString());

            expect(result.workspace).toBeDefined();
            expect(result.workspace).not.toBeNull();
            expect((result.workspace as any)!.name).toBe('Test Workspace');
            expect((result.workspace as any)!.members).toHaveLength(1);
            expect((result.workspace as any)!.members[0].role.name).toBe(Roles.OWNER);
        });

        it('should throw NotFoundException for non-existent workspace', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();

            await expect(getWorkspaceByIdService(nonExistentId)).rejects.toThrow(NotFoundException);
            await expect(getWorkspaceByIdService(nonExistentId)).rejects.toThrow('Workspace not found');
        });
    });

    describe('getWorkspaceMembersService', () => {
        it('should return workspace members with roles', async () => {
            // Create workspace
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            // Create member
            const member = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member.save();

            const result = await getWorkspaceMembersService(workspace._id.toString());

            expect(result.members).toHaveLength(1);
            expect(result.members[0].userId.name).toBe('Test User');
            expect(result.members[0].role.name).toBe(Roles.OWNER);
            expect(result.roles).toHaveLength(2); // owner and member roles
        });

        it('should filter out members with null userId', async () => {
            // Create workspace
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            // Create member with null userId
            const member = new MemberModel({
                userId: null,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member.save();

            const result = await getWorkspaceMembersService(workspace._id.toString());
            expect(result.members).toHaveLength(0);
        });
    });

    describe('getWorkspaceAnalyticsService', () => {
        it('should return workspace analytics', async () => {
            // Create workspace
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            // Create tasks
            const task1 = new TaskModel({
                title: 'Task 1',
                description: 'Description 1',
                status: TaskStatusEnum.TODO,
                workspace: workspace._id,
                project: dataHelpers.randomObjectId(),
                assignee: testUser._id
            });
            await task1.save();

            const task2 = new TaskModel({
                title: 'Task 2',
                description: 'Description 2',
                status: TaskStatusEnum.DONE,
                workspace: workspace._id,
                project: dataHelpers.randomObjectId(),
                assignee: testUser._id
            });
            await task2.save();

            const task3 = new TaskModel({
                title: 'Task 3',
                description: 'Description 3',
                status: TaskStatusEnum.IN_PROGRESS,
                workspace: workspace._id,
                project: dataHelpers.randomObjectId(),
                assignee: testUser._id,
                dueDate: new Date(Date.now() - 86400000) // Yesterday (overdue)
            });
            await task3.save();

            const result = await getWorkspaceAnalyticsService(workspace._id.toString());

            expect(result.analytics).toBeDefined();
            expect(result.analytics.totalTasks).toBe(3);
            expect(result.analytics.completedTasks).toBe(1);
            expect(result.analytics.overdueTasks).toBe(1);
        });

        it('should return cached analytics when available', async () => {
            const { globalCache } = require('../../src/utils/lru-cache');
            const cachedAnalytics = { totalTasks: 5, completedTasks: 3, overdueTasks: 1 };
            globalCache.get.mockReturnValue(cachedAnalytics);

            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            const result = await getWorkspaceAnalyticsService(workspace._id.toString());

            expect(result.analytics).toEqual(cachedAnalytics);
            expect(globalCache.get).toHaveBeenCalledWith(`ws-analytics:${workspace._id}`);
        });
    });

    describe('changeMemberRoleService', () => {
        it('should change member role', async () => {
            // Create workspace
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            // Create member
            const member = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member.save();

            const result = await changeMemberRoleService(
                workspace._id.toString(),
                testUser._id.toString(),
                memberRole._id.toString()
            );

            expect(result.member.role.toString()).toBe(memberRole._id.toString());
        });

        it('should throw NotFoundException for non-existent workspace', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();

            await expect(changeMemberRoleService(
                nonExistentId,
                testUser._id.toString(),
                memberRole._id.toString()
            )).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException for non-existent role', async () => {
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            const nonExistentRoleId = dataHelpers.randomObjectId().toString();

            await expect(changeMemberRoleService(
                workspace._id.toString(),
                testUser._id.toString(),
                nonExistentRoleId
            )).rejects.toThrow(NotFoundException);
        });

        it('should throw error for member not found in workspace', async () => {
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            await expect(changeMemberRoleService(
                workspace._id.toString(),
                testUser._id.toString(),
                memberRole._id.toString()
            )).rejects.toThrow('Member not found in the workspace');
        });
    });

    describe('updateWorkspaceByIdService', () => {
        it('should update workspace name and description', async () => {
            const workspace = new WorkspaceModel({
                name: 'Original Name',
                description: 'Original Description',
                owner: testUser._id
            });
            await workspace.save();

            const result = await updateWorkspaceByIdService(
                workspace._id.toString(),
                'Updated Name',
                'Updated Description'
            );

            expect(result.workspace.name).toBe('Updated Name');
            expect(result.workspace.description).toBe('Updated Description');
        });

        it('should update only name when description not provided', async () => {
            const workspace = new WorkspaceModel({
                name: 'Original Name',
                description: 'Original Description',
                owner: testUser._id
            });
            await workspace.save();

            const result = await updateWorkspaceByIdService(
                workspace._id.toString(),
                'Updated Name'
            );

            expect(result.workspace.name).toBe('Updated Name');
            expect(result.workspace.description).toBe('Original Description');
        });

        it('should throw NotFoundException for non-existent workspace', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();

            await expect(updateWorkspaceByIdService(
                nonExistentId,
                'New Name'
            )).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteWorkspaceService', () => {
        it('should delete workspace and all related data', async () => {
            // Create workspace
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            // Set user's currentWorkspace
            testUser.currentWorkspace = workspace._id;
            await testUser.save();

            // Create related data
            const project = new ProjectModel({
                name: 'Test Project',
                workspace: workspace._id,
                owner: testUser._id
            });
            await project.save();

            const task = new TaskModel({
                title: 'Test Task',
                workspace: workspace._id,
                project: project._id,
                assignee: testUser._id
            });
            await task.save();

            const insight = new InsightsNoteModel({
                title: 'Test Insight',
                content: 'Test content',
                workspace: workspace._id,
                author: testUser._id
            });
            await insight.save();

            const member = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member.save();

            const result = await deleteWorkspaceService(
                workspace._id.toString(),
                testUser._id.toString()
            );

            expect(result.currentWorkspace).toBeNull();

            // Verify workspace was deleted
            const deletedWorkspace = await WorkspaceModel.findById(workspace._id);
            expect(deletedWorkspace).toBeNull();

            // Verify related data was deleted
            const deletedProject = await ProjectModel.findById(project._id);
            expect(deletedProject).toBeNull();

            const deletedTask = await TaskModel.findById(task._id);
            expect(deletedTask).toBeNull();

            const deletedInsight = await InsightsNoteModel.findById(insight._id);
            expect(deletedInsight).toBeNull();

            const deletedMember = await MemberModel.findById(member._id);
            expect(deletedMember).toBeNull();
        });

        it('should throw NotFoundException for non-existent workspace', async () => {
            const nonExistentId = dataHelpers.randomObjectId().toString();

            await expect(deleteWorkspaceService(
                nonExistentId,
                testUser._id.toString()
            )).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when user is not owner', async () => {
            // Create another user
            const otherUserData = await authHelpers.createTestUser({
                email: 'other@example.com',
                name: 'Other User'
            });
            const otherUser = new UserModel(otherUserData);
            await otherUser.save();

            // Create workspace owned by testUser
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            await expect(deleteWorkspaceService(
                workspace._id.toString(),
                otherUser._id.toString()
            )).rejects.toThrow(BadRequestException);
            await expect(deleteWorkspaceService(
                workspace._id.toString(),
                otherUser._id.toString()
            )).rejects.toThrow('You are not authorized to delete this workspace');
        });

        it('should update user currentWorkspace to another workspace if available', async () => {
            // Create two workspaces
            const workspace1 = new WorkspaceModel({
                name: 'Workspace 1',
                owner: testUser._id
            });
            await workspace1.save();

            const workspace2 = new WorkspaceModel({
                name: 'Workspace 2',
                owner: testUser._id
            });
            await workspace2.save();

            // Set user's currentWorkspace to workspace1
            testUser.currentWorkspace = workspace1._id;
            await testUser.save();

            // Create memberships for both workspaces
            const member1 = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace1._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member1.save();

            const member2 = new MemberModel({
                userId: testUser._id,
                workspaceId: workspace2._id,
                role: ownerRole._id,
                joinedAt: new Date()
            });
            await member2.save();

            const result = await deleteWorkspaceService(
                workspace1._id.toString(),
                testUser._id.toString()
            );

            // Should update to workspace2
            expect(result.currentWorkspace?.toString()).toBe(workspace2._id.toString());
        });

        it('should handle transaction rollback on error', async () => {
            const workspace = new WorkspaceModel({
                name: 'Test Workspace',
                owner: testUser._id
            });
            await workspace.save();

            // Mock UserModel.save to throw an error
            const originalSave = UserModel.prototype.save;
            UserModel.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

            await expect(deleteWorkspaceService(
                workspace._id.toString(),
                testUser._id.toString()
            )).rejects.toThrow('Database error');

            // Verify workspace still exists (transaction was rolled back)
            const workspaceStillExists = await WorkspaceModel.findById(workspace._id);
            expect(workspaceStillExists).toBeDefined();

            // Restore original method
            UserModel.prototype.save = originalSave;
        });
    });
});
