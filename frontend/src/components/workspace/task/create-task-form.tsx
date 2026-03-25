import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader, Zap, Save, AlertCircle, CheckCircle, X, Sparkles, Clock, Target } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { createTaskMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useLoadingContext } from "@/components/loading";
import { useState, useEffect, useMemo } from "react";
import { useTaskSyncStore } from "@/stores";
import { ResponsiveAvatar } from "@/components/ui/responsive-avatar";
import { useProfilePictures } from "@/hooks/use-profile-pictures";
import { cn } from "@/lib/utils";

export default function CreateTaskForm(props: {
  projectId?: string;
  onClose: () => void;
}) {
  const { projectId, onClose } = props;

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { triggerTaskCreated } = useTaskSyncStore();
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: createTaskMutationFn,
  });

  const { data, isLoading } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    skip: !!projectId,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projects = data?.projects || [];
  const members = memberData?.members || [];

  // Deduplicate members by user ID to prevent duplicate keys
  const uniqueMembers = members.filter((member, index, self) =>
    index === self.findIndex(m => m.userId._id === member.userId._id)
  );

  // Extract unique user IDs for profile picture fetching
  const userIds = useMemo(() => {
    const ids = uniqueMembers
      .map(member => member.userId?._id)
      .filter((id): id is string => !!id);
    return [...new Set(ids)]; // Remove duplicates
  }, [uniqueMembers]);

  // Fetch profile pictures separately
  const { data: profilePicturesData } = useProfilePictures(userIds);

  // Workspace Projects
  const projectOptions = projects?.map((project) => ({
    label: (
      <div className="flex items-center gap-2">
        <span className="text-lg">{project.emoji}</span>
        <span className="font-medium">{project.name}</span>
      </div>
    ),
    value: project._id,
  }));

  // Workspace Members with enhanced styling
  const membersOptions = uniqueMembers?.map((member, index) => ({
    label: member.userId?.name || "Unknown",
    value: member.userId._id,
    photo: profilePicturesData?.profilePictures?.[member.userId?._id || ''] || null,
    email: member.userId?.email || "",
    // Use index as fallback to ensure unique keys
    uniqueKey: `${member.userId._id}-${index}`,
  }));

  // Status & Priority Options with enhanced styling
  const statusOptions = Object.values(TaskStatusEnum).map((status) => ({
    label: status === 'IN_PROGRESS' ? 'In Progress' :
      status === 'IN_REVIEW' ? 'In Review' :
        status.charAt(0) + status.slice(1).toLowerCase(),
    value: status,
    color: status === 'DONE' ? 'text-green-600' :
      status === 'IN_PROGRESS' ? 'text-blue-600' :
        status === 'IN_REVIEW' ? 'text-purple-600' :
          status === 'TODO' ? 'text-yellow-600' : 'text-gray-600'
  }));

  const priorityOptions = Object.values(TaskPriorityEnum).map((priority) => ({
    label: priority.charAt(0) + priority.slice(1).toLowerCase(),
    value: priority,
    color: priority === 'HIGH' ? 'text-red-600' :
      priority === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
  }));

  const formSchema = z.object({
    title: z.string().trim().min(1, { message: "Title is required" }),
    description: z.string().trim().max(500, { message: "Description cannot exceed 500 characters" }),
    projectId: z.string().trim().min(1, { message: "Project is required" }),
    status: z.enum(Object.values(TaskStatusEnum) as [keyof typeof TaskStatusEnum]),
    priority: z.enum(Object.values(TaskPriorityEnum) as [keyof typeof TaskPriorityEnum]),
    assignedTo: z.string().trim().min(1, { message: "AssignedTo is required" }),
    dueDate: z.date({ required_error: "A due date is required." }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: projectId || "",
      status: TaskStatusEnum.TODO,
      priority: TaskPriorityEnum.MEDIUM,
      assignedTo: "",
      dueDate: new Date(),
    },
  });

  // Track form changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        setHasChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    setIsSubmitting(true);

    const payload = {
      workspaceId,
      projectId: values.projectId,
      data: {
        ...values,
        dueDate: values.dueDate.toISOString(),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["project-analytics", projectId],
        });

        queryClient.invalidateQueries({
          queryKey: ["all-tasks", workspaceId],
        });

        // Trigger kanban board sync event
        triggerTaskCreated();

        toast({
          title: "Success",
          description: "Task created successfully",
          variant: "success",
        });
        setHasChanges(false);
        setIsSubmitting(false);
        onClose();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
      },
    });
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-full mx-auto h-auto p-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="h-full">
        {/* Enhanced Header with Status Indicators */}
        <div className="mb-4 pb-3 border-b border-gray-200 dark:border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/30 dark:to-green-800/30 rounded-lg shadow-sm border border-emerald-200/50 dark:border-emerald-700/50">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Task</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set up a new task with all necessary details in the project</p>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {projects.find(p => p.emoji)?.emoji + ` ` || '📊'}
                  {projects.find(p => p._id === projectId)?.name || 'Selected Project'}
                </span>
              </div>
            </div>

            {/* Project Selection Badge */}

          </div>
        </div>

        <Form {...form}>
          <form className="space-y-3 sm:space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Title Field with Enhanced Styling */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem className="group">
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Task Title
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter task title..."
                    className="focus:shadow-md transition-shadow duration-200"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Description Field with Character Count */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem className="group">
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Task Description
                  <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="Describe the task details..."
                    className={`focus:shadow-md transition-shadow duration-200 focus:ring-2 resize-none ${field.value.length > 500 ? 'focus:ring-red-500/20 border-red-300 dark:border-red-600' :
                      field.value.length > 450 ? 'focus:ring-orange-500/20 border-orange-300 dark:border-orange-600' :
                        field.value.length > 300 ? 'focus:ring-yellow-500/20 border-yellow-300 dark:border-yellow-600' :
                          'focus:ring-green-500/20 border-gray-300 dark:border-gray-600'
                      }`}
                  />
                </FormControl>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Add detailed description</span>
                  <span className={`font-medium ${field.value.length > 450 ? 'text-red-500' :
                    field.value.length > 400 ? 'text-orange-500' :
                      field.value.length > 300 ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {field.value.length}/500
                  </span>
                </div>
                {field.value.length > 450 && field.value.length <= 500 && (
                  <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                    ⚠️ You're approaching the 500 character limit. Please keep your description concise.
                  </div>
                )}
                {field.value.length > 500 && (
                  <div className="disabled:opacity-50 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border-2 border-red-300 dark:border-red-700 font-medium">
                    🚫 Character limit exceeded! Your description is {field.value.length} characters. Please reduce it to 500 characters or less.
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )} />

            {/* Project Selection - Only show if no projectId provided */}
            {!projectId && (
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    Select Project
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="focus:shadow-md transition-shadow duration-200">
                        <SelectValue placeholder="Choose a project for this task" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading && (
                          <div className="my-2 flex justify-center">
                            <Loader className="w-4 h-4 animate-spin" />
                          </div>
                        )}
                        <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                          {projectOptions?.map((option) => (
                            <SelectItem
                              key={option.value}
                              className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Assigned To with Direct Member Selection */}
            <FormField control={form.control} name="assignedTo" render={({ field }) => (
              <FormItem className="group">
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-foreground flex items-center gap-2 mb-3">
                  Assign To Team Member
                </FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 auto-rows-fr">
                  {membersOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={field.value === option.value ? "link" : "outline"}
                      onClick={() => field.onChange(option.value)}
                      className={`h-auto py-2 sm:py-3 px-1 sm:px-2 flex flex-col items-center gap-1 sm:gap-2 transition-all duration-200 min-w-0 w-full touch-manipulation ${field.value === option.value
                        ? 'bg-cyan-600 text-white'
                        : 'hover:shadow-md hover:scale-105'
                        }`}
                    >
                      <ResponsiveAvatar
                        src={option.photo || undefined}
                        alt={option.label}
                        fallback={option.label.charAt(0).toUpperCase()}
                        size="sm"
                        className={cn(
                          "ring-2 transition-all duration-200",
                          field.value === option.value
                            ? "ring-cyan-600 ring-offset-2"
                            : "ring-white dark:ring-gray-300"
                        )}
                      />
                      <span className="text-xs font-medium text-center leading-tight whitespace-normal w-full px-1">{option.label}</span>
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Due Date with Enhanced Calendar */}
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem className="group">
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Due Date
                </FormLabel>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal focus:shadow-md transition-shadow duration-200"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                        {field.value ? (
                          <span className="flex items-center gap-2">
                            {format(field.value, "PPP")}
                            <span className={`px-2 py-1 text-xs rounded-full ${field.value < new Date() ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              field.value.toDateString() === new Date().toDateString() ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                              {field.value < new Date() ? 'Overdue' :
                                field.value.toDateString() === new Date().toDateString() ? 'Today' :
                                  field.value.toDateString() === new Date(Date.now() + 86400000).toDateString() ? 'Tomorrow' :
                                    'Upcoming'}
                            </span>
                          </span>
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border-border shadow-lg dark:shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        // Automatically close the popover when a date is selected
                        setIsDatePickerOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border border-border bg-background"
                      classNames={{
                        day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 dark:focus:bg-blue-600"
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            {/* Status Selection - Direct Buttons */}
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem className="group">
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-foreground flex items-center gap-2 mb-3">
                  Task Status
                </FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {statusOptions.map((status) => (
                    <Button
                      key={status.value}
                      type="button"
                      variant={field.value === status.value ? "default" : "outline"}
                      onClick={() => field.onChange(status.value)}
                      className={`h-auto py-2 sm:py-3 px-1 sm:px-2 flex flex-col items-center gap-1 sm:gap-2 transition-all duration-200 touch-manipulation w-full ${field.value === status.value
                        ? status.value === 'DONE' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white' :
                          status.value === 'IN_PROGRESS' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white' :
                            status.value === 'IN_REVIEW' ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white' :
                              status.value === 'TODO' ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white' :
                                'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white'
                        : 'hover:shadow-md hover:scale-105'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${status.value === 'DONE' ? 'bg-green-200' :
                        status.value === 'IN_PROGRESS' ? 'bg-blue-200' :
                          status.value === 'IN_REVIEW' ? 'bg-purple-200' :
                            status.value === 'TODO' ? 'bg-yellow-200' : 'bg-gray-200'
                        }`}></div>
                      <span className="text-xs font-medium">{status.label}</span>
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Priority Selection - Direct Buttons */}
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem className="group">
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-foreground flex items-center gap-2 mb-3">
                  Task Priority
                </FormLabel>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {priorityOptions.map((priority) => (
                    <Button
                      key={priority.value}
                      type="button"
                      variant={field.value === priority.value ? "default" : "outline"}
                      onClick={() => field.onChange(priority.value)}
                      className={`h-auto py-3 sm:py-4 px-2 sm:px-3 flex flex-col items-center gap-1 sm:gap-2 transition-all duration-200 touch-manipulation w-full ${field.value === priority.value
                        ? priority.value === 'HIGH' ? 'bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white' :
                          priority.value === 'MEDIUM' ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white' :
                            'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white'
                        : 'hover:shadow-md hover:scale-105'
                        }`}
                    >
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${priority.value === 'HIGH' ? 'bg-red-200 dark:bg-red-300' :
                        priority.value === 'MEDIUM' ? 'bg-yellow-200 dark:bg-yellow-300' : 'bg-green-200 dark:bg-green-300'
                        }`}></div>
                      <span className="text-xs sm:text-sm font-medium">{priority.label}</span>
                      {priority.value === 'HIGH' && <span className="text-xs opacity-80 hidden sm:block">Urgent</span>}
                      {priority.value === 'MEDIUM' && <span className="text-xs opacity-80 hidden sm:block">Normal</span>}
                      {priority.value === 'LOW' && <span className="text-xs opacity-80 hidden sm:block">Relaxed</span>}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Action Buttons with Enhanced Styling */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancel}
                className="flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="flex-1 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 hover:from-emerald-800 hover:via-teal-800 hover:to-cyan-800 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 dark:hover:from-emerald-700 dark:hover:via-teal-700 dark:hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border-0"
                disabled={isPending || !hasChanges}
              >
                {isPending || isSubmitting ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isPending || isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>

            {/* Change Indicator */}
            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span>You have unsaved changes</span>
              </div>
            )}

            {/* Success Indicator */}
            {!hasChanges && !isPending && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-4 h-4" />
                <span>Ready to create task</span>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
