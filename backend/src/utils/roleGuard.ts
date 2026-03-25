import { PermissionType, Permissions } from "../enums/role.enum";
import { UnauthorizedException } from "./appError";
import { RolePermissions } from "./role-permission";

export const roleGuard = (
  role: keyof typeof RolePermissions,
  requiredPermissions: PermissionType[]
) => {
  const permissions = RolePermissions[role];

  // Check if role exists and has permissions
  if (!permissions || !Array.isArray(permissions)) {
    throw new UnauthorizedException(
      `Invalid role: ${role}. You do not have the necessary permissions to perform this action`
    );
  }

  // If the role doesn't exist or lacks required permissions, throw an exception
  const hasPermission = requiredPermissions.every((permission) =>
    permissions.includes(permission)
  );

  if (!hasPermission) {
    throw new UnauthorizedException(
      "You do not have the necessary permissions to perform this action"
    );
  }
};
