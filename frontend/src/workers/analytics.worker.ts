/**
 * Analytics Web Worker
 * Offloads heavy analytics calculations to a background thread
 * to prevent blocking the main UI thread
 */

// Types for my web worker 
export interface WorkerRequest {
  type: 'TEAM_ANALYTICS' | 'PRODUCTIVITY_ANALYTICS' | 'PROJECT_ANALYTICS';
  payload: any;
  id: string;
}

export interface WorkerResponse {
  type: 'SUCCESS' | 'ERROR';
  id: string;
  payload?: any;
  error?: string;
}

// Team Analytics Calculation
function calculateTeamAnalytics(data: {
  members: any[];
  tasks: any[];
}) {
  const { members, tasks } = data;
  
  if (!members.length || !tasks.length) {
    return {
      teamMembers: [],
      totalTeamTasks: 0,
      totalCompletedTasks: 0,
      totalOverdueTasks: 0,
      totalInProgressTasks: 0,
      teamCompletionRate: 0,
      averageVelocity: 0
    };
  }

  const currentDate = new Date();
  const TASK_STATUS = {
    DONE: 'DONE',
    IN_PROGRESS: 'IN_PROGRESS'
  };

  // Calculate task allocation for each member
  const teamMembers = members.map(member => {
    const memberTasks = tasks.filter((task: any) =>
      task.assignedTo?._id === member.userId._id
    );

    const completedTasks = memberTasks.filter((task: any) =>
      task.status === TASK_STATUS.DONE
    ).length;

    const inProgressTasks = memberTasks.filter((task: any) =>
      task.status === TASK_STATUS.IN_PROGRESS
    ).length;

    const overdueTasks = memberTasks.filter((task: any) =>
      task.status !== TASK_STATUS.DONE &&
      new Date(task.dueDate) < currentDate
    ).length;

    const totalTasks = memberTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get current active tasks (not done)
    const currentTasks = memberTasks
      .filter((task: any) => task.status !== TASK_STATUS.DONE)
      .slice(0, 5)
      .map((task: any) => task.title);

    // Calculate weekly velocity
    const weeklyVelocity = completedTasks > 0 ? Math.round((completedTasks / 4) * 10) / 10 : 0;

    return {
      id: member._id,
      name: member.userId.name,
      email: member.userId.email,
      role: member.role.name,
      profilePicture: member.userId.profilePicture || null,
      tasksCompleted: completedTasks,
      totalTasks: totalTasks,
      overdueTasks: overdueTasks,
      inProgressTasks: inProgressTasks,
      completionRate: completionRate,
      weeklyVelocity: weeklyVelocity,
      currentTasks: currentTasks,
      expertise: getExpertiseFromRole(member.role.name)
    };
  });

  // Sorting by completion rate
  teamMembers.sort((a, b) => b.completionRate - a.completionRate);

  const totalTeamTasks = teamMembers.reduce((sum, member) => sum + member.totalTasks, 0);
  const totalCompletedTasks = teamMembers.reduce((sum, member) => sum + member.tasksCompleted, 0);
  const totalOverdueTasks = teamMembers.reduce((sum, member) => sum + member.overdueTasks, 0);
  const totalInProgressTasks = teamMembers.reduce((sum, member) => sum + member.inProgressTasks, 0);
  const teamCompletionRate = totalTeamTasks > 0 ? Math.round((totalCompletedTasks / totalTeamTasks) * 100) : 0;
  const averageVelocity = teamMembers.length > 0 ?
    teamMembers.reduce((sum, member) => sum + member.weeklyVelocity, 0) / teamMembers.length : 0;

  return {
    teamMembers,
    totalTeamTasks,
    totalCompletedTasks,
    totalOverdueTasks,
    totalInProgressTasks,
    teamCompletionRate,
    averageVelocity
  };
}

// Helper function to generate expertise based on role
function getExpertiseFromRole(roleName: string): string[] {
  const roleExpertise: Record<string, string[]> = {
    'OWNER': ['Leadership', 'Strategy', 'Management'],
    'ADMIN': ['Administration', 'User Management', 'Coordination'],
    'MEMBER': ['Team Collaboration', 'Task Execution'],
    'Senior Developer': ['React', 'TypeScript', 'Node.js', 'Architecture'],
    'Developer': ['JavaScript', 'Frontend', 'Backend'],
    'UI/UX Designer': ['Figma', 'Design Systems', 'Prototyping'],
    'Backend Developer': ['APIs', 'Database', 'Server Architecture'],
    'Frontend Developer': ['React', 'CSS', 'UI/UX'],
    'Product Manager': ['Agile', 'Analytics', 'Strategy'],
    'DevOps': ['CI/CD', 'Docker', 'Cloud'],
    'QA Engineer': ['Testing', 'Automation', 'Quality Assurance']
  };

  return roleExpertise[roleName] || ['Team Collaboration', 'Project Management'];
}

