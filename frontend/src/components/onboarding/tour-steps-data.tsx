"use client";
import React from "react";
import { LayoutDashboard, BarChart3, CheckCircle, Users, Settings, FolderPlus, Target, Rocket, Crown, Activity, TrendingUp, PlusCircle, UserCheck, Palette } from "lucide-react";
import type { TourStep } from "./TourStepsData";

export const tourStepsData: TourStep[] = [
    {
        title: "🎉 Welcome to Timeline, {userName}!",
        description: "Let's take a visual tour of your new workspace and discover what you can achieve together.",
        icon: <Target className="w-6 h-6" />,
        keyBenefit: "Your productivity companion",
        features: ["✨ Modern & intuitive interface", "🚀 Real-time collaboration", "📊 Powerful analytics", "🎯 Goal-oriented workflows"],
        gradient: "from-gray-500 to-slate-600 dark:from-gray-600 dark:to-slate-700",
        demoElements: (
            <div className="relative p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                <div className="flex items-center justify-center">
                    <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400/90 to-purple-500/90 rounded-full flex items-center justify-center animate-pulse">
                            <Rocket className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                            <Crown className="w-3 h-3 text-yellow-800" />
                        </div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-300 rounded-full animate-ping opacity-30"></div>
                    </div>
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-3">
                    Ready to boost your productivity? 🚀
                </p>
            </div>
        ),
        tips: ["Click through each step to explore", "You can always restart this tour later", "Each section has unique superpowers!"]
    },
    {
        title: "📊 Dashboard - Your Command Center",
        description: "Get the bird's eye view of everything happening in your workspace. See progress, activity, and take quick actions.",
        icon: <LayoutDashboard className="w-6 h-6" />,
        keyBenefit: "Complete overview at a glance",
        features: ["📋 Project cards with live progress", "⚡ Recent activity feed", "🎯 Quick task creation", "📈 Performance metrics"],
        action: {
            label: "Explore Dashboard",
            description: "Jump to your main command center",
            route: `/workspace/{workspaceId}`
        },
        gradient: "from-gray-500 to-slate-600 dark:from-gray-600 dark:to-slate-700",
        spotlightSelector: '[data-tour-id="nav-dashboard"]',
        workflowType: 'dashboard',
        demoElements: (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium">Active Projects</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">3</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium">Tasks Done</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">24</div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                        <span className="text-xs font-semibold">Recent Activity</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Task completed</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-gray-600 dark:text-gray-300">New member joined</span>
                        </div>
                    </div>
                </div>
            </div>
        ),
        tips: ["Dashboard updates in real-time", "Customize widgets to your needs", "Quick actions save tons of time"]
    },
    {
        title: "📈 Analytics - Data-Driven Insights",
        description: "Transform your workspace data into actionable insights. Track progress, identify bottlenecks, and optimize performance.",
        icon: <BarChart3 className="w-6 h-6" />,
        keyBenefit: "Make informed decisions with data",
        features: ["📊 Visual completion tracking", "⚖️ Team workload balance", "📈 Performance trends", "🎯 Goal achievement metrics"],
        action: {
            label: "View Analytics",
            description: "Explore your workspace insights",
            route: `/workspace/{workspaceId}/analytics`
        },
        gradient: "from-orange-500/85 via-red-500/85 to-pink-500/85 dark:from-orange-600/90 dark:via-red-600/90 dark:to-pink-600/90",
        spotlightSelector: '[data-tour-id="nav-analytics"]',
        workflowType: 'analytics',
        demoElements: (
            <div className="space-y-3">
                <div className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">Project Progress</span>
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xs w-16">Design</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-green-400/80 to-green-500/80 h-2 rounded-full w-4/5 animate-pulse"></div>
                            </div>
                            <span className="text-xs text-green-600 font-medium">80%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs w-16">Dev</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-400/80 to-blue-500/80 h-2 rounded-full w-3/5 animate-pulse"></div>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">60%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs w-16">Testing</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-orange-400/80 to-orange-500/80 h-2 rounded-full w-1/3 animate-pulse"></div>
                            </div>
                            <span className="text-xs text-orange-600 font-medium">35%</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="text-center">
                        <div className="text-lg font-bold text-orange-500">87%</div>
                        <div className="text-xs text-gray-500">On-time</div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-pink-500">4.2</div>
                        <div className="text-xs text-gray-500">Avg Rating</div>
                    </div>
                </div>
            </div>
        ),
        tips: ["Charts update automatically", "Export reports for presentations", "Set up custom alerts"]
    },
    {
        title: "✅ Tasks - Where Work Gets Done",
        description: "Create, organize, and track tasks with powerful features. Use Kanban boards, set priorities, and never miss a deadline.",
        icon: <CheckCircle className="w-6 h-6" />,
        keyBenefit: "Organize work like a pro",
        features: ["📋 Kanban board view", "⭐ Priority levels", "📅 Due date tracking", "🏷️ Custom labels & filters"],
        action: {
            label: "Manage Tasks",
            description: "Create and organize your tasks",
            route: `/workspace/{workspaceId}/tasks`
        },
        gradient: "from-green-500/85 to-emerald-500/85 dark:from-green-600/90 dark:to-emerald-600/90",
        spotlightSelector: '[data-tour-id="nav-tasks"]',
        workflowType: 'tasks',
        demoElements: (
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">5</div>
                            <div className="text-xs text-gray-500">To Do</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">3</div>
                            <div className="text-xs text-gray-500">In Progress</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">12</div>
                            <div className="text-xs text-gray-500">Done</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-semibold">Quick Actions</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded text-xs text-center">+ Add Task</div>
                        <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded text-xs text-center">Filter</div>
                    </div>
                </div>
            </div>
        ),
        tips: ["Drag & drop to move tasks", "Use keyboard shortcuts", "Set up recurring tasks"]
    },
    {
        title: "👥 Team - Collaboration Made Easy",
        description: "Invite team members, assign roles, and collaborate seamlessly. Manage permissions and keep everyone in sync.",
        icon: <Users className="w-6 h-6" />,
        keyBenefit: "Teamwork at its finest",
        features: ["📧 Easy member invitations", "🛡️ Role-based permissions", "👤 User profiles & avatars", "🔔 Team notifications"],
        action: {
            label: "Manage Team",
            description: "Invite and manage team members",
            route: `/workspace/{workspaceId}/members`
        },
        gradient: "from-purple-500/85 via-pink-500/85 to-rose-500/85 dark:from-purple-600/90 dark:via-pink-600/90 dark:to-rose-600/90",
        spotlightSelector: '[data-tour-id="nav-members"]',
        workflowType: 'team',
        demoElements: (
            <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 bg-gradient-to-br from-purple-400/90 to-indigo-500/90 rounded-full flex items-center justify-center text-white text-sm font-medium animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                            {String.fromCharCode(64 + i)}
                        </div>
                    ))}
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <PlusCircle className="w-5 h-5 text-gray-500" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold">Team Stats</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                            <div className="font-bold text-purple-600">4</div>
                            <div className="text-gray-500">Members</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-indigo-600">3</div>
                            <div className="text-gray-500">Active</div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        tips: ["Set up teams within teams", "Customize notification preferences", "Track team performance"]
    },
    {
        title: "📁 Projects - Organize Like a Pro",
        description: "Group related tasks into projects with milestones. Use templates, track progress, and achieve your goals systematically.",
        icon: <FolderPlus className="w-6 h-6" />,
        keyBenefit: "Structure your work effectively",
        features: ["🎯 Project templates", "🏁 Milestone tracking", "📊 Progress visualization", "🔄 Project workflows"],
        action: {
            label: "Create Project",
            description: "Start a new project",
            route: `/workspace/{workspaceId}/projects`
        },
        gradient: "from-teal-500/85 to-cyan-500/85 dark:from-teal-600/90 dark:to-cyan-600/90",
        spotlightSelector: '[data-tour-id="nav-projects"]',
        workflowType: 'projects',
        demoElements: (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            <span className="text-xs font-medium">Website Redesign</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">Due in 2 weeks</div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                            <div className="bg-gradient-to-r from-teal-400/80 to-cyan-500/80 h-1 rounded-full w-3/4"></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            <span className="text-xs font-medium">Mobile App</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">Due in 1 month</div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                            <div className="bg-gradient-to-r from-cyan-400/80 to-teal-500/80 h-1 rounded-full w-1/2"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <FolderPlus className="w-4 h-4 text-teal-500" />
                        <span className="text-xs font-semibold">Quick Start</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded text-xs text-center">Template</div>
                        <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded text-xs text-center">Blank</div>
                    </div>
                </div>
            </div>
        ),
        tips: ["Use templates to get started quickly", "Set up automated workflows", "Track budget and resources"]
    },
    {
        title: "⚙️ Settings - Make It Yours",
        description: "Customize your workspace to fit your team's needs. Configure notifications, integrations, and preferences.",
        icon: <Settings className="w-6 h-6" />,
        keyBenefit: "Tailor your workspace experience",
        features: ["🔧 Workspace customization", "🔔 Notification preferences", "🔗 Third-party integrations", "🎨 Theme & appearance"],
        action: {
            label: "Configure Settings",
            description: "Customize your workspace",
            route: `/workspace/{workspaceId}/settings`
        },
        gradient: "from-slate-500/85 to-gray-500/85 dark:from-slate-600/90 dark:to-gray-600/90",
        spotlightSelector: '[data-tour-id="nav-settings"]',
        workflowType: 'settings',
        demoElements: (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-medium">Theme</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded"></div>
                            <div className="w-4 h-4 bg-gray-800 border-2 border-gray-300 rounded"></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-medium">Integrations</span>
                        </div>
                        <div className="text-xs text-gray-500">3 connected</div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold">Quick Settings</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span>Email Notifications</span>
                            <div className="w-6 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span>Dark Mode</span>
                            <div className="w-6 h-3 bg-gray-300 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        tips: ["Set up team permissions", "Connect your favorite tools", "Customize your dashboard layout"]
    }
];
