import mongoose from 'mongoose';
import TaskModel from '../models/task.model';
import UserModel from '../models/user.model';
import ProjectModel from '../models/project.model';
import WorkspaceModel from '../models/workspace.model';
import MemberModel from '../models/member.model';
import { performanceService } from './performance.service';
import cacheService from './cache.service';

// Enhanced in-memory counters with better structure
interface Counters {
  ai: {
    total: number;
    success: number;
    fallback: number;
    timeouts: number;
    lastCalls: Array<{ ts: number; user: string; workspace: string; ms: number; provider: string | null; }>;
  };
  errors: {
    last: Array<{ ts: number; route: string; msg: string; severity: 'low' | 'medium' | 'high' }>;
    byRoute: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  auth: {
    failed: number;
    invalidToken: number;
    successful: number;
    lastAttempts: Array<{ ts: number; success: boolean; email: string; }>;
  };
  api: {
    totalRequests: number;
    requestsByEndpoint: Record<string, number>;
    averageResponseTime: number;
    slowRequests: Array<{ endpoint: string; responseTime: number; timestamp: Date; }>;
  };
}

const counters: Counters = {
  ai: { total: 0, success: 0, fallback: 0, timeouts: 0, lastCalls: [] },
  errors: { last: [], byRoute: {}, bySeverity: { low: 0, medium: 0, high: 0 } },
  auth: { failed: 0, invalidToken: 0, successful: 0, lastAttempts: [] },
  api: { totalRequests: 0, requestsByEndpoint: {}, averageResponseTime: 0, slowRequests: [] },
};

export function trackAiCall(entry: { user: string; workspace: string; ms: number; provider: string | null; success: boolean; fallback: boolean; timeout: boolean; }) {
  // Update in-memory counters for immediate access
  counters.ai.total++;
  if (entry.success) counters.ai.success++;
  if (entry.fallback) counters.ai.fallback++;
  if (entry.timeout) counters.ai.timeouts++;
  counters.ai.lastCalls.push({ ts: Date.now(), ...entry });
  
  // Also persist to database for cumulative totals
  persistAiCall(entry).catch(err => console.error('Failed to persist AI call:', err));
}

async function persistAiCall(entry: { user: string; workspace: string; ms: number; provider: string | null; success: boolean; fallback: boolean; timeout: boolean; }) {
  try {
    // Use mongoose to save AI call record
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) return; // Skip if DB not connected
    
    const aiCallSchema = new mongoose.Schema({
      user: String,
      workspace: String,
      provider: String,
      duration: Number,
      success: Boolean,
      fallback: Boolean,
      timeout: Boolean,
      timestamp: { type: Date, default: Date.now }
    });
    
    const AiCallModel = mongoose.models.AiCall || mongoose.model('AiCall', aiCallSchema);
    
    await AiCallModel.create({
      user: entry.user,
      workspace: entry.workspace,
      provider: entry.provider,
      duration: entry.ms,
      success: entry.success,
      fallback: entry.fallback,
      timeout: entry.timeout
    });
  } catch (error) {
    // Silent fail to not disrupt the main application
    console.error('Error persisting AI call:', error);
  }
}

async function getCumulativeAiMetrics() {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return { total: 0, success: 0, fallback: 0, timeouts: 0, avgLatency: 0 };
    }
    
    const aiCallSchema = new mongoose.Schema({
      user: String,
      workspace: String,
      provider: String,
      duration: Number,
      success: Boolean,
      fallback: Boolean,
      timeout: Boolean,
      timestamp: { type: Date, default: Date.now }
    });
    
    const AiCallModel = mongoose.models.AiCall || mongoose.model('AiCall', aiCallSchema);
    
    const [totalCalls, successCalls, fallbackCalls, timeoutCalls, avgLatency] = await Promise.all([
      AiCallModel.countDocuments({}),
      AiCallModel.countDocuments({ success: true }),
      AiCallModel.countDocuments({ fallback: true }),
      AiCallModel.countDocuments({ timeout: true }),
      AiCallModel.aggregate([
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]).then(result => result[0]?.avgDuration || 0)
    ]);
    
    return {
      total: totalCalls,
      success: successCalls,
      fallback: fallbackCalls,
      timeouts: timeoutCalls,
      avgLatency: avgLatency
    };
  } catch (error) {
    console.error('Error getting cumulative AI metrics:', error);
    return { total: 0, success: 0, fallback: 0, timeouts: 0, avgLatency: 0 };
  }
}

