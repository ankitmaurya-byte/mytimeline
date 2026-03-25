import mongoose from 'mongoose';
import UserModel from '../models/user.model';
import WorkspaceModel from '../models/workspace.model';
import MemberModel from '../models/member.model';
import RoleModel from '../models/roles-permission.model';
import { Roles } from '../enums/role.enum';
import { NotFoundException, BadRequestException, UnauthorizedException } from '../utils/appError';

export interface UserActionLog {
  action: 'dismissed' | 'removed' | 'reinstated';
  targetUserId: string;
  targetUserName: string;
  adminUserId: string;
  adminUserName: string;
  workspaceId: string;
  workspaceName: string;
  reason?: string;
  timestamp: Date;
}

export interface DismissedUser {
  userId: string;
  userName: string;
  userEmail: string;
  dismissedAt: Date;
  dismissedBy: string;
  dismissedByUserName: string;
  reason?: string;
  canBeReinstated: boolean;
}

export class AdminUserManagementService {
  /**
   * Dismiss a user from a workspace (temporary removal)
   */
  static async dismissUserFromWorkspace(
    adminUserId: string,
    targetUserId: string,
    workspaceId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    dismissedUser: DismissedUser;
  }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Verify admin permissions
      const adminMember = await MemberModel.findOne({
        userId: adminUserId,
        workspaceId: workspaceId
      }).populate('role').session(session);

      if (!adminMember) {
        throw new NotFoundException('Admin user not found in workspace');
      }

      // Check if admin has sufficient permissions (OWNER or ADMIN)
      if (!adminMember.role ||
        (adminMember.role.name !== Roles.OWNER && adminMember.role.name !== Roles.ADMIN)) {
        throw new UnauthorizedException('Insufficient permissions to dismiss users');
      }

      // Get target user member record
      const targetMember = await MemberModel.findOne({
        userId: targetUserId,
        workspaceId: workspaceId
      }).populate('user').session(session);

      if (!targetMember) {
        throw new NotFoundException('Target user not found in workspace');
      }

      // Prevent dismissing workspace owner
      if (targetMember.role && targetMember.role.name === Roles.OWNER) {
        throw new UnauthorizedException('Cannot dismiss workspace owner');
      }

      // Prevent admin from dismissing themselves
      if (adminUserId === targetUserId) {
        throw new BadRequestException('Cannot dismiss yourself');
      }

      // Get user and workspace details
      const targetUser = await UserModel.findById(targetUserId).session(session);
      const workspace = await WorkspaceModel.findById(workspaceId).session(session);

      if (!targetUser || !workspace) {
        throw new NotFoundException('User or workspace not found');
      }

      // Create dismissed user record
      const dismissedUser: DismissedUser = {
        userId: targetUserId,
        userName: targetUser.name,
        userEmail: targetUser.email,
        dismissedAt: new Date(),
        dismissedBy: adminUserId,
        dismissedByUserName: adminMember.user?.name || 'Unknown Admin',
        reason: reason,
        canBeReinstated: true
      };

      // Store dismissed user in workspace
      if (!workspace.dismissedUsers) {
        workspace.dismissedUsers = [];
      }
      workspace.dismissedUsers.push(dismissedUser);

      // Remove user from active members
      await MemberModel.findByIdAndDelete(targetMember._id).session(session);

      // Update workspace
      await workspace.save({ session });

      // Log the action
      await this.logUserAction({
        action: 'dismissed',
        targetUserId,
        targetUserName: targetUser.name,
        adminUserId,
        adminUserName: adminMember.user?.name || 'Unknown Admin',
        workspaceId,
        workspaceName: workspace.name,
        reason,
        timestamp: new Date()
      });

      await session.commitTransaction();

