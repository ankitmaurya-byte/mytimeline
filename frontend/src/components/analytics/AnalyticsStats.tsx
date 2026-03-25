import {
    ListTodo,
    TrendingUp,
    AlertTriangle,
    Zap
} from "lucide-react";
import { AnalyticsStatCard } from "./AnalyticsStatCard";

interface AnalyticsData {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
}

interface AnalyticsStatsProps {
    data: AnalyticsData;
}

export function AnalyticsStats({ data }: AnalyticsStatsProps) {
    const completionRate = Math.round((data.completedTasks / data.totalTasks) * 100);
    const pendingTasks = data.totalTasks - data.completedTasks - data.overdueTasks;

    return (
        <div className="space-y-6">
            {/* Core Task Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnalyticsStatCard
                    title="Total Tasks"
                    value={data.totalTasks.toString()}
                    change={`${data.completedTasks} completed`}
                    icon={ListTodo}
                    gradient="from-blue-500 to-blue-600"
                    bgGradient="from-blue-50 to-blue-100 dark:from-blue-900/80 dark:to-blue-800/80"
                />
                <AnalyticsStatCard
                    title="Completion Rate"
                    value={`${completionRate}%`}
                    change={completionRate >= 80 ? "🚀 Excellent" : completionRate >= 60 ? "👍 Good" : "⚡ Needs Focus"}
                    icon={TrendingUp}
                    gradient="from-emerald-500 to-emerald-600"
                    bgGradient="from-emerald-50 to-emerald-100 dark:from-emerald-900/80 dark:to-emerald-800/80"
                />
                <AnalyticsStatCard
                    title="Overdue Tasks"
                    value={data.overdueTasks.toString()}
                    change={data.overdueTasks === 0 ? "🎯 Perfect!" : data.overdueTasks <= 2 ? "⚠️ Monitor" : "🚨 Critical"}
                    icon={AlertTriangle}
                    gradient="from-red-500 to-red-600"
                    bgGradient="from-red-50 to-red-100 dark:from-red-900/80 dark:to-red-800/80"
                />
                <AnalyticsStatCard
                    title="In Progress"
                    value={pendingTasks.toString()}
                    change={`${Math.round((pendingTasks / data.totalTasks) * 100)}% of total`}
                    icon={Zap}
                    gradient="from-violet-500 to-violet-600"
                    bgGradient="from-violet-50 to-violet-100 dark:from-violet-900/80 dark:to-violet-800/80"
                />
            </div>
        </div>
    );
}
