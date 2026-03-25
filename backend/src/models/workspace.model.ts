import mongoose, { Document, Schema } from "mongoose";
import { generateInviteCode } from "../utils/uuid";

export interface DismissedUser {
  userId: string;
  userName: string;
  userEmail: string;
  dismissedAt: Date;
  dismissedBy: string;
  dismissedByUserName: string;
  reason?: string;
  canBeReinstated: boolean;
}

export interface WorkspaceDocument extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  inviteCode: string;
  dismissedUsers?: DismissedUser[];
  createdAt: string;
  updatedAt: string;
}

const dismissedUserSchema = new Schema<DismissedUser>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  dismissedAt: { type: Date, default: Date.now },
  dismissedBy: { type: String, required: true },
  dismissedByUserName: { type: String, required: true },
  reason: { type: String, required: false },
  canBeReinstated: { type: Boolean, default: true }
});

const workspaceSchema = new Schema<WorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model (workspace owner)
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      default: generateInviteCode,
    },
    dismissedUsers: [dismissedUserSchema]
  },
  {
    timestamps: true,
  }
);

workspaceSchema.methods.resetInviteCode = function () {
  this.inviteCode = generateInviteCode();
};

const WorkspaceModel = mongoose.models.Workspace || mongoose.model<WorkspaceDocument>(
  "Workspace",
  workspaceSchema
);

// Performance indexes for common query patterns
workspaceSchema.index({ owner: 1 }); // Checking owner lookups (for workspace owner)
workspaceSchema.index({ createdAt: -1 }); // Index for creation date sorting (Helps in sorting workspaces by creation date)

// Indexes for dismissed users
workspaceSchema.index({ 'dismissedUsers.userId': 1 });
workspaceSchema.index({ 'dismissedUsers.dismissedAt': 1 });

export default WorkspaceModel;
