import API from "@/lib/axios-client";

export interface AnalyticsOverview {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueTasks: number;
    totalProjects: number;
    activeProjects: number;
    teamMembers: number;
    avgCompletionTime: string;
}

export interface ProductivityData {
    weeklyCompletion: Array<{
        day: string;
        completed: number;
    }>;
    monthlyProgress: Array<{
        month: string;
        tasks: number;
        completed: number;
    }>;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    completed: number;
    assigned: number;
    efficiency: number;
    avatar?: string;
}

export interface ProjectStatus {
    id: string;
    name: string;
    progress: number;
    status: "On Track" | "Behind" | "Ahead" | "Completed";
    dueDate: string;
    tasksTotal: number;
    tasksCompleted: number;
}

export interface AnalyticsData {
    overview: AnalyticsOverview;
    productivity: ProductivityData;
    teamPerformance: TeamMember[];
    projectStatus: ProjectStatus[];
}

class AnalyticsService {
    async getWorkspaceAnalytics(workspaceId: string, timeRange: "7d" | "30d" | "90d"): Promise<AnalyticsData> {
        try {
            const response = await API.get(`/workspace/analytics/${workspaceId}`, {
                params: { timeRange }
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            // Return mock data as fallback
            return this.getMockAnalytics();
        }
    }

    async getTaskAnalytics(workspaceId: string, timeRange: string) {
        try {
            // Use the main analytics endpoint since specific task analytics doesn't exist
            const response = await API.get(`/workspace/analytics/${workspaceId}`, {
                params: { timeRange, type: 'tasks' }
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch task analytics:", error);
            throw error;
        }
    }

    async getTeamAnalytics(workspaceId: string, timeRange: string) {
        try {
            // Use the main analytics endpoint since specific team analytics doesn't exist
            const response = await API.get(`/workspace/analytics/${workspaceId}`, {
                params: { timeRange, type: 'team' }
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch team analytics:", error);
            throw error;
        }
    }

    async getProjectAnalytics(workspaceId: string, timeRange: string) {
        try {
            // Use the main analytics endpoint since specific project analytics doesn't exist
            const response = await API.get(`/workspace/analytics/${workspaceId}`, {
                params: { timeRange, type: 'projects' }
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch project analytics:", error);
            throw error;
        }
    }

    // Mock data for development/fallback
    getMockAnalytics(): AnalyticsData {
        return {
            overview: {
                totalTasks: 156,
                completedTasks: 89,
                activeTasks: 47,
                overdueTasks: 20,
                totalProjects: 12,
                activeProjects: 8,
                teamMembers: 15,
                avgCompletionTime: "3.2 days"
            },
            productivity: {
                weeklyCompletion: [
                    { day: "Mon", completed: 12 },
                    { day: "Tue", completed: 19 },
                    { day: "Wed", completed: 8 },
                    { day: "Thu", completed: 15 },
                    { day: "Fri", completed: 22 },
                    { day: "Sat", completed: 6 },
                    { day: "Sun", completed: 4 }
                ],
                monthlyProgress: [
                    { month: "Jan", tasks: 45, completed: 38 },
                    { month: "Feb", tasks: 52, completed: 41 },
                    { month: "Mar", tasks: 38, completed: 35 },
                    { month: "Apr", tasks: 61, completed: 48 }
                ]
            },
            teamPerformance: [
                { id: "1", name: "Vansh rathod", email: "vansh@example.com", completed: 23, assigned: 28, efficiency: 82 },
                { id: "2", name: "Madhav verma", email: "madhav@example.com", completed: 19, assigned: 22, efficiency: 86 },
                { id: "3", name: "Puja seth", email: "puja@example.com", completed: 31, assigned: 35, efficiency: 89 },
                { id: "4", name: "Dravid kamble", email: "dravid@example.com", completed: 15, assigned: 20, efficiency: 75 }
            ],
            projectStatus: [
                {
                    id: "1",
                    name: "Website Redesign",
                    progress: 75,
                    status: "On Track",
                    dueDate: "2025-09-15",
                    tasksTotal: 24,
                    tasksCompleted: 18
                },
                {
                    id: "2",
                    name: "Mobile App",
                    progress: 45,
                    status: "Behind",
                    dueDate: "2025-10-01",
                    tasksTotal: 32,
                    tasksCompleted: 14
                },
                {
                    id: "3",
                    name: "API Integration",
                    progress: 90,
                    status: "Ahead",
                    dueDate: "2025-08-20",
                    tasksTotal: 16,
                    tasksCompleted: 14
                },
                {
                    id: "4",
                    name: "User Research",
                    progress: 30,
                    status: "On Track",
                    dueDate: "2025-09-30",
                    tasksTotal: 20,
                    tasksCompleted: 6
                }
            ]
        };
    }

    // Real-time analytics using WebSocket (for future implementation)
    subscribeToRealTimeUpdates(callback: (data: AnalyticsData) => void) {
        // This would connect to your WebSocket endpoint
        // const ws = new WebSocket(`ws://your-backend/analytics/${workspaceId}`);
        // ws.onmessage = (event) => {
        //   const data = JSON.parse(event.data);
        //   callback(data);
        // };
        // return () => ws.close();

        // Mock real-time updates for demo
        const interval = setInterval(() => {
            callback(this.getMockAnalytics());
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }

    // Export analytics data
    async exportAnalytics(workspaceId: string, format: "csv" | "pdf" | "excel", timeRange: string) {
        try {
            // Use the main analytics endpoint since specific export endpoint doesn't exist
            const response = await API.get(`/workspace/analytics/${workspaceId}`, {
                params: { format, timeRange, export: true },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics-${workspaceId}-${timeRange}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export analytics:", error);
            throw error;
        }
    }

    // Generate insights using AI (future feature)
    async generateInsights(workspaceId: string): Promise<string[]> {
        try {
            // Use the main analytics endpoint since specific insights endpoint doesn't exist
            const response = await API.post(`/workspace/analytics/${workspaceId}`, {
                action: 'generate-insights'
            });
            return response.data.insights;
        } catch (error) {
            console.error("Failed to generate insights:", error);
            // Return mock insights
            return [
                "Your team's productivity increased by 15% this week compared to last week.",
                "Tasks are taking 2.3 days longer than average to complete.",
                "Carol Davis has the highest efficiency rate at 89%.",
                "The Mobile App project is behind schedule and may need additional resources.",
                "Friday is your team's most productive day with 22 tasks completed on average."
            ];
        }
    }
}

export const analyticsService = new AnalyticsService();
