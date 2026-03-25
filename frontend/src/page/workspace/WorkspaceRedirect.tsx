"use client";
import { useAuthContext } from "@/context/useAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAllWorkspacesUserIsMemberQueryFn } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceDialog } from "@/context/workspace-dialog-context";
import { useEffect, useState } from "react";
import { Plus, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function WorkspaceRedirect() {
    const { loading, isSignedIn, user } = useAuthContext();
    const router = useRouter();
    const { openDialog } = useWorkspaceDialog();
    const { hideOnboarding, showOnboarding } = useOnboarding();
    const search = useSearchParams();
    const onboarding = search?.get('onboarding') === '1';
    const oauthSuccess = search?.get('oauth') === 'success';
    const oauthToken = search?.get('token');
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showNewWorkspaceOnboarding, setShowNewWorkspaceOnboarding] = useState(false);

    const { data: workspaceData, isLoading: workspacesLoading, error: workspacesError, refetch: refetchWorkspaces } = useQuery({
        queryKey: ["workspaces"],
        queryFn: getAllWorkspacesUserIsMemberQueryFn,
        enabled: isSignedIn && !loading,
        retry: 1,
        retryDelay: 2000, // Wait 2 seconds before retry
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes to improve performance
        refetchOnMount: false, // Don't refetch on mount if data is fresh
        refetchOnWindowFocus: false, // Don't refetch on window focus
    });

    // Handle query errors
    useEffect(() => {
        if (workspacesError) {
            // Query error handled silently
        }
    }, [workspacesError]);

    // Handle OAuth success - set cookie and redirect properly
    useEffect(() => {
        if (oauthSuccess && oauthToken) {

            // Set the auth cookie from the token in the URL
            const maxAge = 7 * 24 * 60 * 60; // 7 days
            const secure = window.location.protocol === 'https:';
            const sameSite = secure ? 'None' : 'Lax';
            const securePart = secure ? 'Secure; ' : '';

            // Set both HttpOnly and JS-accessible cookies for cross-domain compatibility
            const httpOnlyCookie = `auth_token=${oauthToken}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}; ${securePart}`;
            const jsAccessibleCookie = `auth_token_js=${oauthToken}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}; ${securePart}`;

            document.cookie = httpOnlyCookie;
            document.cookie = jsAccessibleCookie;



            // Clear the OAuth parameters from URL and redirect to clean workspace URL
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('oauth');
                url.searchParams.delete('token');
                window.history.replaceState({}, '', url.toString());


                // Instead of reloading, redirect to a clean workspace URL

                window.location.href = '/workspace';
            }
        }
    }, [oauthSuccess, oauthToken]);

    // Check for newly created workspace and trigger onboarding
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const newlyCreatedWorkspace = sessionStorage.getItem('newly-created-workspace');
            const shouldShowNewWorkspaceTour = sessionStorage.getItem('show-new-workspace-tour');

            if (newlyCreatedWorkspace && shouldShowNewWorkspaceTour === 'true') {


                // Refetch workspaces to ensure we have the latest data
                refetchWorkspaces();

                // Check if user has disabled new workspace tours
                const hasDisabledNewWorkspaceTours = localStorage.getItem('disable-new-workspace-tours') === 'true';

                if (!hasDisabledNewWorkspaceTours) {
                    setShowNewWorkspaceOnboarding(true);
                    // Don't clear flags yet - let the redirect logic handle it after workspace data is loaded
                } else {
                    // User has disabled new workspace tours, go directly to workspace

                    // Don't clear flags yet - let the redirect logic handle it after workspace data is loaded
                }
            }
        }
    }, [refetchWorkspaces]);

    // Handle workspace redirect
    useEffect(() => {
        if (onboarding) return; // allow user to stay on onboarding screen

        // If there's a workspace error, don't try to redirect
        if (workspacesError) {

            return;
        }

        if (workspaceData?.workspaces && workspaceData.workspaces.length > 0) {
            // If we just created a new workspace, redirect to it instead of staying on onboarding
            if (showNewWorkspaceOnboarding) {

                const firstWorkspace = workspaceData.workspaces[0];
                setIsRedirecting(true);

                // Clear sessionStorage flags
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('newly-created-workspace');
                    sessionStorage.removeItem('show-new-workspace-tour');
                }

                // Redirect to the newly created workspace
                router.replace(`/workspace/${firstWorkspace._id}`);
                return;
            }

            // Check for new workspace flags in sessionStorage - redirect to the specific workspace
            if (typeof window !== 'undefined') {
                const newlyCreatedWorkspace = sessionStorage.getItem('newly-created-workspace');
                const shouldShowNewWorkspaceTour = sessionStorage.getItem('show-new-workspace-tour');

                if (newlyCreatedWorkspace && shouldShowNewWorkspaceTour === 'true') {

                    setIsRedirecting(true);

                    // Clear sessionStorage flags
                    sessionStorage.removeItem('newly-created-workspace');
                    sessionStorage.removeItem('show-new-workspace-tour');

                    // Redirect to the newly created workspace
                    router.replace(`/workspace/${newlyCreatedWorkspace}`);
                    return;
                }
            }

            // Always redirect directly to workspace - skip the welcome page
            const firstWorkspace = workspaceData.workspaces[0];
            if (!firstWorkspace || !firstWorkspace._id) {

                return;
            }

            setIsRedirecting(true);

            // Clear sessionStorage flags after workspace data is loaded and we're about to redirect
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('newly-created-workspace');
                sessionStorage.removeItem('show-new-workspace-tour');
            }

            // Check if tour should be triggered after navigation
            const shouldTriggerTour = localStorage.getItem('trigger-tour-after-navigation') === 'true';
            if (shouldTriggerTour) {
                localStorage.removeItem('trigger-tour-after-navigation');
                // Navigate to workspace and trigger tour
                router.replace(`/workspace/${firstWorkspace._id}?tour=1`);
            } else {
                router.replace(`/workspace/${firstWorkspace._id}`);
            }
        } else if (workspaceData?.workspaces && workspaceData.workspaces.length === 0) {


            // Check if we have sessionStorage flags indicating a workspace was just created
            if (typeof window !== 'undefined') {
                const newlyCreatedWorkspace = sessionStorage.getItem('newly-created-workspace');
                if (newlyCreatedWorkspace) {

                    // Force a refetch to get the latest workspace data
                    refetchWorkspaces();

                    // Add a timeout to handle cases where refetch takes too long
                    setTimeout(() => {
                        const stillNoWorkspaces = !workspaceData?.workspaces || workspaceData.workspaces.length === 0;
                        if (stillNoWorkspaces) {

                            // If we still don't have workspace data, try to redirect directly to the newly created workspace
                            router.replace(`/workspace/${newlyCreatedWorkspace}`);
                        }
                    }, 2000); // Wait 2 seconds for refetch to complete
                }
            }

            // Ensure we're not redirecting when no workspaces exist
            setIsRedirecting(false);
        }
    }, [workspaceData, router, onboarding, user, showNewWorkspaceOnboarding]);

    // Handle sign-in redirect (Just in case for the login flow)
    useEffect(() => {
        if (!loading && !isSignedIn) {
            setIsRedirecting(true);
            router.replace("/sign-in");
        }
    }, [loading, isSignedIn, router]);


    // Don't render anything while redirecting
    if (isRedirecting) {
        return null;
    }

    // Show loading state during OAuth processing with timeout
    if (oauthSuccess && oauthToken && !isSignedIn) {
        // Add a timeout effect to prevent infinite loading
        useEffect(() => {
            const timeout = setTimeout(() => {
                // console.error('[WorkspaceRedirect] OAuth processing timeout, redirecting to sign-in');
                window.location.href = '/sign-in';
            }, 15000); // 15 second timeout

            return () => clearTimeout(timeout);
        }, []);

        return (
            <div className="fixed inset-0 z-50 h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 flex items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-sm sm:max-w-md mx-auto">
                    <div className="animate-spin rounded-full h-20 w-20 sm:h-32 sm:w-32 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 px-4">Completing OAuth login...</p>
                </div>
            </div>
        );
    }

    // Don't render anything if not signed in (will redirect via useEffect)
    // Exception: Allow rendering during OAuth success to process the token
    if (!isSignedIn && !oauthSuccess) {
        return null;
    }

    if (workspacesLoading) {
        return (
            <div className="fixed inset-0 z-50 h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 flex items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-sm sm:max-w-md mx-auto">
                    <div className="animate-spin rounded-full h-20 w-20 sm:h-32 sm:w-32 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 px-4">Loading your workspaces...</p>
                </div>
            </div>
        );
    }

    // Show error state if there's an error
    if (workspacesError) {
        return (
            <div className="fixed inset-0 z-50 h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 flex items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-sm sm:max-w-md mx-auto px-4">
                    <div className="text-red-500 dark:text-red-400 text-4xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">Error Loading Workspaces</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                        There was an error loading your workspaces. Please try refreshing the page.
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 w-full sm:w-auto"
                    >
                        Refresh Page
                    </Button>
                </div>
            </div>
        );
    }

    const handleOnboardingClose = () => {
        // If this was for a newly created workspace, DON'T mark global completion
        // This allows future new workspace tours to still show
        if (showNewWorkspaceOnboarding) {

            setShowNewWorkspaceOnboarding(false);

            // Simply hide - the Enhanced tour will handle the completion logic
            hideOnboarding();

            // Navigate to workspace without marking global completion
            if (workspaceData?.workspaces && workspaceData.workspaces.length > 0) {
                const firstWorkspace = workspaceData.workspaces[0];

                router.push(`/workspace/${firstWorkspace._id}`);
            }
        } else {
            // This was general onboarding for a returning user or first-time user
            // Simply hide - the Enhanced tour will handle completion based on how it was closed

            hideOnboarding();
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 flex items-center justify-center p-4 sm:p-6 md:p-8">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-30 dark:opacity-20">
                <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 dark:bg-blue-900 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-200 dark:bg-indigo-900 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-100 dark:bg-cyan-900 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-lg px-4">
                {/* Hero section */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="relative inline-block mb-4 sm:mb-6">
                        {/* Animated icon background */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-t from-black to-gray-700 dark:from-gray-800 dark:to-gray-600 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 sm:p-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                            <Rocket className="w-full h-full text-white" />
                        </div>

                        {/* Floating sparkles */}
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 dark:text-yellow-300 animate-ping" />
                        </div>
                        <div className="absolute -bottom-2 -left-2">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 dark:text-pink-300 animate-ping" style={{ animationDelay: '0.5s' }} />
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-600 dark:text-gray-200 mb-2 sm:mb-3 px-4">
                        {showNewWorkspaceOnboarding
                            ? "🎉 Workspace Created Successfully!"
                            : workspaceData?.workspaces && workspaceData.workspaces.length > 0
                                ? "Welcome Back to Timeline!"
                                : "Welcome to Timeline!"
                        }
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed px-4">
                        {showNewWorkspaceOnboarding
                            ? "Great! Your workspace is ready. Let's take a quick tour to show you all the amazing features Timeline has to offer."
                            : workspaceData?.workspaces && workspaceData.workspaces.length > 0
                                ? "Let's get you familiar with Timeline's powerful features before you dive into your projects."
                                : "Ready to organize your projects and collaborate with your team? Let's create your first workspace and get started."
                        }
                    </p>
                </div>

                {/* Main action card */}
                <Card className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 dark:border dark:border-gray-700 shadow-2xl hover:shadow-3xl transition-all duration-500 transform">
                    <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            {showNewWorkspaceOnboarding
                                ? "Let's Explore Your New Workspace!"
                                : workspaceData?.workspaces && workspaceData.workspaces.length > 0
                                    ? "Welcome Back!"
                                    : "Create Your First Workspace"
                            }
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed px-2">
                            {showNewWorkspaceOnboarding
                                ? "Your workspace has been created successfully! Before you dive in, let's take a quick guided tour to help you make the most of Timeline's powerful features."
                                : workspaceData?.workspaces && workspaceData.workspaces.length > 0
                                    ? `Great! You already have ${workspaceData.workspaces.length} workspace${workspaceData.workspaces.length > 1 ? 's' : ''}. Let's show you around Timeline's features with a quick tour, then you can dive into your projects.`
                                    : "A workspace is your command center for organizing projects, managing tasks, and collaborating with your team."
                            } </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 sm:space-y-6 flex flex-col items-center justify-center px-4 sm:px-6">
                        {/* Enhanced buttons */}
                        {showNewWorkspaceOnboarding ? (
                            // New workspace created - show tour and skip options
                            <div className="w-full space-y-4">
                                <Button
                                    className="h-12 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg transition-all duration-200 transform-gpu hover:scale-105"
                                    onClick={() => {
                                        // Tour should already be triggered
                                    }}
                                    size="lg"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Start the Guided Tour
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-12 w-full border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                                    onClick={() => {
                                        // Skip tour for this workspace creation only - don't mark global completion
                                        setShowNewWorkspaceOnboarding(false);

                                        // Navigate to workspace
                                        if (workspaceData?.workspaces && workspaceData.workspaces.length > 0) {
                                            const firstWorkspace = workspaceData.workspaces[0];
                                            router.push(`/workspace/${firstWorkspace._id}`);
                                        }
                                    }}
                                    size="lg"
                                >
                                    <Rocket className="w-5 h-5 mr-2" />
                                    Skip This Tour
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="h-10 w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                                    onClick={() => {
                                        // Disable tours for new workspaces specifically
                                        localStorage.setItem('disable-new-workspace-tours', 'true');

                                        setShowNewWorkspaceOnboarding(false);

                                        // DON'T mark general onboarding as complete - just disable new workspace tours

                                        if (workspaceData?.workspaces && workspaceData.workspaces.length > 0) {
                                            const firstWorkspace = workspaceData.workspaces[0];
                                            router.push(`/workspace/${firstWorkspace._id}`);
                                        }
                                    }}
                                    size="sm"
                                >
                                    Don't show tours for new workspaces
                                </Button>
                            </div>
                        ) : workspaceData?.workspaces && workspaceData.workspaces.length > 0 ? (
                            // User has workspaces - show tour and continue options
                            <div className="w-full space-y-4">
                                <Button
                                    className="h-12 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg transition-all duration-200 transform-gpu hover:scale-105"
                                    onClick={() => {

                                        const firstWorkspace = workspaceData.workspaces[0];
                                        router.push(`/workspace/${firstWorkspace._id}`);
                                    }}
                                    size="lg"
                                >
                                    <Rocket className="w-5 h-5 mr-2" />
                                    Continue to My Workspace
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-12 w-full border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all duration-200"
                                    onClick={() => {
                                        // Clear localStorage and navigate to workspace with tour
                                        if (user) {
                                            localStorage.removeItem(`timeline-tour-completed-${user._id}`);
                                        }
                                        localStorage.removeItem('timeline-tour-completed');

                                        // Navigate to workspace with tour parameter
                                        if (workspaceData?.workspaces && workspaceData.workspaces.length > 0) {
                                            const firstWorkspace = workspaceData.workspaces[0];
                                            router.push(`/workspace/${firstWorkspace._id}?tour=1`);
                                        }
                                    }}
                                    size="lg"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Take the Tour First
                                </Button>
                            </div>
                        ) : (
                            // No workspaces - show create workspace button
                            <Button
                                className="h-11 sm:h-12 w-full sm:w-3/4 bg-gradient-to-l from-black to-gray-700 dark:from-gray-700 dark:to-gray-600 text-white font-semibold shadow-lg transition-all duration-200 border-0 transform-gpu hover:scale-105 border-none text-sm sm:text-base"
                                onClick={openDialog}
                                size="lg"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                {isHovered ? 'Let\'s Get Started!' : 'Create Workspace'}
                            </Button>
                        )}

                        {/* Additional info - only for users without workspaces */}
                        {!showNewWorkspaceOnboarding && (!workspaceData?.workspaces || workspaceData.workspaces.length === 0) && (
                            <div className="text-center space-y-3">
                                <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    <div className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                                    <span>Setup in under 2 minutes</span>
                                </div>
                            </div>
                        )}

                        {/* Help text */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                Need help? Our team is here to support you every step of the way.
                                <br />
                                <Link href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}?subject=I want to learn more about workspaces&body=Please tell me more about Timeline`} target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer underline flex items-center justify-center gap-1">
                                    {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                                </Link>
                            </p>

                            {/* Quick Tour Button - only for users without workspaces */}
                            {!showNewWorkspaceOnboarding && (!workspaceData?.workspaces || workspaceData.workspaces.length === 0) && (
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            // Clear the completed status and show the tour
                                            localStorage.removeItem('timeline-tour-completed');
                                            if (user) {
                                                localStorage.removeItem(`timeline-tour-completed-${user._id}`);
                                            }
                                            // Trigger the tour
                                            setTimeout(() => {
                                                window.location.reload();
                                            }, 100);
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Take a Quick Tour
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom decoration Part (Will be changed later) */}
                <div className="text-center mt-6 sm:mt-8">
                    <div className="inline-flex items-center space-x-2 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                        <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                        <span>Timeline v2.0</span>
                        <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    </div>
                </div>
            </div>

        </div>
    );
}
