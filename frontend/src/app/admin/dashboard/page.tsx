"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, AlertTriangle, Cpu, Database, Gauge, Activity, Server, Zap, BarChart3,
  Users, Calendar, Clock, TrendingUp, TrendingDown, Shield, Globe, Settings,
  ChevronRight, ExternalLink, Download, Filter, Search, Bell
} from 'lucide-react';
import API from '@/lib/axios-client';
import { checkAdminStatus } from '@/lib/admin-utils';
import { Button } from '../../../components/ui/button';

interface MetricsResponse {
  message: string;
  metrics?: any;
  data?: {
    metrics: any;
    metadata?: any;
  };
}

const StatCard = ({
  title,
  value,
  sub,
  icon: Icon,
  highlight,
  trend,
  onClick
}: {
  title: string;
  value: React.ReactNode;
  sub?: string;
  icon?: any;
  highlight?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}) => (
  <div
    className={`rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-900/80 backdrop-blur p-6 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col gap-3 ${highlight ? 'ring-2 ring-emerald-400/60 border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-zinc-700'
      } ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        {Icon && <Icon className="h-5 w-5" />}
        {title}
      </div>
      {trend && (
        <div className={`p-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
          trend === 'down' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
          {trend === 'up' && <TrendingUp className="h-3 w-3" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3" />}
        </div>
      )}
    </div>
    <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      {value}
    </div>
    {sub && <div className="text-sm text-gray-500 dark:text-gray-400">{sub}</div>}
  </div>
);

