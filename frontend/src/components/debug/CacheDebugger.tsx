'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CacheDebuggerProps {
    workspaceId: string;
    projectId?: string;
}

export function CacheDebugger({ workspaceId, projectId }: CacheDebuggerProps) {
    const queryClient = useQueryClient();
    const [cacheState, setCacheState] = useState<any>({});
    const [isVisible, setIsVisible] = useState(false);

    const updateCacheState = () => {
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.getAll();

        const taskQueries = queries.filter(query => {
            const key = query.queryKey;
            return (
                (Array.isArray(key) && key[0] === 'tasks') ||
                (Array.isArray(key) && key[0] === 'all-tasks') ||
                (Array.isArray(key) && key[0] === 'calendar-tasks')
            );
        });

        const state: any = {};
        taskQueries.forEach(query => {
            const key = JSON.stringify(query.queryKey);
            state[key] = {
                queryKey: query.queryKey,
                state: query.state.status,
                dataUpdatedAt: new Date(query.state.dataUpdatedAt).toISOString(),
                data: query.state.data ? {
                    taskCount: (query.state.data as any)?.tasks?.length || 0,
                    totalCount: (query.state.data as any)?.pagination?.totalCount || 0
                } : null,
                error: query.state.error,
                isStale: query.isStale(),
                isFetching: query.state.fetchStatus === 'fetching'
            };
        });

        setCacheState(state);
    };

    useEffect(() => {
        if (isVisible) {
            updateCacheState();
            const interval = setInterval(updateCacheState, 1000);
            return () => clearInterval(interval);
        }
    }, [isVisible, workspaceId, projectId]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['calendar-tasks', workspaceId] });
        updateCacheState();
    };

    const refetchAll = () => {
        queryClient.refetchQueries({ queryKey: projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId] });
        queryClient.refetchQueries({ queryKey: ['all-tasks', workspaceId] });
        queryClient.refetchQueries({ queryKey: ['calendar-tasks', workspaceId] });
        updateCacheState();
    };

    if (!isVisible) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 z-50"
            >
                🐛 Debug Cache
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                    🐛 Cache Debugger
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsVisible(false)}
                    >
                        ✕
                    </Button>
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                    Workspace: {workspaceId} | Project: {projectId || 'None'}
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex gap-2">
                    <Button size="sm" onClick={invalidateAll}>
                        Invalidate
                    </Button>
                    <Button size="sm" onClick={refetchAll}>
                        Refetch
                    </Button>
                    <Button size="sm" onClick={updateCacheState}>
                        Refresh
                    </Button>
                </div>

                <div className="space-y-2">
                    {Object.entries(cacheState).map(([key, query]: [string, any]) => (
                        <div key={key} className="border rounded p-2 text-xs">
                            <div className="font-mono text-xs mb-1">
                                {JSON.stringify(query.queryKey)}
                            </div>
                            <div className="flex gap-1 mb-1">
                                <Badge variant={query.state === 'success' ? 'default' : 'secondary'}>
                                    {query.state}
                                </Badge>
                                {query.isStale && <Badge variant="outline">Stale</Badge>}
                                {query.isFetching && <Badge variant="outline">Fetching</Badge>}
                            </div>
                            {query.data && (
                                <div className="text-xs text-muted-foreground">
                                    Tasks: {query.data.taskCount} | Total: {query.data.totalCount}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Updated: {new Date(query.dataUpdatedAt).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
