"use client"
import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskTable from "@/components/workspace/task/task-table";
import KanbanBoard from "@/components/workspace/task/kanban-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Kanban, Calendar as CalendarIcon } from "lucide-react";
import dynamic from 'next/dynamic';
const TaskCalendar = dynamic(() => import('@/components/workspace/calendar/task-calendar'), { ssr: false });
const TaskAIAssistant = dynamic(() => import('@/components/workspace/ai/task-ai-assistant'), { ssr: false });
import { useState, useCallback } from "react";
import { TaskType } from "@/types/api.type";
import { TaskPriorityEnum } from "@/constant";

export default function Tasks() {

  return (
    <div className="flex flex-col space-y-8 p-6 sm:p-8 xs:p-1 lg:p-9">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-6 sm:space-y-0 bg-white dark:bg-card rounded-2xl p-6 shadow-lg dark:shadow-xl border border-gray-200 dark:border-border">
        <div className="space-y-3">
          <h2 className="text-2xl max-xs:text-center sm:text-3xl sm:text-left font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            All Tasks
          </h2>
          <p className="text-base sm:text-lg max-xs:text-center text-gray-600 dark:text-slate-300 font-medium">
            Manage and track your workspace tasks efficiently
          </p>
        </div>
        <div>
          <div className="transform hover:scale-105 transition-transform duration-200">
            <CreateTaskDialog />
          </div>
        </div>
      </div>

      {/* Task Views Tabs */}
      <div className="w-full">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent dark:bg-transparent rounded-xl p-1 gap-1">
            <TabsTrigger
              value="list"
              className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-slate-200 data-[state=active]:text-slate-800 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-200 data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:bg-slate-800 dark:data-[state=inactive]:text-slate-500 transition-all duration-200"
            >
              <List className="w-4 h-4" />
              <span>List View</span>
            </TabsTrigger>
            <TabsTrigger
              value="board"
              className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-slate-200 data-[state=active]:text-slate-800 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-200 data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:bg-slate-800 dark:data-[state=inactive]:text-slate-500 transition-all duration-200"
            >
              <Kanban className="w-4 h-4" />
              <span>Board View</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-slate-200 data-[state=active]:text-slate-800 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-200 data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:bg-slate-800 dark:data-[state=inactive]:text-slate-500 transition-all duration-200"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="list" className="mt-0">
              <div className="w-full overflow-hidden bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border shadow-sm dark:shadow-lg">
                <TaskTable />
              </div>
            </TabsContent>

            <TabsContent value="board" className="mt-0">
              <div className="w-full overflow-hidden bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-6 shadow-sm dark:shadow-lg">
                <KanbanBoard />
              </div>
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <div className="w-full overflow-hidden bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-6 shadow-sm dark:shadow-lg">
                <TaskCalendar />
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="mt-6">
          <TaskAIAssistant />
        </div>
      </div>
    </div>
  );
}
