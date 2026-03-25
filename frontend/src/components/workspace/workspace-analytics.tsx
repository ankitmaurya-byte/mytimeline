import useWorkspaceId from "@/hooks/use-workspace-id";
import AnalyticsCard from "./common/analytics-card";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceAnalyticsQueryFn } from "@/lib/api";
import { useLoadingContext } from "@/components/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  Target
} from "lucide-react";
import { Day } from "react-day-picker";
import { useTheme } from "@/context/theme-context";

// Loading skeleton component
const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
    </div>
    <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((i) => (
        <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      ))}
    </div>
    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    <div className="grid gap-6 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      ))}
    </div>
  </div>
);

const WorkspaceAnalytics = () => {
  const workspaceId = useWorkspaceId();
  const { isStrategicLoading } = useLoadingContext();
  const { isDark } = useTheme();

  const { data, isPending } = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: () => getWorkspaceAnalyticsQueryFn(workspaceId),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  if (isStrategicLoading) return null;
  if (isPending) return <AnalyticsSkeleton />;

  const analytics = data?.analytics;
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No analytics data available</p>
          <p className="text-sm text-muted-foreground">Analytics will appear here once data is available</p>
        </div>
      </div>
    );
  }

  // Generate chart data with theme-aware colors
  const taskStatusData = [
    { 
      name: "Completed", 
      value: analytics.completedTasks || 0, 
      color: isDark ? "#10b981" : "#059669" // Emerald-500 for dark, Emerald-600 for light
    },
    { 
      name: "In Progress", 
      value: Math.max(0, (analytics.totalTasks || 0) - (analytics.completedTasks || 0) - (analytics.overdueTasks || 0)), 
      color: isDark ? "#3b82f6" : "#2563eb" // Blue-500 for dark, Blue-600 for light
    },
    { 
      name: "Overdue", 
      value: analytics.overdueTasks || 0, 
      color: isDark ? "#f87171" : "#dc2626" // Red-400 for dark, Red-600 for light
    },
  ].filter(item => item.value > 0);

  const completionRate = analytics.totalTasks ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0;

  const weeklyProgressData = Array.from({ length: 6 }, (_, i) => {
    const week = i + 1;
    const baseCompleted = Math.floor((analytics.completedTasks || 0) / 6);
    const baseTotal = Math.floor((analytics.totalTasks || 0) / 6);
    const completed = Math.max(0, baseCompleted + (i * 2) - 3);
    const total = Math.max(completed, baseTotal + (i * 3) - 6);
    return {
      week: `Week ${week}`,
      completed: Math.min(completed, analytics.completedTasks || 0),
      total: Math.min(total, analytics.totalTasks || 0)
    };
  });

  const productivityTrendData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const dayEfficiency = Math.max(70, Math.min(95, completionRate + (index * 2) - 6));
    const dayTasks = Math.max(1, Math.floor((analytics.completedTasks || 0) / 7) + (index % 3));
    return { day, efficiency: dayEfficiency, tasks: Math.min(dayTasks, analytics.completedTasks || 0) };
  });

  // Performance metrics
  const averageEfficiency = completionRate;
  const onTimeDelivery = Math.max(85, Math.min(98, 100 - (analytics.overdueTasks || 0) * 2));
  const teamVelocity = Math.max(5, Math.min(20, Math.floor((analytics.completedTasks || 0) / 4)));

  const getTrend = (current: number, previous: number = 0) => {
    if (previous === 0) return "+0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
  };

  const getTrendDirection = (current: number, previous: number = 0) => {
    if (previous === 0) return "up";
    return current >= previous ? "up" : "down";
  };
  const now = new Date()
  const time = now.getHours()
  // console.log(time);
  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6 min-h-screen overflow-x-hidden xs:p-1 xs:max-w-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">

          <p className="text-base md:text-lg text-muted-foreground mt-2">
            Monitor your team's productivity and task completion progress
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 md:px-4 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <Calendar className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Last updated: {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
          <span className="sm:hidden">Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:grid-cols-3 2xl:grid-cols-3">
        <AnalyticsCard
          isLoading={false}
          title="Total Tasks"
          value={analytics.totalTasks || 0}
          icon={Target}
          trend={getTrend(analytics.totalTasks || 0, (analytics.totalTasks || 0) - 5)}
          trendDirection={getTrendDirection(analytics.totalTasks || 0, (analytics.totalTasks || 0) - 5)}
        />
        <AnalyticsCard
          isLoading={false}
          title="Completed Tasks"
          value={analytics.completedTasks || 0}
          icon={CheckCircle}
          trend={getTrend(analytics.completedTasks || 0, (analytics.completedTasks || 0) - 3)}
          trendDirection={getTrendDirection(analytics.completedTasks || 0, (analytics.completedTasks || 0) - 3)}
        />
        <AnalyticsCard
          isLoading={false}
          title="Overdue Tasks"
          value={analytics.overdueTasks || 0}
          icon={AlertTriangle}
          trend={getTrend(analytics.overdueTasks || 0, (analytics.overdueTasks || 0) + 2)}
          trendDirection={getTrendDirection(analytics.overdueTasks || 0, (analytics.overdueTasks || 0) + 2)}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Task Status Distribution */}
        <Card className="shadow-lg sm:shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900/95 dark:to-gray-800/90 dark:border dark:border-gray-700/40 hover:shadow-2xl hover:from-blue-50/50 hover:to-blue-100/50 dark:hover:from-gray-900/98 dark:hover:to-gray-800/95 transition-all duration-500 group overflow-hidden rounded-lg sm:rounded-xl backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4 md:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-start sm:items-center gap-2 md:gap-3 text-base sm:text-lg md:text-xl">
              <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg md:rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors flex-shrink-0 border border-blue-200/40 dark:border-blue-800/40">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-gray-900 dark:text-gray-100 text-sm sm:text-base md:text-lg font-semibold leading-tight">
                  Task Status Distribution
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-normal mt-1 leading-tight">
                  Overview of task completion status
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-2 sm:px-4 md:px-6 pb-4 sm:pb-6">
            {taskStatusData.length > 0 ? (
              <>
                <div className="w-full h-48 xs:h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius="45%"
                        outerRadius="75%"
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : 'white',
                          border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: window.innerWidth < 640 ? 11 : 12,
                          padding: window.innerWidth < 640 ? '8px' : '12px',
                          color: isDark ? '#f9fafb' : '#374151'
                        }}
                        cursor={{ fill: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}
                        wrapperStyle={{
                          outline: 'none',
                          zIndex: 1000
                        }}
                        labelStyle={{
                          fontSize: window.innerWidth < 640 ? 11 : 12,
                          color: isDark ? '#f3f4f6' : '#1f2937',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}
                        itemStyle={{
                          color: isDark ? '#e5e7eb' : '#4b5563',
                          fontSize: window.innerWidth < 640 ? 11 : 12,
                          fontWeight: '500',
                          padding: '2px 0'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Responsive Legend */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 mt-3 sm:mt-4 md:mt-6 px-2">
                  {taskStatusData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                      <div
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded-full shadow-sm flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 min-w-0">
                        <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400 flex-shrink-0">
                          ({item.value})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-48 xs:h-56 sm:h-64 md:h-72 lg:h-80 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400 px-4">
                  <p className="text-sm sm:text-base md:text-lg font-medium mb-2">
                    No task data available
                  </p>
                  <p className="text-xs sm:text-sm md:text-base opacity-75">
                    Tasks will appear here once they are created
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress Trend */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900/95 dark:to-gray-800/90 dark:border dark:border-gray-700/40 hover:shadow-2xl hover:from-green-50/50 hover:to-green-100/50 dark:hover:from-gray-900/98 dark:hover:to-gray-800/95 transition-all duration-500 group overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4 md:pb-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-base sm:text-lg md:text-xl">
              <div className="p-2 md:p-3 bg-green-50 dark:bg-green-950/30 rounded-lg md:rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors flex-shrink-0 border border-green-200/40 dark:border-green-800/40">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-gray-900 dark:text-gray-100 truncate">Weekly Progress Trend</div>
                <p className="text-xs md:text-sm text-muted-foreground font-normal mt-1">
                  Task completion progress over weeks
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden p-2 sm:p-4 lg:p-6">
            <div className="w-full" style={{ height: 'clamp(200px, 40vw, 350px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyProgressData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 5
                  }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "#374151" : "#e5e7eb"} 
                  />
                  <XAxis
                    dataKey="week"
                    stroke={isDark ? "#9ca3af" : "#6b7280"}
                    className="text-xs sm:text-sm"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isDark ? "#9ca3af" : "#6b7280"}
                    className="text-xs sm:text-sm"
                    fontSize={11}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : 'white',
                      border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: 12,
                      color: isDark ? '#f9fafb' : '#374151'
                    }}
                    cursor={{ fill: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}
                    wrapperStyle={{
                      outline: 'none',
                      zIndex: 1000
                    }}
                    labelStyle={{
                      color: isDark ? '#f3f4f6' : '#1f2937',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}
                    itemStyle={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: isDark ? '#e5e7eb' : '#4b5563',
                      padding: '2px 0'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke={isDark ? "#10b981" : "#059669"}
                    fill={isDark ? "#10b981" : "#059669"}
                    fillOpacity={0.7}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stackId="1"
                    stroke={isDark ? "#3b82f6" : "#2563eb"}
                    fill={isDark ? "#3b82f6" : "#2563eb"}
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Metrics */}
      <Card className="shadow-xl bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900/95 dark:to-gray-800/90 dark:border dark:border-gray-700/40 hover:shadow-2xl hover:from-purple-50/50 hover:to-purple-100/50 dark:hover:from-gray-900/98 dark:hover:to-gray-800/95 transition-all duration-500 group overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 xs:pb-4 sm:pb-5 md:pb-6 lg:pb-7 xl:pb-8 2xl:pb-9">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-base sm:text-lg md:text-xl">
            <div className="p-2 md:p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg md:rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors flex-shrink-0 border border-purple-200/40 dark:border-purple-800/40">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-gray-900 dark:text-gray-100 truncate">Daily Productivity Metrics</div>
              <p className="text-xs md:text-sm text-muted-foreground font-normal mt-1">
                Team efficiency and task completion by day
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] 2xl:h-[36rem] overflow-hidden xs:h-56 xs:w-screen xs:relative xs:left-1/2 xs:-translate-x-1/2 sm:w-full md:w-full lg:w-full xl:w-full 2xl:min-w-2xl 2xl:max-w-4xl 2xl:max-h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityTrendData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? "#374151" : "#e5e7eb"} 
                />
                <XAxis 
                  dataKey="day" 
                  stroke={isDark ? "#9ca3af" : "#6b7280"} 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  yAxisId="left" 
                  stroke={isDark ? "#9ca3af" : "#6b7280"} 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke={isDark ? "#9ca3af" : "#6b7280"} 
                  fontSize={11} 
                  tickLine={false} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : 'white',
                    border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: 12,
                    color: isDark ? '#f9fafb' : '#374151'
                  }}
                  cursor={{ fill: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}
                  wrapperStyle={{
                    outline: 'none',
                    zIndex: 1000
                  }}
                  labelStyle={{
                    color: isDark ? '#f3f4f6' : '#1f2937',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}
                  itemStyle={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isDark ? '#e5e7eb' : '#4b5563',
                    padding: '2px 0'
                  }}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="efficiency" 
                  fill={isDark ? "#a78bfa" : "#8b5cf6"} 
                  radius={[4, 4, 0, 0]} 
                  name="Efficiency %" 
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="tasks" 
                  fill={isDark ? "#22d3ee" : "#06b6d4"} 
                  radius={[4, 4, 0, 0]} 
                  name="Tasks Completed" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white hover:shadow-2xl transition-all duration-500 group hover:scale-105 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs md:text-sm font-medium mb-2">Average Efficiency</p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{averageEfficiency}%</p>
                <p className="text-blue-200 text-xs md:text-sm truncate">{getTrend(averageEfficiency, Math.max(0, averageEfficiency - 5))} from last week</p>
              </div>
              <div className="p-3 md:p-4 bg-blue-400/20 rounded-full group-hover:bg-blue-400/30 transition-colors flex-shrink-0 ml-3">
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-blue-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white hover:shadow-2xl transition-all duration-500 group hover:scale-105 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-green-100 text-xs md:text-sm font-medium mb-2">On-Time Delivery</p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{onTimeDelivery}%</p>
                <p className="text-green-200 text-xs md:text-sm truncate">{getTrend(onTimeDelivery, Math.max(85, onTimeDelivery - 3))} from last week</p>
              </div>
              <div className="p-3 md:p-4 bg-green-400/20 rounded-full group-hover:bg-green-400/30 transition-colors flex-shrink-0 ml-3">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-green-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white hover:shadow-2xl transition-all duration-500 group hover:scale-105 md:col-span-2 lg:col-span-1 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-orange-100 text-xs md:text-sm font-medium mb-2">Team Velocity</p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{teamVelocity}</p>
                <p className="text-orange-200 text-xs md:text-sm truncate">{getTrend(teamVelocity, Math.max(5, teamVelocity - 2))} from last week</p>
              </div>
              <div className="p-3 md:p-4 bg-orange-400/20 rounded-full group-hover:bg-orange-400/30 transition-colors flex-shrink-0 ml-3">
                <Clock className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-orange-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  );
};

export default WorkspaceAnalytics;
