import API from "./axios-client";
import {
  AllMembersInWorkspaceResponseType,
  AllProjectPayloadType,
  AllProjectResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CreateProjectPayloadType,
  CreateTaskPayloadType,
  EditTaskPayloadType,
  CreateWorkspaceResponseType,
  EditProjectPayloadType,
  ProjectByIdPayloadType,
  ProjectResponseType,
  UserType,
} from "../types/api.type";
import {
  AllWorkspaceResponseType,
  CreateWorkspaceType,
  CurrentUserResponseType,
  LoginResponseType,
  loginType,
  registerType,
  WorkspaceByIdResponseType,
  EditWorkspaceType,
} from "@/types/api.type";

export const getCurrentUserQueryFn = async (): Promise<{ message: string; user: UserType | null }> => {
  const timestamp = Date.now();
  try {
    const response = await API.get(`/auth/me?_t=${timestamp}`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 401) {
      return { message: 'unauthorized', user: null };
    }
    throw err;
  }
};

export const updateUserMutationFn = async (data: { name: string }): Promise<CurrentUserResponseType> => {
  const response = await API.put("/user/update", data);
  return response.data;
};

export const deleteAccountMutationFn = async (): Promise<{ message: string }> => {
  const response = await API.delete(`/auth/delete-account`);
  return response.data;
};

//********* WORKSPACE ****************
//************* */

export const createWorkspaceMutationFn = async (
  data: CreateWorkspaceType
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post(`/workspace/create/new`, data);
  return response.data;
};

export const editWorkspaceMutationFn = async ({
  workspaceId,
  data,
}: EditWorkspaceType) => {
  // Backend Next.js route exists at /api/workspace/update/[id]
  const response = await API.put(`/workspace/update/${workspaceId}`, data);
  return response.data;
};

export const getAllWorkspacesUserIsMemberQueryFn =
  async (): Promise<AllWorkspaceResponseType> => {
    const timestamp = Date.now();
    const response = await API.get(`/workspace/all?_t=${timestamp}`);
    // console.log('[getAllWorkspacesUserIsMemberQueryFn] API Response:', response.data);
    return response.data;
  };

export const getWorkspaceByIdQueryFn = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  const response = await API.get(`/workspace/${workspaceId}`);
  return response.data;
};

export const getMembersInWorkspaceQueryFn = async (
  workspaceId: string
): Promise<AllMembersInWorkspaceResponseType> => {
  const response = await API.get(`/workspace/members/${workspaceId}`);
  return response.data;
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  const response = await API.get(`/workspace/analytics/${workspaceId}`);
  return response.data;
};

export const changeWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  const response = await API.put(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string | null;
}> => {
  // Backend Next.js route exists at /api/workspace/delete/[id]
  const response = await API.delete(`/workspace/delete/${workspaceId}`);
  return response.data;
};

//*******MEMBER ****************

export const joinWorkspaceByInviteMutationFn = async (inviteCode: string): Promise<{ message: string; workspaceId: string; role: string }> => {
  const response = await API.post(`/member/workspace/${inviteCode}/join`);
  return response.data;
};

export const getWorkspaceByInviteCodeQueryFn = async (inviteCode: string): Promise<{ message: string; workspace: any; owner: any }> => {
  const response = await API.get(`/workspace/invite/${inviteCode}`);
  return response.data;
};

export const leaveWorkspaceMutationFn = async (workspaceId: string): Promise<{ message: string }> => {
  const response = await API.delete(`/membership/workspace/${workspaceId}/leave`);
  return response.data;
};

