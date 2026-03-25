'use client';

import React, { useState } from 'react';
import KanbanBoard from './kanban-board';
import { TaskType } from '@/types/api.type';
import { TaskStatusEnum, TaskPriorityEnum } from '@/constant';

// Example usage of the KanbanBoard component
const KanbanBoardExample: React.FC = () => {
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize with sample data after component mounts
    React.useEffect(() => {
        setIsLoading(true);
        const sampleTasks: TaskType[] = [
            {
                _id: '1',
                title: 'Design new landing page',
                description: 'Create wireframes and mockups for the new landing page design',
                priority: TaskPriorityEnum.HIGH,
                status: TaskStatusEnum.TODO,
                assignedTo: {
                    _id: 'user1',
                    name: 'John Doe',
                    profilePicture: null,
                },
                dueDate: '2024-02-15',
                taskCode: 'TASK-001',
                project: {
                    _id: 'project1',
                    emoji: '🎨',
                    name: 'Website Redesign',
                },
            },
            {
                _id: '2',
                title: 'Implement user authentication',
                description: 'Set up JWT authentication and user management system',
                priority: TaskPriorityEnum.MEDIUM,
                status: TaskStatusEnum.IN_PROGRESS,
                assignedTo: {
                    _id: 'user2',
                    name: 'Jane Smith',
                    profilePicture: null,
                },
                dueDate: '2024-02-20',
                taskCode: 'TASK-002',
                project: {
                    _id: 'project2',
                    emoji: '🔐',
                    name: 'Backend API',
                },
            },
            {
                _id: '3',
                title: 'Write API documentation',
                description: 'Document all API endpoints with examples and usage',
                priority: TaskPriorityEnum.LOW,
                status: TaskStatusEnum.DONE,
                assignedTo: {
                    _id: 'user3',
                    name: 'Mike Johnson',
                    profilePicture: null,
                },
                dueDate: '2024-02-10',
                taskCode: 'TASK-003',
                project: {
                    _id: 'project2',
                    emoji: '📚',
                    name: 'Documentation',
                },
            },
            {
                _id: '4',
                title: 'Setup CI/CD pipeline',
                description: 'Configure GitHub Actions for automated testing and deployment',
                priority: TaskPriorityEnum.HIGH,
                status: TaskStatusEnum.IN_REVIEW,
                assignedTo: {
                    _id: 'user1',
                    name: 'John Doe',
                    profilePicture: null,
                },
                dueDate: '2024-02-25',
                taskCode: 'TASK-004',
                project: {
                    _id: 'project3',
                    emoji: '🚀',
                    name: 'DevOps',
                },
            },
            {
                _id: '5',
                title: 'Bug fixes and testing',
                description: 'Fix reported bugs and run comprehensive testing',
                priority: TaskPriorityEnum.MEDIUM,
                status: TaskStatusEnum.BACKLOG,
                assignedTo: null,
                dueDate: '2024-03-01',
                taskCode: 'TASK-005',
                project: {
                    _id: 'project1',
                    emoji: '🐛',
                    name: 'Bug Fixes',
                },
            },
        ];

        setTasks(sampleTasks);
        setIsLoading(false);
    }, []);

    const handleTaskUpdate = (taskId: string, updates: Partial<TaskType>) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task._id === taskId ? { ...task, ...updates } : task
            )
        );
    };

    const handleAddTask = (status: keyof typeof TaskStatusEnum) => {
        const newTask: TaskType = {
            _id: Date.now().toString(),
            title: 'New Task',
            description: 'Task description',
            priority: TaskPriorityEnum.MEDIUM,
            status: status,
            assignedTo: null,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            taskCode: `TASK-${Date.now()}`,
            project: {
                _id: 'project1',
                emoji: '📝',
                name: 'General',
            },
        };
        setTasks((prevTasks) => [...prevTasks, newTask]);
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-2">Loading tasks...</div>
                    <p className="text-gray-400 text-sm">Please wait while we fetch your tasks</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <KanbanBoard
                // KanbanBoard in this example does not accept props; remove tasks prop to fix lint error
                // onTaskUpdate={handleTaskUpdate}
                // onAddTask={handleAddTask}
            />
        </div>
    );
};

export default KanbanBoardExample;
