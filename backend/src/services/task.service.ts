import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { BadRequestException, NotFoundException } from "../utils/appError";

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const { title, description, priority, status, assignedTo, dueDate } = body;

  const project = await ProjectModel.findById(projectId).select('_id workspace');

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }
  if (assignedTo) {
    const isAssignedUserMember = await MemberModel.exists({
      userId: assignedTo,
      workspaceId,
    });

    if (!isAssignedUserMember) {
      throw new Error("Assigned user is not a member of this workspace.");
    }
  }
  const task = new TaskModel({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo,
    createdBy: userId,
    workspace: workspaceId,
    project: projectId,
    dueDate,
  });

  await task.save();

  return { task };
};

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const project = await ProjectModel.findById(projectId).select('_id workspace');

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findById(taskId).select('_id project');

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    {
      ...body,
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  return { updatedTask };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  },
  sorting?: {
    field: string;
    direction: 1 | -1;
  }
) => {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) {
    query.project = filters.projectId;
  }

  if (filters.status && filters.status?.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.priority && filters.priority?.length > 0) {
    query.priority = { $in: filters.priority };
  }

  if (filters.assignedTo && filters.assignedTo?.length > 0) {
    query.assignedTo = { $in: filters.assignedTo };
  }

  if (filters.keyword && filters.keyword !== undefined) {
    // Use text search if available, otherwise fallback to regex
    if (filters.keyword.length > 2) {
      query.$text = { $search: filters.keyword };
    } else {
      query.title = { $regex: filters.keyword, $options: "i" };
    }
  }

  if (filters.dueDate) {
    const targetDate = new Date(filters.dueDate);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    query.dueDate = {
      $gte: targetDate,
      $lt: nextDay,
    };
  }

  // Date range filtering (calendar view). Takes precedence over single dueDate if provided
  if (filters.dueDateStart || filters.dueDateEnd) {
    const range: Record<string, Date> = {};
    if (filters.dueDateStart) {
      const start = new Date(filters.dueDateStart);
      if (!isNaN(start.getTime())) range.$gte = start;
    }
    if (filters.dueDateEnd) {
      const end = new Date(filters.dueDateEnd);
      if (!isNaN(end.getTime())) range.$lte = end;
    }
    if (Object.keys(range).length > 0) {
      query.dueDate = range;
    }
  }

  // Pagination Setup
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  // Build sort object - default to createdAt if no sorting specified
  const sortObject: Record<string, 1 | -1> = sorting
    ? { [sorting.field]: sorting.direction }
    : { createdAt: -1 };

  // Use simple find query instead of failing aggregation pipeline
  // Exclude profilePicture to reduce payload size - it can be fetched separately when needed
  const assignedToSelect = '_id name';

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort(sortObject)
      .select('taskCode title status priority assignedTo project dueDate createdAt')
      .populate({ path: 'assignedTo', select: assignedToSelect, options: { lean: true } })
      .populate({ path: 'project', select: '_id emoji name', options: { lean: true } })
      .lean(),
    TaskModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

// Optimized service for recent tasks (without profilePicture to reduce payload)
export const getRecentTasksService = async (
  workspaceId: string,
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find({ workspace: workspaceId })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .select('taskCode title status priority assignedTo project dueDate createdAt')
      .populate({ path: 'assignedTo', select: '_id name', options: { lean: true } }) // Exclude profilePicture to reduce payload size
      .populate({ path: 'project', select: '_id emoji name', options: { lean: true } })
      .lean(),
    TaskModel.countDocuments({ workspace: workspaceId }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await ProjectModel.findById(projectId).select('_id workspace');

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  })
    .select('taskCode title description status priority assignedTo project dueDate createdAt updatedAt')
    .populate({ path: 'assignedTo', select: '_id name', options: { lean: true } })
    .lean();

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string
) => {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  return;
};
