"use client";

import { Plus, Sparkles, TrendingUp, Users, FolderOpen, Calendar, Clock, Target, Zap, ArrowRight, Star, Activity, CheckCircle2, AlertTriangle, BarChart3, Sun, Moon, Sunset } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectDialog } from "@/context/project-dialog-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoadingContext } from "@/components/loading";

// Lazy load heavy components with better loading states
const WorkspaceAnalytics = dynamic(() => import("@/components/workspace/workspace-analytics"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-lg animate-pulse" />
});

const RecentProjects = dynamic(() => import("@/components/workspace/project/recent-projects"), {
  ssr: false,
  loading: () => <div className="h-48 bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg animate-pulse" />
});

const RecentTasks = dynamic(() => import("@/components/workspace/task/recent-tasks"), {
  ssr: false,
  loading: () => <div className="h-48 bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-800 dark:to-slate-700 rounded-lg animate-pulse" />
});

const RecentMembers = dynamic(() => import("@/components/workspace/member/recent-members"), {
  ssr: false,
  loading: () => <div className="h-48 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-lg animate-pulse" />
});

const EnhancedOnboardingTour = dynamic(() => import("@/components/onboarding/EnhancedOnboardingTour"), {
  ssr: false,
  loading: () => null // No loading state for tour
});

const WelcomeBanner = dynamic(() => import("@/components/onboarding/WelcomeBanner"), {
  ssr: false,
  loading: () => <div className="h-24 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-lg animate-pulse" />
});

import { useAuthContext } from "@/context/useAuthContext";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceAnalyticsQueryFn } from "@/lib/api";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CreateTaskForm from "@/components/workspace/task/create-task-form";

const WorkspaceDashboard = () => {
  const { openDialog } = useProjectDialog();
  const { isStrategicLoading } = useLoadingContext();
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [showCreateTask, setShowCreateTask] = useState(false);

  const { user } = useAuthContext();

  // Fetch analytics data for quick stats
  const { data: analyticsData } = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: () => getWorkspaceAnalyticsQueryFn(workspaceId),
    enabled: !!workspaceId,
  });

  const analytics = analyticsData?.analytics;

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  // Get current time for greeting and appropriate icon
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoonnn";
    if (hour < 22) return "Good Evening";
    return "Good Night";
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-500 dark:text-yellow-400" />;
    if (hour < 18) return <Sun className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-orange-500 dark:text-orange-400" />;
    if (hour < 22) return <Moon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-indigo-600 dark:text-indigo-400" />;
    return <Moon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-purple-600 dark:text-purple-400" />;
  };

  // Navigation handlers
  const handleCreateTask = () => {
    setShowCreateTask(true);
  };

  const handleScheduleMeeting = () => {
    // For now, navigate to tasks page where they can create a task for the meeting
    router.push(`/workspace/${workspaceId}/tasks`);
  };

  const handleInviteMember = () => {
    router.push(`/workspace/${workspaceId}/members`);
  };

  const handleViewReports = () => {
    router.push(`/workspace/${workspaceId}/analytics`);
  };

  return (
    <main className="flex flex-1 flex-col py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-3 space-y-6 sm:space-y-8">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-slate-900/90 dark:to-gray-900 p-4 sm:p-6 md:p-8 border border-blue-100 dark:border-gray-700 shadow-lg">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-xl animate-pulse delay-500"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/90 dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                {getGreetingIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-gray-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent break-words">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              Here's your workspace overview. Track progress, manage tasks, and stay productive.
            </p>
          </div>
          <Button
            onClick={openDialog}
            size="lg"
            className="flex items-center gap-2 w-full sm:w-auto rounded-xl font-semibold transition-all duration-200 transform-gpu hover:scale-105 text-sm sm:text-base dark:bg-black dark:text-white dark:hover:bg-gray-900 dark:border dark:border-gray-700"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">New Project</span>
            <span className="xs:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Welcome Banner for New Users */}
      <WelcomeBanner />

      {/* Analytics Section */}
      <div className="space-y-4">
        <WorkspaceAnalytics />
      </div>

      {/* Enhanced Tabs Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Recent Activity
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Stay updated with your latest projects, tasks, and team members
            </p>
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 dark:bg-gray-950/90 dark:border dark:border-gray-700/50 rounded-xl border-0 p-1 shadow-sm backdrop-blur-sm">
            <TabsTrigger
              value="projects"
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800/80 dark:data-[state=active]:border-gray-600/50 transition-all duration-300 text-xs sm:text-sm font-medium"
            >
              <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Recent Projects</span>
              <span className="sm:hidden">Projects</span>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800/80 dark:data-[state=active]:border-gray-600/50 transition-all duration-200 text-xs sm:text-sm"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Recent Tasks</span>
              <span className="sm:hidden">Tasks</span>
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800/80 dark:data-[state=active]:border-gray-600/50 transition-all duration-200 text-xs sm:text-sm"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Recent Members</span>
              <span className="sm:hidden">Members</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 sm:mt-4 md:mt-6 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white/90 dark:bg-gray-950/95 shadow-sm dark:shadow-lg dark:shadow-gray-900/20 backdrop-blur-sm">
            <TabsContent value="projects" className="p-2 sm:p-3 md:p-4">
              <RecentProjects />
            </TabsContent>
            <TabsContent value="tasks" className="p-2 sm:p-3 md:p-4">
              <RecentTasks />
            </TabsContent>
            <TabsContent value="members" className="p-2 sm:p-3 md:p-4">
              <RecentMembers />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Quick Actions Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-lg sm:text-xl">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            Quick Actions
          </CardTitle>
          <CardDescription className="dark:text-gray-300 text-sm">
            Common tasks to help you get things done faster
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={handleCreateTask}
              className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white dark:hover:bg-gray-800/80 dark:border-gray-600/50 dark:bg-gray-800/40 dark:text-gray-200 transition-all duration-300 backdrop-blur-sm"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-xs sm:text-sm text-center">Create Task</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleScheduleMeeting}
              className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white dark:hover:bg-gray-800/80 dark:border-gray-600/50 dark:bg-gray-800/40 dark:text-gray-200 transition-all duration-300 backdrop-blur-sm"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              <span className="font-medium text-xs sm:text-sm text-center">Schedule Meeting</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleInviteMember}
              className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white dark:hover:bg-gray-800/80 dark:border-gray-600/50 dark:bg-gray-800/40 dark:text-gray-200 transition-all duration-300 backdrop-blur-sm"
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-xs sm:text-sm text-center">Invite Member</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleViewReports}
              className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white dark:hover:bg-gray-800/80 dark:border-gray-600/50 dark:bg-gray-800/40 dark:text-gray-200 transition-all duration-300 backdrop-blur-sm"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
              <span className="font-medium text-xs sm:text-sm text-center">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <CreateTaskForm onClose={() => setShowCreateTask(false)} />
        </DialogContent>
      </Dialog>
    </main >
  );
};

export default WorkspaceDashboard;