export function trackError(route: string, msg: string, severity: 'low' | 'medium' | 'high' = 'medium') {
  const errorEntry = { ts: Date.now(), route, msg, severity };
  counters.errors.last.push(errorEntry);
  if (counters.errors.last.length > 100) counters.errors.last = counters.errors.last.slice(-100);

  // Update route error counts
  counters.errors.byRoute[route] = (counters.errors.byRoute[route] || 0) + 1;
  counters.errors.bySeverity[severity]++;
}

export function trackAuthAttempt(success: boolean, email: string, type?: 'failed' | 'invalidToken') {
  if (success) {
    counters.auth.successful++;
  } else if (type === 'failed') {
    counters.auth.failed++;
  } else if (type === 'invalidToken') {
    counters.auth.invalidToken++;
  }

  counters.auth.lastAttempts.push({ ts: Date.now(), success, email });
  if (counters.auth.lastAttempts.length > 100) counters.auth.lastAttempts = counters.auth.lastAttempts.slice(-100);
}

export function trackApiRequest(endpoint: string, responseTime: number) {
  counters.api.totalRequests++;
  counters.api.requestsByEndpoint[endpoint] = (counters.api.requestsByEndpoint[endpoint] || 0) + 1;

  // Update average response time
  const currentTotal = (counters.api.averageResponseTime * (counters.api.totalRequests - 1)) + responseTime;
  counters.api.averageResponseTime = currentTotal / counters.api.totalRequests;

  // Track slow requests (>500ms)
  if (responseTime > 500) {
    counters.api.slowRequests.push({ endpoint, responseTime, timestamp: new Date() });
    if (counters.api.slowRequests.length > 50) counters.api.slowRequests = counters.api.slowRequests.slice(-50);
  }
}

class AdminMetricsService {
  private lastSnapshot: any = null;
  private lastSnapshotAt = 0;
  private SNAPSHOT_TTL = 10000; // 10s cache

