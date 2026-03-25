import { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/context/useAuthContext';
import { useWebSocketOnlineStatus } from './use-websocket-online-status';
import useWorkspaceId from './use-workspace-id';

export interface OnlineStatus {
  isOnline: boolean;
  lastSeen?: Date;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  isOnline: boolean;
  lastSeen: Date;
}

export function useOnlineStatus() {
  const { user } = useAuthContext();
  const workspaceId = useWorkspaceId();

  // Store current user ID to avoid timing issues
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // Update stored user data when user changes
  useEffect(() => {
    if (user) {
      setCurrentUserId(user._id);
      setCurrentUserName(user.name || user.email);
    } else {
      setCurrentUserId(null);
      setCurrentUserName('');
    }
  }, [user]);

  // Use WebSocket for real-time online status
  const {
    isConnected,
    onlineUsers: wsOnlineUsers,
    onlineUsersVersion,
    getUserOnlineStatus,
    connect,
    disconnect,
    connectionError
  } = useWebSocketOnlineStatus({
    workspaceId,
    autoConnect: true,
    serverUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  });

  const getOnlineStatus = (userId: string): OnlineStatus => {
    // Current user is always considered online if we have their data
    if (userId === currentUserId) {
      return {
        isOnline: true,
        lastSeen: new Date(),
      };
    }

    // Check WebSocket users first - they have real-time data
    const wsUser = wsOnlineUsers.find(u => u.userId === userId);
    if (wsUser) {
      return {
        isOnline: wsUser.isOnline,
        lastSeen: wsUser.lastSeen,
      };
    }

    // Fallback for other users when no WebSocket data available
    return {
      isOnline: false,
      lastSeen: undefined,
    };
  };

  const getAllOnlineUsers = (): OnlineUser[] => {
    // Start with WebSocket users (they already include current user if connected)
    // Deduplicate by userId, keeping the most recent status (prefer online over offline)
    const userMap = new Map<string, OnlineUser>();
    
    // Add all WebSocket users
    wsOnlineUsers.forEach(user => {
      const existing = userMap.get(user.userId);
      if (!existing || (user.isOnline && !existing.isOnline)) {
        // Keep this user if: no existing entry, or this one is online and existing is offline
        userMap.set(user.userId, user);
      }
    });

    // Only add current user if they're not already in the WebSocket list
    if (currentUserId && !userMap.has(currentUserId)) {
      userMap.set(currentUserId, {
        userId: currentUserId,
        userName: currentUserName,
        isOnline: true,
        lastSeen: new Date(),
      });
    }

    return Array.from(userMap.values());
  };

  const isUserOnline = (userId: string): boolean => {
    return getOnlineStatus(userId).isOnline;
  };

  const getUserLastSeen = (userId: string): Date | null => {
    const status = getOnlineStatus(userId);
    return status.lastSeen || null;
  };

  // Memoize the online users list to ensure component re-renders when it changes
  const memoizedOnlineUsers = useMemo(() => {
    return getAllOnlineUsers();
  }, [wsOnlineUsers, onlineUsersVersion, currentUserId, currentUserName]);

  return {
    // Connection state
    isConnected,
    connectionError,

    // Data
    onlineUsers: memoizedOnlineUsers,

    // Methods
    getOnlineStatus,
    isUserOnline,
    getUserLastSeen,

    // Connection controls
    connect,
    disconnect,
  };
}
