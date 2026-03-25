"use client";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import ProjectAnalytics from "@/components/workspace/project/project-analytics";
import ProjectHeader from "@/components/workspace/project/project-header";
import TaskTable from "@/components/workspace/task/task-table";
import KanbanBoard from "@/components/workspace/task/kanban-board";
import { Button } from "@/components/ui/button";
import { List, Kanban, Info, Loader } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ProjectDetails = () => {
  const { viewMode, setViewMode, isLoaded } = useViewMode('list');
  const [isViewChanging, setIsViewChanging] = useState(false);

  const handleViewChange = (newView: 'list' | 'board') => {
    if (newView === viewMode || isViewChanging) return;

    setIsViewChanging(true);
    setViewMode(newView);

    // Reset loading state after a short delay to allow for smooth transition
    setTimeout(() => setIsViewChanging(false), 300);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleViewChange('list');
            break;
          case '2':
            event.preventDefault();
            handleViewChange('board');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, isViewChanging]);

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6 bg-background/50 dark:bg-slate-900/30 backdrop-blur-sm min-h-screen">
      <ProjectHeader />
      <div className="space-y-4 sm:space-y-5">
        <ProjectAnalytics />
        <Separator className="dark:border-slate-700/50" />

        {/* View Toggle */}
        <div className="flex flex-col gap-4 p-3 sm:p-4 rounded-xl bg-card/50 dark:bg-slate-800/40 border border-border/50 dark:border-slate-700/30 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100">
                Project Tasks
              </h3>

              {/* Current View Indicator */}
              {isLoaded && (
                <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-600'
                  : 'bg-purple-100 text-purple-700 dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-600'
                  }`}>
                  {viewMode === 'list' ? (
                    <>
                      <List className="w-3 h-3" />
                      <span className="hidden sm:inline">List View</span>
                      <span className="sm:hidden">List</span>
                    </>
                  ) : (
                    <>
                      <Kanban className="w-3 h-3" />
                      <span className="hidden sm:inline">Board View</span>
                      <span className="sm:hidden">Board</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/50"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg">
                    <div className="max-w-xs space-y-2">
                      <p className="font-medium text-gray-900 dark:text-slate-100">View Modes:</p>
                      <p className="text-gray-700 dark:text-slate-300"><strong>List View:</strong> Traditional table layout with sorting and filtering</p>
                      <p className="text-gray-700 dark:text-slate-300"><strong>Board View:</strong> Kanban-style drag & drop organization</p>
                      <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          💡 <strong>Keyboard shortcuts:</strong> Ctrl+1 (List) • Ctrl+2 (Board)
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* View Toggle Buttons - Full width on mobile */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('list')}
              disabled={isViewChanging || !isLoaded}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 transition-all duration-200 ${viewMode === 'list'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md dark:bg-blue-500 dark:hover:bg-blue-600'
                : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 border-gray-200 dark:border-slate-600'
                }`}
              title="Switch to List View (Ctrl+1)"
            >
              {isViewChanging && viewMode !== 'list' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <List className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">List View</span>
              <span className="sm:hidden">List</span>
            </Button>
            <Button
              variant={viewMode === 'board' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('board')}
              disabled={isViewChanging || !isLoaded}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 transition-all duration-200 ${viewMode === 'board'
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md dark:bg-purple-500 dark:hover:bg-purple-600'
                : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 border-gray-200 dark:border-slate-600'
                }`}
              title="Switch to Board View (Ctrl+2)"
            >
              {isViewChanging && viewMode !== 'board' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Kanban className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Board View</span>
              <span className="sm:hidden">Board</span>
            </Button>
          </div>
        </div>

        {/* Task View with Transition */}
        <div className="transition-all duration-300 ease-in-out">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-32 bg-card/30 dark:bg-slate-800/30 rounded-xl border border-border/50 dark:border-slate-700/30 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="animate-in slide-in-from-left-2 duration-300 bg-card/20 dark:bg-slate-800/20 rounded-xl border border-border/30 dark:border-slate-700/20 backdrop-blur-sm overflow-hidden">
              <TaskTable />
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-2 duration-300 bg-card/20 dark:bg-slate-800/20 rounded-xl border border-border/30 dark:border-slate-700/20 backdrop-blur-sm overflow-hidden">
              <KanbanBoard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