export const removeMemberMutationFn = async ({
  workspaceId,
  memberId,
  reason,
}: {
  workspaceId: string;
  memberId: string;
  reason?: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(`/membership/workspace/${workspaceId}/member/${memberId}`, {
    data: { reason },
  });
  return response.data;
};

export const dismissAdminMutationFn = async ({
  workspaceId,
  memberId,
  reason,
}: {
  workspaceId: string;
  memberId: string;
  reason?: string;
}): Promise<{ message: string }> => {
  // Primary (REST style) endpoint
  try {
    const response = await API.put(`/membership/workspace/${workspaceId}/member/${memberId}/dismiss`, { reason });
    return response.data;
  } catch (err: any) {
    // If the dedicated membership route isn't deployed yet (404), fallback to legacy admin action endpoint
    const status = err?.response?.status;
    if (status === 404) {
      console.warn('[dismissAdminMutationFn] REST dismiss endpoint 404. Falling back to /admin/users action API');
      try {
        const fallback = await API.post(`/admin/users`, {
          action: 'dismiss',
          memberId,
          workspaceId,
          reason,
        });
        return { message: fallback.data?.message || 'Member dismissed (fallback)' };
      } catch (fallbackErr: any) {
        const fallbackStatus = fallbackErr?.response?.status;
        if (fallbackStatus === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (fallbackStatus === 405) {
          throw new Error('Admin users endpoint not available. Please contact support.');
        }
        throw fallbackErr;
      }
    } else if (status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    throw err;
  }
};

//********* */
//********* PROJECTS
export const createProjectMutationFn = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editProjectMutationFn = async ({
  projectId,
  workspaceId,
  data,
}: EditProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.put(
    `/project/${projectId}/workspace/${workspaceId}`,
    data
  );
  return response.data;
};

export const getProjectsInWorkspaceQueryFn = async ({
  workspaceId,
  pageSize = 50, // Increased default from 10 to 50
  pageNumber = 1,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const response = await API.get(
    `/project/workspace/${workspaceId}/all?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return response.data;
};

export const getProjectByIdQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

export const getProjectAnalyticsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/analytics`
  );
  return response.data;
};

export const deleteProjectMutationFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

//*******TASKS ********************************
//************************* */

export const createTaskMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: CreateTaskPayloadType) => {
  const response = await API.post(
    `/task/project/${projectId}/workspace/${workspaceId}`,
    data
  );
  return response.data;
};

export const editTaskMutationFn = async ({
  taskId,
  projectId,
  workspaceId,
  data,
}: EditTaskPayloadType): Promise<{ message: string; }> => {
  // console.log('🌐 API: editTaskMutationFn called with:', { taskId, projectId, workspaceId, data });
  // console.log('🌐 API: Making PUT request to:', `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/update`);

  try {
    const response = await API.put(
      `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/update`,
      data
    );
    // console.log('🌐 API: editTaskMutationFn response:', response.data);
    return response.data;
  } catch (error) {
    console.error('🌐 API: editTaskMutationFn error:', error);
    throw error;
  }
};

export const getAllTasksQueryFn = async ({
  workspaceId,
  keyword,
  projectId,
  assignedTo,
  priority,
  status,
  dueDate,
  dueDateStart,
  dueDateEnd,
  pageNumber = 1,
  pageSize = 20, // Reduced default page size for faster loading
  sortBy,
  sortOrder,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  const baseUrl = `/task/workspace/${workspaceId}/all`;

  // Always use null for empty/optional fields, never undefined
  const queryParams = new URLSearchParams();
  if (keyword ?? null) queryParams.append("keyword", keyword ?? "");
  if (projectId ?? null) queryParams.append("projectId", projectId ?? "");
  if (assignedTo ?? null) queryParams.append("assignedTo", assignedTo ?? "");
  if (priority ?? null) queryParams.append("priority", priority ?? "");
  if (status ?? null) queryParams.append("status", status ?? "");
  if (dueDate ?? null) queryParams.append("dueDate", dueDate ?? "");
  if (dueDateStart ?? null) queryParams.append("dueDateStart", dueDateStart ?? "");
  if (dueDateEnd ?? null) queryParams.append("dueDateEnd", dueDateEnd ?? "");
  if (pageNumber) queryParams.append("pageNumber", pageNumber?.toString());
  if (pageSize) queryParams.append("pageSize", pageSize?.toString());
  if (sortBy) queryParams.append("sortBy", sortBy);

  // Only add cache-busting parameter when explicitly requested
  // This prevents rate limiting while still allowing cache invalidation when needed
  if (sortOrder) queryParams.append("sortOrder", sortOrder);

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTaskMutationFn = async ({
  workspaceId,
  taskId,
  projectId,
}: {
  workspaceId: string;
  taskId: string;
  projectId: string;
}): Promise<{
  message: string;
}> => {
  const url = `/task/${taskId}/project/${projectId}/workspace/${workspaceId}`;
  const response = await API.delete(url);
  return response.data;
};

//********* INSIGHTS NOTES ****************

export const getInsightsNotesQueryFn = async (workspaceId: string): Promise<{
  notes: Array<{ id: string; text: string; author: string; userId: string; createdAt: string; }>;
}> => {
  const response = await API.get(`/insights/workspace/${workspaceId}/notes`);
  return response.data;
};

export const createInsightsNoteMutationFn = async ({
  workspaceId,
  text,
  author,
}: {
  workspaceId: string;
  text: string;
  author: string;
}): Promise<{
  message: string;
  note: { id: string; text: string; author: string; createdAt: string; };
}> => {
  const response = await API.post(`/insights/workspace/${workspaceId}/notes`, {
    text,
    author,
  });
  return response.data;
};

export const deleteInsightsNoteMutationFn = async ({
  workspaceId,
  noteId,
}: {
  workspaceId: string;
  noteId: string;
}): Promise<{ message: string }> => {
  const response = await API.delete(`/insights/workspace/${workspaceId}/notes/${noteId}`);
  return response.data;
};

//********* AI INSIGHTS (dynamic) ****************

export const getAIInsightsQueryFn = async (workspaceId: string): Promise<{
  message: string;
  generatedAt: string;
  provider: string;
  stats: any;
  insights: Array<{ text: string; type: 'performance' | 'team' | 'personal'; score?: number }>;
  recommendation: string;
  llm?: any;
  llmSummary?: string | null;
}> => {
  const response = await API.get(`/ai/insights/workspace/${workspaceId}`);
  return response.data;
};

//********* AUTHENTICATION ****************

export const logoutMutationFn = async (): Promise<{ message: string }> => {
  const response = await API.post("/auth/logout");
  return response.data;
};

export const deleteUserMutationFn = async (): Promise<{ message: string }> => {
  const response = await API.delete("/user/delete");
  return response.data;
};
