import mongoose from "mongoose";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";
import ProjectModel from "../models/project.model";
import InsightsNoteModel from "../models/insights-note.model";
import { createDefaultProjectForWorkspace } from "./default-project.service";
import { globalCache } from "../utils/lru-cache";

//********************************
// CREATE NEW WORKSPACE
//**************** **************/
export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;

  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });

  if (!ownerRole) {
    throw new NotFoundException("Owner role not found");
  }

  const workspace = new WorkspaceModel({
    name: name,
    description: description,
    owner: user._id,
  });

  await workspace.save();

  const member = new MemberModel({
    userId: user._id,
    workspaceId: workspace._id,
    role: ownerRole._id,
    joinedAt: new Date(),
  });

  await member.save();

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
  await user.save();

  // Create default project with tasks for new users
  try {
    await createDefaultProjectForWorkspace(workspace._id, user._id);
  } catch (error) {
    console.error("Failed to create default project:", error);
    // Don't fail the workspace creation if default project creation fails
  }

  return {
    workspace,
  };
};

//********************************
// GET WORKSPACES USER IS A MEMBER
//**************** **************/
export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  // console.log('[getAllWorkspacesUserIsMemberService] Looking for memberships for user:', userId);

  const memberships = await MemberModel.find({ userId })
    .populate({
      path: "workspaceId",
      options: {
        lean: true,
        sort: { createdAt: -1 } // Sort by creation date, newest first
      }
    })
    .select("-password")
    .lean()
    .exec();

  // console.log('[getAllWorkspacesUserIsMemberService] Found memberships:', memberships?.length, memberships?.map(m => ({
  //   userId: m.userId,
  //   workspaceId: m.workspaceId?._id,
  //   workspaceName: m.workspaceId?.name
  // })));

  // Extract workspace details from memberships and filter out null workspaces
  const workspaces = memberships
    .map((membership) => membership.workspaceId)
    .filter((workspace) => workspace && workspace._id);

  // console.log('[getAllWorkspacesUserIsMemberService] Filtered workspaces:', workspaces?.length, workspaces?.map(w => ({ id: w._id, name: w.name })));

  // Sort workspaces by creation date (newest first) to ensure newly created workspaces appear first
  workspaces.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { workspaces };
};

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findById(workspaceId).lean();

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const members = await MemberModel.find({ workspaceId })
    .populate({ path: "role", options: { lean: true }, select: "name permissions" }) // Added permissions
    .lean();

  const workspaceWithMembers = workspace ? { ...workspace, members } : null;

  return {
    workspace: workspaceWithMembers,
  };
};

export const getWorkspaceByInviteCodeService = async (inviteCode: string) => {
  const workspace = await WorkspaceModel.findOne({ inviteCode }).lean<import('../models/workspace.model').WorkspaceDocument>();

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  // Get the owner information
  const owner = await UserModel.findById(workspace.owner as any).lean();

  if (!owner) {
    throw new NotFoundException("Workspace owner not found");
  }

  return { workspace, owner };
};

//********************************
// GET ALL MEMEBERS IN WORKSPACE
//**************** **************/

export const getWorkspaceMembersService = async (workspaceId: string) => {
  // Fetch all members of the workspace

  const allMembers = await MemberModel.find({
    workspaceId,
  })
    .populate("userId", "name email lastSeen profilePicture -password")
    .populate("role", "name permissions"); // Added permissions to the population

  // Filter out members with null or missing userId
  const members = allMembers.filter(member => member.userId && member.userId._id);

  // Optimize member data to reduce response size
  const optimizedMembers = members.map(member => ({
    _id: member._id,
    userId: {
      _id: member.userId._id,
      name: member.userId.name,
      email: member.userId.email,
      lastSeen: member.userId.lastSeen,
      profilePicture: member.userId.profilePicture
    },
    role: {
      _id: member.role._id,
      name: member.role.name,
      permissions: member.role.permissions
    },
    workspaceId: member.workspaceId,
    joinedAt: member.joinedAt
    // Exclude any other large fields
  }));

  const roles = await RoleModel.find({}, { name: 1, _id: 1 })
    .select("-permission")
    .lean();

  return { members: optimizedMembers, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const currentDate = new Date();

  const cacheKey = `ws-analytics:${workspaceId}`;
  const cached = globalCache.get(cacheKey);
  if (cached) return { analytics: cached };

  const totalTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
  });

  const overdueTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  const analytics = {
    totalTasks,
    overdueTasks,
    completedTasks,
  };

  globalCache.set(cacheKey, analytics, 5000); // cache 5s

  return { analytics };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId).lean();
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new NotFoundException("Role not found");
  }

  const member = await MemberModel.findOne({
    userId: memberId,
    workspaceId: workspaceId,
  });

  if (!member) {
    throw new Error("Member not found in the workspace");
  }

  member.role = role;
  await member.save();

  return {
    member,
  };
};

//********************************
// UPDATE WORKSPACE
//**************** **************/
export const updateWorkspaceByIdService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  // Update the workspace details
  workspace.name = name || workspace.name;
  workspace.description = description || workspace.description;
  await workspace.save();

  return {
    workspace,
  };
};

export const deleteWorkspaceService = async (
  workspaceId: string,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const workspace = await WorkspaceModel.findById(workspaceId).session(
      session
    );
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    // Check if the user owns the workspace
    if (!workspace.owner.equals(new mongoose.Types.ObjectId(userId))) {
      throw new BadRequestException(
        "You are not authorized to delete this workspace"
      );
    }

    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await ProjectModel.deleteMany({ workspace: workspace._id }).session(
      session
    );
    await TaskModel.deleteMany({ workspace: workspace._id }).session(session);
    await InsightsNoteModel.deleteMany({ workspace: workspace._id }).session(session);

    await MemberModel.deleteMany({
      workspaceId: workspace._id,
    }).session(session);

    // Update the user's currentWorkspace if it matches the deleted workspace
    if (user?.currentWorkspace?.equals(workspaceId)) {
      console.log('[deleteWorkspaceService] Updating user currentWorkspace from:', workspaceId);
      const memberWorkspace = await MemberModel.findOne({ userId }).session(
        session
      );
      // Update the user's currentWorkspace to another workspace they're a member of, or null if none
      user.currentWorkspace = memberWorkspace
        ? memberWorkspace.workspaceId
        : null;

      console.log('[deleteWorkspaceService] User currentWorkspace updated to:', user.currentWorkspace);
      await user.save({ session });
    }

    await workspace.deleteOne({ session });

    // Clear any cached data related to this workspace
    // Note: LRUCache doesn't have invalidateWorkspace method, so we skip cache invalidation
    // In a production environment, you might want to implement workspace-specific cache invalidation

    await session.commitTransaction();

    session.endSession();

    console.log('[deleteWorkspaceService] Workspace deletion completed. Returning currentWorkspace:', user.currentWorkspace);

    return {
      currentWorkspace: user.currentWorkspace,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
