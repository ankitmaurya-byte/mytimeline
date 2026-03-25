const { Server } = require('socket.io');
const { createServer } = require('http');
const jwt = require('jsonwebtoken');

// Create HTTP server
const server = createServer();

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Store for online users
const onlineUsers = new Map();

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new Error('Authentication token missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error('Socket authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
});

// Connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.userId}`);

  // Handle user joining a workspace
  socket.on('join-workspace', (data) => {
    const { workspaceId, userName } = data;
    const userId = socket.data.userId;

    console.log(`User ${userId} joining workspace ${workspaceId}`);

    // Join the workspace room
    socket.join(`workspace:${workspaceId}`);
    socket.data.workspaceId = workspaceId;

    // Add user to online users
    onlineUsers.set(userId, {
      userId,
      workspaceId,
      socketId: socket.id,
      userName,
      lastSeen: new Date(),
    });

    // Notify others in the workspace that user came online
    socket.to(`workspace:${workspaceId}`).emit('user-online', {
      userId,
      userName,
      timestamp: new Date(),
    });

    // Send current online users to the newly connected user
    const workspaceOnlineUsers = Array.from(onlineUsers.values())
      .filter((user) => user.workspaceId === workspaceId)
      .map((user) => ({
        userId: user.userId,
        userName: user.userName,
        lastSeen: user.lastSeen,
      }));

    socket.emit('online-users', workspaceOnlineUsers);
  });

  // Handle user leaving workspace
  socket.on('leave-workspace', (data) => {
    const { workspaceId } = data;
    const userId = socket.data.userId;

    console.log(`User ${userId} leaving workspace ${workspaceId}`);

    socket.leave(`workspace:${workspaceId}`);

    // Remove user from online users
    const user = onlineUsers.get(userId);
    if (user) {
      onlineUsers.delete(userId);

      // Notify others
      socket.to(`workspace:${workspaceId}`).emit('user-offline', {
        userId,
        lastSeen: new Date(),
      });
    }
  });

  // Handle user activity
  socket.on('user-activity', () => {
    const userId = socket.data.userId;
    const user = onlineUsers.get(userId);

    if (user) {
      user.lastSeen = new Date();
      onlineUsers.set(userId, user);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    const user = onlineUsers.get(userId);

    if (user) {
      console.log(
        `User ${userId} disconnected from workspace ${user.workspaceId}`
      );

      // Notify others in workspace
      socket.to(`workspace:${user.workspaceId}`).emit('user-offline', {
        userId,
        lastSeen: new Date(),
      });

      // Remove from online users
      onlineUsers.delete(userId);
    }
  });
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/websocket-health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        onlineUsers: onlineUsers.size,
        timestamp: new Date().toISOString(),
        message: 'WebSocket server is running',
      })
    );
  }
});

// Start server
const PORT = process.env.WEBSOCKET_PORT || 8001;
// Temporarily disabled for Go WebSocket testing
/*
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(
    `Health check available at http://localhost:${PORT}/websocket-health`
  );
});
*/
console.log(`Node.js WebSocket server DISABLED (temporarily for Go testing)`);
console.log(`To re-enable, uncomment the server.listen() call in websocket-server.js`);



