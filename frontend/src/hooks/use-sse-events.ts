import { useEffect, useRef, useState, useCallback } from 'react';
import useWorkspaceId from '@/hooks/use-workspace-id';

interface SSEEvent {
    type: string;
    workspaceId: string;
    data: any;
    timestamp: string;
}

interface UseSSEEventsOptions {
    onTaskUpdated?: (data: any) => void;
    onTaskCreated?: (data: any) => void;
    onTaskDeleted?: (data: any) => void;
    enabled?: boolean;
}

export function useSSEEvents(options: UseSSEEventsOptions = {}) {
    const { onTaskUpdated, onTaskCreated, onTaskDeleted, enabled = true } = options;
    const workspaceId = useWorkspaceId();
    const eventSourceRef = useRef<EventSource | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Stable callback references to prevent re-connections
    const stableOnTaskUpdated = useCallback(onTaskUpdated || (() => { }), [onTaskUpdated]);
    const stableOnTaskCreated = useCallback(onTaskCreated || (() => { }), [onTaskCreated]);
    const stableOnTaskDeleted = useCallback(onTaskDeleted || (() => { }), [onTaskDeleted]);

    useEffect(() => {
        if (!enabled || !workspaceId) {
            // console.log('🔔 [SSE] SSE disabled or no workspace ID');
            return;
        }

        // Don't create multiple connections
        if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
            // console.log('🔔 [SSE] Connection already exists, skipping');
            return;
        }

        // console.log('🔔 [SSE] Connecting to SSE for workspace:', workspaceId);

        // Create SSE connection - use backend URL directly
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const sseUrl = `${backendUrl}/api/events?workspaceId=${workspaceId}`;
        // console.log('🔔 [SSE] Backend URL from env:', process.env.NEXT_PUBLIC_BACKEND_URL);
        // console.log('🔔 [SSE] Final backend URL:', backendUrl);
        // console.log('🔔 [SSE] SSE URL:', sseUrl);
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        // Connection opened
        eventSource.onopen = () => {
            // console.log('🔔 [SSE] Connection opened successfully!');
            // console.log('🔔 [SSE] EventSource readyState:', eventSource.readyState);
            // console.log('🔔 [SSE] EventSource URL:', eventSource.url);
            setIsConnected(true);
            setConnectionError(null);
        };

        // Connection error
        eventSource.onerror = (error) => {
            console.error('🔔 [SSE] Connection error:', error);
            // console.log('🔔 [SSE] EventSource readyState on error:', eventSource.readyState);
            setIsConnected(false);
            setConnectionError('SSE connection failed');

            // Attempt to reconnect after a delay
            setTimeout(() => {
                if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
                    // console.log('🔔 [SSE] Attempting to reconnect...');
                    // The useEffect will handle reconnection
                }
            }, 5000);
        };

        // Handle messages
        eventSource.onmessage = (event) => {
            // console.log('🔔 [SSE] Raw message received:', event.data);
            try {
                const data: SSEEvent = JSON.parse(event.data);
                // console.log('🔔 [SSE] Parsed event type:', data.type);
                // console.log('🔔 [SSE] Event data keys:', data.data ? Object.keys(data.data) : 'no data');

                switch (data.type) {
                    case 'connected':
                        // console.log('🔔 [SSE] Connected to workspace:', data.workspaceId);
                        break;

                    case 'task-updated':
                        // console.log('🔔 [SSE] Task updated - taskId:', data.data?.taskId);
                        stableOnTaskUpdated(data.data);
                        break;

                    case 'task-created':
                        // console.log('🔔 [SSE] Task created - taskId:', data.data?.taskId);
                        stableOnTaskCreated(data.data);
                        break;

                    case 'task-deleted':
                        // console.log('🔔 [SSE] Task deleted - taskId:', data.data?.taskId);
                        stableOnTaskDeleted(data.data);
                        break;

                    default:
                        // console.log('🔔 [SSE] Unknown event type:', data.type);
                }
            } catch (error) {
                console.error('🔔 [SSE] Error parsing event data:', error);
            }
        };

        // Cleanup on unmount
        return () => {
            // console.log('🔔 [SSE] Closing SSE connection');
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            setIsConnected(false);
        };
    }, [enabled, workspaceId, stableOnTaskUpdated, stableOnTaskCreated, stableOnTaskDeleted]);

    // Manual disconnect function
    const disconnect = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        }
    };

    return {
        isConnected,
        connectionError,
        disconnect
    };
}

