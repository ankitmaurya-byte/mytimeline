'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any[];
    source?: string;
}

export function AdvancedLogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<'all' | 'log' | 'info' | 'warn' | 'error' | 'debug'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [maxLogs, setMaxLogs] = useState(1000);
    const [isVisible, setIsVisible] = useState(true);
    const [buttonPosition, setButtonPosition] = useState({ x: 16, y: 16 }); // bottom-4 right-4 = 16px
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const logsEndRef = useRef<HTMLDivElement>(null);
    const isCapturingRef = useRef(false);
    const maxLogsRef = useRef(maxLogs);

    // Update refs when state changes
    useEffect(() => {
        isCapturingRef.current = isCapturing;
        maxLogsRef.current = maxLogs;
    }, [isCapturing, maxLogs]);

    // Add keyboard support to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Handle dragging for floating button
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            // Calculate new position (from bottom-right corner)
            const newX = window.innerWidth - (e.clientX + dragOffset.x);
            const newY = window.innerHeight - (e.clientY + dragOffset.y);

            // Keep button within screen bounds
            const clampedX = Math.max(16, Math.min(window.innerWidth - 64, window.innerWidth - newX));
            const clampedY = Math.max(16, Math.min(window.innerHeight - 64, window.innerHeight - newY));

            setButtonPosition({
                x: window.innerWidth - clampedX - 48, // 48px = button width
                y: window.innerHeight - clampedY - 48  // 48px = button height
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Capture console logs
    const captureLogs = useCallback(() => {
        if (isCapturingRef.current) return;

        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
        };

        const addLog = (level: LogEntry['level'], ...args: any[]) => {
            const message = args.map(arg =>
                typeof arg === 'string' ? arg : JSON.stringify(arg)
            ).join(' ');

            const newLog: LogEntry = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                level,
                message,
                data: args,
                source: 'console',
            };

            setLogs(prev => {
                const newLogs = [...prev, newLog];
                // Keep only the last maxLogs entries
                return newLogs.slice(-maxLogsRef.current);
            });
        };

        // Override console methods
        console.log = (...args) => {
            originalConsole.log(...args);
            addLog('log', ...args);
        };

        console.info = (...args) => {
            originalConsole.info(...args);
            addLog('info', ...args);
        };

        console.warn = (...args) => {
            originalConsole.warn(...args);
            addLog('warn', ...args);
        };

        console.error = (...args) => {
            originalConsole.error(...args);
            addLog('error', ...args);
        };

        console.debug = (...args) => {
            originalConsole.debug(...args);
            addLog('debug', ...args);
        };

        setIsCapturing(true);

        // Return cleanup function
        return () => {
            console.log = originalConsole.log;
            console.info = originalConsole.info;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
            console.debug = originalConsole.debug;
            setIsCapturing(false);
        };
    }, []); // Remove dependencies to prevent infinite loop

    // Start capturing logs when component mounts
    useEffect(() => {
        const cleanup = captureLogs();
        return cleanup;
    }, []); // Only run once on mount

    // Scroll to bottom when new logs arrive
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Filter logs based on level and search term
    const filteredLogs = logs.filter(log => {
        const matchesLevel = filter === 'all' || log.level === filter;
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.data && log.data.some(item =>
                JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
            ));
        return matchesLevel && matchesSearch;
    });

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-600 bg-red-50 border-red-200';
            case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
            case 'log': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error': return '❌';
            case 'warn': return '⚠️';
            case 'info': return 'ℹ️';
            case 'debug': return '🔍';
            case 'log': return '📝';
            default: return '📝';
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const exportLogs = () => {
        const logText = filteredLogs.map(log =>
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `console-logs-${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const addTestLogs = () => {
        console.warn('This is a test warning message');
        console.error('This is a test error message', new Error('Test error'));
    };

    const handleButtonMouseDown = (e: React.MouseEvent) => {
        // Prevent opening modal when starting drag
        e.preventDefault();
        e.stopPropagation();

        setDragOffset({
            x: e.clientX - (window.innerWidth - buttonPosition.x - 48),
            y: e.clientY - (window.innerHeight - buttonPosition.y - 48),
        });
        setIsDragging(true);
    };

    const handleButtonClick = (e: React.MouseEvent) => {
        // Only open modal if we're not dragging
        if (!isDragging) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <>
            {/* Floating log button - only show if visible */}
            {isVisible && (
                <button
                    onClick={handleButtonClick}
                    onMouseDown={handleButtonMouseDown}
                    className="fixed bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transition-colors z-50 select-none"
                    style={{
                        right: `${buttonPosition.x}px`,
                        bottom: `${buttonPosition.y}px`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none',
                    }}
                    title={isDragging ? 'Dragging...' : 'View Console Logs (Drag to move)'}
                >
                    📋
                </button>
            )}

            {/* Log viewer modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        // Close when clicking the backdrop (not the modal content)
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-4/5 flex flex-col relative">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <div>
                                <h2 className="text-xl font-semibold">Console Logs</h2>
                                <p className="text-sm text-gray-500">
                                    {isCapturing ? '🟢 Capturing logs' : '🔴 Not capturing'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                                title="Close Logger (Press Escape)"
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
                                        <option value="log">Log</option>
                                        <option value="info">Info</option>
                                        <option value="warn">Warning</option>
                                        <option value="error">Error</option>
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Logs
                                    </label>
                                    <input
                                        type="number"
                                        value={maxLogs}
                                        onChange={(e) => setMaxLogs(Number(e.target.value))}
                                        min="100"
                                        max="10000"
                                        className="w-20 border rounded px-2 py-1 text-sm"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={addTestLogs}
                                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Test Logs
                                    </button>
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
                                    <button
                                        onClick={() => setIsVisible(!isVisible)}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${isVisible
                                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                                            : 'bg-gray-500 text-white hover:bg-gray-600'
                                            }`}
                                        title={isVisible ? 'Hide floating button' : 'Show floating button'}
                                    >
                                        {isVisible ? '👁️ Hide Icon' : '👁️‍🗨️ Show Icon'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                            {filteredLogs.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    No logs to display. Try adding some test logs or interacting with the app.
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
                                                    {log.source && (
                                                        <span className="text-xs text-gray-400">
                                                            from {log.source}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium">{log.message}</div>
                                                {log.data && log.data.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {log.data.map((item, index) => (
                                                            <pre key={index} className="text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                                                                {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                                                            </pre>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} className="relative" />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t text-sm text-gray-500">
                            Showing {filteredLogs.length} of {logs.length} logs
                            {logs.length >= maxLogs && (
                                <span className="text-orange-600 ml-2">
                                    (Max logs reached, older logs are being dropped)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
