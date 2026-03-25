"use client";
import React, { useEffect, useState } from "react";
import { Loader, Users, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimelineLogo } from "@/components/ui/timeline-logo";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/api/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllWorkspacesUserIsMemberQueryFn, joinWorkspaceByInviteMutationFn, getWorkspaceByInviteCodeQueryFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const InviteUser = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const param = useParams<Record<string, string>>();
  const inviteCode = param?.inviteCode as string;
  const returnUrl = `/invite/workspace/${inviteCode}/join`;

  const { data: authData, isPending } = useAuth();
  const user = authData?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: joinWorkspaceByInviteMutationFn,
    retry: 1, // Retry once on failure
  });

  // Query all workspaces user is a member of
  const { data: workspaceData } = useQuery({
    queryKey: ["userWorkspaces"],
    queryFn: getAllWorkspacesUserIsMemberQueryFn,
    staleTime: 0,
    enabled: !!user,
  });

  // Query workspace information by invite code
  const { data: inviteWorkspaceData, isLoading: isLoadingWorkspace } = useQuery({
    queryKey: ["workspaceByInvite", inviteCode],
    queryFn: () => getWorkspaceByInviteCodeQueryFn(inviteCode),
    enabled: !!inviteCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    mutate(inviteCode, {
      onSuccess: (data: { workspaceId: string }) => {
        
        // Reset queries first
        queryClient.resetQueries({
          queryKey: ["userWorkspaces"],
        });
        
        toast({
          title: "Success",
          description: "Successfully joined the workspace! Redirecting...",
          variant: "success",
        });
        
        // Add a small delay to ensure the toast is visible and queries are reset
        setTimeout(() => {
          const workspaceUrl = `/workspace/${data.workspaceId}`;
          
          try {
            // Try Next.js router first
            router.replace(workspaceUrl);
          } catch (error) {
            console.error('[InviteUser] Router.replace failed, using window.location:', error);
            // Fallback to direct navigation
            window.location.href = workspaceUrl;
          }
        }, 1000);
      },
      onError: (error) => {
        console.error('[InviteUser] Error joining workspace:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to join workspace. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const [alreadyMember, setAlreadyMember] = React.useState(false);

  React.useEffect(() => {
    if (user && inviteCode && workspaceData?.workspaces) {
      const isMember = workspaceData.workspaces.some(
        (ws) => ws.inviteCode === inviteCode
      );
      setAlreadyMember(isMember);
    }
  }, [user, inviteCode, workspaceData]);

  // Show loading state until component is mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200 dark:bg-indigo-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Logo Section - Top Center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 sm:top-6 z-10">
        <Link
          href="/"
          className="group relative inline-block transition-all duration-500 hover:scale-105"
        >
          <div className="flex items-center gap-3">
            <TimelineLogo width={40} height={40} className="group-hover:drop-shadow-lg transition-all duration-500" />
            <span className="font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent drop-shadow-sm group-hover:drop-shadow-lg transition-all duration-500">
              Timeline
            </span>
          </div>
          <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:w-full transition-all duration-700 ease-out"></div>
        </Link>
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 md:p-10">
        <div className="w-full max-w-md space-y-8">

          {/* Main Card */}
          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50">
            <CardHeader className="text-center pb-8 pt-10">
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                {alreadyMember ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <Mail className="w-10 h-10 text-white" />
                )}
              </div>

              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-tight">
                {alreadyMember ? "Welcome back!" : "You're Invited!"}
              </CardTitle>

              <CardDescription className="text-lg text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                {alreadyMember
                  ? "You're already a valued member of this Timeline Workspace. You can access it anytime from your dashboard."
                  : "Join this Timeline Workspace to start collaborating with your team and stay on top of your projects."}
              </CardDescription>

              {/* Workspace Information */}
              {isLoadingWorkspace ? (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-center space-y-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse w-3/4 mx-auto"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : inviteWorkspaceData ? (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">
                      {inviteWorkspaceData.workspace.name}
                    </h3>
                    {inviteWorkspaceData.workspace.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {inviteWorkspaceData.workspace.description}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>Invited by {inviteWorkspaceData.owner.name || inviteWorkspaceData.owner.email}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="pb-10">
              {isPending ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
                    <Loader className="absolute inset-0 w-12 h-12 text-white animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-slate-600 dark:text-slate-300 font-medium">Loading your account...</p>
                    <div className="flex space-x-1 justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              ) : alreadyMember ? (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium text-lg">
                    <CheckCircle className="w-5 h-5" />
                    Already a member
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    You can access this workspace from your dashboard.
                  </p>
                  
                  {/* Find the workspace ID and redirect */}
                  {(() => {
                    const workspace = workspaceData?.workspaces?.find(
                      (ws) => ws.inviteCode === inviteCode
                    );
                    return workspace ? (
                      <Button
                        onClick={() => router.replace(`/workspace/${workspace._id}`)}
                        size="lg"
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Go to Workspace
                      </Button>
                    ) : (
                      <Button
                        onClick={() => router.replace('/workspace-redirect')}
                        size="lg"
                        variant="outline"
                        className="w-full h-12 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        Go to Dashboard
                      </Button>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-6">
                  {user ? (
                    <div className="text-center">
                      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span>Ready to join as {user.email || user.name}</span>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit}>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          size="lg"
                          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                          {isLoading ? (
                            <>
                              <Loader className="w-6 h-6 animate-spin mr-3" />
                              Joining Workspace...
                            </>
                          ) : (
                            <>
                              <Users className="w-6 h-6 mr-3" />
                              Join the Workspace
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                          Sign in to your Timeline account to join
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                          href={`/sign-up?returnUrl=${returnUrl}`}
                          className="block"
                        >
                          <Button
                            size="lg"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                          >
                            Create Account
                          </Button>
                        </Link>

                        <Link
                          href={`/?returnUrl=${returnUrl}`}
                          className="block"
                        >
                          <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                          >
                            Sign In
                          </Button>
                        </Link>
                      </div>

                      <div className="text-center mt-6">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          New to Timeline? Creating an account takes less than a minute.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Powered by Timeline • Secure collaboration made simple
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteUser;
