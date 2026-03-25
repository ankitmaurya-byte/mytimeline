import mongoose, { Document, Schema } from "mongoose";

export interface ProjectDocument extends Document {
  name: string;
  description: string | null; // Optional description for the project
  emoji: string;
  workspace: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    emoji: {
      type: String,
      required: false,
      trim: true,
      default: "📊",
    },
    description: { type: String, required: false },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectModel = mongoose.models.Project || mongoose.model<ProjectDocument>("Project", projectSchema);

// Performance indexes for common query patterns
projectSchema.index({ workspace: 1 }); // Index for workspace lookups
projectSchema.index({ createdBy: 1 }); // Index for creator lookups
projectSchema.index({ workspace: 1, createdAt: -1 }); // Compound index for workspace-creation sorting
projectSchema.index({ workspace: 1, name: 1 }); // Compound index for workspace-name search
projectSchema.index({ name: "text", description: "text" }); // Text index for project search
projectSchema.index({ updatedAt: -1 }); // Index for recent updates

export default ProjectModel;
