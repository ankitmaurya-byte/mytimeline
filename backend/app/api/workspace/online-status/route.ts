import { NextRequest, NextResponse } from 'next/server';
import { onlineStatusService } from '../../../../src/services/onlineStatus.service';
import { logger } from '../../../../src/api-lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ message: 'Workspace ID is required' }, { status: 400 });
    }

    // Get online count for workspace
    const onlineCount = onlineStatusService.getWorkspaceOnlineCount(workspaceId);
    
    // Get all online users (for debugging, can be removed in production)
    const allOnlineUsers = onlineStatusService.getAllOnlineUsers();

    logger.info(`Online status requested for workspace ${workspaceId}: ${onlineCount} users online`);

    return NextResponse.json({
      workspaceId,
      onlineCount,
      totalOnlineUsers: allOnlineUsers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching online status');
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