      return {
        success: true,
        message: `User ${targetUser.name} has been dismissed from the workspace`,
        dismissedUser
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Permanently remove a user from a workspace
   */
  static async removeUserFromWorkspace(
    adminUserId: string,
    targetUserId: string,
    workspaceId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Verify admin permissions
      const adminMember = await MemberModel.findOne({
        userId: adminUserId,
        workspaceId: workspaceId
      }).populate('role').session(session);

      if (!adminMember) {
        throw new NotFoundException('Admin user not found in workspace');
      }

      // Only workspace owners and admins can remove users
      if (!adminMember.role || (adminMember.role.name !== Roles.OWNER && adminMember.role.name !== Roles.ADMIN)) {
        throw new UnauthorizedException('Only workspace owners and admins can remove users');
      }

      // Get target user member record
      const targetMember = await MemberModel.findOne({
        userId: targetUserId,
        workspaceId: workspaceId
      }).populate('role').session(session);

      if (!targetMember) {
        throw new NotFoundException('Target user not found in workspace');
      }

      // Prevent removing workspace owner
      if (targetMember.role && targetMember.role.name === Roles.OWNER) {
        throw new UnauthorizedException('Cannot remove workspace owner');
      }

      // Admins can only remove regular members, not other admins
      if (adminMember.role.name === Roles.ADMIN && targetMember.role && targetMember.role.name === Roles.ADMIN) {
        throw new UnauthorizedException('Admins can only remove regular members');
      }

      // Prevent owner from removing themselves
      if (adminUserId === targetUserId) {
        throw new BadRequestException('Cannot remove yourself from workspace');
      }

      // Get user and workspace details
      const targetUser = await UserModel.findById(targetUserId).session(session);
      const workspace = await WorkspaceModel.findById(workspaceId).session(session);

      if (!targetUser || !workspace) {
        throw new NotFoundException('User or workspace not found');
      }

      // Remove user from active members
      await MemberModel.findByIdAndDelete(targetMember._id).session(session);

      // Remove from dismissed users if they were dismissed
      if (workspace.dismissedUsers) {
        workspace.dismissedUsers = workspace.dismissedUsers.filter(
          du => du.userId !== targetUserId
        );
      }

      // Update workspace
      await workspace.save({ session });

      // Log the action
      await this.logUserAction({
        action: 'removed',
        targetUserId,
        targetUserName: targetUser.name,
        adminUserId,
        adminUserName: adminMember.user?.name || 'Unknown Admin',
        workspaceId,
        workspaceName: workspace.name,
        reason,
        timestamp: new Date()
      });

      await session.commitTransaction();

      return {
        success: true,
        message: `User ${targetUser.name} has been permanently removed from the workspace`
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reinstate a dismissed user
   */
  static async reinstateUser(
    adminUserId: string,
    targetUserId: string,
    workspaceId: string,
    roleId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Verify admin permissions
      const adminMember = await MemberModel.findOne({
        userId: adminUserId,
        workspaceId: workspaceId
      }).populate('role').session(session);

      if (!adminMember) {
        throw new NotFoundException('Admin user not found in workspace');
      }

      // Check if admin has sufficient permissions (OWNER or ADMIN)
      if (!adminMember.role ||
        (adminMember.role.name !== Roles.OWNER && adminMember.role.name !== Roles.ADMIN)) {
        throw new UnauthorizedException('Insufficient permissions to reinstate users');
      }

      // Get workspace and check if user was dismissed
      const workspace = await WorkspaceModel.findById(workspaceId).session(session);
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      const dismissedUser = workspace.dismissedUsers?.find(du => du.userId === targetUserId);
      if (!dismissedUser) {
        throw new NotFoundException('User was not dismissed from this workspace');
      }

      // Verify role exists
      const role = await RoleModel.findById(roleId).session(session);
      if (!role) {
        throw new NotFoundException('Specified role not found');
      }

      // Get user details
      const targetUser = await UserModel.findById(targetUserId).session(session);
      if (!targetUser) {
        throw new NotFoundException('Target user not found');
      }

      // Create new member record
      const newMember = new MemberModel({
        userId: targetUserId,
        workspaceId: workspaceId,
        role: roleId,
        joinedAt: new Date()
      });

      await newMember.save({ session });

      // Remove from dismissed users
      if (workspace.dismissedUsers) {
        workspace.dismissedUsers = workspace.dismissedUsers.filter(
          du => du.userId !== targetUserId
        );
        await workspace.save({ session });
      }

      // Log the action
      await this.logUserAction({
        action: 'reinstated',
        targetUserId,
        targetUserName: targetUser.name,
        adminUserId,
        adminUserName: adminMember.user?.name || 'Unknown Admin',
        workspaceId,
        workspaceName: workspace.name,
        timestamp: new Date()
      });

      await session.commitTransaction();

      return {
        success: true,
        message: `User ${targetUser.name} has been reinstated to the workspace with role: ${role.name}`
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all dismissed users in a workspace
   */
  static async getDismissedUsers(workspaceId: string): Promise<DismissedUser[]> {
    try {
      const workspace = await WorkspaceModel.findById(workspaceId);
      if (!workspace || !workspace.dismissedUsers) {
        return [];
      }

      return workspace.dismissedUsers;
    } catch (error) {
      console.error('Error getting dismissed users:', error);
      return [];
    }
  }

  /**
   * Get user action logs for a workspace
   */
  static async getUserActionLogs(
    workspaceId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserActionLog[]> {
    try {
      // This would typically query a separate logs collection
      // For now, we'll return an empty array as a placeholder
      // You can implement this based on your logging strategy
      return [];
    } catch (error) {
      console.error('Error getting user action logs:', error);
      return [];
    }
  }

  /**
   * Log user actions for audit purposes
   */
  private static async logUserAction(actionLog: UserActionLog): Promise<void> {
    try {
      // This would typically save to a logs collection or external logging service
      // For now, we'll just console.log for development
      console.log('User Action Log:', actionLog);

      // TODO: Implement proper logging to database or external service
      // await LogModel.create(actionLog);
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }
}

