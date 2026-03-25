import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Target, Clock, CheckCircle, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery } from "@tanstack/react-query";
import { getAllTasksQueryFn } from "@/lib/api";
import { TaskType } from "@/types/api.type";
import { TaskStatusEnum } from "@/constant";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { useAuthContext } from "@/context/useAuthContext";
import { useMemo, useEffect, useState } from "react";
import { useAnalyticsWorker } from "@/hooks/use-analytics-worker";

// Helper function to generate expertise based on role
const getExpertiseFromRole = (roleName: string): string[] => {
    const roleExpertise: Record<string, string[]> = {
        'OWNER': ['Leadership', 'Strategy', 'Management'],
        'ADMIN': ['Administration', 'User Management', 'Coordination'],
        'MEMBER': ['Team Collaboration', 'Task Execution'],
        'Senior Developer': ['React', 'TypeScript', 'Node.js', 'Architecture'],
        'Developer': ['JavaScript', 'Frontend', 'Backend'],
        'UI/UX Designer': ['Figma', 'Design Systems', 'Prototyping'],
        'Backend Developer': ['APIs', 'Database', 'Server Architecture'],
        'Frontend Developer': ['React', 'CSS', 'UI/UX'],
        'Product Manager': ['Agile', 'Analytics', 'Strategy'],
        'DevOps': ['CI/CD', 'Docker', 'Cloud'],
        'QA Engineer': ['Testing', 'Automation', 'Quality Assurance']
    };

    return roleExpertise[roleName] || ['Team Collaboration', 'Project Management'];
};

// Fallback calculation on main thread (when worker is not available)
const calculateTeamAnalyticsFallback = (members: any[], allTasks: any[]) => {
    const currentDate = new Date();

    const teamMembers = members.map(member => {
        const memberTasks = allTasks.filter(task =>
            task.assignedTo?._id === member.userId._id
        );

        const completedTasks = memberTasks.filter(task =>
            task.status === TaskStatusEnum.DONE
        ).length;

        const inProgressTasks = memberTasks.filter(task =>
            task.status === TaskStatusEnum.IN_PROGRESS
        ).length;

        const overdueTasks = memberTasks.filter(task =>
            task.status !== TaskStatusEnum.DONE &&
            new Date(task.dueDate) < currentDate
        ).length;

        const totalTasks = memberTasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const currentTasks = memberTasks
            .filter(task => task.status !== TaskStatusEnum.DONE)
            .slice(0, 5)
            .map(task => task.title);

        const weeklyVelocity = completedTasks > 0 ? Math.round((completedTasks / 4) * 10) / 10 : 0;

        return {
            id: member._id,
            name: member.userId.name,
            email: member.userId.email,
            role: member.role.name,
            profilePicture: member.userId.profilePicture || null,
            tasksCompleted: completedTasks,
            totalTasks: totalTasks,
            overdueTasks: overdueTasks,
            inProgressTasks: inProgressTasks,
            completionRate: completionRate,
            weeklyVelocity: weeklyVelocity,
            currentTasks: currentTasks,
            expertise: getExpertiseFromRole(member.role.name)
        };
    });

    teamMembers.sort((a, b) => b.completionRate - a.completionRate);

    const totalTeamTasks = teamMembers.reduce((sum, member) => sum + member.totalTasks, 0);
    const totalCompletedTasks = teamMembers.reduce((sum, member) => sum + member.tasksCompleted, 0);
    const totalOverdueTasks = teamMembers.reduce((sum, member) => sum + member.overdueTasks, 0);
    const totalInProgressTasks = teamMembers.reduce((sum, member) => sum + member.inProgressTasks, 0);
    const teamCompletionRate = totalTeamTasks > 0 ? Math.round((totalCompletedTasks / totalTeamTasks) * 100) : 0;
    const averageVelocity = teamMembers.length > 0 ?
        teamMembers.reduce((sum, member) => sum + member.weeklyVelocity, 0) / teamMembers.length : 0;

    return {
        teamMembers,
        totalTeamTasks,
        totalCompletedTasks,
        totalOverdueTasks,
        totalInProgressTasks,
        teamCompletionRate,
        averageVelocity
    };
};

