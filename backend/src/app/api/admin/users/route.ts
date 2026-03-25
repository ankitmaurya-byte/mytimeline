import { NextRequest, NextResponse } from 'next/server';
import { AdminUserManagementService } from '../../../../services/admin-user-management.service';
import { authenticateToken } from '../../../../middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, targetUserId, workspaceId, reason, roleId } = await request.json();

    // Validate required fields
    if (!action || !targetUserId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'dismiss':
        result = await AdminUserManagementService.dismissUserFromWorkspace(
          authResult.userId,
          targetUserId,
          workspaceId,
          reason
        );
        break;

      case 'remove':
        result = await AdminUserManagementService.removeUserFromWorkspace(
          authResult.userId,
          targetUserId,
          workspaceId,
          reason
        );
        break;

      case 'reinstate':
        if (!roleId) {
          return NextResponse.json(
            { error: 'Role ID is required for reinstatement' },
            { status: 400 }
          );
        }
        result = await AdminUserManagementService.reinstateUser(
          authResult.userId,
          targetUserId,
          workspaceId,
          roleId
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be dismiss, remove, or reinstate' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Admin user management error:', error);

    // Handle specific error types
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for this action' },
        { status: 403 }
      );
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('Cannot dismiss') || error.message?.includes('Cannot remove')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await authenticateToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type'); // 'dismissed' or 'logs'

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    if (type === 'dismissed') {
      const dismissedUsers = await AdminUserManagementService.getDismissedUsers(workspaceId);
      return NextResponse.json({
        success: true,
        dismissedUsers
      });
    } else if (type === 'logs') {
      const logs = await AdminUserManagementService.getUserActionLogs(workspaceId);
      return NextResponse.json({
        success: true,
        logs
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be dismissed or logs' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Get admin user data error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

