"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthContext } from '@/context/useAuthContext';
import { useQuery } from '@tanstack/react-query';
import { getAllWorkspacesUserIsMemberQueryFn } from '@/lib/api';

interface WorkspaceValidatorProps {
    children: React.ReactNode;
}

export function WorkspaceValidator({ children }: WorkspaceValidatorProps) {
    const router = useRouter();
    const params = useParams();
    const { isSignedIn, loading } = useAuthContext();
    const [hasValidated, setHasValidated] = useState(false);

    const workspaceId = params?.workspaceId as string;

    // Get user workspaces to validate access - but don't block rendering
    const { data: workspaceData, isLoading: workspacesLoading } = useQuery({
        queryKey: ["workspaces"],
        queryFn: getAllWorkspacesUserIsMemberQueryFn,
        enabled: isSignedIn && !loading && !!workspaceId && !hasValidated,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: 1,
    });

    useEffect(() => {
        // Skip validation if still loading auth
        if (loading) return;

        // If not signed in, redirect to sign in
        if (!isSignedIn) {
            router.replace('/sign-in');
            return;
        }

        // If no workspace data yet, wait
        if (!workspaceData || workspacesLoading) return;

        const workspaces = workspaceData.workspaces || [];

        // Check if user has access to current workspace
        const hasAccess = workspaces.some(ws => ws._id === workspaceId);

        if (!hasAccess) {
            if (workspaces.length === 0) {
                // User has no workspaces, redirect to workspace creation
                router.replace('/workspace');
            } else {
                // User has workspaces but not this one, redirect to their first workspace
                router.replace(`/workspace/${workspaces[0]._id}`);
            }
            return;
        }

        // Validation passed
        setHasValidated(true);
    }, [isSignedIn, loading, workspacesLoading, workspaceData, workspaceId, router, hasValidated]);

    // Always render children immediately - don't block navigation
    // Validation happens in the background
    return <>{children}</>;
}
