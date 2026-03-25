"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  CheckCircle,
  Users,
  Settings,
  FolderPlus,
  ArrowRight,
  Star,
  Target,
  Zap,
} from "lucide-react";

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

interface TourStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features?: string[];
  action?: {
    label: string;
    description: string;
  };
  gradient: string;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, userName = "there" }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const tourSteps: TourStep[] = [
    {
      id: 0,
      title: `Welcome to Timeline, ${userName}!`,
      description: "Quick tour of the essentials so you can start fast.",
      icon: <Target className="w-6 h-6" />,
      features: ["Modern UI", "Real-time collaboration", "Analytics"],
      gradient: "from-green-500 to-teal-500",
    },
    {
      id: 1,
      title: "Dashboard",
      description: "Your overview: projects, recent activity, quick actions.",
      icon: <LayoutDashboard className="w-6 h-6" />,
      features: ["Project cards", "Activity feed", "Quick task"],
      action: { label: "Open Dashboard", description: "Use the sidebar to jump back anytime" },
      gradient: "from-gray-500 to-slate-600",
    },
    {
      id: 2,
      title: "Analytics",
      description: "Track progress and performance.",
      icon: <BarChart3 className="w-6 h-6" />,
      features: ["Completion rates", "Workload", "Trends"],
      action: { label: "Explore Analytics", description: "See workspace insights" },
      gradient: "from-orange-500 to-pink-500",
    },
    {
      id: 3,
      title: "Tasks",
      description: "Create, assign, and track tasks.",
      icon: <CheckCircle className="w-6 h-6" />,
      features: ["Kanban", "Priorities", "Due dates"],
      action: { label: "Manage Tasks", description: "Create your first task" },
      gradient: "from-green-500 to-teal-500",
    },
    {
      id: 4,
      title: "Team",
      description: "Invite members and set roles.",
      icon: <Users className="w-6 h-6" />,
      features: ["Invites", "Permissions", "Profiles"],
      action: { label: "View Team", description: "Manage workspace members" },
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      id: 5,
      title: "Projects",
      description: "Group related tasks with milestones.",
      icon: <FolderPlus className="w-6 h-6" />,
      features: ["Setup wizard", "Milestones", "Templates"],
      action: { label: "Create Project", description: "Start organizing work" },
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      id: 6,
      title: "Settings",
      description: "Customize your workspace and preferences.",
      icon: <Settings className="w-6 h-6" />,
      features: ["Workspace", "Notifications", "Integrations"],
      action: { label: "Open Settings", description: "Tune your experience" },
      gradient: "from-gray-500 to-slate-500",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setProgress((currentStep / (tourSteps.length - 1)) * 100);
    }
  }, [currentStep, isOpen, tourSteps.length]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) setCurrentStep((s) => s + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };
  const skipTour = () => onClose();
  const finishTour = () => onClose();

  const currentTourStep = tourSteps[currentStep];

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-xl w-[92vw] p-0 gap-0">
        {/* Header (compact) */}
        <div className={`bg-gradient-to-r ${currentTourStep.gradient} p-4 text-white relative overflow-hidden rounded-t-lg`}>

          {/* Progress bar (thin) */}
          <div className="mb-2">
            <div className="flex justify-between items-center gap-5 mb-3">
              <span className="text-xs font-medium opacity-90">Step {currentStep + 1} of {tourSteps.length}</span>
              <span className="mr-10 text-md font-medium opacity-90 ">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-white/20" />
          </div>

          <DialogHeader className="space-y-2 p-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <div className="text-white">{currentTourStep.icon}</div>
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white mb-1 leading-tight">{currentTourStep.title}</DialogTitle>
                <DialogDescription className="text-white/90 text-sm leading-snug">{currentTourStep.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content (compact) */}
        <div className="p-4">
          {currentTourStep.features && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Key Features
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {currentTourStep.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground leading-snug">{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {currentTourStep.action && (
            <div className="mt-3 p-3 rounded-md border border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md bg-gradient-to-r ${currentTourStep.gradient} text-white`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-semibold text-sm leading-tight">{currentTourStep.action.label}</h5>
                  <p className="text-xs text-muted-foreground leading-snug">{currentTourStep.action.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (compact) */}
        <div className="flex items-center justify-between p-3 border-t bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${index === currentStep ? `bg-gradient-to-r ${currentTourStep.gradient}` : "bg-gray-300 dark:bg-gray-600"}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={skipTour} className="text-muted-foreground hover:text-foreground">
              Skip
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
              )}
              {currentStep < tourSteps.length - 1 ? (
                <Button variant="default" size="sm" onClick={nextStep} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={finishTour} className="gap-2">
                  Done
                  <Zap className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
