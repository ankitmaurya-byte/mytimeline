"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceAnalyticsQueryFn, getAllTasksQueryFn } from '@/lib/api';
import useWorkspaceId from "@/hooks/use-workspace-id";

// Import clean, modular components
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsStats } from "@/components/analytics/AnalyticsStats";
import ProductivityTab from "@/components/analytics/ProductivityTab";
import TeamTab from "@/components/analytics/TeamTab";
import ProjectsTab from "@/components/analytics/ProjectsTab";
import InsightsTab from "@/components/analytics/InsightsTab";
import { generateInsights } from "@/lib/analytics-utils";
import { useIsMobile } from "../../hooks/use-mobile";

interface AnalyticsData {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    tasks?: Array<{
        id: string;
        title: string;
        dueDate?: string;
        status: 'pending' | 'in-progress' | 'completed' | 'overdue';
        completedAt?: string;
    }>;
}

const Analytics = () => {
    const workspaceId = useWorkspaceId();
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
    const isMobile = useIsMobile();

    // Fetch analytics data
    const { data: analyticsResponse, isLoading: loading, refetch } = useQuery({
        queryKey: ['workspace-analytics', workspaceId, timeRange],
        queryFn: () => getWorkspaceAnalyticsQueryFn(workspaceId),
        enabled: !!workspaceId,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch all tasks for the workspace
    const { data: allTasksResponse, isLoading: loadingTasks } = useQuery({
        queryKey: ['all-tasks', workspaceId],
        queryFn: () => getAllTasksQueryFn({ workspaceId }),
        enabled: !!workspaceId,
        staleTime: 2 * 60 * 1000,
    });

    // Transform data
    const analyticsData = analyticsResponse?.analytics;
    const tasks = allTasksResponse?.tasks || [];

    // Map backend TaskType to ProductivityTab's expected task shape
    // Use TaskType for type safety
    const mapStatus = (status: string): "pending" | "in-progress" | "completed" | "overdue" => {
        switch (status) {
            case "BACKLOG":
            case "TODO":
                return "pending";
            case "IN_PROGRESS":
                return "in-progress";
            case "IN_REVIEW":
                return "overdue"; // or "in-progress" if that's more appropriate for your logic
            case "DONE":
                return "completed";
            default:
                return "pending";
        }
    };

    const mappedTasks = (tasks as import('@/types/api.type').TaskType[]).map((task) => ({
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        status: mapStatus(task.status),
        completedAt: mapStatus(task.status) === 'completed' ? task.updatedAt || undefined : undefined,
    }));

    const data: AnalyticsData | null = analyticsData ? {
        totalTasks: analyticsData.totalTasks,
        completedTasks: analyticsData.completedTasks,
        overdueTasks: analyticsData.overdueTasks,
        tasks: mappedTasks,
    } : null;

    // Generate insights
    useEffect(() => {
        if (analyticsData) {
            // Generate insights for future use
            generateInsights(analyticsData);
        }
    }, [analyticsData]);

    const handleRefresh = async () => {
        try {
            await refetch();
        } catch (error) {
            console.error("Failed to refresh analytics:", error);
        }
    };

    const handleExport = async () => {
    };

    if (loading || loadingTasks || !data) {
        return (
            <main className="flex flex-1 flex-col py-6 md:py-8 px-4 md:px-3 space-y-8">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col py-6 md:py-8 px-4 xs:px-2 md:px-6 space-y-8">
            <AnalyticsHeader
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                onRefresh={handleRefresh}
                onExport={handleExport}
                loading={loading}
            />

            <AnalyticsStats data={data} />

            <Tabs defaultValue="productivity" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="productivity">{isMobile ? "📊" : "📊 Productivity"}</TabsTrigger>
                    <TabsTrigger value="team">{isMobile ? "👥" : "👥 Team"}</TabsTrigger>
                    <TabsTrigger value="projects">{isMobile ? "📁" : "📁 Projects"}</TabsTrigger>
                    <TabsTrigger value="insights">{isMobile ? "🧠" : "🧠 Insights"}</TabsTrigger>
                </TabsList>

                <TabsContent value="productivity">
                    <ProductivityTab data={data} />
                </TabsContent>

                <TabsContent value="team">
                    <TeamTab />
                </TabsContent>

                <TabsContent value="projects">
                    <ProjectsTab />
                </TabsContent>

                <TabsContent value="insights">
                    <InsightsTab />
                </TabsContent>
            </Tabs>
        </main>
    );
};

export default Analytics;
