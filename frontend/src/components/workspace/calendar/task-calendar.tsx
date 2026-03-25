"use client";
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllTasksQueryFn } from '@/lib/api';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { TaskType } from '@/types/api.type';
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isSameDay, isSameMonth, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CalendarIcon, RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarSelectionStore } from './use-calendar-selection-store';
import CreateTaskDialog from '../task/create-task-dialog';

interface DayCell { date: Date; tasks: TaskType[]; }

const buildRange = (current: Date) => {
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return { gridStart, gridEnd };
};

const priorityColors: Record<string, string> = {
  HIGH: 'border-red-50 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/30 dark:text-red-300',
  MEDIUM: 'border-yellow-50 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-300',
  LOW: 'border-green-50 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-950/30 dark:text-green-300'
};

const statusDot: Record<string, string> = {
  DONE: 'bg-green-500',
  IN_PROGRESS: 'bg-orange-500',
  IN_REVIEW: 'bg-purple-500',
  TODO: 'bg-gray-400',
  BACKLOG: 'bg-slate-300'
};

const TaskCalendar: React.FC = () => {
  const workspaceId = useWorkspaceId();
  const [current, setCurrent] = useState(new Date());
  const [bannerDate, setBannerDate] = useState(() => new Date()); // Always show today's date by default
  const { gridStart, gridEnd } = useMemo(() => buildRange(current), [current]);
  const { selectedDate, setDate, toggle } = useCalendarSelectionStore();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calendar-tasks', workspaceId, gridStart.toISOString(), gridEnd.toISOString()],
    queryFn: () => getAllTasksQueryFn({ workspaceId, dueDateStart: gridStart.toISOString(), dueDateEnd: gridEnd.toISOString(), pageSize: 100, pageNumber: 1 }),
    enabled: !!workspaceId,
    staleTime: 5 * 1000, // 5 seconds cache for better real-time sync
    gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
  });

  const tasks = data?.tasks || [];

  const days: DayCell[] = useMemo(() => {
    const dayCells: DayCell[] = [];
    let date = gridStart;
    while (date <= gridEnd) {
      const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));
      dayCells.push({ date, tasks: dayTasks });
      date = addDays(date, 1);
    }
    return dayCells;
  }, [gridStart, gridEnd, tasks]);

  const monthLabel = format(current, 'MMMM yyyy');

  // Listen for custom task update events
  useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent) => {
      const { workspaceId: eventWorkspaceId } = event.detail;
      if (eventWorkspaceId === workspaceId) {
        queryClient.invalidateQueries({
          queryKey: ['calendar-tasks', workspaceId],
          exact: false
        });
      }
    };

    window.addEventListener('taskUpdated', handleTaskUpdate as EventListener);
    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdate as EventListener);
    };
  }, [workspaceId, queryClient]);

  // Set today's date as default selected date on mount
  useEffect(() => {
    setDate(new Date());
  }, [setDate]);

  // Set today's date as default for banner on mount
  useEffect(() => {
    setBannerDate(new Date());
  }, []);

  // Keep today's date selected when month changes (don't clear it)
  // useEffect(() => {
  //   setDate(null);
  // }, [current, setDate]);

  const openDay = useCallback((d: Date) => {
    setDate(d);
    setBannerDate(d);
    toggle(true);
  }, [setDate, toggle]);

  return (
    <div className="space-y-5">
      <div key={bannerDate.toISOString()} className="mt-2 p-4 rounded-xl border border-slate-100 dark:border-slate-100/15 bg-white dark:bg-card shadow-sm dark:shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
            {isSameDay(bannerDate, new Date()) ? 'Today\'s Tasks' : `Tasks on ${format(bannerDate, 'PPP')}`}
          </h4>
          {!isSameDay(bannerDate, new Date()) && (
            <Button size="sm" variant="outline" onClick={() => setBannerDate(new Date())}>
              <ChevronLeft className="w-3 h-3 mr-1" />
              Back to Today
            </Button>
          )}
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), bannerDate)).map(t => (
            <div key={t._id} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600/50 bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600/50 transition flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight break-words min-w-0 flex-1">{t.title}</span>
                <span className={`text-[10px] px-1 py-0.5 rounded border flex-shrink-0 ${priorityColors[t.priority] || ''}`}>{t.priority}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className={`w-2 h-2 rounded-full ${statusDot[t.status]}`} /> {t.status.replace('_', ' ')}
                {t.project?.emoji && <span>{t.project.emoji}</span>}
                {t.assignedTo?.name && <span className="truncate max-w-[120px]">@{t.assignedTo.name}</span>}
              </div>
            </div>
          ))}
          {tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), bannerDate)).length === 0 && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic">No tasks scheduled for this day.</div>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-1 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {monthLabel}
          </h3>
          <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />Done</div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500" />In Progress</div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />Review</div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />Todo</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button size="sm" variant="outline" onClick={() => setCurrent(addDays(current, -30))} className="px-2 sm:px-3">
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrent(new Date())} className="px-2 sm:px-3 text-xs sm:text-sm">Today</Button>
          <Button size="sm" variant="outline" onClick={() => setCurrent(addDays(current, 30))} className="px-2 sm:px-3">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading} className="px-2 sm:px-3">
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <CreateTaskDialog />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/20 dark:bg-white/10 rounded-xl overflow-hidden ring-1 ring-white/30 dark:ring-white/20 mx-1 sm:mx-0">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="bg-muted/50 dark:bg-muted/30 backdrop-blur p-1.5 sm:p-2 text-[10px] sm:text-[11px] font-semibold tracking-wide text-muted-foreground text-center uppercase">
            {d}
          </div>
        ))}
        {days.map(day => {
          const inMonth = isSameMonth(day.date, current);
          const past = isBefore(day.date, new Date());
          const isSelected = isSameDay(day.date, bannerDate);
          return (
            <div
              key={day.date.toISOString()}
              onClick={() => openDay(day.date)}
              className={`min-h-20 sm:min-h-24 md:min-h-28 flex flex-col bg-background dark:bg-card relative p-1 sm:p-1.5 border border-border/20 cursor-pointer group transition-all duration-150
                ${!inMonth ? 'opacity-40' : ''}
                ${isSelected ? 'ring-[.0187rem] ring-primary shadow-sm ' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] sm:text-[11px] font-semibold ${isSameDay(day.date, new Date()) ? 'text-primary' : 'text-foreground'}`}>{format(day.date, 'd')}</span>
                {day.tasks.length > 0 && (
                  <span className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded bg-primary/10 dark:bg-primary/20 text-primary font-medium border border-primary/10 dark:border-primary/20 shadow-sm">{day.tasks.length}</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {day.tasks.slice(0, 4).map(t => (
                  <div
                    key={t._id}
                    title={t.title}
                    className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded border flex items-start gap-1 ${priorityColors[t.priority] || 'border-border/20 bg-muted text-muted-foreground'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${statusDot[t.status] || 'bg-slate-400'}`} />
                    <span className="leading-tight min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{t.title}</span>
                  </div>
                ))}
                {day.tasks.length > 4 && (
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground">+{day.tasks.length - 4} more</div>
                )}
                {day.tasks.length === 0 && past && (
                  <div className="mt-auto text-[9px] text-slate-300 dark:text-slate-500 italic">No tasks</div>
                )}
                {day.tasks.length === 0 && !past && (
                  <div className="mt-auto text-[9px] text-slate-400 dark:text-slate-500">–</div>
                )}
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-end justify-end p-1 pointer-events-none">
                <div className="pointer-events-auto">
                  <Button size="icon" variant="outline" className="h-5 w-5 rounded bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 shadow border-slate-200 dark:border-slate-600" onClick={(e) => { e.stopPropagation(); openDay(day.date); }}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && <div className="text-xs text-slate-500 dark:text-slate-400">Loading tasks...</div>}
      {!isLoading && tasks.length === 0 && <div className="text-xs text-slate-500 dark:text-slate-400">No tasks with due dates in this range.</div>}
    </div>
  );
};

export default TaskCalendar;
