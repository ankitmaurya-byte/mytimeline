"use client";

import { useEffect } from 'react';
import { useOnlineNotifications } from '@/hooks/use-online-notifications';
import { useWebSocketOnlineStatus } from '@/hooks/use-websocket-online-status';
import useWorkspaceId from '@/hooks/use-workspace-id';

interface OnlineNotificationsProps {
    enabled?: boolean;
}

export function OnlineNotifications({ enabled = true }: OnlineNotificationsProps) {
    const workspaceId = useWorkspaceId();
    
    // Initialize notification hook (handles event listeners internally)
    useOnlineNotifications();

    // Don't initialize WebSocket if no workspace ID
    const {
        isConnected,
    } = useWebSocketOnlineStatus({
        workspaceId: workspaceId || undefined,
        autoConnect: !!workspaceId
    });

    // Log connection status for debugging (optional)
    useEffect(() => {
        if (enabled && isConnected && workspaceId) {
            // WebSocket connected and notifications are enabled
        }
    }, [enabled, isConnected, workspaceId]);

    // This component doesn't render anything - it just handles notifications
    return null;
}
