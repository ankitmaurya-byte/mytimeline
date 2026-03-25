import { NextRequest, NextResponse } from 'next/server';

// Store for online users (shared with main route)
const onlineUsers = new Map<string, {
    userId: string;
    workspaceId: string;
    socketId: string;
    userName: string;
    lastSeen: Date;
}>();

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({
            status: 'ok',
            onlineUsers: onlineUsers.size,
            timestamp: new Date().toISOString(),
            message: 'WebSocket server is running'
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: 'WebSocket server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}