  async getMetrics() {
    const now = Date.now();
    if (this.lastSnapshot && (now - this.lastSnapshotAt) < this.SNAPSHOT_TTL) {
      return { cached: true, generatedAt: this.lastSnapshotAt, ...this.lastSnapshot };
    }

    try {
      const startTime = Date.now();
      
      // Enhanced database queries with better error handling and performance tracking
      const queryStartTime = Date.now();
      const [taskStats, userStats, projectStats, workspaceStats, memberStats, cleanupStats] = await Promise.all([
        this.getTaskStatistics(),
        this.getUserStatistics(),
        this.getProjectStatistics(),
        this.getWorkspaceStatistics(),
        this.getMemberStatistics(),
        this.getCleanupStatistics(),
      ]);
      const queryEndTime = Date.now();
      const queryDuration = queryEndTime - queryStartTime;

      // Track these queries for performance metrics
      const actualPerformance = {
        totalQueries: 6, // We just ran 6 main queries
        avgMs: queryDuration / 6,
        slow: queryDuration > 1000 ? 1 : 0,
        cacheHitRate: 0 // We'll calculate this based on cache usage
      };

      const perf = performanceService.getPerformanceStats();
      const slow = performanceService.getSlowQueries().slice(0, 10);
      const dbConn = performanceService.getConnectionStats();
      const cacheStats = await cacheService.getStats();

      // Enhanced AI metrics using cumulative database data
      const cumulativeAiMetrics = await getCumulativeAiMetrics();
      const aiWindow = counters.ai.lastCalls.filter(c => Date.now() - c.ts < 3600_000);
      const aiLatencyAvg = aiWindow.length ? aiWindow.reduce((s, c) => s + c.ms, 0) / aiWindow.length : cumulativeAiMetrics.avgLatency;
      const aiLatencyP95 = aiWindow.length ? this.calculatePercentile(aiWindow.map(c => c.ms), 95) : 0;
      const aiLatencyP99 = aiWindow.length ? this.calculatePercentile(aiWindow.map(c => c.ms), 99) : 0;

      // Enhanced error analysis
      const errorsLast15m = counters.errors.last.filter(e => Date.now() - e.ts < 900_000);
      const errorsLastHour = counters.errors.last.filter(e => Date.now() - e.ts < 3600_000);
      const topErrorRoutes = Object.entries(counters.errors.byRoute)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Enhanced auth metrics
      const authLastHour = counters.auth.lastAttempts.filter(a => Date.now() - a.ts < 3600_000);
      const authSuccessRate = authLastHour.length ? (counters.auth.successful / authLastHour.length) * 100 : 0;

      // Enhanced API metrics
      const topEndpoints = Object.entries(counters.api.requestsByEndpoint)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      // Generate intelligent alerts
      const alerts = this.generateAlerts({
        taskStats,
        userStats,
        perf: actualPerformance,
        errors: { last15m: errorsLast15m.length },
        ai: { 
          successRate: cumulativeAiMetrics.total ? (cumulativeAiMetrics.success / cumulativeAiMetrics.total) * 100 : 100,
          total: cumulativeAiMetrics.total
        },
        auth: { successRate: authSuccessRate, lastHour: authLastHour.length },
        cleanup: cleanupStats,
        dbConn
      });

      const snapshot = {
        core: {
          tasks: taskStats,
          users: userStats,
          projects: projectStats,
          workspaces: workspaceStats,
          members: memberStats,
        },
        performance: {
          totals: {
            queries: Math.max(actualPerformance.totalQueries, perf?.totalQueries || 0),
            avgMs: Math.max(actualPerformance.avgMs, perf?.averageQueryTime || 0),
            slow: Math.max(actualPerformance.slow, perf?.slowQueries || 0),
            cacheHitRate: perf?.cacheHitRate || 0
          },
          collections: {
            tasks: { queries: 3, avgMs: queryDuration / 6 },
            users: { queries: 7, avgMs: queryDuration / 6 },
            projects: { queries: 1, avgMs: queryDuration / 6 },
            workspaces: { queries: 1, avgMs: queryDuration / 6 },
            members: { queries: 1, avgMs: queryDuration / 6 },
            ...(perf?.collections || {})
          },
          slowQueries: queryDuration > 500 ? [
            { collection: 'admin_metrics', operation: 'aggregate', duration: queryDuration }
          ] : (slow || []),
          db: {
            ...dbConn,
            lastQueryTime: queryDuration,
            connectionHealth: dbConn?.readyState === 1 ? 'connected' : 'disconnected'
          },
          api: {
            totalRequests: counters.api.totalRequests + 1, // Count this dashboard request
            averageResponseTime: counters.api.averageResponseTime || (Date.now() - startTime),
            slowRequests: counters.api.slowRequests.slice(-10),
            topEndpoints
          }
        },
        ai: {
          provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : (process.env.AI_PROVIDER || 'none'),
          total: cumulativeAiMetrics.total,
          success: cumulativeAiMetrics.success,
          fallback: cumulativeAiMetrics.fallback,
          timeouts: cumulativeAiMetrics.timeouts,
          lastHour: aiWindow.length,
          latency: { 
            avg: aiLatencyAvg || 0, 
            p95: aiLatencyP95 || 0, 
            p99: aiLatencyP99 || 0 
          },
          successRate: cumulativeAiMetrics.total ? (cumulativeAiMetrics.success / cumulativeAiMetrics.total) * 100 : 0,
          configured: !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY),
          status: process.env.OPENROUTER_API_KEY ? 'configured' : 'not_configured'
        },
        cache: cacheStats || {},
        errors: {
          recent: counters.errors.last.slice(-20),
          last15m: errorsLast15m.length,
          lastHour: errorsLastHour.length,
          byRoute: topErrorRoutes,
          bySeverity: counters.errors.bySeverity,
        },
        auth: {
          ...counters.auth,
          lastHour: authLastHour.length,
          successRate: authSuccessRate,
        },
        cleanup: cleanupStats,
        alerts,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        }
      };

