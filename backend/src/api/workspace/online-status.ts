import { NextRequest, NextResponse } from 'next/server';
import { getDbUserFromRequest } from '../../../app/api/_lib/auth';
import { onlineStatusService } from '../../services/onlineStatus.service';
import { logger } from '../../../app/api/_lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getDbUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');

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