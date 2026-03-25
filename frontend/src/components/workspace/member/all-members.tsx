"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader, MoreVertical, LogOut, UserMinus, Shield, AlertTriangle } from "lucide-react";

import { ResponsiveAvatar } from "@/components/ui/responsive-avatar";
import { Button } from "@/components/ui/button";
import { OnlineStatusIndicator } from "@/components/ui/online-status-indicator";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { useAuthContext } from "@/context/useAuthContext";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeWorkspaceMemberRoleMutationFn, leaveWorkspaceMutationFn, removeMemberMutationFn, dismissAdminMutationFn } from "@/lib/api";
import { useProfilePictures } from "@/hooks/use-profile-pictures";
import { useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { Permissions } from "@/constant";
import { useLoadingContext } from "@/components/loading";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

const AllMembers = () => {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'leave' | 'remove' | 'dismiss';
    member?: any;
    reason?: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const { user, hasPermission } = useAuthContext();
  const router = useRouter();

  const canChangeMemberRole = hasPermission(Permissions.CHANGE_MEMBER_ROLE);

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { data, isPending } = useGetWorkspaceMembers(workspaceId);
  const members = data?.members || [];
  const roles = data?.roles || [];

  // Extract unique user IDs from members for profile picture fetching
  const userIds = useMemo(() => {
    if (!members) return [];
    const ids = members
      .map(member => member.userId?._id)
      .filter((id): id is string => !!id);
    return [...new Set(ids)]; // Remove duplicates
  }, [members]);

  // Fetch profile pictures separately
  const { data: profilePicturesData } = useProfilePictures(userIds);

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: changeWorkspaceMemberRoleMutationFn,
  });

  const { mutate: leaveWorkspace, isPending: isLeavingWorkspace } = useMutation({
    mutationFn: leaveWorkspaceMutationFn,
  });

  const { mutate: removeMember, isPending: isRemovingMember } = useMutation({
    mutationFn: removeMemberMutationFn,
  });

  const { mutate: dismissAdmin, isPending: isDismissingAdmin } = useMutation({
    mutationFn: dismissAdminMutationFn,
  });

  const { isStrategicLoading } = useLoadingContext();
  const { isUserOnline, getUserLastSeen, isConnected, connectionError, onlineUsers } = useOnlineStatus();

  // Helper to get lastSeen with fallback to API data
  const getLastSeenForMember = (memberId: string): Date | null => {
    // First try WebSocket data
    const wsLastSeen = getUserLastSeen(memberId);
    if (wsLastSeen) return wsLastSeen;
    
    // Fallback to API data from member object
    const member = members.find(m => m.userId._id === memberId);
    if (member?.userId?.lastSeen) {
      return new Date(member.userId.lastSeen);
    }
    
    return null;
  };

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const handleSelect = (roleId: string, memberId: string) => {
    if (!roleId || !memberId) return;
    const payload = {
      workspaceId,
      data: {
        roleId,
        memberId,
      },
    };
    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["members", workspaceId],
        });
        toast({
          title: "Success",
          description: "Member's role changed successfully",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleLeaveWorkspace = () => {
    setConfirmAction({ type: 'leave' });
    setShowConfirmDialog(true);
  };

  const handleRemoveMember = (member: any) => {
    setConfirmAction({ type: 'remove', member });
    setShowConfirmDialog(true);
  };

  const handleDismissAdmin = (member: any) => {
    setConfirmAction({ type: 'dismiss', member });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    const commonCallbacks = {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["members", workspaceId],
        });
        setShowConfirmDialog(false);
        setConfirmAction(null);
        setReason("");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    };

    switch (confirmAction.type) {
      case 'leave':
        leaveWorkspace(workspaceId, {
          ...commonCallbacks,
          onSuccess: () => {
            toast({
              title: "Success",
              description: "You have left the workspace",
              variant: "success",
            });
            router.push('/workspace');
          },
        });
        break;
      case 'remove':
        removeMember({
          workspaceId,
          memberId: confirmAction.member.userId._id,
          reason: reason || undefined,
        }, {
          ...commonCallbacks,
          onSuccess: () => {
            toast({
              title: "Success",
              description: `${confirmAction.member.userId.name} has been removed from the workspace`,
              variant: "success",
            });
            commonCallbacks.onSuccess();
          },
        });
        break;
      case 'dismiss':
        dismissAdmin({
          workspaceId,
          memberId: confirmAction.member.userId._id,
          reason: reason || undefined,
        }, {
          ...commonCallbacks,
          onSuccess: () => {
            toast({
              title: "Success",
              description: `${confirmAction.member.userId.name} has been dismissed as admin`,
              variant: "success",
            });
            commonCallbacks.onSuccess();
          },
        });
        break;
    }
  };

  // Helper to determine user permissions
  const getCurrentUserRole = () => {
    const currentUserMembership = members.find(m => m.userId._id === user?._id);
    return currentUserMembership?.role?.name;
  };

  const currentUserRole = getCurrentUserRole();
  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const canRemoveMembers = isOwner || isAdmin;
  
  const onlineCount = onlineUsers.filter(user => user.isOnline).length;

  return (
    <div className="space-y-4 sm:space-y-5 pt-2">
      {/* WebSocket Connection Status */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="truncate">
            {isConnected ? `Online status: Connected (${onlineCount} online)` : "Online status: Disconnected"}
          </span>
          {connectionError && (
            <span className="text-destructive text-xs">({connectionError})</span>
          )}
        </div>
      </div>
      {/* Leave Workspace Button for current user */}
      {user && !isOwner && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaveWorkspace}
            disabled={isLeavingWorkspace}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 dark:text-destructive dark:border-destructive/30 dark:hover:bg-destructive/20"
          >
            {isLeavingWorkspace ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Leave Workspace
              </>
            )}
          </Button>
        </div>
      )}

      {isPending ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-primary" />
        </div>
      ) : null}

      {members?.map((member) => {
        const name = member.userId?.name;
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);
        const isBtnDisabled =
          isLoading ||
          !canChangeMemberRole ||
          member.userId._id === user?._id;
        const popoverId = member.userId?._id || member._id;
        return (
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-card/60 dark:bg-card/70 backdrop-blur-sm border border-border shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200 group w-full"
            key={popoverId}
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
              <div className="relative">
                <ResponsiveAvatar
                  src={profilePicturesData?.profilePictures?.[member.userId._id || ''] || undefined}
                  alt={member.userId?.name || "Member"}
                  fallback={initials}
                  size="lg"
                  className="shadow-md ring-2 ring-primary/20 dark:ring-primary/30"
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineStatusIndicator
                    isOnline={isUserOnline(member.userId._id)}
                    lastSeen={getLastSeenForMember(member.userId._id)}
                    size="sm"
                  />
                </div>
              </div>
              <div className="min-w-0 w-full">
                <div className="flex items-center gap-2">
                  <p className="text-sm sm:text-base font-semibold leading-none text-foreground truncate">
                    {name}
                  </p>
                  {isUserOnline(member.userId._id) && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                      Online
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
                  {member.userId.email}
                </p>
                {!isUserOnline(member.userId._id) && getLastSeenForMember(member.userId._id) && (
                  <p className="text-xs text-muted-foreground/70 truncate">
                    Last seen {getLastSeenForMember(member.userId._id)?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    `min-w-20 sm:min-w-24 capitalize border-0 shadow-sm transition-transform duration-150 disabled:opacity-90 text-xs sm:text-sm ` +
                    (member.userId._id === user?._id
                      ? 'bg-primary/80 text-primary-foreground cursor-default'
                      : 'bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground dark:from-primary dark:to-primary/90')
                  }
                  disabled={true}
                >
                  {member.role.name?.toLowerCase()}
                </Button>

                {/* Member Actions Dropdown */}
                {canRemoveMembers && member.userId._id !== user?._id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                        disabled={isRemovingMember || isDismissingAdmin}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-background dark:bg-slate-900 border-border dark:border-slate-700">
                      <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Change Role Option */}
                      {canChangeMemberRole && (
                        <Popover open={openPopoverId === popoverId} onOpenChange={(open) => setOpenPopoverId(open ? popoverId : null)}>
                          <PopoverTrigger asChild>
                            <div className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                              <ChevronDown className="w-4 h-4 ml-auto" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="mx-auto rounded-xl shadow-lg border border-border dark:border-slate-700 bg-background/95 dark:bg-slate-900/95" align="end">
                            <Command>
                              <CommandInput
                                placeholder="Select new role..."
                                disabled={isLoading}
                                className="disabled:pointer-events-none"
                              />
                              <CommandList>
                                {isLoading ? (
                                  <Loader className="w-8 h-8 animate-spin place-self-center flex my-4 text-blue-500" />
                                ) : (
                                  <>
                                    <CommandEmpty>No roles found.</CommandEmpty>
                                    <CommandGroup>
                                      {roles?.map(
                                        (role) =>
                                          role.name !== "OWNER" && (
                                            <CommandItem
                                              key={role._id}
                                              disabled={isLoading}
                                              className="disabled:pointer-events-none gap-1 mb-1 flex flex-col items-start px-4 py-2 cursor-pointer rounded-lg hover:text-white hover:bg-black dark:hover:bg-slate-800 dark:hover:text-white transition-colors w-full"
                                              onSelect={() => {
                                                handleSelect(
                                                  role._id,
                                                  member.userId._id
                                                );
                                                setOpenPopoverId(null);
                                              }}
                                            >
                                              <p className="capitalize font-medium text-gray-800 dark:text-gray-100">
                                                {role.name?.toLowerCase()}
                                              </p>
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {role.name === "ADMIN" &&
                                                  `Can view, create, edit tasks, project and manage settings.`}
                                                {role.name === "MEMBER" &&
                                                  `Can view, edit only task created by.`}
                                              </p>
                                            </CommandItem>
                                          )
                                      )}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}

                      {/* Dismiss Admin (only for owners dismissing admins) */}
                      {isOwner && member.role.name === "ADMIN" && (
                        <DropdownMenuItem
                          onClick={() => handleDismissAdmin(member)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Dismiss Admin
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* Remove Member */}
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'leave' && 'Leave Workspace'}
              {confirmAction?.type === 'remove' && 'Remove Member'}
              {confirmAction?.type === 'dismiss' && 'Dismiss Admin'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {/* Always render AlertDialogDescription with content */}
          {confirmAction?.type === 'leave' && (
            <AlertDialogDescription className="space-y-4">
              <div>Are you sure you want to leave this workspace?</div>
              <div className="text-sm text-red-600 mt-2">
                You will lose access to all projects and tasks in this workspace.
              </div>
            </AlertDialogDescription>
          )}
          
          {confirmAction?.type === 'remove' && confirmAction.member && (
            <AlertDialogDescription className="space-y-4">
              <div>
                Are you sure you want to remove{" "}
                <span className="font-semibold">{confirmAction.member.userId.name}</span>{" "}
                from this workspace?
              </div>
              <div className="text-sm text-red-600 mt-2">
                They will lose access to all projects and tasks in this workspace.
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (optional):
                </div>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason for this action..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          )}
          
          {confirmAction?.type === 'dismiss' && confirmAction.member && (
            <AlertDialogDescription className="space-y-4">
              <div>
                Are you sure you want to dismiss{" "}
                <span className="font-semibold">{confirmAction.member.userId.name}</span>{" "}
                as an admin?
              </div>
              <div className="text-sm text-orange-600 mt-2">
                They will be demoted to a regular member role.
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (optional):
                </div>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason for this action..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              setConfirmAction(null);
              setReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isLeavingWorkspace || isRemovingMember || isDismissingAdmin}
              className={
                confirmAction?.type === 'leave' || confirmAction?.type === 'remove'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }
            >
              {(isLeavingWorkspace || isRemovingMember || isDismissingAdmin) ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {confirmAction?.type === 'leave' && 'Leave Workspace'}
                  {confirmAction?.type === 'remove' && 'Remove Member'}
                  {confirmAction?.type === 'dismiss' && 'Dismiss Admin'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllMembers;
