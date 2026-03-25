"use client";
import { createContext, useEffect } from "react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useAuth from "@/hooks/api/use-auth";
import { UserType, WorkspaceType } from "@/types/api.type";
import useGetWorkspaceQuery from "@/hooks/api/use-get-workspace";
import { useRouter } from "next/navigation";
import usePermissions from "@/hooks/use-permissions";
import { PermissionType } from "@/constant";

type ApiError = {
  message: string;
  errorCode?: string;
  status?: number;
};

type AuthContextType = {
  user?: UserType;
  workspace?: WorkspaceType;
  hasPermission: (permission: PermissionType) => boolean;
  error: ApiError | null;
  isLoading: boolean;
  isFetching: boolean;
  workspaceLoading: boolean;
  refetchAuth: () => void;
  refetchWorkspace: () => void;
  // Legacy compatibility properties
  loading: boolean;
  isSignedIn: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const {
    data: authData,
    error: authError,
    isLoading,
    isFetching,
    refetch: refetchAuth,
  } = useAuth();
  const user = authData?.user ?? undefined;
  const isSignedIn = !!user; // Derive signed-in state from user data

  const effectiveWorkspaceId = workspaceId || user?.currentWorkspace?._id || "";


  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useGetWorkspaceQuery(effectiveWorkspaceId, {
    enabled: !!effectiveWorkspaceId && isSignedIn, // Only fetch if we have a workspace ID and user is signed in
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const workspace = workspaceData?.workspace;

  useEffect(() => {
    if (workspaceError) {
      if (workspaceError?.errorCode === "ACCESS_UNAUTHORIZED") {
        router.push("/");
      } else if (workspaceError?.errorCode === "WORKSPACE_NOT_FOUND" || workspaceError?.message?.includes("Workspace not found")) {
        router.push("/workspace");
      }
    }
  }, [router, workspaceError]);

  // Handle workspace navigation when URL workspace doesn't match user's access
  useEffect(() => {
    if (user && workspaceId && user.currentWorkspace && workspaceError) {
      // If there's a workspace error and the URL workspace differs from user's current workspace
      const currentWorkspaceId = user.currentWorkspace?._id;
      if (currentWorkspaceId && workspaceId !== currentWorkspaceId) {
        router.replace(`/workspace/${currentWorkspaceId}`);
      }
    }
  }, [user, workspaceId, workspaceError, router]);

  useEffect(() => {
    const authCookieName = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || 'auth_active';
    const authTokenCookieName = process.env.NEXT_PUBLIC_AUTH_TOKEN_COOKIE_NAME || 'auth_token';

    // Check for valid auth cookies (not just empty ones)
    const hasValidAuthCookie = document.cookie.includes(`${authCookieName}=true`) ||
      (document.cookie.includes(`${authTokenCookieName}=`) &&
        !document.cookie.includes(`${authTokenCookieName}=;`) &&
        !document.cookie.includes(`${authTokenCookieName}=`));

    // Only refetch if we have valid cookies AND no user AND not loading
    // Also check if we're not on the home page (to avoid redirect loops)
    const isOnHomePage = window.location.pathname === '/';

    if (hasValidAuthCookie && !user && !isLoading && !isOnHomePage) {
      refetchAuth();
    }
  }, [user, isLoading, refetchAuth]);

  const permissions = usePermissions(user, workspace);

  const hasPermission = (permission: PermissionType): boolean => {
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        hasPermission,
        error: authError || workspaceError || null,
        isLoading,
        isFetching,
        workspaceLoading,
        refetchAuth,
        refetchWorkspace,
        // Legacy compatibility properties
        loading: isLoading,
        isSignedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
