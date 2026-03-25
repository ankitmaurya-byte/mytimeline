import mongoose, { Document, Schema } from "mongoose";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "../enums/task.enum";
import { generateTaskCode } from "../utils/uuid";

export interface TaskDocument extends Document {
  taskCode: string;
  title: string;
  description: string | null;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  status: TaskStatusEnumType;
  priority: TaskPriorityEnumType;
  assignedTo: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>(
  {
    taskCode: {
      type: String,
      unique: true,
      default: generateTaskCode,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatusEnum),
      default: TaskStatusEnum.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriorityEnum),
      default: TaskPriorityEnum.MEDIUM,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TaskModel = mongoose.models.Task || mongoose.model<TaskDocument>("Task", taskSchema);

// Performance indexes for common query patterns
// Core access patterns compound indexes
taskSchema.index({ workspace: 1, project: 1, createdAt: -1 });
taskSchema.index({ workspace: 1, status: 1, createdAt: -1 });
taskSchema.index({ workspace: 1, assignedTo: 1, status: 1 });
taskSchema.index({ workspace: 1, priority: 1, createdAt: -1 });
taskSchema.index({ workspace: 1, dueDate: 1, status: 1 });
taskSchema.index({ project: 1, status: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
// Text index remains for search
taskSchema.index({ title: "text", description: "text" });

// NOTE: Consider partial indexes (MongoDB 3.2+) for open tasks only:
// db.tasks.createIndex({ workspace:1, status:1, dueDate:1 }, { partialFilterExpression: { status: { $ne: 'DONE' } } })

export default TaskModel;
