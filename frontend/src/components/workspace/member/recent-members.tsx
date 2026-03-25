import { ResponsiveAvatar } from "@/components/ui/responsive-avatar";
import { OnlineStatusIndicator } from "@/components/ui/online-status-indicator";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useLoadingContext } from "@/components/loading";
import { useProfilePictures } from "@/hooks/use-profile-pictures";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMemo } from "react";

const RecentMembers = () => {
  const workspaceId = useWorkspaceId();
  const { data, isPending } = useGetWorkspaceMembers(workspaceId);
  const { isStrategicLoading } = useLoadingContext();
  const { isUserOnline, getUserLastSeen } = useOnlineStatus();

  const members = data?.members || [];

  // Extract unique user IDs from members for profile picture fetching
  const userIds = useMemo(() => {
    if (!members) return [];
    const ids = members
      .map(member => member.userId?._id)
      .filter((id): id is string => !!id);
    return [...new Set(ids)]; // Remove duplicates
  }, [members]);

  // Fetch profile pictures separately
  const { data: profilePicturesData, isLoading: profilePicturesLoading, error: profilePicturesError } = useProfilePictures(userIds);

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {isPending ? (
        <Loader
          className="w-8 h-8 
        animate-spin
        place-self-center flex"
        />
      ) : null}

      <ul role="list" className="space-y-3">
        {members.map((member, index) => {
          const name = member?.userId?.name || "";
          const initials = getAvatarFallbackText(name);
          const avatarColor = getAvatarColor(name);
          return (
            <li
              key={index}
              role="listitem"
              className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                <ResponsiveAvatar
                  src={profilePicturesData?.profilePictures?.[member.userId._id || ''] || undefined}
                  alt={member.userId.name || "Member"}
                  fallback={initials}
                  size="lg"
                  className="ring-2 ring-primary/10"
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineStatusIndicator
                    isOnline={isUserOnline(member.userId._id)}
                    lastSeen={getUserLastSeen(member.userId._id)}
                    size="sm"
                  />
                </div>
              </div>

              {/* Member Details */}
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.userId.name}
                  </p>
                  {isUserOnline(member.userId._id) && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                      Online
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role.name}</p>
                {!isUserOnline(member.userId._id) && getUserLastSeen(member.userId._id) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last seen {getUserLastSeen(member.userId._id)?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              {/* Joined Date */}
              <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                <p>Joined</p>
                <p>{member.joinedAt ? format(member.joinedAt, "PPP") : null}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentMembers;
