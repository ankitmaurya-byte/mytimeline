"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  Zap,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Activity,
  Plus,
  MessageCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnimatedWorkflowProps {
  type: 'dashboard' | 'analytics' | 'tasks' | 'team' | 'projects' | 'settings';
  isActive: boolean;
}

export const AnimatedWorkflow: React.FC<AnimatedWorkflowProps> = ({ type, isActive }) => {
  const [step, setStep] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      setIsLooping(false);
      return;
    }

    setIsLooping(true);
    // Fast timing for projects, normal timing for others
    const intervalTime = type === 'projects' ? 500 : 1500; // 0.5s for projects, 1.5s for others
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % getStepsForType(type));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isActive, type]);

  const getStepsForType = (workflowType: string) => {
    switch (workflowType) {
      case 'dashboard': return 4;
      case 'analytics': return 3;
      case 'tasks': return 5;
      case 'team': return 4;
      case 'projects': return 1; // Fast skip - only 1 step
      case 'settings': return 3;
      default: return 3;
    }
  };

  const renderDashboardWorkflow = () => (
    <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg overflow-hidden">
      {/* Step indicators */}
      <div className="absolute top-2 right-2 flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-gradient-to-r from-gray-500 to-slate-600 scale-110' : 'bg-gray-300'
            }`} />
        ))}
      </div>

      {/* Dashboard cards animation */}
      <div className="absolute inset-4 grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: step >= 0 ? 1 : 0,
            y: step >= 0 ? 0 : 10,
            scale: step === 0 ? 1.05 : 1
          }}
          className="bg-white dark:bg-gray-800 rounded-md p-3 border shadow-sm"
        >
          <div className="flex items-center gap-1 mb-1">
            <Target className="w-3 h-3 text-blue-500" />
            <span className="text-sm font-medium">Active Projects</span>
          </div>
          <div className="text-base font-bold text-blue-600">
            {step >= 1 ? '5' : '0'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: step >= 1 ? 1 : 0,
            y: step >= 1 ? 0 : 10,
            scale: step === 1 ? 1.05 : 1
          }}
          className="bg-white dark:bg-gray-800 rounded-md p-3 border shadow-sm"
        >
          <div className="flex items-center gap-1 mb-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <div className="text-sm font-bold text-green-600">
            {step >= 2 ? '23' : '18'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: step >= 2 ? 1 : 0,
            y: step >= 2 ? 0 : 10,
            scale: step === 2 ? 1.05 : 1
          }}
          className="bg-white dark:bg-gray-800 rounded-md p-2 border shadow-sm col-span-2"
        >
          <div className="flex items-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-purple-500 animate-pulse" />
            <span className="text-xs font-medium">Recent Activity</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {step >= 3 ? '🎉 New milestone achieved!' : '📝 Task "UI Design" completed'}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderAnalyticsWorkflow = () => (
    <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-orange-500 scale-110' : 'bg-gray-300'
            }`} />
        ))}
      </div>

      <div className="absolute inset-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: step >= 0 ? 1 : 0 }}
          className="mb-2"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Team Performance</span>
            <TrendingUp className="w-3 h-3 text-orange-500" />
          </div>

          <div className="space-y-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: step >= 1 ? '75%' : '45%' }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-r from-orange-400 to-pink-500 h-2 rounded-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: step >= 2 ? '90%' : '60%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: step >= 1 ? '65%' : '35%' }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-gradient-to-r from-purple-400 to-indigo-500 h-2 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: step >= 2 ? 1 : 0,
            y: step >= 2 ? 0 : 10
          }}
          className="text-center"
        >
          <div className="text-lg font-bold text-orange-500">
            {step >= 2 ? '87%' : '72%'}
          </div>
          <div className="text-xs text-gray-500">Overall Efficiency</div>
        </motion.div>
      </div>
    </div>
  );

  const renderTasksWorkflow = () => (
    <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-green-500 scale-110' : 'bg-gray-300'
            }`} />
        ))}
      </div>

      <div className="absolute inset-2 grid grid-cols-3 gap-1 text-xs">
        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded">
          <div className="text-xs font-medium mb-1">To Do</div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: step >= 0 ? 1 : 0,
              scale: step >= 0 ? 1 : 0.8
            }}
            className="bg-white dark:bg-gray-800 p-1 rounded border mb-1"
          >
            <div className="text-xs">Setup project</div>
            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          </motion.div>
          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-1 rounded border"
            >
              <div className="text-xs">New task</div>
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            </motion.div>
          )}
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded">
          <div className="text-xs font-medium mb-1">In Progress</div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: step >= 1 ? 1 : 0,
              scale: step >= 1 ? 1 : 0.8
            }}
            className="bg-white dark:bg-gray-800 p-1 rounded border"
          >
            <div className="text-xs">Design UI</div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
          </motion.div>
          {step < 1 && (
            <motion.div
              animate={{ x: step === 1 ? 20 : 0, opacity: step >= 1 ? 0 : 1 }}
              className="bg-white dark:bg-gray-800 p-1 rounded border"
            >
              <div className="text-xs">Setup project</div>
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            </motion.div>
          )}
        </div>

        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded">
          <div className="text-xs font-medium mb-1">Done</div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: step >= 2 ? 1 : 0,
              scale: step >= 2 ? 1 : 0.8
            }}
            className="bg-white dark:bg-gray-800 p-1 rounded border"
          >
            <div className="text-xs line-through">Initial meeting</div>
            <CheckCircle className="w-2 h-2 text-green-500" />
          </motion.div>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-1 rounded border"
            >
              <div className="text-xs line-through">Setup project</div>
              <CheckCircle className="w-2 h-2 text-green-500" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTeamWorkflow = () => (
    <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-purple-500 scale-110' : 'bg-gray-300'
            }`} />
        ))}
      </div>

      <div className="absolute inset-4 space-y-1">
        {[
          { name: "Vansh", color: "from-purple-400 to-purple-600", online: true },
          { name: "Madhav", color: "from-blue-400 to-blue-600", online: step >= 1 },
          { name: "Puja", color: "from-green-400 to-green-600", online: step >= 2 },
        ].map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: step >= index ? 1 : 0.3,
              x: step >= index ? 0 : -10
            }}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded border"
          >
            <div className={`w-4 h-4 bg-gradient-to-br ${member.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
              {member.name[0]}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-medium">{member.name}</div>
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${member.online ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-gray-500">{member.online ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            {step >= 3 && index === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-100 text-blue-700 px-1 rounded text-xs"
              >
                New Task
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Fast projects workflow - skips quickly with minimal animation
  const renderProjectsWorkflow = () => (
    <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg overflow-hidden">
      <div className="absolute inset-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }} // Fast transition
          className="bg-white dark:bg-gray-800 p-3 rounded border h-full flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <div className="text-sm font-medium text-teal-600 dark:text-teal-400">Projects Ready!</div>
            <div className="text-xs text-gray-500 mt-1">Organize your work efficiently</div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderSettingsWorkflow = () => (
    <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-gray-500 scale-110' : 'bg-gray-300'
            }`} />
        ))}
      </div>

      <div className="absolute inset-4 space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: step >= 0 ? 1 : 0 }}
          className="bg-white dark:bg-gray-800 p-2 rounded border"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Dark Mode</span>
            <motion.div
              animate={{
                backgroundColor: step >= 1 ? '#3b82f6' : '#d1d5db'
              }}
              className="w-6 h-3 rounded-full p-0.5 cursor-pointer"
            >
              <motion.div
                animate={{ x: step >= 1 ? 12 : 0 }}
                className="w-2 h-2 bg-white rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: step >= 1 ? 1 : 0 }}
          className="bg-white dark:bg-gray-800 p-2 rounded border"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Notifications</span>
            <motion.div
              animate={{
                backgroundColor: step >= 2 ? '#10b981' : '#d1d5db'
              }}
              className="w-6 h-3 rounded-full p-0.5 cursor-pointer"
            >
              <motion.div
                animate={{ x: step >= 2 ? 12 : 0 }}
                className="w-2 h-2 bg-white rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>

        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 dark:bg-green-900/30 p-2 rounded border text-center"
          >
            <div className="text-xs text-green-700 dark:text-green-300">
              ✅ Settings saved successfully!
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderWorkflow = () => {
    switch (type) {
      case 'dashboard': return renderDashboardWorkflow();
      case 'analytics': return renderAnalyticsWorkflow();
      case 'tasks': return renderTasksWorkflow();
      case 'team': return renderTeamWorkflow();
      case 'projects': return renderProjectsWorkflow();
      case 'settings': return renderSettingsWorkflow();
      default: return <div>Workflow not found</div>;
    }
  };

  return (
    <div className="w-full">
      {renderWorkflow()}
    </div>
  );
};

export default AnimatedWorkflow;
