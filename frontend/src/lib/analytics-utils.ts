interface AnalyticsData {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
}

export function generateInsights(analyticsData: AnalyticsData): string[] {
    const insights: string[] = [];
    const completionRate = (analyticsData.completedTasks / analyticsData.totalTasks) * 100;
    const overdueRate = (analyticsData.overdueTasks / analyticsData.totalTasks) * 100;
    const pendingTasks = analyticsData.totalTasks - analyticsData.completedTasks - analyticsData.overdueTasks;

    // Completion rate insights
    if (completionRate >= 90) {
        insights.push("🎉 Excellent work! Your task completion rate is outstanding at " + Math.round(completionRate) + "%");
    } else if (completionRate >= 70) {
        insights.push("✅ Good progress! Your completion rate of " + Math.round(completionRate) + "% is above average");
    } else if (completionRate >= 50) {
        insights.push("📈 Your completion rate is " + Math.round(completionRate) + "%. Focus on completing pending tasks to improve efficiency");
    } else {
        insights.push("⚠️ Low completion rate detected (" + Math.round(completionRate) + "%). Consider reviewing task priorities and deadlines");
    }

    // Overdue task insights
    if (analyticsData.overdueTasks === 0) {
        insights.push("⭐ Perfect timing! No overdue tasks - your team is staying on schedule");
    } else if (overdueRate <= 10) {
        insights.push("🔔 " + analyticsData.overdueTasks + " tasks are overdue. Consider reviewing deadlines and resource allocation");
    } else if (overdueRate <= 25) {
        insights.push("⚡ " + analyticsData.overdueTasks + " overdue tasks (" + Math.round(overdueRate) + "%) may impact project timelines. Immediate attention recommended");
    } else {
        insights.push("🚨 High number of overdue tasks (" + analyticsData.overdueTasks + "). Consider redistributing workload or extending deadlines");
    }

    // Pending tasks insights
    if (pendingTasks > 0) {
        const pendingRate = (pendingTasks / analyticsData.totalTasks) * 100;
        if (pendingRate > 50) {
            insights.push("🔄 " + pendingTasks + " tasks in progress (" + Math.round(pendingRate) + "%). Monitor closely to prevent bottlenecks");
        } else {
            insights.push("💪 " + pendingTasks + " tasks in progress. Good balance between active work and completion");
        }
    }

    // Productivity recommendations
    if (completionRate < 80 && analyticsData.overdueTasks > 0) {
        insights.push("💡 Recommendation: Focus on completing existing tasks before taking on new ones to improve overall efficiency");
    }

    if (analyticsData.totalTasks > 0) {
        const efficiency = 100 - overdueRate;
        if (efficiency >= 95) {
            insights.push("🌟 Team efficiency is exceptional! Consider documenting your workflow processes for future reference");
        } else if (efficiency >= 85) {
            insights.push("📊 Strong team performance with " + Math.round(efficiency) + "% efficiency. Keep up the momentum!");
        }
    }

    // Workload insights
    if (analyticsData.totalTasks < 10) {
        insights.push("📋 Light workload detected. This might be a good time to plan upcoming projects or improve processes");
    } else if (analyticsData.totalTasks > 50) {
        insights.push("🏃‍♂️ High task volume (" + analyticsData.totalTasks + " tasks). Consider prioritizing critical items and delegating when possible");
    }

    return insights.slice(0, 6); // Limit to 6 most relevant insights
}
