import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthContext } from '@/context/useAuthContext';
import { getAuthTokenFromCookie } from '@/lib/auth-utils';

export interface OnlineUser {
  userId: string;
  userName: string;
  lastSeen: Date;
  isOnline: boolean;
}

export interface TypingUser {
  userId: string;
  userName: string;
  context?: string;
}

interface UseWebSocketOnlineStatusOptions {
  workspaceId?: string;
  autoConnect?: boolean;
  serverUrl?: string;
}

interface WebSocketEvents {
  'user-online': (data: { userId: string; userName: string; timestamp: Date }) => void;
  'user-offline': (data: { userId: string; lastSeen: Date }) => void;
  'user-activity': (data: { userId: string; lastSeen: Date }) => void;
  'online-users': (users: OnlineUser[]) => void;
  'user-typing': (data: TypingUser) => void;
  'user-stop-typing': (data: { userId: string }) => void;
  'task-created': (data: { taskId: string; projectId: string; workspaceId: string; createdBy: string; createdAt: Date; task: any }) => void;
  'task-updated': (data: { taskId: string; projectId: string; workspaceId: string; updatedBy: string; updatedAt: Date; changes: any }) => void;
  'task-deleted': (data: { taskId: string; projectId: string; workspaceId: string; deletedBy: string; deletedAt: Date }) => void;
}

// Global state to prevent multiple health check calls
let healthCheckInProgress = false;

// Global WebSocket singleton to prevent multiple connections
let globalSocket: WebSocket | null = null;
let globalSocketListeners: Set<(users: OnlineUser[]) => void> = new Set();
let globalOnlineUsers: OnlineUser[] = [];
let globalOnlineUsersVersion = 0; // Global version counter
let globalSocketHasListeners = false; // Track if main event listeners are attached
let globalJoinedWorkspaces = new Set<string>(); // Track which workspaces we've joined

