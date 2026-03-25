import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { TaskStatusEnum, TaskPriorityEnum } from "../enums/task.enum";

/**
 * Creates a default project with sample tasks for new users
 * This should be called after a new workspace is created
 */
export const createDefaultProjectForWorkspace = async (
    workspaceId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
) => {
    try {
        // console.log(`[DEBUG] Starting default project creation for workspace: ${workspaceId}, user: ${userId}`);

        // Check if default project already exists for this workspace
        const existingProject = await ProjectModel.findOne({
            name: "First Steps",
            workspace: workspaceId,
        });

        if (existingProject) {
            // console.log("Default project 'First Steps' already exists for this workspace.");
            return existingProject;
        }

        // Create the default project
        const defaultProject = new ProjectModel({
            name: "First Steps",
            description: "Initial project setup for the Timeline application technology stack",
            emoji: "🚀",
            workspace: workspaceId,
            createdBy: userId,
        });

        // console.log(`[DEBUG] Saving default project: ${defaultProject.name}`);
        await defaultProject.save();
        // console.log("Default project 'First Steps' created successfully.");

        // Create the first task: TODO status
        // console.log(`[DEBUG] Creating first task...`);
        const task1 = new TaskModel({
            title: "Setup project",
            description: "Organize your project details and customize it as you like.",
            project: defaultProject._id,
            workspace: workspaceId,
            status: TaskStatusEnum.TODO,
            priority: TaskPriorityEnum.HIGH,
            assignedTo: userId,
            createdBy: userId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        /*      console.log(`[DEBUG] Task 1 data:`, {
                title: task1.title,
                status: task1.status,
                priority: task1.priority,
                project: task1.project,
                workspace: task1.workspace
              }); */

        // Create the second task: IN_PROGRESS status
        // console.log(`[DEBUG] Creating second task...`);
        const task2 = new TaskModel({
            title: "Add your first timeline entry",
            description: "Create your first milestone to start building your journey.",
            project: defaultProject._id,
            workspace: workspaceId,
            status: TaskStatusEnum.IN_PROGRESS,
            priority: TaskPriorityEnum.HIGH,
            assignedTo: userId,
            createdBy: userId,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        });

        // console.log(`[DEBUG] Task 2 data:`, {
        //     title: task2.title,
        //     status: task2.status,
        //     priority: task2.priority,
        //     project: task2.project,
        //     workspace: task2.workspace
        // });

        // console.log(`[DEBUG] Saving tasks to database...`);
        await task1.save();
        // console.log(`[DEBUG] Task 1 saved successfully with ID: ${task1._id}`);

        await task2.save();
        // console.log(`[DEBUG] Task 2 saved successfully with ID: ${task2._id}`);

        // console.log("Default tasks created successfully:");
        // console.log(`- ${task1.title} (${task1.status})`);
        // console.log(`- ${task2.title} (${task2.status})`);

        // Verify tasks were actually saved
        const savedTask1 = await TaskModel.findById(task1._id);
        const savedTask2 = await TaskModel.findById(task2._id);

        if (savedTask1 && savedTask2) {
            // console.log(`[DEBUG] Verification: Both tasks found in database`);
        } else {
            // console.log(`[DEBUG] Verification failed: Task 1: ${!!savedTask1}, Task 2: ${!!savedTask2}`);
        }

        // Test query to see if tasks can be found by workspace
        const allTasksInWorkspace = await TaskModel.find({ workspace: workspaceId });
        // console.log(`[DEBUG] Total tasks found in workspace: ${allTasksInWorkspace.length}`);
        allTasksInWorkspace.forEach((task, index) => {
            // console.log(`[DEBUG] Task ${index + 1}: ${task.title} (${task.status})`);
        });

        // Test query to see if tasks can be found by project
        const allTasksInProject = await TaskModel.find({ project: defaultProject._id });
        // console.log(`[DEBUG] Total tasks found in project: ${allTasksInProject.length}`);
        allTasksInProject.forEach((task, index) => {
            // console.log(`[DEBUG] Project Task ${index + 1}: ${task.title} (${task.status})`);
        });

        return defaultProject;
    } catch (error) {
        console.error("Error creating default project:", error);
        console.error("Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'Unknown stack',
            name: error instanceof Error ? error.name : 'Unknown error'
        });
        throw error;
    }
};
