import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import UserModel from '../../../../src/models/user.model';
import TaskModel from '../../../../src/models/task.model';
import ProjectModel from '../../../../src/models/project.model';
import WorkspaceModel from '../../../../src/models/workspace.model';
import { HTTPSTATUS } from '../../../../src/config/http.config';
import { withCORS } from '../../_lib/cors';

export const dynamic = 'force-dynamic';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const user = await getDbUserFromRequest(req);

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized',
        error: 'User not authenticated'
      }), {
        status: HTTPSTATUS.UNAUTHORIZED,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!(user as any).isAdmin) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Forbidden',
        error: 'Admin access required'
      }), {
        status: HTTPSTATUS.FORBIDDEN,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get real-time analytics
    const [
      userGrowth,
      taskAnalytics,
      projectAnalytics,
      workspaceAnalytics,
      systemHealth
    ] = await Promise.all([
      getUserGrowthAnalytics(now, oneDayAgo, oneWeekAgo, oneMonthAgo),
      getTaskAnalytics(now, oneDayAgo, oneWeekAgo),
      getProjectAnalytics(now, oneDayAgo, oneWeekAgo),
      getWorkspaceAnalytics(now, oneDayAgo, oneWeekAgo),
      getSystemHealthAnalytics()
    ]);

    const responseTime = Date.now() - startTime;

    const response = {
      success: true,
      message: 'Real-time analytics retrieved successfully',
      data: {
        userGrowth,
        taskAnalytics,
        projectAnalytics,
        workspaceAnalytics,
        systemHealth,
        metadata: {
          generatedAt: now.toISOString(),
          responseTime: `${responseTime}ms`,
          timeRanges: {
            day: oneDayAgo.toISOString(),
            week: oneWeekAgo.toISOString(),
            month: oneMonthAgo.toISOString()
          }
        }
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (e: any) {
    console.error('[admin/analytics] Error:', e);

    const errorResponse = {
      success: false,
      message: 'Failed to retrieve analytics',
      error: e?.message || 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function getUserGrowthAnalytics(now: Date, oneDayAgo: Date, oneWeekAgo: Date, oneMonthAgo: Date) {
  try {
    const [totalUsers, newUsersToday, newUsersWeek, newUsersMonth, verifiedUsers, unverifiedUsers] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      UserModel.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      UserModel.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
      UserModel.countDocuments({ emailVerified: { $ne: null } }),
      UserModel.countDocuments({ emailVerified: null })
    ]);

    // Calculate growth rates
    const growthRate = totalUsers > 0 ? ((newUsersMonth / totalUsers) * 100) : 0;
    const verificationRate = totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100) : 0;

    return {
      total: totalUsers,
      growth: {
        today: newUsersToday,
        thisWeek: newUsersWeek,
        thisMonth: newUsersMonth,
        rate: Math.round(growthRate * 100) / 100
      },
      verification: {
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        rate: Math.round(verificationRate * 100) / 100
      },
      trends: {
        dailyGrowth: newUsersToday,
        weeklyGrowth: newUsersWeek,
        monthlyGrowth: newUsersMonth
      }
    };
  } catch (error) {
    console.error('Error getting user growth analytics:', error);
    return { error: 'Failed to get user analytics' };
  }
}

async function getTaskAnalytics(now: Date, oneDayAgo: Date, oneWeekAgo: Date) {
  try {
    const [totalTasks, tasksToday, tasksWeek, statusBreakdown, priorityBreakdown] = await Promise.all([
      TaskModel.countDocuments(),
      TaskModel.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      TaskModel.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      TaskModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      TaskModel.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    const statusMap = statusBreakdown.reduce((acc: any, item: any) => {
      acc[item._id || 'unknown'] = item.count;
      return acc;
    }, {});

    const priorityMap = priorityBreakdown.reduce((acc: any, item: any) => {
      acc[item._id || 'none'] = item.count;
      return acc;
    }, {});

    const completed = statusMap['DONE'] || 0;
    const completionRate = totalTasks > 0 ? ((completed / totalTasks) * 100) : 0;

    return {
      total: totalTasks,
      activity: {
        today: tasksToday,
        thisWeek: tasksWeek
      },
      status: statusMap,
      priority: priorityMap,
      completion: {
        completed,
        rate: Math.round(completionRate * 100) / 100
      }
    };
  } catch (error) {
    console.error('Error getting task analytics:', error);
    return { error: 'Failed to get task analytics' };
  }
}

async function getProjectAnalytics(now: Date, oneDayAgo: Date, oneWeekAgo: Date) {
  try {
    const [totalProjects, newProjectsToday, newProjectsWeek, activeProjects, archivedProjects] = await Promise.all([
      ProjectModel.countDocuments(),
      ProjectModel.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      ProjectModel.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      ProjectModel.countDocuments({ archived: { $ne: true } }),
      ProjectModel.countDocuments({ archived: true })
    ]);

    const activeRate = totalProjects > 0 ? ((activeProjects / totalProjects) * 100) : 0;

    return {
      total: totalProjects,
      growth: {
        today: newProjectsToday,
        thisWeek: newProjectsWeek
      },
      status: {
        active: activeProjects,
        archived: archivedProjects,
        activeRate: Math.round(activeRate * 100) / 100
      }
    };
  } catch (error) {
    console.error('Error getting project analytics:', error);
    return { error: 'Failed to get project analytics' };
  }
}

async function getWorkspaceAnalytics(now: Date, oneDayAgo: Date, oneWeekAgo: Date) {
  try {
    const [totalWorkspaces, newWorkspacesToday, newWorkspacesWeek, activeWorkspaces] = await Promise.all([
      WorkspaceModel.countDocuments(),
      WorkspaceModel.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      WorkspaceModel.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      WorkspaceModel.countDocuments({ active: { $ne: false } })
    ]);

    const activeRate = totalWorkspaces > 0 ? ((activeWorkspaces / totalWorkspaces) * 100) : 0;

    return {
      total: totalWorkspaces,
      growth: {
        today: newWorkspacesToday,
        thisWeek: newWorkspacesWeek
      },
      status: {
        active: activeWorkspaces,
        activeRate: Math.round(activeRate * 100) / 100
      }
    };
  } catch (error) {
    console.error('Error getting workspace analytics:', error);
    return { error: 'Failed to get workspace analytics' };
  }
}

async function getSystemHealthAnalytics() {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      system: {
        uptime: Math.floor(uptime / 3600), // hours
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024) // MB
        },
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      performance: {
        timestamp: new Date().toISOString(),
        memoryUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      }
    };
  } catch (error) {
    console.error('Error getting system health analytics:', error);
    return { error: 'Failed to get system health analytics' };
  }
}