export function useWebSocketOnlineStatus(options: UseWebSocketOnlineStatusOptions = {}) {
  const { workspaceId, autoConnect = true, serverUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000' } = options;
  const { user } = useAuthContext();

  const socketRef = useRef<any>(null);
  const hasConnectedRef = useRef(false);
  const lastConnectionAttemptRef = useRef<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineUsersVersion, setOnlineUsersVersion] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Sync local version with global version (for cross-hook-instance updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (globalOnlineUsersVersion !== onlineUsersVersion) {
        setOnlineUsers(globalOnlineUsers);
        setOnlineUsersVersion(globalOnlineUsersVersion);
      }
    }, 100); // Check every 100ms
    return () => clearInterval(interval);
  }, [onlineUsersVersion]);

  // Connect to WebSocket server
  const connect = useCallback((targetWorkspaceId?: string) => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;

    // Prevent connection attempts more frequent than 1 second
    if (timeSinceLastAttempt < 1000) {
      return;
    }

    lastConnectionAttemptRef.current = now;

    // In React strict mode, effects run twice - prevent duplicate connections
    if (hasConnectedRef.current) {
      return;
    }

    // Small delay to allow any previous cleanup to complete
    setTimeout(() => {
      performConnection(targetWorkspaceId);
    }, 100);
  }, [user, workspaceId, serverUrl, isConnecting]);

  const performConnection = useCallback((targetWorkspaceId?: string) => {
    const token = getAuthTokenFromCookie();

    if (!user || !token) {
      // console.log('❌ WebSocket: No user or token available');
      return;
    }

    const workspaceToJoin = targetWorkspaceId || workspaceId;
    if (!workspaceToJoin) {
      // console.log('❌ WebSocket: No workspace ID available');
      return;
    }

    // console.log('🔌 WebSocket: Connecting to server:', serverUrl);
    // console.log('🔌 WebSocket: Workspace to join:', workspaceToJoin);
    // console.log('🔌 WebSocket: User ID:', user._id);

    // Prevent multiple connection attempts
    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      // console.log('🔌 WebSocket: Connection in progress, skipping');
      return;
    }

    // Test if the WebSocket server is reachable first (prevent multiple simultaneous calls)
    if (!healthCheckInProgress) {
      healthCheckInProgress = true;
      fetch(`${serverUrl}/api/health`) // Changed from websocket-health to health
        .then(() => {
          // Health check successful, proceed with connection
        })
        .catch(() => {
          // Health check failed, but proceed anyway
        })
        .finally(() => {
          healthCheckInProgress = false;
        });
    }

    // Create WebSocket URL with token
    const wsUrl = `${serverUrl.replace('http', 'ws')}/ws?token=${token}`;
    
    let socket: WebSocket | null = null;
    let isReusingConnection = false;
    
    // Check if there's already a global socket connection
    if (globalSocket && (globalSocket.readyState === WebSocket.OPEN || globalSocket.readyState === WebSocket.CONNECTING)) {
      // console.log('🔌 WebSocket: Reusing existing global connection, state:', globalSocket.readyState === WebSocket.OPEN ? 'OPEN' : 'CONNECTING', 'hasListeners:', globalSocketHasListeners);
      socket = globalSocket;
      isReusingConnection = true;
      socketRef.current = globalSocket;
      setOnlineUsers(globalOnlineUsers);
      
      // If already open, send join message immediately
      if (globalSocket.readyState === WebSocket.OPEN) {
        setIsConnected(true);
        setIsConnecting(false);
        // Only join if we haven't already joined this workspace
        if (!globalJoinedWorkspaces.has(workspaceToJoin)) {
          // console.log('🔌 WebSocket: Joining workspace immediately:', workspaceToJoin);
          globalSocket.send(JSON.stringify({
            type: 'join-workspace',
            workspaceId: workspaceToJoin,
            userName: user.name || user.email
          }));
          globalJoinedWorkspaces.add(workspaceToJoin);
        }
      } else if (globalSocket.readyState === WebSocket.CONNECTING) {
        // Connection is still being established, wait for it to open
        setIsConnected(false);
        setIsConnecting(true);
        // console.log('🔌 WebSocket: Waiting for connection to open before joining workspace:', workspaceToJoin);
        
        // Add a one-time listener to join when the connection opens
        const handleOpen = () => {
          // console.log('🔌 WebSocket: Connection now open, joining workspace:', workspaceToJoin);
          setIsConnected(true);
          setIsConnecting(false);
          if (globalSocket?.readyState === WebSocket.OPEN && !globalJoinedWorkspaces.has(workspaceToJoin)) {
            globalSocket.send(JSON.stringify({
              type: 'join-workspace',
              workspaceId: workspaceToJoin,
              userName: user.name || user.email
            }));
            globalJoinedWorkspaces.add(workspaceToJoin);
          }
          globalSocket?.removeEventListener('open', handleOpen);
        };
        
        globalSocket.addEventListener('open', handleOpen);
      }
      
      // If this socket doesn't have main event listeners yet (e.g., after page refresh), add them
      if (!globalSocketHasListeners) {
        // console.log('🔌 WebSocket: Reused socket missing listeners, attaching now');
        // Don't return early, continue to attach listeners below
      } else {
        // Socket already has listeners, safe to return
        return;
      }
    }
    
    // If we're not reusing or need to attach listeners to reused socket
    if (!isReusingConnection) {
      // console.log('🔌 WebSocket: Creating new connection to:', wsUrl);
      socket = new WebSocket(wsUrl);
      
      // Store as global socket
      globalSocket = socket;
      socketRef.current = socket;
    }
    
    // Mark that we're adding listeners (socket should be assigned by now)
    if (!socket) {
      console.error('🔌 WebSocket: Socket is null, cannot attach listeners');
      return;
    }
    globalSocketHasListeners = true;

    // Connection handlers
    socket.addEventListener('open', () => {
      hasConnectedRef.current = true;
      setIsConnected(true);
      setConnectionError(null);
      setIsConnecting(false);

      // Join the workspace (only if not already joined)
      if (!globalJoinedWorkspaces.has(workspaceToJoin)) {
        // console.log('🔌 WebSocket: Joining workspace:', workspaceToJoin);
        socket.send(JSON.stringify({
          type: 'join-workspace',
          workspaceId: workspaceToJoin,
          userName: user.name || user.email
        }));
        globalJoinedWorkspaces.add(workspaceToJoin);
      }

      // Start sending activity pings every 30 seconds
      const activityInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'user-activity',
            workspaceId: workspaceToJoin
          }));
        }
      }, 30000); // 30 seconds

      // Store interval ID for cleanup
      (socket as any)._activityInterval = activityInterval;
    });

    socket.addEventListener('error', (error) => {
      console.error('❌ WebSocket: Connection error');
      setConnectionError(`Connection failed: WebSocket error`);
      setIsConnected(false);
      setIsConnecting(false);
      hasConnectedRef.current = false; // Reset to allow reconnection attempts
    });

    socket.addEventListener('close', (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      hasConnectedRef.current = false;

      // Clear activity interval
      if ((socket as any)._activityInterval) {
        clearInterval((socket as any)._activityInterval);
      }

      // Reset global state
      globalSocketHasListeners = false;
      globalSocket = null;
      globalJoinedWorkspaces.clear(); // Clear joined workspaces on disconnect

      // Mark all users as offline but keep them in the list until we reconnect
      // This prevents losing user status during brief disconnections
      setOnlineUsers(prev => prev.map(u => ({ ...u, isOnline: false })));
      setTypingUsers([]);
    });

    // Online status handlers
    socket.addEventListener('message', (event) => {
      // console.log('📨 WebSocket: Received raw message:', event.data);
      try {
        const message = JSON.parse(event.data);
        const eventType = message.type;
        const data = message;
        // console.log('📨 WebSocket: Parsed message type:', eventType, 'data:', data);

        switch (eventType) {
          case 'online-users':
            {
              const users: OnlineUser[] = data.users || [];
              const updatedUsers = users.map(u => ({
                ...u,
                lastSeen: new Date(u.lastSeen),
                isOnline: u.isOnline !== undefined ? u.isOnline : true,
              }));
              
              globalOnlineUsers = updatedUsers;
              setOnlineUsers(updatedUsers);
              globalOnlineUsersVersion++;
              setOnlineUsersVersion(globalOnlineUsersVersion);
              break;
            }
          case 'joined_workspace':
            {
              break;
            }
          case 'user-online':
            {
              const { userId, userName, timestamp } = data;
              const onlineTime = new Date(timestamp);
              
              // Always dispatch event for toast notifications (even if state doesn't change)
              const userOnlineEvent = new CustomEvent('user-status-change', {
                detail: {
                  type: 'online',
                  userId,
                  userName,
                  timestamp: onlineTime
                }
              });
              window.dispatchEvent(userOnlineEvent);
              
              setOnlineUsers(prev => {
                const existingUser = prev.find(u => u.userId === userId);
                
                if (existingUser?.isOnline) {
                  return prev;
                }
                
                if (existingUser && !existingUser.isOnline) {
                  if (onlineTime < existingUser.lastSeen) {
                    return prev;
                  }
                }
                
                const filtered = prev.filter(u => u.userId !== userId);
                const updated = [...filtered, {
                  userId,
                  userName,
                  lastSeen: onlineTime,
                  isOnline: true,
                }];
                
                globalOnlineUsers = updated;
                return updated;
              });
              globalOnlineUsersVersion++;
              setOnlineUsersVersion(globalOnlineUsersVersion);
              break;
            }
          case 'user-activity':
            {
              const { userId, lastSeen } = data;
              setOnlineUsers(prev => {
                const updated = prev.map(u =>
                  u.userId === userId
                    ? { ...u, lastSeen: new Date(lastSeen), isOnline: true }
                    : u
                );
                globalOnlineUsers = updated;
                return updated;
              });
              globalOnlineUsersVersion++;
              setOnlineUsersVersion(globalOnlineUsersVersion);
              break;
            }
          case 'user-offline':
            {
              const { userId, lastSeen } = data;
              
              // Always dispatch event for toast notifications (even if state doesn't change)
              const userOfflineEvent = new CustomEvent('user-status-change', {
                detail: {
                  type: 'offline',
                  userId,
                  userName: data.userName,
                  timestamp: new Date(lastSeen)
                }
              });
              window.dispatchEvent(userOfflineEvent);
              
              setOnlineUsers(prev => {
                const existingUser = prev.find(u => u.userId === userId);
                if (existingUser) {
                  const updated = prev.map(u =>
                    u.userId === userId
                      ? { ...u, isOnline: false, lastSeen: new Date(lastSeen) }
                      : u
                  );
                  globalOnlineUsers = updated;
                  return updated;
                } else {
                  const updated = [...prev, {
                    userId,
                    userName: data.userName || 'Unknown',
                    isOnline: false,
                    lastSeen: new Date(lastSeen),
                  }];
                  globalOnlineUsers = updated;
                  return updated;
                }
              });
              globalOnlineUsersVersion++;
              setOnlineUsersVersion(globalOnlineUsersVersion);
              break;
            }
          case 'user-typing':
            {
              const typingData: TypingUser = data;
              setTypingUsers(prev => {
                const filtered = prev.filter(u => u.userId !== typingData.userId);
                return [...filtered, typingData];
              });
              break;
            }
          case 'user-stop-typing':
            {
              const { userId } = data;
              setTypingUsers(prev => prev.filter(u => u.userId !== userId));
              break;
            }
          case 'task-created':
            {
              // console.log('📝 Task created via WebSocket:', data);
              // console.log('🔍 WebSocket connection state:', socket.connected);
              // console.log('🔍 Current workspace ID:', workspaceToJoin);

              // Trigger custom event for task creation
              const event = new CustomEvent('task-created', {
                detail: {
                  type: 'created',
                  workspaceId: data.workspaceId,
                  projectId: data.projectId,
                  taskId: data.taskId,
                  createdBy: data.createdBy
                }
              });
              window.dispatchEvent(event);
              // console.log('📤 Dispatched task-created event');
              break;
            }
          case 'task-updated':
            {
              // console.log('✏️ Task updated via WebSocket:', data);
              // console.log('🔍 WebSocket connection state:', socket.connected);
              // console.log('🔍 Current workspace ID:', workspaceToJoin);

              // Trigger custom event for task update
              const event = new CustomEvent('task-updated', {
                detail: {
                  type: 'updated',
                  workspaceId: data.workspaceId,
                  projectId: data.projectId,
                  taskId: data.taskId,
                  updatedBy: data.updatedBy
                }
              });
              window.dispatchEvent(event);
              break;
            }
          case 'task-deleted':
            {
              const event = new CustomEvent('task-deleted', {
                detail: {
                  type: 'deleted',
                  workspaceId: data.workspaceId,
                  projectId: data.projectId,
                  taskId: data.taskId,
                  deletedBy: data.deletedBy
                }
              });
              window.dispatchEvent(event);
              break;
            }
          default:
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

  }, [user, workspaceId, serverUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    hasConnectedRef.current = false; // Allow reconnection on next connect call
    lastConnectionAttemptRef.current = 0; // Reset connection attempt timestamp
    setIsConnecting(false);
    if (socketRef.current) {
      socketRef.current.close();
      
      // Clear global socket if it's the same instance
      if (globalSocket === socketRef.current) {
        globalSocket = null;
      }
      
      socketRef.current = null;
      setIsConnected(false);
      // Mark all users as offline but keep their lastSeen data
      setOnlineUsers(prev => prev.map(u => ({ ...u, isOnline: false })));
      setTypingUsers([]);
      setConnectionError(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // DO NOT close the WebSocket on unmount - keep it alive for other components
      // Only mark this component as unmounted
      hasConnectedRef.current = false;
      lastConnectionAttemptRef.current = 0;
      // console.log('🧹 Component unmounting, keeping WebSocket alive for other components');
    };
  }, []);

  // Switch workspace
  const switchWorkspace = useCallback((newWorkspaceId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Leave current workspace
      if (workspaceId) {
        socketRef.current.send(JSON.stringify({
          type: 'leave-workspace',
          workspaceId: workspaceId
        }));
      }

      // Join new workspace
      socketRef.current.send(JSON.stringify({
        type: 'join-workspace',
        workspaceId: newWorkspaceId,
        userName: user?.name || user?.email || 'Unknown'
      }));
    }
  }, [workspaceId, user]);

  // Send activity ping
  const sendActivity = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.send(JSON.stringify({ event: 'user-activity' }));
    }
  }, []);

  // Typing indicators
  const startTyping = useCallback((context?: string) => {
    if (socketRef.current?.connected && workspaceId) {
      socketRef.current.send(JSON.stringify({ event: 'typing-start', data: { workspaceId, context } }));
    }
  }, [workspaceId]);

  const stopTyping = useCallback(() => {
    if (socketRef.current?.connected && workspaceId) {
      socketRef.current.send(JSON.stringify({ event: 'typing-stop', data: { workspaceId } }));
    }
  }, [workspaceId]);

  // Get online status for a specific user
  const getUserOnlineStatus = useCallback((userId: string): { isOnline: boolean; lastSeen?: Date } => {
    const userStatus = onlineUsers.find(u => u.userId === userId);
    return {
      isOnline: userStatus?.isOnline ?? false,
      lastSeen: userStatus?.lastSeen,
    };
  }, [onlineUsers]);

  // Auto-connect when conditions are met
  useEffect(() => {
    const token = getAuthTokenFromCookie();
    // console.log('🔌 WebSocket: Auto-connect effect triggered:', { autoConnect, hasUser: !!user, workspaceId, hasToken: !!token });

    if (autoConnect && user && workspaceId && token) {
      // console.log('🔌 WebSocket: Auto-connecting...');
      connect();
    } else {
      // console.log('🔌 WebSocket: Auto-connect conditions not met:', { autoConnect, hasUser: !!user, workspaceId, hasToken: !!token });
    }

    // Note: Removed cleanup from here to prevent React strict mode from closing connections
    // between double-invoked effects. Cleanup is handled by the separate useEffect below.
  }, [autoConnect, user, workspaceId]);

  // Send periodic activity pings
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      sendActivity();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, sendActivity]);

  return {
    // Connection state
    isConnected,
    connectionError,

    // Data
    onlineUsers,
    onlineUsersVersion, // Add version for tracking changes
    typingUsers,

    // Actions
    connect,
    disconnect,
    switchWorkspace,
    sendActivity,
    startTyping,
    stopTyping,
    getUserOnlineStatus,
  };
}
