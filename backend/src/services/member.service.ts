import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import WorkspaceModel from "../models/workspace.model";
import UserModel from "../models/user.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
): Promise<{ role: string }> => {
  // Validate inputs
  if (!workspaceId || workspaceId === "undefined" || workspaceId === "null") {
    throw new BadRequestException("Invalid workspace ID provided");
  }

  if (!userId || userId === "undefined" || userId === "null") {
    throw new BadRequestException("Invalid user ID provided");
  }

  // Check if workspaceId is a valid MongoDB ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(workspaceId)) {
    throw new BadRequestException("Workspace ID must be a valid MongoDB ObjectId");
  }

  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    // Log additional information for debugging
    console.warn(`Workspace not found: ${workspaceId} for user: ${userId}`);
    throw new NotFoundException("Workspace not found - it may have been deleted or you may not have access");
  }
  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role");

  if (!member) {
    // If the user is an admin (bootstrap / system admin), allow implicit access.
    // Optionally auto-create a membership so subsequent calls are fast & consistent.
    const user = await UserModel.findById(userId).lean() as { isAdmin?: boolean } | null;
    if (user?.isAdmin) {
      // Try to find an OWNER role first, else fallback to ADMIN, else any existing role.
      let roleDoc = await RoleModel.findOne({ name: Roles.OWNER });
      if (!roleDoc) roleDoc = await RoleModel.findOne({ name: Roles.ADMIN });
      if (!roleDoc) roleDoc = await RoleModel.findOne();

      if (!roleDoc) {
        // No roles seeded yet; treat as OWNER without persisting membership.
        return { role: Roles.OWNER };
      }
      try {
        await MemberModel.create({
          userId,
          workspaceId,
          role: roleDoc._id,
        } as any);
        return { role: (await RoleModel.findById(roleDoc._id))?.name || Roles.ADMIN };
      } catch (err: any) {
        if (err?.code === 11000) {
          // Race: membership created concurrently; fetch it.
          const existing = await MemberModel.findOne({ userId, workspaceId }).populate("role");
          if (existing?.role) return { role: (existing.role as any).name };
          return { role: Roles.ADMIN };
        }
        // Fallback: allow access as ADMIN even if creation failed (non-critical)
        return { role: Roles.ADMIN };
      }
    }

    // Non-admin path: user not found in workspace
    throw new NotFoundException(
      "You are not a member of this workspace"
    );
  }

  if (!member.role) {
    // Check the raw member data to see what's in the role field
    const rawMember = await MemberModel.findOne({ userId, workspaceId });

    // Try to find the role by ID directly
    if (rawMember?.role) {
      const roleById = await RoleModel.findById(rawMember.role);

      if (roleById) {
        return { role: roleById.name };
      }
    }

    throw new BadRequestException("Member role not found - role reference is null. Raw role ID: " + rawMember?.role);
  }

  const roleName = (member.role as any)?.name;

  if (!roleName) {
    throw new BadRequestException("Role name not found - role object is missing name property");
  }

  return { role: roleName };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  // Find workspace by invite code
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();
  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace not found");
  }

  // Check if user is already a member
  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();

  if (existingMember) {
    throw new BadRequestException("You are already a member of this workspace");
  }

  const role = await RoleModel.findOne({ name: Roles.MEMBER });

  if (!role) {
    throw new NotFoundException("Role not found");
  }

  // Add user to workspace as a member
  const newMember = new MemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
  });
  await newMember.save();

  return { workspaceId: workspace._id, role: role.name };
};
