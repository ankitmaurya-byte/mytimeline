import mongoose, { Document, Schema } from "mongoose";
import { RoleDocument } from "./roles-permission.model";

export interface MemberDocument extends Document {
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  role: RoleDocument;
  joinedAt: Date;
}

const memberSchema = new Schema<MemberDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MemberModel = mongoose.models.Member || mongoose.model<MemberDocument>("Member", memberSchema);

// Performance indexes for common query patterns
memberSchema.index({ userId: 1 }); // Index for user lookups
memberSchema.index({ workspaceId: 1 }); // Index for workspace lookups
memberSchema.index({ userId: 1, workspaceId: 1 }, { unique: true }); // Enforce uniqueness of membership
memberSchema.index({ role: 1 }); // Index for role lookups
memberSchema.index({ workspaceId: 1, joinedAt: -1 }); // Compound index for workspace-join date sorting

export default MemberModel;
