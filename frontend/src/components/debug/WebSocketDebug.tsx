"use client";

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/useAuthContext';
import { useWebSocketOnlineStatus } from '@/hooks/use-websocket-online-status';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function WebSocketDebug() {
    const { user } = useAuthContext();
    const workspaceId = useWorkspaceId();
    const [serverHealth, setServerHealth] = useState<any>(null);
    const [healthError, setHealthError] = useState<string | null>(null);

    const {
        isConnected,
        connectionError,
        onlineUsers,
        connect,
        disconnect,
    } = useWebSocketOnlineStatus({
        workspaceId,
        autoConnect: false, // Manual control for debugging
    });

    const serverUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // Debug environment variables
    const envDebug = {
        NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
        NODE_ENV: process.env.NODE_ENV,
        serverUrl: serverUrl
    };

    const checkServerHealth = async () => {
        try {
            setHealthError(null);
            const response = await fetch(`${serverUrl}/api/health`); // Changed from websocket-health to health

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setServerHealth(data);
        } catch (error) {
            setHealthError(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const getAuthToken = () => {
        const authTokenCookieName = process.env.NEXT_PUBLIC_AUTH_TOKEN_COOKIE_NAME || 'auth_token';
        if (typeof document === 'undefined') return null;

        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === authTokenCookieName) {
                return value;
            }
        }
        return null;
    };

    useEffect(() => {
        checkServerHealth();
    }, []);

    const token = getAuthToken();

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>WebSocket Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Server Health */}
                <div>
                    <h3 className="font-semibold mb-2">Server Health</h3>
                    <div className="flex items-center gap-2 mb-2">
                        <Button onClick={checkServerHealth} size="sm">
                            Check Health
                        </Button>
                        {serverHealth && (
                            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700">
                                Server Online
                            </Badge>
                        )}
                        {healthError && (
                            <Badge variant="destructive">
                                Server Error: {healthError}
                            </Badge>
                        )}
                    </div>
                    {serverHealth && (
                        <pre className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-2 rounded border border-gray-200 dark:border-slate-700">
                            {JSON.stringify(serverHealth, null, 2)}
                        </pre>
                    )}
                </div>

                {/* Connection Info */}
                <div>
                    <h3 className="font-semibold mb-2">Connection Info</h3>
                    <div className="space-y-1 text-sm">
                        <div>Server URL: <code>{serverUrl}</code></div>
                        <div>Workspace ID: <code>{workspaceId || 'None'}</code></div>
                        <div>User: <code>{user?.email || 'Not logged in'}</code></div>
                        <div>Token: <code>{token ? `${token.substring(0, 20)}...` : 'None'}</code></div>
                    </div>

                    {/* Environment Debug */}
                    <div className="mt-3">
                        <h4 className="font-medium text-sm mb-1">Environment Debug:</h4>
                        <pre className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-2 rounded border border-gray-200 dark:border-slate-700">
                            {JSON.stringify(envDebug, null, 2)}
                        </pre>
                    </div>
                </div>

                {/* Connection Status */}
                <div>
                    <h3 className="font-semibold mb-2">Connection Status</h3>
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            onClick={() => connect()}
                            disabled={isConnected}
                            size="sm"
                        >
                            Connect
                        </Button>
                        <Button
                            onClick={() => disconnect()}
                            disabled={!isConnected}
                            size="sm"
                            variant="outline"
                        >
                            Disconnect
                        </Button>
                        {isConnected && (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700">
                                Connected
                            </Badge>
                        )}
                        {connectionError && (
                            <Badge variant="destructive">
                                Error: {connectionError}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Online Users */}
                <div>
                    <h3 className="font-semibold mb-2">Online Users ({onlineUsers.length})</h3>
                    {onlineUsers.length > 0 ? (
                        <div className="space-y-1">
                            {onlineUsers.map((user) => (
                                <div key={user.userId} className="text-sm">
                                    {user.userName} ({user.userId})
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-slate-400">No users online</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
