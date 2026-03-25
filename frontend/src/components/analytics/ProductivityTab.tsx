import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CheckCircle, AlertCircle, Activity, Award, Users, AlertTriangle, Calendar } from "lucide-react";

// Color mapping to avoid dynamic Tailwind classes
const colorClasses = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    dot: 'w-3 h-3 bg-green-500',
    text: 'text-green-700 dark:text-green-300',
    textLight: 'text-green-600 dark:text-green-400',
    progress: 'bg-green-600',
    progressBg: 'bg-green-200 dark:bg-green-800',
    border: 'border-green-700/20'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    dot: 'w-3 h-3 bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    textLight: 'text-blue-600 dark:text-blue-400',
    progress: 'bg-blue-600',
    progressBg: 'bg-blue-200 dark:bg-blue-800',
    border: 'border-blue-700/20'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    dot: 'w-3 h-3 bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    textLight: 'text-red-600 dark:text-red-400',
    progress: 'bg-red-600',
    progressBg: 'bg-red-200 dark:bg-red-800',
    border: 'border-red-700/20'
  }
};

export default function ProductivityTab({ data }: { data: { totalTasks: number; completedTasks: number; overdueTasks: number; tasks?: Array<{ id: string; title: string; dueDate?: string; status: 'pending' | 'in-progress' | 'completed' | 'overdue'; completedAt?: string; }>; }; }) {
  // Ensure data is always defined with fallbacks
  const safeData = {
    totalTasks: data?.totalTasks || 0,
    completedTasks: data?.completedTasks || 0,
    overdueTasks: data?.overdueTasks || 0,
    tasks: data?.tasks || []
  };

  const tasks = safeData.tasks;
  const today = new Date();

  // Helper function to safely parse dates
  const safeDateParse = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Sort tasks by due date safely
  const sortByDue = (arr: typeof tasks) => {
    return [...arr].sort((a, b) => {
      const dateA = safeDateParse(a.dueDate);
      const dateB = safeDateParse(b.dueDate);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Filter overdue tasks safely
  const overdueTasks = sortByDue(
    tasks.filter(t => {
      const dueDate = safeDateParse(t.dueDate);
      return dueDate && t.status !== 'completed' && dueDate < today;
    })
  );

  // Get upcoming tasks safely
  const getUpcoming = (min: number, max: number) => {
    return sortByDue(
      tasks.filter(t => {
        const dueDate = safeDateParse(t.dueDate);
        if (!dueDate || t.status === 'completed') return false;

        // Calculate days difference from today
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

        // Include tasks that are due within the specified range
        // min <= daysDiff < max (inclusive of min, exclusive of max)
        return daysDiff >= min && daysDiff < max;
      })
    );
  };

  // Get all upcoming tasks for better debugging
  const allUpcomingTasks = tasks.filter(t => {
    const dueDate = safeDateParse(t.dueDate);
    return dueDate && t.status !== 'completed' && dueDate >= today;
  });

  // More intuitive ranges: 0-3 days, 4-7 days, 8-15 days
  const [firstUpcoming, secondUpcoming, thirdUpcoming] = [
    getUpcoming(0, 4)[0],    // Due in 0-3 days
    getUpcoming(4, 8)[0],    // Due in 4-7 days  
    getUpcoming(8, 16)[0]    // Due in 8-15 days
  ];

  const customUpcomingTasks = [firstUpcoming, secondUpcoming, thirdUpcoming].filter(Boolean);
  const criticalTasks = firstUpcoming ? [firstUpcoming] : [];

  // Alternative: Show all upcoming tasks if the specific ranges are empty
  const fallbackUpcomingTasks = customUpcomingTasks.length === 0 && allUpcomingTasks.length > 0
    ? allUpcomingTasks.slice(0, 3)
    : customUpcomingTasks;

  // Debug info for development (can be removed in production)
  const debugInfo = {
    totalTasks: tasks.length,
    upcomingTasks: allUpcomingTasks.length,
    firstRange: getUpcoming(0, 4).length,
    secondRange: getUpcoming(4, 8).length,
    thirdRange: getUpcoming(8, 16).length,
    overdueCount: overdueTasks.length
  };

  // Calculate metrics safely
  const inProgressTasks = Math.max(0, safeData.totalTasks - safeData.completedTasks - overdueTasks.length);
  const pendingTasks = inProgressTasks + overdueTasks.length;
  const completionRate = safeData.totalTasks > 0 ? Math.round((safeData.completedTasks / safeData.totalTasks) * 100) : 0;
  const overdueRate = safeData.totalTasks > 0 ? Math.round((overdueTasks.length / safeData.totalTasks) * 100) : 0;
  const inProgressRate = safeData.totalTasks > 0 ? Math.round((inProgressTasks / safeData.totalTasks) * 100) : 0;
  const productivityScore = safeData.totalTasks > 0 ? Math.max(0, Math.min(100,
    Math.round((completionRate * 0.7) + (Math.max(0, 100 - overdueRate) * 0.3))
  )) : 0;

  // Format due date safely
  const getFormattedDueDate = (dateString: string) => {
    const date = safeDateParse(dateString);
    if (!date) return 'Invalid date';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate.getTime() === today.getTime()) return 'Today';
    if (dueDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate average completion time safely
  const completedTasksWithDates = tasks.filter(t =>
    t.status === 'completed' && t.completedAt && t.dueDate
  );

  const avgCompletionTime = completedTasksWithDates.length > 0
    ? completedTasksWithDates.reduce((acc, t) => {
      const completedDate = safeDateParse(t.completedAt);
      const dueDate = safeDateParse(t.dueDate);
      if (!completedDate || !dueDate) return acc;
      return acc + Math.abs(Math.ceil((completedDate.getTime() - dueDate.getTime()) / 86400000));
    }, 0) / completedTasksWithDates.length
    : 0;

  const getPerformanceLevel = (score: number) => {
    if (safeData.totalTasks === 0) return { level: "No Data", color: "gray", emoji: "📊" };
    if (score >= 90) return { level: "Excellent", color: "emerald", emoji: "🏆" };
    if (score >= 75) return { level: "Good", color: "blue", emoji: "👍" };
    if (score >= 60) return { level: "Average", color: "yellow", emoji: "⚡" };
    return { level: "Needs Focus", color: "red", emoji: "🎯" };
  };

  const performance = getPerformanceLevel(productivityScore);

  const StatCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/60 dark:to-gray-800/60 shadow-sm dark:shadow-lg rounded-lg border-2 border-slate-200 dark:border-slate-600/50">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
        <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-slate-100">{title}</h4>
      </div>
      {children}
    </div>
  );

  const TaskDistributionItem = ({ color, label, value, rate }: { color: 'green' | 'blue' | 'red', label: string, value: number, rate: number }) => {
    const colorScheme = colorClasses[color];
    return (
      <div className={`${colorScheme.bg} rounded-lg p-3 sm:p-4 h-full`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 h-full">
          {/* Label and Dot */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`${colorScheme.dot} rounded-full`}></div>
            <span className={`text-sm sm:text-base font-medium ${colorScheme.text}`}>{label}</span>
          </div>

          {/* Progress Bar and Value */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs sm:text-sm font-medium ${colorScheme.textLight}`}>{rate}%</span>
              <span className={`text-sm sm:text-base font-bold ${colorScheme.text}`}>{value}</span>
            </div>
            <div className={`w-full ${colorScheme.progressBg} rounded-full h-2 sm:h-3 relative overflow-hidden`}>
              <div
                className={`${colorScheme.progress} h-2 sm:h-3 rounded-full transition-all duration-300 shadow-sm border ${colorScheme.border} relative z-10`}
                style={{
                  width: `${Math.max(rate, 2)}%`,
                  minWidth: '4px'
                }}
              ></div>
              {/* Add a subtle inner glow */}
              <div
                className={`absolute inset-0 ${colorScheme.progress} opacity-30 rounded-full blur-sm`}
                style={{
                  width: `${Math.max(rate, 2)}%`,
                  minWidth: '4px'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Early return if no data
  if (safeData.totalTasks === 0 && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm dark:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Timeline Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No tasks available</p>
              <p className="text-sm">Start by creating some tasks to see productivity analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card className="shadow-sm dark:shadow-lg xs:border-none xs:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Timeline Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 xs:p-0">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Users} title="Task Statistics">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Total tasks:</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{safeData.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Pending tasks:</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{pendingTasks}</span>
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  {completionRate >= 75 ? "✅ Good progress" : "📈 Keep pushing forward"}
                </div>
              </div>
            </StatCard>

            <StatCard icon={TrendingUp} title="Performance">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Completion rate:</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{completionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Active tasks:</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{inProgressTasks}</span>
                </div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  {completionRate >= 80 ? "🌟 Excellent performance" : "📈 Room for improvement"}
                </div>
              </div>
            </StatCard>

            <StatCard icon={AlertTriangle} title="Risk Assessment">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Overdue tasks:</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{overdueTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Risk level:</span>
                  <span className={`font-medium ${overdueTasks.length === 0 ? 'text-green-600' : overdueTasks.length <= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {overdueTasks.length === 0 ? 'Low' : overdueTasks.length <= 2 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {overdueTasks.length === 0 ? "🎯 On track" : "⚠️ Needs attention"}
                </div>
              </div>
            </StatCard>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 bg-background/50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-600/30">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-500/15 dark:to-emerald-500/15"></div>
          <CardContent className="p-4 sm:p-6 text-center relative">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {safeData.totalTasks === 0 ? 'N/A' : `${productivityScore}%`}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {safeData.totalTasks === 0 ? 'No tasks available' : 'Productivity Score'}
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-600/50 rounded-full h-2 mt-3">
              <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${productivityScore}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 bg-background/50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-600/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-500/15 dark:to-cyan-500/15"></div>
          <CardContent className="p-4 sm:p-6 text-center relative">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressTasks}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">In Progress</div>
            <div className="w-full bg-gray-200 dark:bg-slate-600/50 rounded-full h-2 mt-3">
              <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(inProgressRate, 10)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 bg-background/50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-600/30">
          <div className={`absolute inset-0 ${overdueTasks.length > 0 ? 'bg-gradient-to-br from-red-500/5 to-orange-500/5 dark:from-red-500/15 dark:to-orange-500/15' : 'bg-gradient-to-br from-amber-500/5 to-yellow-500/5 dark:from-amber-500/15 dark:to-yellow-500/15'}`}></div>
          <CardContent className="p-4 sm:p-6 text-center relative">
            <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ${overdueTasks.length > 0 ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20' : 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20'} rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
              {overdueTasks.length > 0 ? (
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              ) : (
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${overdueTasks.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {overdueTasks.length > 0 ? overdueTasks.length : allUpcomingTasks.length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {overdueTasks.length > 0 ? 'Overdue Tasks' : 'Upcoming Tasks'}
            </div>
            {overdueTasks.length > 0 ? (
              <div className="w-full bg-gray-200 dark:bg-slate-600/50 rounded-full h-2 mt-3">
                <div className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(overdueTasks.length * 10, 100)}%` }}></div>
              </div>
            ) : (
              <div className="w-full bg-gray-200 dark:bg-slate-600/50 rounded-full h-2 mt-3">
                <div className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(allUpcomingTasks.length * 20, 100)}%` }}></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 bg-background/50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-600/30">
          <div className={`absolute inset-0 ${performance.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/15' : performance.color === 'blue' ? 'bg-gradient-to-br from-blue-500/5 to-blue-600/5 dark:from-blue-500/15 dark:to-blue-600/15' : performance.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500/5 to-yellow-600/5 dark:from-yellow-500/15 dark:to-yellow-600/15' : 'bg-gradient-to-br from-red-500/5 to-red-600/5 dark:from-red-500/15 dark:to-red-600/15'}`}></div>
          <CardContent className="p-4 sm:p-6 text-center relative">
            <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ${performance.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-500/20 dark:to-emerald-600/20' : performance.color === 'blue' ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20' : performance.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 dark:from-yellow-500/20 dark:to-yellow-600/20' : 'bg-gradient-to-br from-red-500/10 to-red-600/10 dark:from-red-500/20 dark:to-red-600/20'} rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <Award className={`w-5 h-5 sm:w-6 sm:h-6 ${performance.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : performance.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : performance.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${performance.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : performance.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : performance.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {safeData.totalTasks === 0 ? 'N/A' : String(productivityScore)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {safeData.totalTasks === 0 ? 'No Data' : 'Productivity Score'}
            </div>
            <div className="text-xs font-medium mt-1 flex items-center justify-center gap-1">
              <span>{performance.emoji}</span>
              <span className={`${performance.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : performance.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : performance.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{performance.level}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info - Remove in production */}
      {/*  <Card className="relative overflow-hidden border-dashed border-amber-300 dark:border-amber-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Debug Info (Remove in Production)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-blue-600">{debugInfo.totalTasks}</div>
              <div className="text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">{debugInfo.upcomingTasks}</div>
              <div className="text-gray-600">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-amber-600">{debugInfo.firstRange + debugInfo.secondRange + debugInfo.thirdRange}</div>
              <div className="text-gray-600">In Ranges</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">{debugInfo.overdueCount}</div>
              <div className="text-gray-600">Overdue</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs">
            <div className="font-medium mb-2">Range Breakdown:</div>
            <div>0-3 days: {debugInfo.firstRange} tasks</div>
            <div>4-7 days: {debugInfo.secondRange} tasks</div>
            <div>8-15 days: {debugInfo.thirdRange} tasks</div>
            <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
              <div className="font-medium mb-2">Task Details:</div>
              {allUpcomingTasks.map((task, idx) => (
                <div key={task.id} className="text-xs text-gray-600 dark:text-gray-400">
                  {idx + 1}. {task.title} - Due: {task.dueDate ? getFormattedDueDate(task.dueDate) : 'No date'}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Team Performance Analysis */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Team Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <div className="space-y-6">
            <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
              {/* Task Distribution */}
              <div className="space-y-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Task Distribution
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  <TaskDistributionItem color="green" label="Completed" value={safeData.completedTasks} rate={completionRate} />
                  <TaskDistributionItem color="blue" label="In Progress" value={inProgressTasks} rate={inProgressRate} />
                  {overdueTasks.length > 0 && (
                    <TaskDistributionItem color="red" label="Overdue" value={overdueTasks.length} rate={overdueRate} />
                  )}
                </div>
              </div>

              {/* Timeline Progress */}
              <div className="space-y-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Timeline Progress
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Progress Rate</span>
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Completed Tasks</span>
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300">{safeData.completedTasks}</span>
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Out of {safeData.totalTasks} total tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
              {/* Timeline Status */}
              <div className="space-y-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Timeline Status
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upcoming Deadlines</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{customUpcomingTasks.length}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="block sm:inline">Tasks due soon</span>
                      <span className="hidden sm:inline"> • </span>
                      <span className="block sm:inline text-amber-600 dark:text-amber-400 font-medium">
                        Critical: {criticalTasks.length} {criticalTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                    {(fallbackUpcomingTasks.length > 0 || customUpcomingTasks.length > 0) && (
                      <div className="space-y-2 mt-2">
                        {(fallbackUpcomingTasks.length > 0 ? fallbackUpcomingTasks : customUpcomingTasks).map((task, idx) => task?.dueDate && (
                          <div key={task.id} className="text-sm text-amber-600 dark:text-amber-400">
                            {fallbackUpcomingTasks.length > 0 ? (
                              // Show all upcoming tasks with generic labels
                              <span className="inline-flex items-center">
                                <span className="mr-1">📅</span>
                                <span className="font-medium">
                                  {task?.title && task.title.length > 20
                                    ? task.title.substring(0, 20) + '...'
                                    : task?.title || 'Task'}
                                </span>
                                <span className="ml-1">
                                  (Due: {task?.dueDate
                                    ? getFormattedDueDate(task.dueDate)
                                    : 'No date'})
                                </span>
                              </span>
                            ) : (
                              // Show specific range labels
                              <>
                                {idx === 0 && "Due in 0-3d: "}
                                {idx === 1 && "Due in 4-7d: "}
                                {idx === 2 && "Due in 8-15d: "}
                                <span className="inline-flex items-center">
                                  <span className="mr-1">📅</span>
                                  <span className="font-medium">
                                    {task?.title && task.title.length > 20
                                      ? task.title.substring(0, 20) + '...'
                                      : task?.title || 'Task'}
                                  </span>
                                  <span className="ml-1">
                                    ({task?.dueDate
                                      ? getFormattedDueDate(task.dueDate)
                                      : 'No date'})
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Timeline Health</span>
                      <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                        {overdueTasks.length === 0 && criticalTasks.length === 0 ? "Good" :
                          overdueTasks.length > 0 ? "Critical" : criticalTasks.length <= 2 ? "At Risk" : "Critical"}
                      </span>
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      {overdueTasks.length === 0 && criticalTasks.length === 0 && (fallbackUpcomingTasks.length === 0 && customUpcomingTasks.length === 0)
                        ? "✅ All tasks on track"
                        : overdueTasks.length > 0
                          ? `⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`
                          : `⚠️ ${criticalTasks.length} task${criticalTasks.length > 1 ? 's' : ''} need attention`}
                    </div>
                  </div>
                  {avgCompletionTime > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Avg. Completion Time</span>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          {Math.round(avgCompletionTime)} days
                        </span>
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {avgCompletionTime <= 1 ? "🎯 Excellent timing" : avgCompletionTime <= 3 ? "👍 Good timing" : "📈 Room for improvement"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Recommendations */}
              <div className="space-y-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  Timeline Recommendations
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                      {overdueTasks.length > 0 && (
                        <div className="space-y-2">
                          <div>• Address {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} immediately:</div>
                          {overdueTasks.slice(0, 2).map(task => task.dueDate && (
                            <div key={task.id} className="ml-3 text-red-600 dark:text-red-400">
                              <span className="inline-flex items-center">
                                <span className="mr-1">⚠️</span>
                                <span className="font-medium">
                                  {task.title && task.title.length > 25
                                    ? task.title.substring(0, 25) + '...'
                                    : task.title || 'Task'}
                                </span>
                                <span className="ml-1">
                                  (Overdue since: {task.dueDate ? getFormattedDueDate(task.dueDate) : 'Unknown'})
                                </span>
                              </span>
                            </div>
                          ))}
                          {overdueTasks.length > 2 && (
                            <div className="ml-3 text-red-600 dark:text-red-400">- {overdueTasks.length - 2} more overdue task{overdueTasks.length - 2 > 1 ? 's' : ''}</div>
                          )}
                        </div>
                      )}

                      {criticalTasks.length > 0 && (
                        <div className="space-y-2">
                          <div>• Critical tasks due soon:</div>
                          {criticalTasks.slice(0, 3).map(task => task.dueDate && (
                            <div key={task.id} className="ml-3">
                              - <span className="inline-flex items-center">
                                <span className="font-medium">
                                  {task.title && task.title.length > 25
                                    ? task.title.substring(0, 25) + '...'
                                    : task.title || 'Task'}
                                </span>
                                <span className="ml-1 text-amber-600 dark:text-amber-400">
                                  (Due: {task.dueDate ? getFormattedDueDate(task.dueDate) : 'Unknown'})
                                </span>
                              </span>
                            </div>
                          ))}
                          {criticalTasks.length > 3 && (
                            <div className="ml-3">- {criticalTasks.length - 3} more critical task{criticalTasks.length - 3 > 1 ? 's' : ''}</div>
                          )}
                        </div>
                      )}

                      {(fallbackUpcomingTasks.length > 0 || customUpcomingTasks.length > 0) && (
                        <div>• {(fallbackUpcomingTasks.length > 0 ? fallbackUpcomingTasks.length : customUpcomingTasks.length) - criticalTasks.length} more task{(fallbackUpcomingTasks.length > 0 ? fallbackUpcomingTasks.length : customUpcomingTasks.length) - criticalTasks.length > 1 ? 's' : ''} due soon - plan accordingly</div>
                      )}
                      {completionRate < 70 && <div>• Focus on completing current tasks before adding new ones</div>}
                      {avgCompletionTime > 3 && <div>• Consider breaking down complex tasks to improve delivery time</div>}
                      {completionRate > 80 && overdueTasks.length === 0 && <div>• Excellent timeline management! Keep up the momentum</div>}
                      {criticalTasks.length === 0 && customUpcomingTasks.length === 0 && <div>• No upcoming deadlines - good time to plan ahead</div>}
                      <div>• Review upcoming deadlines daily to stay proactive</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Task Efficiency</span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{100 - overdueRate}%</span>
                    </div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400">
                      {overdueTasks.length === 0 ? "🎯 No overdue tasks" : `⚠️ ${overdueTasks.length} overdue`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
