import UserModel from "../models/user.model";
import MemberModel from "../models/member.model";
import AccountModel from "../models/account.model";
import TaskModel from "../models/task.model";
import ProjectModel from "../models/project.model";
import WorkspaceModel from "../models/workspace.model";
import { BadRequestException } from "../utils/appError";

export const getCurrentUserService = async (userId: string) => {
  // Get the populated user data
  const user = await UserModel.findById(userId)
    .populate("currentWorkspace")
    .select("-password");

  if (!user) {
    throw new BadRequestException("User not found");
  }

  return {
    user,
  };
};

export const updateUserService = async (userId: string, updateData: { name?: string }) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new BadRequestException("User not found");
  }

  // Update only provided fields
  if (updateData.name !== undefined) {
    user.name = updateData.name;
  }

  await user.save();

  // Return the updated user with populated data
  const updatedUser = await UserModel.findById(userId)
    .populate("currentWorkspace")
    .select("-password");

  return {
    user: updatedUser,
  };
};

export const deleteUserService = async (userId: string) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new BadRequestException("User not found");
  }

  // Delete all related data
  await Promise.all([
    // Delete user's memberships
    MemberModel.deleteMany({ userId }),

    // Delete user's accounts (OAuth connections)
    AccountModel.deleteMany({ userId }),

    // Delete tasks assigned to the user
    TaskModel.deleteMany({ assignedTo: userId }),

    // Delete projects owned by the user
    ProjectModel.deleteMany({ owner: userId }),

    // Delete workspaces owned by the user
    WorkspaceModel.deleteMany({ owner: userId }),

    // Finally delete the user
    UserModel.findByIdAndDelete(userId)
  ]);

  return {
    message: "User account and all related data deleted successfully",
  };
};
