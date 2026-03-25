import mongoose, { Document, Schema } from "mongoose";

export interface IInsightsNote extends Document {
    _id: string;
    text: string;
    author: string;
    workspaceId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

const insightsNoteSchema = new Schema<IInsightsNote>(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        author: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        workspaceId: {
            type: String,
            required: true,
            ref: "Workspace"
        },
        userId: {
            type: String,
            required: true,
            ref: "User"
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Index for better query performance
insightsNoteSchema.index({ workspaceId: 1, createdAt: -1 });
insightsNoteSchema.index({ userId: 1 });

export default (mongoose.models.InsightsNote || mongoose.model<IInsightsNote>("InsightsNote", insightsNoteSchema));
