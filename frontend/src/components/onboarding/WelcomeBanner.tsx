"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useWorkspaceId from '../../hooks/use-workspace-id';
import {
  X,
  Lightbulb,
  Rocket,
  Users,
  Target,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAuthContext } from "@/context/useAuthContext";
import { useProjectDialog } from "@/context/project-dialog-context";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";

interface WelcomeBannerProps {
  className?: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ className = "" }) => {
  const workspaceId = useWorkspaceId();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const { user } = useAuthContext();
  const { isOnboardingComplete, showOnboarding } = useOnboarding();
  const { openDialog: openProjectDialog } = useProjectDialog();
  const router = useRouter();

  const tips = [
    {
      icon: <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Create Your First Project",
      description: "Kickstart your productivity by creating a project and organizing your tasks.",
      action: "Get Started"
    },
    {
      icon: <Users className="w-5 h-5 text-green-600 dark:text-green-400" />,
      title: "Invite Your Team",
      description: "Collaborate instantly by inviting teammates to your workspace.",
      action: "Add Members"
    },
    {
      icon: <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      title: "Set Task Priorities",
      description: "Stay focused by prioritizing tasks and meeting your goals.",
      action: "Learn More"
    },
  ];

  useEffect(() => {
    if (!user) return;

    // Check if user has dismissed the welcome banner
    const dismissed = localStorage.getItem(`welcome-banner-dismissed-${user._id}`);

    // Check if user has completed onboarding (check localStorage directly for more reliable state)
    const hasCompletedTour = localStorage.getItem('timeline-tour-completed') === 'true';
    const userSpecificKey = `timeline-tour-completed-${user._id}`;
    const hasCompletedUserTour = localStorage.getItem(userSpecificKey) === 'true';
    const hasCompletedAnyTour = hasCompletedTour || hasCompletedUserTour;

    if (!dismissed && !hasCompletedAnyTour) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user, isOnboardingComplete]);

  // Listen for onboarding completion events to hide banner immediately
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ action?: 'show' | 'hide' | 'complete' }>;
      const action = ce.detail?.action;
      if (action === 'complete') {
        setIsVisible(false);
      }
    };

    window.addEventListener('timeline:onboarding', handler as EventListener);
    return () => window.removeEventListener('timeline:onboarding', handler as EventListener);
  }, []);

  // Auto-cycle tips only when the banner is visible
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, tips.length]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (user) {
      localStorage.setItem(`welcome-banner-dismissed-${user._id}`, 'true');
    }
  };

  // Additional check: Don't show banner if user has completed onboarding
  useEffect(() => {
    if (!user) return;

    const hasCompletedTour = localStorage.getItem('timeline-tour-completed') === 'true';
    const userSpecificKey = `timeline-tour-completed-${user._id}`;
    const hasCompletedUserTour = localStorage.getItem(userSpecificKey) === 'true';

    if (hasCompletedTour || hasCompletedUserTour) {
      setIsVisible(false);
    }
  }, [user]);

  const handleTakeTour = () => {
    // Dismiss the banner immediately
    setIsVisible(false);
    if (user) {
      localStorage.setItem(`welcome-banner-dismissed-${user._id}`, 'true');
    }

    // If we're on /workspace without an ID, we need to navigate to the actual workspace first
    // The tour will be triggered after navigation
    if (workspaceId) {
      // We're already in a workspace, show the tour immediately
      showOnboarding();
    } else {
      // We're on /workspace redirect page, need to navigate to actual workspace first
      // Set a flag to trigger tour after navigation
      localStorage.setItem('trigger-tour-after-navigation', 'true');
      // The WorkspaceRedirect component will handle the navigation and tour triggering
    }
  };

  if (!isVisible || !user) return null;

  const currentTipData = tips[currentTip];

  return (
    <Card className={`relative overflow-hidden bg-card/50 dark:bg-slate-800/40 backdrop-blur-sm border border-border/50 dark:border-slate-700/30 shadow-sm dark:shadow-lg ${className}`}>
      <CardContent className="p-4 sm:p-6">
        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon and Content */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              {currentTipData.icon}
            </div>            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Welcome, {user.name?.split(' ')[0]}!
                </h3>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Tip {currentTip + 1}/{tips.length}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {currentTipData.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentTipData.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTakeTour}
              className="text-xs gap-1 flex-1 sm:flex-none"
            >
              <Lightbulb className="w-3 h-3" />
              Take Tour
            </Button>
            <Button
              variant="default"
              size="sm"
              className="text-xs gap-1 flex-1 sm:flex-none"
              onClick={() => {
                const action = currentTipData.action;
                if (action === "Get Started") {
                  openProjectDialog();
                } else if (action === "Add Members") {
                  router.push(`/workspace/${workspaceId}/members`);
                } else if (action === "Learn More") {
                  if (workspaceId) router.push(`/workspace/${workspaceId}/tasks`);
                } else {
                  openProjectDialog();
                }
              }}
            >
              {currentTipData.action}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-1 mt-3">
          {tips.map((_, index) => {
            const isActive = index === currentTip;
            return (
              <button
                key={index}
                type="button"
                aria-label={`Show tip ${index + 1}`}
                aria-pressed={isActive}
                onClick={() => setCurrentTip(index)}
                className={`h-1.5 rounded-full duration-1000 focus:outline-none focus:ring-2 focus:ring-blue-300 ${isActive ? 'bg-blue-500 w-4' : 'bg-gray-300 dark:bg-gray-600 w-1.5'
                  }`}
              />
            );
          })}
        </div>

        {/* Subtle Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 dark:from-indigo-500/20 dark:to-blue-500/20 rounded-full blur-xl pointer-events-none" />
      </CardContent>
    </Card>
  );
};

export default WelcomeBanner;
