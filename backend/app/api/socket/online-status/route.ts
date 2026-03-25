import { NextRequest, NextResponse } from 'next/server';

// Store for online users (in-memory for demo)
const onlineUsers = new Map<string, {
  userId: string;
  workspaceId: string;
  socketId: string;
  userName: string;
  lastSeen: Date;
}>();

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'WebSocket server is running',
    onlineUsers: onlineUsers.size,
    timestamp: new Date().toISOString()
  });
}
