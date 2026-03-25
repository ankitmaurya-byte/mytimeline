import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/useAuthContext';
import useWorkspaceId from './use-workspace-id';

interface UserStatusChangeEvent extends CustomEvent {
    detail: {
        type: 'online' | 'offline';
        userId: string;
        userName: string;
        timestamp: Date;
    };
}

export function useOnlineNotifications() {
    const { toast } = useToast();
    const { user: currentUser } = useAuthContext();
    const workspaceId = useWorkspaceId();

    // Track users we've already notified about to avoid duplicate notifications
    const notifiedUsersRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!currentUser || !workspaceId) {
            return;
        }

        // Reset tracking when workspace changes
        notifiedUsersRef.current.clear();
    }, [workspaceId, currentUser]);

    // Listen for user status change events
    useEffect(() => {
        if (!currentUser || !workspaceId) {
            return;
        }

        const handleUserStatusChange = (event: Event) => {
            const customEvent = event as UserStatusChangeEvent;
            const { type, userId, userName } = customEvent.detail;

            // Don't show notification for current user
            if (userId === currentUser._id) {
                return;
            }

            if (type === 'online') {
                // Don't show duplicate notifications
                if (notifiedUsersRef.current.has(userId)) {
                    return;
                }

                // Show toast notification
                toast({
                    title: "👋 User Online",
                    description: `${userName} is now online`,
                    variant: "info",
                    duration: 4000,
                });

                // Mark as notified
                notifiedUsersRef.current.add(userId);
            } else if (type === 'offline') {
                // Remove from notified users so we can notify again when they come back
                notifiedUsersRef.current.delete(userId);
            }
        };

        window.addEventListener('user-status-change', handleUserStatusChange);

        return () => {
            window.removeEventListener('user-status-change', handleUserStatusChange);
        };
    }, [currentUser, workspaceId, toast]);

    // Legacy methods for backward compatibility (no longer needed but kept for existing code)
    const handleUserOnline = () => {};
    const handleUserOffline = () => {};
    const handleOnlineUsersUpdate = () => {};

    return {
        handleUserOnline,
        handleUserOffline,
        handleOnlineUsersUpdate,
    };
}
