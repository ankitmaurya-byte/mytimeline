#!/usr/bin/env node

/**
 * WebSocket Server Test Script
 * Tests the online status WebSocket functionality
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Test configuration
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:8001';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';
const TEST_WORKSPACE_ID = 'test-workspace-123';

// Create a test JWT token
function createTestToken() {
  const payload = {
    userId: 'test-user-' + Math.random().toString(36).substr(2, 9),
    id: 'test-user-id-123',
    email: 'test@example.com',
    name: 'Test User'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Test WebSocket connection
async function testWebSocketConnection() {
  console.log('🧪 Starting WebSocket connection test...');
  console.log(`📡 Connecting to: ${SOCKET_URL}`);
  
  const token = createTestToken();
  console.log('🔑 Generated test JWT token');
  
  // Create socket connection
  const socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  // Set up event handlers
  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    console.log(`🆔 Socket ID: ${socket.id}`);
    
    // Join a test workspace
    console.log(`🏢 Joining workspace: ${TEST_WORKSPACE_ID}`);
    socket.emit('join-workspace', {
      workspaceId: TEST_WORKSPACE_ID,
      userName: 'Test User'
    });
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });

  socket.on('online-users', (users) => {
    console.log('👥 Received online users:', users);
    console.log(`📊 Total online users: ${users.length}`);
  });

  socket.on('user-online', (data) => {
    console.log('🟢 User came online:', data);
  });

  socket.on('user-offline', (data) => {
    console.log('🔴 User went offline:', data);
  });

  socket.on('user-activity', (data) => {
    console.log('📱 User activity:', data);
  });

  // Test activity after connection
  setTimeout(() => {
    console.log('📤 Sending activity ping...');
    socket.emit('user-activity');
  }, 2000);

  // Test typing indicators
  setTimeout(() => {
    console.log('⌨️  Testing typing indicators...');
    socket.emit('typing-start', { workspaceId: TEST_WORKSPACE_ID, context: 'chat' });
    
    setTimeout(() => {
      socket.emit('typing-stop', { workspaceId: TEST_WORKSPACE_ID });
    }, 3000);
  }, 4000);

  // Disconnect after test
  setTimeout(() => {
    console.log('🔚 Test completed, disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(0);
});

// Run the test
testWebSocketConnection().catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