// Productivity Analytics Calculation
function calculateProductivityAnalytics(data: {
  tasks: Array<{
    id: string;
    title: string;
    dueDate?: string;
    status: string;
    completedAt?: string;
  }>;
}) {
  const { tasks } = data;
  const today = new Date();

  // Helper function to safely parse dates
  const safeDateParse = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Sort tasks by due date
  const sortByDue = (arr: typeof tasks) => {
    return [...arr].sort((a, b) => {
      const dateA = safeDateParse(a.dueDate);
      const dateB = safeDateParse(b.dueDate);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Filter overdue tasks
  const overdueTasks = sortByDue(
    tasks.filter(t => {
      const dueDate = safeDateParse(t.dueDate);
      return dueDate && t.status !== 'completed' && dueDate < today;
    })
  );

  // Get upcoming tasks
  const getUpcoming = (min: number, max: number) => {
    return sortByDue(
      tasks.filter(t => {
        const dueDate = safeDateParse(t.dueDate);
        if (!dueDate || t.status === 'completed') return false;

        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
        return daysDiff >= min && daysDiff < max;
      })
    );
  };

  const allUpcomingTasks = tasks.filter(t => {
    const dueDate = safeDateParse(t.dueDate);
    return dueDate && t.status !== 'completed' && dueDate >= today;
  });

  const [firstUpcoming, secondUpcoming, thirdUpcoming] = [
    getUpcoming(0, 4)[0],
    getUpcoming(4, 8)[0],
    getUpcoming(8, 16)[0]
  ];

  const customUpcomingTasks = [firstUpcoming, secondUpcoming, thirdUpcoming].filter(Boolean);
  const fallbackUpcomingTasks = customUpcomingTasks.length === 0 && allUpcomingTasks.length > 0
    ? allUpcomingTasks.slice(0, 3)
    : customUpcomingTasks;

  // Calculate average completion time
  const completedTasksWithDates = tasks.filter(t =>
    t.status === 'completed' && t.completedAt && t.dueDate
  );

  const avgCompletionTime = completedTasksWithDates.length > 0
    ? completedTasksWithDates.reduce((acc, t) => {
      const completedDate = safeDateParse(t.completedAt);
      const dueDate = safeDateParse(t.dueDate);
      if (!completedDate || !dueDate) return acc;
      return acc + Math.abs(Math.ceil((completedDate.getTime() - dueDate.getTime()) / 86400000));
    }, 0) / completedTasksWithDates.length
    : 0;

  return {
    overdueTasks,
    upcomingTasks: fallbackUpcomingTasks,
    criticalTasks: firstUpcoming ? [firstUpcoming] : [],
    avgCompletionTime,
    allUpcomingCount: allUpcomingTasks.length
  };
}

// Project Analytics Calculation
function calculateProjectAnalytics(data: {
  projects: any[];
  tasks: any[];
}) {
  const { projects, tasks } = data;

  if (!projects.length || !tasks.length) {
    return {
      projectsWithProgress: [],
      totalProjects: 0,
      projectsOnTrack: 0,
      projectsAtRisk: 0
    };
  }

  const TASK_STATUS = {
    DONE: 'DONE',
    IN_PROGRESS: 'IN_PROGRESS'
  };

  const projectsWithProgress = projects.map(project => {
    const projectTasks = tasks.filter((task: any) => task.project?._id === project._id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter((task: any) => task.status === TASK_STATUS.DONE).length;
    const inProgressTasks = projectTasks.filter((task: any) => task.status === TASK_STATUS.IN_PROGRESS).length;
    const overdueTasks = projectTasks.filter((task: any) =>
      task.status !== TASK_STATUS.DONE &&
      new Date(task.dueDate) < new Date()
    ).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const isOnTrack = completionRate >= 70 && overdueTasks <= 2;
    const isAtRisk = overdueTasks > 2 || (completionRate < 40 && totalTasks > 0);

    return {
      ...project,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      isOnTrack,
      isAtRisk
    };
  });

  // Sort by completion rate
  projectsWithProgress.sort((a, b) => b.completionRate - a.completionRate);

  const totalProjects = projectsWithProgress.length;
  const projectsOnTrack = projectsWithProgress.filter(p => p.isOnTrack).length;
  const projectsAtRisk = projectsWithProgress.filter(p => p.isAtRisk).length;

  return {
    projectsWithProgress,
    totalProjects,
    projectsOnTrack,
    projectsAtRisk
  };
}

// Main message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, payload, id } = event.data;

  try {
    let result;

    switch (type) {
      case 'TEAM_ANALYTICS':
        result = calculateTeamAnalytics(payload);
        break;
      
      case 'PRODUCTIVITY_ANALYTICS':
        result = calculateProductivityAnalytics(payload);
        break;
      
      case 'PROJECT_ANALYTICS':
        result = calculateProjectAnalytics(payload);
        break;
      
      default:
        throw new Error(`Unknown worker task type: ${type}`);
    }

    const response: WorkerResponse = {
      type: 'SUCCESS',
      id,
      payload: result
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'ERROR',
      id,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    self.postMessage(response);
  }
};

// Export empty object for TypeScript
export {};
