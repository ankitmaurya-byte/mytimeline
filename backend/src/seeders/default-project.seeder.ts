import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database.config";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import WorkspaceModel from "../models/workspace.model";
import UserModel from "../models/user.model";
import { TaskStatusEnum, TaskPriorityEnum } from "../enums/task.enum";

const seedDefaultProject = async () => {
    console.log("Seeding default project started...");

    try {
        await connectDatabase();

        const session = await mongoose.startSession();
        session.startTransaction();

        // Find the first available workspace and user
        const workspace = await WorkspaceModel.findOne({}).session(session);
        const user = await UserModel.findOne({}).session(session);

        if (!workspace) {
            console.log("No workspace found. Please create a workspace first.");
            return;
        }

        if (!user) {
            console.log("No user found. Please create a user first.");
            return;
        }

        console.log(`Using workspace: ${workspace.name} and user: ${user.name || user.email}`);

        // Check if default project already exists
        const existingProject = await ProjectModel.findOne({
            name: "Tech Stack Setup",
            workspace: workspace._id
        }).session(session);

        if (existingProject) {
            console.log("Default project 'Tech Stack Setup' already exists.");
            return;
        }

        // Create the default project
        const defaultProject = new ProjectModel({
            name: "Tech Stack Setup",
            description: "Initial project setup for the Timeline application technology stack",
            emoji: "🚀",
            workspace: workspace._id,
            createdBy: user._id,
        });

        await defaultProject.save({ session });
        console.log("Default project 'Tech Stack Setup' created successfully.");

        // Create the first task: TODO status
        const task1 = new TaskModel({
            taskCode: "TSK-001",
            title: "Getting Started",
            description: "Configure Next.js 14 with TypeScript, ESLint, and Tailwind CSS. Set up the project structure and routing.",
            project: defaultProject._id,
            workspace: workspace._id,
            status: TaskStatusEnum.TODO,
            priority: TaskPriorityEnum.HIGH,
            assignedTo: user._id,
            createdBy: user._id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        // Create the second task: IN_PROGRESS status
        const task2 = new TaskModel({
            taskCode: "TSK-002",
            title: "Demo Task",
            description: "Set up MongoDB connection, create database schemas, and implement data models with proper indexing and validation.",
            project: defaultProject._id,
            workspace: workspace._id,
            status: TaskStatusEnum.IN_PROGRESS,
            priority: TaskPriorityEnum.HIGH,
            assignedTo: user._id,
            createdBy: user._id,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        });

        await task1.save({ session });
        await task2.save({ session });

        console.log("Default tasks created successfully:");
        console.log(`- ${task1.title} (${task1.status})`);
        console.log(`- ${task2.title} (${task2.status})`);

        await session.commitTransaction();
        console.log("Transaction committed.");

        session.endSession();
        console.log("Session ended.");

        console.log("Default project seeding completed successfully.");
    } catch (error) {
        console.error("Error during seeding:", error);
    }
};

seedDefaultProject().catch((error) =>
    console.error("Error running seed script:", error)
);






