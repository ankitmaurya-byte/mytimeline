import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import { Loader } from "lucide-react";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { format } from "date-fns";
import { useLoadingContext } from "@/components/loading";
import { useProfilePictures } from "@/hooks/use-profile-pictures";
import { useMemo } from "react";

const RecentProjects = () => {
  const workspaceId = useWorkspaceId();
  const { isStrategicLoading } = useLoadingContext();

  const { data, isPending } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    pageNumber: 1,
    pageSize: 10,
  });

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const projects = data?.projects || [];

  // Extract unique user IDs from projects for profile picture fetching
  const userIds = useMemo(() => {
    if (!projects) return [];
    const ids = projects
      .map(project => project.createdBy?._id)
      .filter((id): id is string => !!id);
    return [...new Set(ids)]; // Remove duplicates
  }, [projects]);

  // Fetch profile pictures separately
  const { data: profilePicturesData } = useProfilePictures(userIds);

  return (
    <div className="flex flex-col">
      {isPending ? (
        <Loader
          className="w-8 h-8
         animate-spin
         place-self-center
         flex"
        />
      ) : null}
      {projects?.length === 0 && (
        <div
          className="font-semibold
         text-sm text-muted-foreground
          text-center py-5"
        >
          No Project created yet
        </div>
      )}

      <ul role="list" className="space-y-2">
        {projects.map((project) => {
          const name = project.createdBy.name;
          const initials = getAvatarFallbackText(name);
          const avatarColor = getAvatarColor(name);

          return (
            <li
              key={project._id}
              role="listitem"
              className="shadow-none cursor-pointer border-0 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ease-in-out rounded-lg"
            >
              <Link
                href={`/workspace/${workspaceId}/project/${project._id}`}
                className="grid gap-8 p-0"
              >
                <div className="flex items-start gap-2">
                  <div className="text-xl !leading-[1.4rem]">
                    {project.emoji}
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none dark:text-gray-100">
                      {project.name}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      {project.createdAt
                        ? format(project.createdAt, "PPP")
                        : null}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Created by</span>
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage
                        src={getProfilePictureUrl(
                          profilePicturesData?.profilePictures?.[project.createdBy._id || ''] || undefined
                        ) || undefined}
                        alt="Avatar"
                      />
                      <AvatarFallback className={avatarColor}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentProjects;
