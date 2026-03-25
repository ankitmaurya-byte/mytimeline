import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model';
import { logger } from '../api-lib/logger';

interface SocketUser {
  id: string;
  email: string;
  name: string;
  workspaceId?: string;
  lastSeen: Date;
}

class OnlineStatusService {
  private io: Server | null = null;
  private onlineUsers = new Map<string, SocketUser>();
  private userSocketMap = new Map<string, string>(); // userId -> socketId
  private socketUserMap = new Map<string, string>(); // socketId -> userId

  initialize(server: HttpServer) {
    // console.log('🔧 WebSocket: Initializing onlineStatusService...');
    // console.log('🔧 WebSocket: Server instance:', !!server);
    // console.log('🔧 WebSocket: Current this.io before init:', !!this.io);

    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    // Add authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        logger.info({
          hasToken: !!token,
          tokenLength: token?.length || 0,
          socketId: socket.id
        }, 'WebSocket auth attempt');

        if (!token) {
          logger.error('No authentication token provided');
          throw new Error('Authentication token missing');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        const userId = decoded.userId || decoded.sub || decoded.id;

        logger.info({
          userId,
          hasUserId: !!userId,
          tokenKeys: Object.keys(decoded)
        }, 'Token decoded');

        if (!userId) {
          logger.error({ decoded }, 'Invalid token: missing user ID');
          throw new Error('Invalid token: missing user ID');
        }

        // Get user info from database
        const user = await UserModel.findById(userId).select('name email');
        if (!user) {
          logger.error({ userId }, 'User not found in database');
          throw new Error('User not found');
        }

        socket.data.userId = userId;
        socket.data.user = { ...decoded, name: user.name, email: user.email };

        logger.info({
          userId,
          userEmail: user.email,
          socketId: socket.id
        }, 'WebSocket authentication successful');

        next();
      } catch (error) {
        const err: any = error;
        logger.error({ error: err, socketId: socket.id }, 'Socket authentication failed');
        next(new Error(`Authentication failed: ${err?.message || 'Unknown error'}`));
      }
    });

    this.setupEventHandlers();
    this.startCleanupInterval();

    // Add health check endpoint
    server.on('request', (req, res) => {
      if (req.url === '/websocket-health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          onlineUsers: this.onlineUsers.size,
          timestamp: new Date().toISOString(),
          message: 'WebSocket server is running',
        }));
      }
    });

    logger.info('WebSocket server initialized for online status');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      const user = socket.data.user;

      logger.info(`User connected: ${userId} (${socket.id})`);

      // Store user information immediately after connection
      const userInfo: SocketUser = {
        id: userId,
        email: user.email,
        name: user.name,
        lastSeen: new Date()
      };

      this.onlineUsers.set(userId, userInfo);
      this.userSocketMap.set(userId, socket.id);
      this.socketUserMap.set(socket.id, userId);

      // Handle joining workspace
      socket.on('join-workspace', async (data: { workspaceId: string; userName: string }) => {
        const { workspaceId, userName } = data;

        logger.info(`User ${userId} (${userName}) joining workspace ${workspaceId}`);

        // Leave any previous workspace rooms
        const existingUser = this.onlineUsers.get(userId);
        if (existingUser && existingUser.workspaceId !== workspaceId) {
          socket.leave(`workspace:${existingUser.workspaceId}`);
        }

        // Join the workspace room
        socket.join(`workspace:${workspaceId}`);
        socket.data.workspaceId = workspaceId;

        // Update user info with workspace and save lastSeen to DB
        const now = new Date();
        userInfo.workspaceId = workspaceId;
        userInfo.lastSeen = now;
        this.onlineUsers.set(userId, userInfo);

        // Save to database
        try {
          await UserModel.findByIdAndUpdate(userId, { lastSeen: now });
        } catch (error) {
          logger.error({ error, userId }, 'Failed to update lastSeen on join-workspace');
        }

        // Notify others in the workspace that user came online
        socket.to(`workspace:${workspaceId}`).emit('user-online', {
          userId,
          userName,
          timestamp: now,
        });

        // Get workspace members and their lastSeen from database
        try {
          const memberModel = (await import('../models/member.model')).default;
          const memberships = await memberModel.find({ workspaceId })
            .populate('userId', 'name email lastSeen')
            .lean();

          // Build online users list with database lastSeen for offline users
          const workspaceOnlineUsers = memberships.map((membership: any) => {
            const member = membership.userId;
            const onlineUser = this.onlineUsers.get(member._id.toString());
            
            return {
              userId: member._id.toString(),
              userName: member.name,
              lastSeen: onlineUser ? onlineUser.lastSeen : (member.lastSeen || new Date()),
              isOnline: !!onlineUser,
            };
          });

          socket.emit('online-users', workspaceOnlineUsers);
          logger.info(`Sent ${workspaceOnlineUsers.length} workspace members to user ${userId}`);
        } catch (error) {
          logger.error({ error, workspaceId }, 'Failed to fetch workspace members');
          
          // Fallback: Send only currently online users
          const workspaceOnlineUsers = Array.from(this.onlineUsers.values())
            .filter(user => user.workspaceId === workspaceId)
            .map(user => ({
              userId: user.id,
              userName: user.name,
              lastSeen: user.lastSeen,
              isOnline: true,
            }));

          socket.emit('online-users', workspaceOnlineUsers);
          logger.info(`Workspace ${workspaceId} now has ${workspaceOnlineUsers.length} online users`);
        }
      });

      // Handle user leaving workspace
      socket.on('leave-workspace', (data: { workspaceId: string }) => {
        const { workspaceId } = data;

        logger.info(`User ${userId} leaving workspace ${workspaceId}`);

        socket.leave(`workspace:${workspaceId}`);

        // Remove user from online users
        const user = this.onlineUsers.get(userId);
        if (user) {
          this.onlineUsers.delete(userId);

          // Update last seen and notify others
          socket.to(`workspace:${workspaceId}`).emit('user-offline', {
            userId,
            lastSeen: new Date(),
          });
        }
      });

      // Handle user activity (to update last seen)
      socket.on('user-activity', async () => {
        const user = this.onlineUsers.get(userId);

        if (user) {
          const now = new Date();
          user.lastSeen = now;
          this.onlineUsers.set(userId, user);

          // Save to database
          try {
            await UserModel.findByIdAndUpdate(userId, { lastSeen: now });
          } catch (error) {
            logger.error({ error, userId }, 'Failed to update lastSeen in database');
          }

          // Broadcast activity to workspace (optional, for more responsive UI)
          if (user.workspaceId) {
            socket.to(`workspace:${user.workspaceId}`).emit('user-activity', {
              userId,
              lastSeen: user.lastSeen,
            });
          }
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { workspaceId: string; context?: string }) => {
        socket.to(`workspace:${data.workspaceId}`).emit('user-typing', {
          userId,
          userName: user.name,
          context: data.context,
        });
      });

      socket.on('typing-stop', (data: { workspaceId: string }) => {
        socket.to(`workspace:${data.workspaceId}`).emit('user-stop-typing', {
          userId,
        });
      });

      // Handle disconnect
      socket.on('disconnect', async (reason) => {
        const user = this.onlineUsers.get(userId);

        if (user) {
          logger.info(`User ${userId} disconnected from workspace ${user.workspaceId} (${reason})`);

          const lastSeen = new Date();

          // Save lastSeen to database
          try {
            await UserModel.findByIdAndUpdate(userId, { lastSeen });
          } catch (error) {
            logger.error({ error, userId }, 'Failed to update lastSeen on disconnect');
          }

          // Notify others in workspace
          if (user.workspaceId) {
            socket.to(`workspace:${user.workspaceId}`).emit('user-offline', {
              userId,
              lastSeen,
            });
          }

          // Remove from online users
          this.onlineUsers.delete(userId);
          this.userSocketMap.delete(userId);
          this.socketUserMap.delete(socket.id);
        }
      });
    });
  }

  private broadcastUserStatusChange(userId: string, isOnline: boolean, workspaceId?: string) {
    if (!this.io) return;

    const statusUpdate = {
      userId,
      isOnline,
      timestamp: new Date(),
      lastSeen: isOnline ? new Date() : new Date()
    };

    if (workspaceId) {
      // Broadcast to specific workspace
      this.io.to(`workspace:${workspaceId}`).emit('user_status_change', statusUpdate);
    } else {
      // Broadcast to all connected clients
      this.io.emit('user_status_change', statusUpdate);
    }
  }

  private getWorkspaceOnlineUsers(workspaceId: string) {
    const workspaceUsers: any[] = [];

    this.onlineUsers.forEach((userInfo, userId) => {
      if (userInfo.workspaceId === workspaceId) {
        workspaceUsers.push({
          userId,
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          isOnline: true,
          lastSeen: userInfo.lastSeen
        });
      }
    });

    return workspaceUsers;
  }

  private startCleanupInterval() {
    // Clean up inactive connections every 30 seconds
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

      this.onlineUsers.forEach((userInfo, userId) => {
        if (now.getTime() - userInfo.lastSeen.getTime() > inactiveThreshold) {
          const socketId = this.userSocketMap.get(userId);
          if (socketId) {
            this.io?.sockets.sockets.get(socketId)?.disconnect();
          }
        }
      });
    }, 30000);
  }

  // Public methods for other services to use
  public getUserOnlineStatus(userId: string): { isOnline: boolean; lastSeen: Date | null } {
    const userInfo = this.onlineUsers.get(userId);
    return {
      isOnline: !!userInfo,
      lastSeen: userInfo?.lastSeen || null
    };
  }

  public getWorkspaceOnlineCount(workspaceId: string): number {
    let count = 0;
    this.onlineUsers.forEach((userInfo) => {
      if (userInfo.workspaceId === workspaceId) {
        count++;
      }
    });
    return count;
  }

  public getAllOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  public broadcastToWorkspace(workspaceId: string, event: string, data: any) {
    // console.log('🔍 WebSocket: broadcastToWorkspace called with:', { workspaceId, event, dataKeys: data ? Object.keys(data) : 'no data' });
    // console.log('🔍 WebSocket: this.io instance:', !!this.io);
    // console.log('🔍 WebSocket: this.io type:', typeof this.io);
    // console.log('🔍 WebSocket: onlineUsers count:', this.onlineUsers.size);
    // console.log('🔍 WebSocket: Process ID:', process.pid);
    // console.log('🔍 WebSocket: Module loaded from:', __filename);

    if (!this.io) {
      // console.log('❌ WebSocket: No IO instance available for broadcasting');
      // console.log('🔍 WebSocket: Skipping broadcast - API route cannot access WebSocket server');
      return;
    }

    const roomName = `workspace:${workspaceId}`;
    // console.log(`📡 WebSocket: Broadcasting ${event} to room ${roomName} - data keys:`, data ? Object.keys(data) : 'no data');

    // Get the number of clients in the room
    const room = this.io.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;
    // console.log(`👥 WebSocket: Room ${roomName} has ${clientCount} clients`);

    this.io.to(roomName).emit(event, data);
    // console.log(`✅ WebSocket: Event ${event} emitted to ${clientCount} clients in ${roomName}`);
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

}

export const onlineStatusService = new OnlineStatusService();
export default onlineStatusService;
