"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Settings as SettingsIcon, Users, Trash2, User, Mail, Camera } from "lucide-react";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";
import EditWorkspaceForm from "@/components/workspace/edit-workspace-form";
import DeleteWorkspaceCard from "@/components/workspace/settings/delete-workspace-card";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/useAuthContext";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { getStableProfilePictureUrl } from "@/lib/profile-picture-utils";

const Settings = () => {
  const { user, hasPermission, isLoading } = useAuthContext();
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  useEffect(() => {
    if (!user || !hasPermission(Permissions.MANAGE_WORKSPACE_SETTINGS)) {
      router.push(`/workspace/${workspaceId}`);
    }
  }, [user, hasPermission, router, workspaceId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Check if user has the required permission
  if (!user || !hasPermission(Permissions.MANAGE_WORKSPACE_SETTINGS)) return null;

  return (
    <div className="w-full min-h-[80vh] py-3 sm:py-6">
      <WorkspaceHeader />
      <main>
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-6">
          <div className="bg-white/90 dark:bg-black/60 rounded-xl sm:rounded-2xl shadow-xl border border-border p-3 sm:p-6 mt-2 sm:mt-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-primary dark:text-white tracking-tight">
              Workspace Settings
            </h2>

            {/* Settings Navigation */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Link href={`/workspace/${workspaceId}/profile`}>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Link href={`/workspace/${workspaceId}/settings`}>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <SettingsIcon className="h-4 w-4" />
                  General
                </Button>
              </Link>
              <Link href={`/workspace/${workspaceId}/settings/security`}>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <Shield className="h-4 w-4" />
                  Security
                </Button>
              </Link>
              <Link href={`/workspace/${workspaceId}/members`}>
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <Users className="h-4 w-4" />
                  Members
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Profile Settings */}
              <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800  mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <User className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your personal information and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center xs:items-center  gap-3 sm:gap-4">
                    {/* Profile Picture and Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="relative xs:flex xs:flex-col xs:items-center xs:justify-center">
                        <Avatar className="h-16 w-16 border-2 border-blue-200 dark:border-blue-700 shadow-lg">
                          <AvatarImage
                            src={getStableProfilePictureUrl(user?.profilePicture || undefined) || undefined}
                            alt={user?.name || "User"}
                          />
                          <AvatarFallback className={`text-lg font-bold ${getAvatarColor(user?.name || "")}`}>
                            {getAvatarFallbackText(user?.name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
                        <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                          {user?.name || "User"}
                        </h3>
                        <div className="flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground min-w-0">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate break-all overflow-hidden min-w-0 text-xs sm:text-sm">{user?.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <Link href={`/workspace/${workspaceId}/profile`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm">
                          <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Edit Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator className="my-2" />

              {/* General Settings */}
              <section className="bg-muted/40 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-border">
                <EditWorkspaceForm />
              </section>

              <Separator className="my-2" />

              {/* Security Settings Preview */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage biometric authentication, remember me tokens, and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="text-sm text-muted-foreground">
                      Configure your workspace security settings
                    </div>
                    <Link href={`/workspace/${workspaceId}/settings/security`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                        Manage Security
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Separator className="my-2" />

              {/* Danger Zone */}
              <section className="bg-destructive/5 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-destructive/20">
                <DeleteWorkspaceCard />
              </section>

              <Separator className="my-2" />

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

// Prevent static generation to avoid context errors
export const dynamic = 'force-dynamic';