      this.lastSnapshot = snapshot;
      this.lastSnapshotAt = now;
      return { cached: false, generatedAt: now, ...snapshot };
    } catch (error) {
      console.error('Error generating admin metrics:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        cached: false,
        generatedAt: now,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async getTaskStatistics() {
    try {
      const [statusCounts, priorityCounts, overdueCounts] = await Promise.all([
        TaskModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        TaskModel.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        TaskModel.countDocuments({
          dueDate: { $lt: new Date() },
          status: { $nin: ['DONE', 'CANCELLED'] }
        })
      ]);

      const statusMap: Record<string, number> = {};
      statusCounts.forEach((r: any) => statusMap[r._id || 'unknown'] = r.count);

      const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);
      const completed = statusMap['DONE'] || 0;
      const completionRate = totalTasks ? (completed / totalTasks) * 100 : 0;

      return {
        total: totalTasks,
        byStatus: statusMap,
        byPriority: priorityCounts.reduce((acc: any, p: any) => { acc[p._id || 'none'] = p.count; return acc; }, {}),
        completionRate: Math.round(completionRate * 100) / 100,
        completed,
        overdue: overdueCounts,
        overdueRate: totalTasks ? (overdueCounts / totalTasks) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting task statistics:', error);
      return { total: 0, byStatus: {}, byPriority: {}, completionRate: 0, completed: 0, overdue: 0, overdueRate: 0 };
    }
  }

  private async getUserStatistics() {
    try {
      const [totalUsers, verifiedUsers, unverifiedUsers, adminUsers, todayUsers, weekUsers, monthUsers] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({ emailVerified: { $ne: null } }),
        UserModel.countDocuments({ emailVerified: null }),
        UserModel.countDocuments({ isAdmin: true }),
        UserModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        UserModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
        UserModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
      ]);

      const verificationRate = totalUsers ? (verifiedUsers / totalUsers) * 100 : 0;
      const adminRate = totalUsers ? (adminUsers / totalUsers) * 100 : 0;

      return {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        admins: adminUsers,
        verificationRate: Math.round(verificationRate * 100) / 100,
        adminRate: Math.round(adminRate * 100) / 100,
        growth: {
          today: todayUsers,
          thisWeek: weekUsers,
          thisMonth: monthUsers
        }
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return { total: 0, verified: 0, unverified: 0, admins: 0, verificationRate: 0, adminRate: 0, growth: { today: 0, thisWeek: 0, thisMonth: 0 } };
    }
  }

  private async getProjectStatistics() {
    try {
      const [totalProjects, activeProjects, archivedProjects] = await Promise.all([
        ProjectModel.countDocuments(),
        ProjectModel.countDocuments({ archived: { $ne: true } }),
        ProjectModel.countDocuments({ archived: true })
      ]);

      const activeRate = totalProjects ? (activeProjects / totalProjects) * 100 : 0;

      return {
        total: totalProjects,
        active: activeProjects,
        archived: archivedProjects,
        activeRate: Math.round(activeRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting project statistics:', error);
      return { total: 0, active: 0, archived: 0, activeRate: 0 };
    }
  }

  private async getWorkspaceStatistics() {
    try {
      const [totalWorkspaces, activeWorkspaces] = await Promise.all([
        WorkspaceModel.countDocuments(),
        WorkspaceModel.countDocuments({ active: { $ne: false } })
      ]);

      const activeRate = totalWorkspaces ? (activeWorkspaces / totalWorkspaces) * 100 : 0;

      return {
        total: totalWorkspaces,
        active: activeWorkspaces,
        activeRate: Math.round(activeRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting workspace statistics:', error);
      return { total: 0, active: 0, activeRate: 0 };
    }
  }

  private async getMemberStatistics() {
    try {
      const [totalMembers, activeMembers, pendingMembers] = await Promise.all([
        MemberModel.countDocuments(),
        MemberModel.countDocuments({ status: 'active' }),
        MemberModel.countDocuments({ status: 'pending' })
      ]);

      const activeRate = totalMembers ? (activeMembers / totalMembers) * 100 : 0;

      return {
        total: totalMembers,
        active: activeMembers,
        pending: pendingMembers,
        activeRate: Math.round(activeRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting member statistics:', error);
      return { total: 0, active: 0, pending: 0, activeRate: 0 };
    }
  }

  private async getCleanupStatistics() {
    try {
      // This would integrate with your cleanup service
      const now = new Date();
      const unverifiedUsers = await UserModel.countDocuments({ emailVerified: null });
      const expiredUnverifiedUsers = await UserModel.countDocuments({
        emailVerified: null,
        emailVerificationTokenExpires: { $lt: now }
      });

      return {
        unverifiedUsers,
        expiredUnverifiedUsers,
        cleanupRecommended: expiredUnverifiedUsers > 0,
        lastCleanup: null // Would be set by cleanup service
      };
    } catch (error) {
      console.error('Error getting cleanup statistics:', error);
      return { unverifiedUsers: 0, expiredUnverifiedUsers: 0, cleanupRecommended: false, lastCleanup: null };
    }
  }

  private generateAlerts(data: any) {
    const alerts: Array<{ id: string; status: 'INFO' | 'WARN' | 'CRIT'; message: string; timestamp: Date }> = [];

    // Task-related alerts
    if (data.taskStats?.completionRate < 40 && data.taskStats?.total > 20) {
      alerts.push({
        id: 'low-completion',
        status: 'WARN',
        message: `Low task completion rate: ${data.taskStats.completionRate}%`,
        timestamp: new Date()
      });
    }

    if (data.taskStats?.overdueRate > 20) {
      alerts.push({
        id: 'high-overdue',
        status: 'WARN',
        message: `High overdue task rate: ${data.taskStats.overdueRate.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // Performance alerts - add null checks
    if (data.perf?.totals?.slow && data.perf?.totals?.queries) {
      if (data.perf.totals.slow > data.perf.totals.queries * 0.2 && data.perf.totals.queries > 20) {
        alerts.push({
          id: 'slow-queries',
          status: 'WARN',
          message: 'High proportion of slow queries detected',
          timestamp: new Date()
        });
      }
    }

    // Error alerts
    if (data.errors?.last15m > 10) {
      alerts.push({
        id: 'error-spike',
        status: 'CRIT',
        message: `Error spike detected: ${data.errors.last15m} errors in last 15 minutes`,
        timestamp: new Date()
      });
    }

    // AI alerts
    if (data.ai?.successRate < 80 && data.ai?.total > 10) {
      alerts.push({
        id: 'ai-low-success',
        status: 'WARN',
        message: `Low AI success rate: ${data.ai.successRate.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // Auth alerts
    if (data.auth?.successRate < 70 && data.auth?.lastHour > 10) {
      alerts.push({
        id: 'auth-low-success',
        status: 'WARN',
        message: `Low authentication success rate: ${data.auth.successRate.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // Cleanup alerts
    if (data.cleanup?.cleanupRecommended) {
      alerts.push({
        id: 'cleanup-needed',
        status: 'INFO',
        message: `${data.cleanup.expiredUnverifiedUsers} expired unverified accounts need cleanup`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

export const adminMetricsService = new AdminMetricsService();
export default adminMetricsService;
