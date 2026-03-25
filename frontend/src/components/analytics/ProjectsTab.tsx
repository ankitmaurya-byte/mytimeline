import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Folder, CheckCircle, AlertCircle, Clock, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProjectsInWorkspaceQueryFn, getAllTasksQueryFn } from "@/lib/api";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskStatusEnum } from "@/constant";
import { useMemo, useState } from "react";

// Helper component for project card
interface ProjectCardProps {
    project: {
        _id: string;
        emoji?: string;
        name: string;
        isOnTrack: boolean;
        isAtRisk: boolean;
        completionRate: number;
        completedTasks: number;
        inProgressTasks: number;
        totalTasks: number;
        overdueTasks: number;
        createdBy?: {
            name?: string;
        };
    };
}

function ProjectCard({ project }: ProjectCardProps) {
    return (
        <Card key={project._id} className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
                {/* Project Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">{project.emoji || "📁"}</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">{project.name}</h3>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`text-xs ${project.isOnTrack ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                    project.isAtRisk ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                        'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    }`}
                            >
                                {project.isOnTrack ? '✅ On Track' : project.isAtRisk ? '⚠️ At Risk' : '🔄 In Progress'}
                            </Badge>
                        </div>
                    </div>
                </div>
                {/* Progress */}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Progress</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{project.completionRate}%</span>
                    </div>
                    <Progress
                        value={project.completionRate}
                        className="h-2 bg-slate-200 dark:bg-slate-700"
                    />
                    {/* Task Stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="font-bold text-emerald-700 dark:text-emerald-300">{project.completedTasks}</div>
                            <div className="text-emerald-600 dark:text-emerald-400 text-[10px]">Done</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="font-bold text-blue-700 dark:text-blue-300">{project.inProgressTasks}</div>
                            <div className="text-blue-600 dark:text-blue-400 text-[10px]">Active</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="font-bold text-slate-700 dark:text-slate-300">{project.totalTasks}</div>
                            <div className="text-slate-600 dark:text-slate-400 text-[10px]">Total</div>
                        </div>
                    </div>
                    {/* Additional Info */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                {project.overdueTasks} overdue
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Created by {project.createdBy?.name || 'Unknown'}
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ProjectsTab() {
    const workspaceId = useWorkspaceId();
    const [filter, setFilter] = useState<'all' | 'onTrack' | 'atRisk'>('all');
    const [search, setSearch] = useState('');

    // Fetch projects
    const { data: projectsData, isLoading: projectsLoading } = useQuery({
        queryKey: ["projects", workspaceId],
        queryFn: () => getProjectsInWorkspaceQueryFn({ workspaceId, pageSize: 10, pageNumber: 1 }),
        enabled: !!workspaceId,
    });

    // Fetch all tasks to calculate project progress
    const { data: tasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ["all-tasks", workspaceId],
        queryFn: () => getAllTasksQueryFn({ workspaceId }),
        enabled: !!workspaceId,
    });

    // Calculate project analytics
    const projectAnalytics = useMemo(() => {
        const projects = projectsData?.projects || [];
        const allTasks = tasksData?.tasks || [];

        if (!projects.length || !allTasks.length) {
            return {
                projectsWithProgress: [],
                totalProjects: 0,
                projectsOnTrack: 0,
                projectsAtRisk: 0
            };
        }

        const projectsWithProgress = projects.map(project => {
            const projectTasks = allTasks.filter(task => task.project?._id === project._id);
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter(task => task.status === TaskStatusEnum.DONE).length;
            const inProgressTasks = projectTasks.filter(task => task.status === TaskStatusEnum.IN_PROGRESS).length;
            const overdueTasks = projectTasks.filter(task =>
                task.status !== TaskStatusEnum.DONE &&
                new Date(task.dueDate) < new Date()
            ).length;

            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const isOnTrack = completionRate >= 70 && overdueTasks <= 2;
            const isAtRisk = overdueTasks > 2 || (completionRate < 40 && totalTasks > 0);

            return {
                ...project,
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                completionRate,
                isOnTrack,
                isAtRisk
            };
        });

        const projectsOnTrack = projectsWithProgress.filter(p => p.isOnTrack).length;
        const projectsAtRisk = projectsWithProgress.filter(p => p.isAtRisk).length;

        return {
            projectsWithProgress,
            totalProjects: projects.length,
            projectsOnTrack,
            projectsAtRisk
        };
    }, [projectsData?.projects, tasksData?.tasks]);

    // Show loading state
    if (projectsLoading || tasksLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading project analytics...</p>
                </div>
            </div>
        );
    }

    // Show empty state if no projects
    if (!projectAnalytics.totalProjects) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Projects Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create projects and assign tasks to see analytics.
                    </p>
                </div>
            </div>
        );
    }

    // Filtered and searched projects
    const filteredProjects = projectAnalytics.projectsWithProgress.filter(project => {
        if (filter === 'onTrack' && !project.isOnTrack) return false;
        if (filter === 'atRisk' && !project.isAtRisk) return false;
        if (search && !project.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Project Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Projects */}
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-800/20 border-indigo-200 dark:border-indigo-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Total Projects</CardTitle>
                        <Folder className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">
                            {projectAnalytics.totalProjects}
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                            Active projects
                        </p>
                    </CardContent>
                </Card>

                {/* Projects On Track */}
                <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 border-emerald-200 dark:border-emerald-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">On Track</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                            {projectAnalytics.projectsOnTrack}
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                            Meeting expectations
                        </p>
                    </CardContent>
                </Card>

                {/* Projects At Risk */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 border-amber-200 dark:border-amber-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">At Risk</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                            {projectAnalytics.projectsAtRisk}
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                            Need attention
                        </p>
                    </CardContent>
                </Card>

                {/* Average Progress */}
                <Card className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-800/20 border-violet-200 dark:border-violet-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">Avg Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-violet-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-800 dark:text-violet-300">
                            {Math.round(projectAnalytics.projectsWithProgress.reduce((sum, p) => sum + p.completionRate, 0) / projectAnalytics.totalProjects)}%
                        </div>
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
                            Overall completion
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <div className="flex gap-2">
                    <button
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'all' ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'onTrack' ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setFilter('onTrack')}
                    >
                        On Track
                    </button>
                    <button
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'atRisk' ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setFilter('atRisk')}
                    >
                        At Risk
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600"
                />
            </div>

            {/* Project Details */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Folder className="h-5 w-5 text-indigo-600" />
                        Project Details & Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                                No projects found.
                            </div>
                        ) : (
                            filteredProjects.map((project) => (
                                <ProjectCard key={project._id} project={project} />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
