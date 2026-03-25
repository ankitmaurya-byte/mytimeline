import { NextRequest } from 'next/server';
import { withCORS } from '../_lib/cors';

// Store active SSE connections - multiple clients per workspace
const connections = new Map<string, ReadableStreamDefaultController[]>();

export const GET = withCORS(async (req: NextRequest) => {
    try {
        // console.log('🔔 [SSE] New SSE connection request');
        // console.log('🔔 [SSE] Request URL:', req.url);
        // console.log('🔔 [SSE] Request headers:', Object.fromEntries(req.headers.entries()));

        const url = new URL(req.url);
        const workspaceId = url.searchParams.get('workspaceId');

        if (!workspaceId) {
            return new Response('Missing workspaceId parameter', { status: 400 });
        }

        // console.log('🔔 [SSE] Creating SSE connection for workspace:', workspaceId);

        // Create SSE stream
        const stream = new ReadableStream({
            start(controller) {
                // console.log('🔔 [SSE] SSE stream started for workspace:', workspaceId);

                // Store the connection
                if (!connections.has(workspaceId)) {
                    connections.set(workspaceId, []);
                }
                connections.get(workspaceId)!.push(controller);

                // console.log(`🔔 [SSE] Client connected to workspace ${workspaceId}. Total clients: ${connections.get(workspaceId)!.length}`);

                // Send initial connection message
                const data = JSON.stringify({
                    type: 'connected',
                    workspaceId,
                    timestamp: new Date().toISOString()
                });

                controller.enqueue(`data: ${data}\n\n`);

                // Handle client disconnect
                req.signal.addEventListener('abort', () => {
                    // console.log('🔔 [SSE] Client disconnected for workspace:', workspaceId);
                    const workspaceConnections = connections.get(workspaceId);
                    if (workspaceConnections) {
                        const index = workspaceConnections.indexOf(controller);
                        if (index > -1) {
                            workspaceConnections.splice(index, 1);
                        }
                        if (workspaceConnections.length === 0) {
                            connections.delete(workspaceId);
                        }
                    }
                    controller.close();
                });
            },

            cancel(controller) {
                // console.log('🔔 [SSE] SSE stream cancelled for workspace:', workspaceId);
                const workspaceConnections = connections.get(workspaceId);
                if (workspaceConnections) {
                    const index = workspaceConnections.indexOf(controller);
                    if (index > -1) {
                        workspaceConnections.splice(index, 1);
                    }
                    if (workspaceConnections.length === 0) {
                        connections.delete(workspaceId);
                    }
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                // CORS is already handled by withCORS middleware
                // Removing wildcard origin for security
                'Access-Control-Allow-Headers': 'Cache-Control'
            }
        });

    } catch (error) {
        console.error('❌ [SSE] Error creating SSE connection:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
});

// Function to broadcast events to all connections in a workspace
export function broadcastToWorkspace(workspaceId: string, event: string, data: any) {
    // console.log('📡 [SSE] Broadcasting to workspace:', workspaceId, 'event:', event);

    const workspaceConnections = connections.get(workspaceId);
    if (workspaceConnections && workspaceConnections.length > 0) {
        const message = JSON.stringify({
            type: event,
            workspaceId,
            data,
            timestamp: new Date().toISOString()
        });

        let successCount = 0;
        let errorCount = 0;

        workspaceConnections.forEach((controller, index) => {
            try {
                controller.enqueue(`data: ${message}\n\n`);
                successCount++;
            } catch (error) {
                console.error(`❌ [SSE] Error broadcasting to client ${index}:`, error);
                errorCount++;
                // Remove failed connection
                workspaceConnections.splice(index, 1);
            }
        });

        // console.log(`✅ [SSE] Event broadcasted to ${successCount} clients, ${errorCount} failed`);
        
        // Clean up empty workspace
        if (workspaceConnections.length === 0) {
            connections.delete(workspaceId);
        }
    } else {
        // console.log('⚠️ [SSE] No active connections for workspace:', workspaceId);
    }
}

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