export default function TeamTab() {
    const workspaceId = useWorkspaceId();

    // Initialize Web Worker
    const { calculateTeamAnalytics: workerCalculate, isSupported: workerSupported } = useAnalyticsWorker();

    // Define team member type
    type TeamMember = {
        id: string;
        name: string;
        email: string;
        role: string;
        profilePicture: string | null;
        tasksCompleted: number;
        totalTasks: number;
        overdueTasks: number;
        inProgressTasks: number;
        completionRate: number;
        weeklyVelocity: number;
        currentTasks: string[];
        expertise: string[];
    };

    const [teamAnalytics, setTeamAnalytics] = useState<{
        teamMembers: TeamMember[];
        totalTeamTasks: number;
        totalCompletedTasks: number;
        totalOverdueTasks: number;
        totalInProgressTasks: number;
        teamCompletionRate: number;
        averageVelocity: number;
    }>({
        teamMembers: [],
        totalTeamTasks: 0,
        totalCompletedTasks: 0,
        totalOverdueTasks: 0,
        totalInProgressTasks: 0,
        teamCompletionRate: 0,
        averageVelocity: 0
    });
    const [workerLoading, setWorkerLoading] = useState(false);

    // Fetch workspace members
    const { data: membersData, isLoading: membersLoading } = useGetWorkspaceMembers(workspaceId);

    // Fetch all tasks in workspace
    const { data: tasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ["all-tasks", workspaceId],
        queryFn: () => getAllTasksQueryFn({ workspaceId }),
        enabled: !!workspaceId,
    });

    // Calculate team analytics using Web Worker (or fallback to main thread)
    useEffect(() => {
        const members = membersData?.members || [];
        const allTasks: TaskType[] = tasksData?.tasks || [];

        if (!members.length || !allTasks.length) {
            setTeamAnalytics({
                teamMembers: [],
                totalTeamTasks: 0,
                totalCompletedTasks: 0,
                totalOverdueTasks: 0,
                totalInProgressTasks: 0,
                teamCompletionRate: 0,
                averageVelocity: 0
            });
            return;
        }

        // Use Web Worker if supported, otherwise fallback to main thread
        if (workerSupported) {
            setWorkerLoading(true);
            workerCalculate(members, allTasks)
                .then((result) => {
                    setTeamAnalytics(result);
                    setWorkerLoading(false);
                })
                .catch((error) => {
                    console.error('Worker calculation failed, using fallback:', error);
                    // Fallback to main thread calculation
                    const result = calculateTeamAnalyticsFallback(members, allTasks);
                    setTeamAnalytics(result);
                    setWorkerLoading(false);
                });
        } else {
            // Direct calculation on main thread
            const result = calculateTeamAnalyticsFallback(members, allTasks);
            setTeamAnalytics(result);
        }
    }, [membersData?.members, tasksData?.tasks, workerCalculate, workerSupported]);

    const {
        teamMembers,
        totalCompletedTasks,
        totalOverdueTasks,
        totalInProgressTasks,
        teamCompletionRate,
        averageVelocity
    } = teamAnalytics;

    // Show loading state
    if (membersLoading || tasksLoading || workerLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                        {workerSupported && workerLoading
                            ? 'Computing team analytics in background...'
                            : 'Loading team analytics...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show empty state if no members or tasks
    if (!teamMembers.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Team Data</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Add team members and assign tasks to see analytics.
                    </p>
                </div>
            </div>
        );
    }

    // Get team performance insights
    const getTeamHealthStatus = () => {
        if (teamCompletionRate >= 85 && totalOverdueTasks <= 2) return { status: "Excellent", color: "green", emoji: "🚀" };
        if (teamCompletionRate >= 75 && totalOverdueTasks <= 4) return { status: "Good", color: "blue", emoji: "👍" };
        if (teamCompletionRate >= 60) return { status: "Average", color: "yellow", emoji: "⚡" };
        return { status: "Needs Attention", color: "red", emoji: "⚠️" };
    };

    const teamHealth = getTeamHealthStatus();

    return (
        <div className="space-y-6">
            {/* Enhanced Team Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Team Size */}
                <Card className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-800/20 border-violet-200 dark:border-violet-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">Team Size</CardTitle>
                        <Users className="h-4 w-4 text-violet-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-800 dark:text-violet-300">
                            {teamMembers.length}
                        </div>
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
                            Active team members
                        </p>
                    </CardContent>
                </Card>

                {/* Team Health */}
                <Card className={`bg-gradient-to-br ${teamHealth.status === 'Excellent' ? 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 border-emerald-200 dark:border-emerald-700' :
                    teamHealth.status === 'Good' ? 'from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-blue-200 dark:border-blue-700' :
                        teamHealth.status === 'Average' ? 'from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 border-amber-200 dark:border-amber-700' :
                            'from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-800/20 border-red-200 dark:border-red-700'
                    }`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${teamHealth.status === 'Excellent' ? 'text-emerald-700 dark:text-emerald-300' :
                            teamHealth.status === 'Good' ? 'text-blue-700 dark:text-blue-300' :
                                teamHealth.status === 'Average' ? 'text-amber-700 dark:text-amber-300' :
                                    'text-red-700 dark:text-red-300'
                            }`}>Team Health</CardTitle>
                        <Target className={`h-4 w-4 ${teamHealth.status === 'Excellent' ? 'text-emerald-600' :
                            teamHealth.status === 'Good' ? 'text-blue-600' :
                                teamHealth.status === 'Average' ? 'text-amber-600' :
                                    'text-red-600'
                            }`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold flex items-center gap-2 ${teamHealth.status === 'Excellent' ? 'text-emerald-800 dark:text-emerald-300' :
                            teamHealth.status === 'Good' ? 'text-blue-800 dark:text-blue-300' :
                                teamHealth.status === 'Average' ? 'text-amber-800 dark:text-amber-300' :
                                    'text-red-800 dark:text-red-300'
                            }`}>
                            {teamHealth.emoji} {teamHealth.status}
                        </div>
                        <p className={`text-xs mt-2 ${teamHealth.status === 'Excellent' ? 'text-emerald-600 dark:text-emerald-400' :
                            teamHealth.status === 'Good' ? 'text-blue-600 dark:text-blue-400' :
                                teamHealth.status === 'Average' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-red-600 dark:text-red-400'
                            }`}>
                            {teamCompletionRate}% completion rate
                        </p>
                    </CardContent>
                </Card>

                {/* Team Velocity */}
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-800/20 border-indigo-200 dark:border-indigo-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Avg Velocity</CardTitle>
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">
                            {averageVelocity.toFixed(1)}
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                            Tasks per week
                        </p>
                    </CardContent>
                </Card>

                {/* Active Tasks */}
                <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-800/20 border-teal-200 dark:border-teal-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">Active Tasks</CardTitle>
                        <Activity className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-teal-800 dark:text-teal-300">
                            {totalInProgressTasks}
                        </div>
                        <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                            Currently in progress
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Team Performance Overview */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Team Statistics */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                            <Target className="h-5 w-5 text-indigo-600" />
                            Team Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Completed Tasks</span>
                                </div>
                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{totalCompletedTasks}</span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">In Progress</span>
                                </div>
                                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{totalInProgressTasks}</span>
                            </div>

                            {totalOverdueTasks > 0 && (
                                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-red-800 dark:text-red-200">Overdue Tasks</span>
                                    </div>
                                    <span className="text-xl font-bold text-red-700 dark:text-red-300">{totalOverdueTasks}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performer Spotlight */}
                <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <Trophy className="h-5 w-5 text-amber-600" />
                            Top Performer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-14 w-14 border-3 border-amber-300 shadow-lg">
                                <AvatarImage
                                    src={getProfilePictureUrl(teamMembers[0]?.profilePicture || undefined) || undefined}
                                    alt={teamMembers[0]?.name}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                                <AvatarFallback className="bg-amber-100 text-amber-800 font-bold text-lg">
                                    {teamMembers[0]?.name ? getAvatarFallbackText(teamMembers[0].name) : "??"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-bold text-lg text-amber-900 dark:text-amber-100">{teamMembers[0]?.name}</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">{teamMembers[0]?.role}</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-800 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200">
                                        🎯 {teamMembers[0]?.completionRate}% completion
                                    </Badge>
                                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-800 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200">
                                        ⚡ {teamMembers[0]?.weeklyVelocity} tasks/week
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Members with Task Allocation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Team Members & Task Allocation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {teamMembers.map((member) => (
                            <Card key={member.id} className="bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-800/50 dark:via-gray-800/50 dark:to-zinc-700/50 border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <CardContent className="p-3">
                                    {/* Member Info - Compact */}
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Avatar className="h-8 w-8 shadow-sm">
                                            <AvatarImage
                                                src={getProfilePictureUrl(member.profilePicture || undefined) || undefined}
                                                alt={member.name}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                            <AvatarFallback
                                                className={`${getAvatarColor(member.name)} text-white font-semibold text-xs`}
                                            >
                                                {getAvatarFallbackText(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">{member.name}</h3>
                                            <Badge variant="outline" className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                                                {member.role}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Task Progress - Compact */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{member.tasksCompleted}/{member.totalTasks}</span>
                                        </div>

                                        {/* Progress Bar - Smaller */}
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${member.completionRate}%` }}
                                            />
                                        </div>

                                        {/* Task Stats - Compact Grid */}
                                        <div className="grid grid-cols-3 gap-1 text-sm">
                                            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded border border-emerald-200 dark:border-emerald-800">
                                                <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{member.tasksCompleted}</div>
                                                <div className="text-emerald-600 dark:text-emerald-400 text-xs">Done</div>
                                            </div>
                                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                                                <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">{member.inProgressTasks}</div>
                                                <div className="text-blue-600 dark:text-blue-400 text-xs">Active</div>
                                            </div>
                                            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/30 rounded border border-orange-200 dark:border-orange-800">
                                                <div className="font-bold text-orange-700 dark:text-orange-300 text-sm">{member.overdueTasks}</div>
                                                <div className="text-orange-600 dark:text-orange-400 text-xs">Overdue</div>
                                            </div>
                                        </div>

                                        {/* Velocity - Single Line */}
                                        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3 text-blue-500" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {member.weeklyVelocity}/week
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-orange-500" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {Array.isArray(member.currentTasks) ? member.currentTasks.length : 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
