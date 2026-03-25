'use client';

import { useState, useEffect, useRef } from 'react';
import { logInfo, logError, logWarn, logDebug } from '@/lib/logger';

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'error' | 'warn' | 'debug';
    message: string;
    data?: any;
}

export function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<'all' | 'info' | 'error' | 'warn' | 'debug'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Add some sample logs for demonstration
    useEffect(() => {
        // Add sample logs
        logInfo('Application started', { version: '1.0.0', timestamp: new Date() });
        logDebug('Component mounted', { component: 'LogViewer' });
        logWarn('Resource usage high', { cpu: '75%', memory: '80%' });
        logError('API call failed', { endpoint: '/api/test', status: 500 });
    }, []);

    // Scroll to bottom when new logs arrive
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Filter logs based on level and search term
    const filteredLogs = logs.filter(log => {
        const matchesLevel = filter === 'all' || log.level === filter;
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase());
        return matchesLevel && matchesSearch;
    });

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-600 bg-red-50';
            case 'warn': return 'text-yellow-600 bg-yellow-50';
            case 'info': return 'text-blue-600 bg-blue-50';
            case 'debug': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error': return '❌';
            case 'warn': return '⚠️';
            case 'info': return 'ℹ️';
            case 'debug': return '🔍';
            default: return '📝';
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const exportLogs = () => {
        const logText = filteredLogs.map(log =>
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message} ${log.data ? JSON.stringify(log.data, null, 2) : ''}`
        ).join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* Floating log button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
                title="View Logs"
            >
                📋
            </button>

            {/* Log viewer modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-semibold">Application Logs</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="p-4 border-b space-y-3">
                            <div className="flex gap-4 items-center">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Filter by Level
                                    </label>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as any)}
                                        className="border rounded px-3 py-1 text-sm"
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="error">Error</option>
                                        <option value="warn">Warning</option>
                                        <option value="info">Info</option>
                                        <option value="debug">Debug</option>
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Search
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full border rounded px-3 py-1 text-sm"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={clearLogs}
                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={exportLogs}
                                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Export
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredLogs.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    No logs to display
                                </div>
                            ) : (
                                filteredLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`p-3 rounded border ${getLevelColor(log.level)}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">{getLevelIcon(log.level)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-gray-500">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                    <span className="text-xs font-semibold uppercase">
                                                        {log.level}
                                                    </span>
                                                </div>
                                                <div className="font-medium">{log.message}</div>
                                                {log.data && (
                                                    <pre className="text-xs mt-2 bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t text-sm text-gray-500">
                            Showing {filteredLogs.length} of {logs.length} logs
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