const Section = ({
  title,
  children,
  actions,
  description
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  description?: string;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {actions}
    </div>
    <div className="grid gap-6">{children}</div>
  </div>
);

const AlertBadge = ({ status }: { status: 'INFO' | 'WARN' | 'CRIT' }) => {
  const colors = {
    INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    WARN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    CRIT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs, setIntervalMs] = useState(5000);
  const [usersPreview, setUsersPreview] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin status on component mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setAdminCheckLoading(true);
        const result = await checkAdminStatus();

        if (!result.isAdmin) {
          // Return JSON response and redirect
          const response = {
            success: false,
            error: 'Unauthorized',
            message: 'Admin access required',
            redirect: true
          };

          // You can also log this to console for debugging

          // Redirect to workspace or sign-in
          router.push('/workspace');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/workspace');
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const fetchSystemHealth = async () => {
    try {
      const res = await API.get('/health');
      setSystemHealth(res.data);
    } catch (e) {
      console.error('Health check failed:', e);
    }
  };

  const fetchUsersPreview = async () => {
    try {
      setUsersLoading(true);
      const res = await API.get('/users', { params: { page: 1, limit: 5, sort: 'createdAt', dir: 'desc' } });
      setUsersPreview(res.data.users || []);
    } catch (e) {
      console.error('Failed to fetch users preview:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/admin/dashboard');
      setData(res.data.data || res.data);
    } catch (e: any) {
      console.error('Admin dashboard error:', e);
      setError(e?.response?.data?.message || e.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const exportMetrics = async () => {
    try {
      const res = await API.get('/admin/dashboard');
      const data = res.data.data || res.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin-metrics-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchUsersPreview();
    fetchSystemHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchMetrics();
      fetchSystemHealth();
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs]);

  const metrics = data?.metrics;
  const core = metrics?.core;
  const performance = metrics?.performance;
  const ai = metrics?.ai;
  const alerts = metrics?.alerts || [];
  const system = metrics?.system;

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'degraded': return 'text-yellow-600 dark:text-yellow-400';
      case 'unhealthy': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Show loading state while checking admin status
  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // If not admin, don't render anything (redirect will happen)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <main className="p-6 md:p-8 xs:px-3 mx-auto max-w-[1600px] space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-200">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real-time system monitoring, performance analytics & AI usage insights
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-md">
              <div className={`w-3 h-3 rounded-full ${systemHealth?.status === 'healthy' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">System {systemHealth?.status || 'Unknown'}</span>
            </div>

            <select
              value={selectedTimeRange}
              onChange={e => setSelectedTimeRange(e.target.value)}
              className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>

            <Button
              onClick={exportMetrics}
              variant='info'
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-md">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-refresh</label>
              <select
                value={intervalMs}
                onChange={e => setIntervalMs(parseInt(e.target.value))}
                className="text-xs rounded border-0 bg-transparent focus:ring-0"
              >
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            </div>

            {metrics && (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-md">
                Last updated: {new Date(metrics.generatedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-800 dark:text-red-200">Error loading dashboard</span>
            </div>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-yellow-600 animate-pulse flex-shrink-0" />
              <h3 className="font-bold text-yellow-800 dark:text-yellow-200 text-sm sm:text-base">Active Alerts ({alerts.length})</h3>
            </div>
            <div className="grid gap-3">
              {alerts.map((alert: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AlertBadge status={alert.status} />
                    <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{alert.id}</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-sm order-3 sm:order-2">{alert.message}</span>
                  <span className="text-xs text-gray-500 order-2 sm:order-3">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-8">
          {/* Core Metrics */}
          <Section
            title="System Overview"
            description="Core business metrics and system statistics"
          >
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard
                title="Total Tasks"
                value={core?.tasks.total ?? '—'}
                sub={`${core?.tasks.completed ?? 0} completed`}
                icon={Activity}
                trend={core?.tasks.total > 100 ? 'up' : 'neutral'}
              />
              <StatCard
                title="Completion Rate"
                value={`${core ? core.tasks.completionRate.toFixed(1) : '—'}%`}
                sub={core ? `${core.tasks.completed}/${core.tasks.total} tasks` : ''}
                icon={Gauge}
                trend={core?.tasks.completionRate > 70 ? 'up' : core?.tasks.completionRate < 50 ? 'down' : 'neutral'}
                highlight={core?.tasks.completionRate > 80}
              />
              <StatCard
                title="Active Users"
                value={core?.users.total ?? '—'}
                sub={`${core?.users.verified ?? 0} verified`}
                icon={Users}
                trend="up"
              />
              <StatCard
                title="Projects"
                value={core?.projects.total ?? '—'}
                sub={`${core?.projects.active ?? 0} active`}
                icon={BarChart3}
              />
              <StatCard
                title="Workspaces"
                value={core?.workspaces.total ?? '—'}
                sub={`${core?.workspaces.active ?? 0} active`}
                icon={Globe}
              />
            </div>
          </Section>

          {/* Performance Metrics */}
          <Section
            title="Performance Analytics"
            description="Database performance and system resource utilization"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Database Queries"
                value={performance?.totals.queries ?? '—'}
                sub={`${performance?.totals.avgMs?.toFixed(1) ?? '—'}ms avg`}
                icon={Database}
              />
              <StatCard
                title="Slow Queries"
                value={performance?.totals.slow ?? '—'}
                sub={performance?.totals.queries ? `${((performance.totals.slow / performance.totals.queries) * 100).toFixed(1)}% of total` : ''}
                icon={AlertTriangle}
                highlight={performance?.totals.slow > 0}
                trend={performance?.totals.slow > 5 ? 'down' : 'neutral'}
              />
              <StatCard
                title="Memory Usage"
                value={system?.memory ? `${Math.round(system.memory.heapUsed / 1024 / 1024)}MB` : '—'}
                sub={system?.memory ? `${Math.round((system.memory.heapUsed / system.memory.heapTotal) * 100)}% used` : ''}
                icon={Cpu}
                trend={system?.memory && (system.memory.heapUsed / system.memory.heapTotal) > 0.8 ? 'down' : 'neutral'}
              />
              <StatCard
                title="System Uptime"
                value={system?.uptime ? `${Math.floor(system.uptime / 3600)}h` : '—'}
                sub={system?.uptime ? `${Math.floor((system.uptime % 3600) / 60)}m uptime` : ''}
                icon={Server}
                trend="up"
              />
            </div>
          </Section>

          {/* AI Usage Analytics */}
          <Section
            title="AI Usage Analytics"
            description="OpenRouter API usage statistics and performance metrics"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="AI Provider"
                value={ai?.provider ?? 'Not configured'}
                sub={ai?.configured ? 'Active' : 'Inactive'}
                icon={Zap}
                highlight={ai?.configured}
              />
              <StatCard
                title="Total API Calls"
                value={ai?.total ?? 0}
                sub={`${ai?.success ?? 0} successful`}
                icon={Activity}
                trend={ai?.total > 0 ? 'up' : 'neutral'}
              />
              <StatCard
                title="Success Rate"
                value={`${ai?.successRate?.toFixed(1) ?? '—'}%`}
                sub={`${ai?.fallback ?? 0} fallbacks, ${ai?.timeouts ?? 0} timeouts`}
                icon={Gauge}
                highlight={ai?.successRate > 90}
                trend={ai?.successRate > 90 ? 'up' : ai?.successRate < 70 ? 'down' : 'neutral'}
              />
              <StatCard
                title="Average Latency"
                value={ai?.latency ? `${Math.round(ai.latency.avg)}ms` : '—'}
                sub={ai?.latency ? `P95: ${Math.round(ai.latency.p95)}ms` : ''}
                icon={Clock}
                trend={ai?.latency?.avg < 2000 ? 'up' : 'down'}
              />
            </div>
          </Section>

          {/* Recent Activity */}
          <div className="grid gap-8 lg:grid-cols-2">
            <Section
              title="Recent Users"
              description="Latest user registrations and activity"
              actions={
                <a
                  href="/admin/users"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View All Users
                  <ExternalLink className="h-4 w-4" />
                </a>
              }
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Email</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Role</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {usersLoading && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Loading users...
                            </div>
                          </td>
                        </tr>
                      )}
                      {!usersLoading && usersPreview.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-gray-900 dark:text-white truncate max-w-[200px]" title={user.email}>
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {user.name || <span className="text-gray-400 italic">No name</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${user.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${user.isAdmin
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                      {!usersLoading && usersPreview.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Section>

            <Section
              title="System Errors"
              description="Recent application errors and issues"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-h-96 overflow-auto">
                {metrics?.errors?.recent?.length ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {metrics.errors.recent.slice(0, 10).map((error: any, i: number) => (
                      <div key={i} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {error.route}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {error.msg}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(error.ts).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Shield className="h-12 w-12 mx-auto text-green-400 mb-3" />
                    <p className="text-sm font-medium">No recent errors</p>
                    <p className="text-xs text-gray-400 mt-1">System running smoothly</p>
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* Detailed Performance Section */}
          {performance?.slowQueries?.length > 0 && (
            <Section
              title="Slow Query Analysis"
              description="Database queries exceeding performance thresholds"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Performance Alert: {performance.slowQueries.length} slow queries detected
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {performance.slowQueries.map((query: any, i: number) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {query.collection}.{query.operation}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Duration</span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {query.duration}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}
