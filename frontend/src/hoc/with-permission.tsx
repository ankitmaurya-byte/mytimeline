"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PermissionType } from "@/constant";
import { useAuthContext } from "@/context/useAuthContext";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const withPermission = (
  WrappedComponent: React.ComponentType,
  requiredPermission: PermissionType
) => {
  const WithPermission = (props: any) => {
    const { user, hasPermission, isLoading } = useAuthContext();
    const router = useRouter();
    const workspaceId = useWorkspaceId();

    useEffect(() => {
      if (!user || !hasPermission(requiredPermission)) {
        router.push(`/workspace/${workspaceId}`);
      }
    }, [user, hasPermission, router, workspaceId]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    // Check if user has the required permission
    if (!user || !hasPermission(requiredPermission)) return null;
    // If the user has permission, render the wrapped component
    return <WrappedComponent {...props} />;
  };
  return WithPermission;
};

export default withPermission;
