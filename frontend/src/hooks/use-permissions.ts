import { PermissionType } from "@/constant";
import { UserType, WorkspaceWithMembersType } from "@/types/api.type";
import { useEffect, useMemo, useState } from "react";

const usePermissions = (
  user: UserType | undefined,
  workspace: WorkspaceWithMembersType | undefined
) => {
  const [permissions, setPermissions] = useState<PermissionType[]>([]);

  useEffect(() => {
    if (user && workspace) {
      // Check if user is the workspace owner
      if (workspace.owner === user._id) {
        // Workspace owner gets ALL permissions
        const allPermissions: PermissionType[] = [
          "CREATE_WORKSPACE",
          "DELETE_WORKSPACE",
          "EDIT_WORKSPACE",
          "MANAGE_WORKSPACE_SETTINGS",
          "ADD_MEMBER",
          "CHANGE_MEMBER_ROLE",
          "REMOVE_MEMBER",
          "CREATE_PROJECT",
          "EDIT_PROJECT",
          "DELETE_PROJECT",
          "CREATE_TASK",
          "EDIT_TASK",
          "DELETE_TASK",
          "VIEW_ONLY"
        ];
        setPermissions(allPermissions);
        return;
      }

      // Check if user is a member
      const member = workspace.members.find(
        (member) => member.userId === user._id
      );

      if (member) {
        // Check if user is admin by role name
        const isAdminUser = member.role.name?.toLowerCase().includes('admin') ||
          member.role.name?.toLowerCase().includes('owner');

        if (isAdminUser) {
          // Admin users get most permissions (except workspace-level ones)
          const adminPermissions: PermissionType[] = [
            "ADD_MEMBER",
            "CHANGE_MEMBER_ROLE",
            "REMOVE_MEMBER",
            "CREATE_PROJECT",
            "EDIT_PROJECT",
            "DELETE_PROJECT",
            "CREATE_TASK",
            "EDIT_TASK",
            "DELETE_TASK",
            "VIEW_ONLY"
          ];
          setPermissions(adminPermissions);
        } else if (member.role.permissions && member.role.permissions.length > 0) {
          // Use role permissions if they exist
          setPermissions(member.role.permissions);
        } else {
          // Fallback: give basic permissions based on role name
          let fallbackPermissions: PermissionType[] = ["VIEW_ONLY"];

          if (member.role.name?.toLowerCase().includes('edit')) {
            fallbackPermissions.push("CREATE_TASK", "EDIT_TASK");
          }
          if (member.role.name?.toLowerCase().includes('manage')) {
            fallbackPermissions.push("CREATE_PROJECT", "EDIT_PROJECT");
          }

          setPermissions(fallbackPermissions);
        }
      } else {
        // If user is not a member, give basic view permissions
        setPermissions(["VIEW_ONLY"]);
      }
    }
  }, [user, workspace]);

  return useMemo(() => permissions, [permissions]);
};

export default usePermissions;
