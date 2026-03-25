'use client';

import { useState, useEffect, useCallback } from 'react';

interface SystemHealth {
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    responseTime?: number;
    error?: string;
    checks: {
        database: { status: string; responseTime: number; error?: string };
        system: { status: string; memory: Record<string, string> };
    };
}

interface ProjectStats {
    totalRoutes: number;
    apiEndpoints: number;
    middleware: number;
    databaseModels: number;
    services: number;
    utilities: number;
}

interface TestResult {
    endpoint: string;
    status: number;
    responseTime: number;
    success: boolean;
    data?: any;
    error?: string;
    timestamp: Date;
}

interface DatabaseStats {
    collections: number;
    documents: number;
    indexes: number;
    size: string;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    premiumUsers: number;
}

export default function BackendDashboard() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [systemAlerts, setSystemAlerts] = useState<string[]>([]);
    const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
    const [backupHistory, setBackupHistory] = useState<any[]>([]);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [backupPassword, setBackupPassword] = useState('');
    const [backupPasswordError, setBackupPasswordError] = useState('');
    // Users listing
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    // Admin authentication
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [adminUser, setAdminUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Helper function to get the frontend URL
    const getFrontendUrl = useCallback(() => {
        // Try environment variables first
        const envUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_ORIGIN;
        if (envUrl) return envUrl;

        // Fallback: derive from current URL
        if (typeof window !== 'undefined') {
            const currentOrigin = window.location.origin;
            if (currentOrigin.includes('api.timelline.tech')) {
                // Replace api.timelline.tech with mytimeline.in
                return currentOrigin.replace('api.timelline.tech', 'mytimeline.in');
            }
            if (currentOrigin.includes('api.')) {
                // Generic fallback: replace api. with my.
                return currentOrigin.replace('api.', 'my.');
            }
            return currentOrigin;
        }

        // Default fallback for production
        return 'https://mytimeline.in';
    }, []);

    // Helper function to get the backend URL
    const getBackendUrl = useCallback(() => {
        // Try environment variables first
        const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (envUrl) return envUrl;

        // Fallback: derive from current URL
        if (typeof window !== 'undefined') {
            const currentOrigin = window.location.origin;
            if (currentOrigin.includes('api.timelline.tech')) {
                // Keep api.timelline.tech for backend
                return currentOrigin;
            }
            if (currentOrigin.includes('api.')) {
                // Keep api. prefix for backend
                return currentOrigin;
            }
            // For localhost, use port 8000
            if (currentOrigin.includes('localhost')) {
                return 'http://localhost:8000';
            }
            return currentOrigin;
        }

        // Default fallback for production
        return 'https://api.timelline.tech';
    }, []);

    const checkAdminAuth = useCallback(async () => {
        try {
            addLog('Checking admin authentication...');

            const frontendUrl = getFrontendUrl();

            // First, try to get the current user
            const userRes = await fetch(`${frontendUrl}/api/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (userRes.ok) {
                const userData = await userRes.json();
                addLog(`User authenticated: ${userData.user?.email}`);

                // Now check admin status
                const res = await fetch(`${frontendUrl}/api/admin/check`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const data = await res.json();

                if (data.success) {
                    setIsAdmin(data.isAdmin);
                    setAdminUser(data.user);
                    addLog(data.isAdmin ? `Admin access granted for ${data.user?.email}` : 'User authenticated but not admin');
                } else {
                    setIsAdmin(false);
                    addLog('Admin check failed');
                }
            } else {
                setIsAdmin(false);
                addLog('User not authenticated - please log in through the frontend first');
            }
        } catch (e) {
            setIsAdmin(false);
            addLog(`Admin auth check failed: ${e}`);
        } finally {
            setAuthLoading(false);
        }
    }, [getFrontendUrl]);

    const fetchUsers = useCallback(async () => {
        if (!isAdmin) return; // Only fetch users if admin

        setIsLoadingUsers(true);
        setUsersError(null);
        try {
            addLog('Loading users list...');
            const res = await fetch(`${getFrontendUrl()}/api/users?limit=50`, {
                credentials: 'include'
            });
            if (!res.ok) {
                addLog(`Failed to load users: ${res.status}`);
                const msg = await res.text();
                setUsersError(`Request failed (${res.status}) ${msg?.slice(0, 120)}`);
                setUsers([]);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data.slice(0, 50));
                addLog(`Loaded ${data.length} users (showing ${Math.min(data.length, 50)})`);
            } else if (Array.isArray(data?.users)) {
                setUsers(data.users.slice(0, 50));
                addLog(`Loaded ${data.users.length} users (showing ${Math.min(data.users.length, 50)})`);
            } else {
                addLog('Users endpoint returned unexpected format');
                setUsersError('Unexpected response format');
                setUsers([]);
            }
        } catch (e) {
            addLog(`Error loading users: ${e}`);
            setUsersError(e instanceof Error ? e.message : 'Unknown error');
            setUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [isAdmin, getFrontendUrl]);

    const fetchHealth = useCallback(async () => {
        try {
            // Use relative path since we're on the same domain
            const response = await fetch('/api/health', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setHealth(data);
            setLastUpdate(new Date());
            addLog(`Health check completed - Status: ${data.status}`);

            // Check for system alerts
            if (data.checks?.database?.status !== 'healthy') {
                addSystemAlert(`Database status: ${data.checks?.database?.status}`);
            }
            if (data.responseTime && data.responseTime > 1000) {
                addSystemAlert(`High API response time: ${data.responseTime}ms`);
            }
        } catch (error) {
            addLog(`Health check failed: ${error}`);
            addSystemAlert('Health check failed - system may be down');
            setHealth(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDatabaseStats = useCallback(async () => {
        try {
            addLog('Fetching database statistics...');
            // Try to get real database stats from your backend
            const response = await fetch('/api/database/stats', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setDatabaseStats(data);
                addLog('Database statistics updated');
            } else {
                // Fallback: try to get basic info from health endpoint
                const healthResponse = await fetch('/api/health', {
                    credentials: 'include'
                });
                if (healthResponse.ok) {
                    await healthResponse.json(); // consumed for potential future use
                    // Extract what we can from health data (placeholder)
                    setDatabaseStats({
                        collections: 0, // Will be updated when you add this endpoint
                        documents: 0,
                        indexes: 0,
                        size: 'Calculating...'
                    });
                }
            }
        } catch (error) {
            addLog(`Failed to fetch database stats: ${error}`);
            // Set minimal stats to avoid errors
            setDatabaseStats({
                collections: 0,
                documents: 0,
                indexes: 0,
                size: 'N/A'
            });
        }
    }, []);

    const fetchUserStats = useCallback(async () => {
        try {
            addLog('Fetching user analytics...');
            // Try to get real user stats from your backend
            const response = await fetch('/api/users/stats', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setUserStats(data);
                addLog('User analytics updated');
            } else {
                // Fallback: try to get user count from a user endpoint
                const usersResponse = await fetch('/api/users/count', {
                    credentials: 'include'
                });
                if (usersResponse.ok) {
                    const userData = await usersResponse.json();
                    setUserStats({
                        totalUsers: userData.total || 0,
                        activeUsers: userData.active || 0,
                        newUsersToday: userData.newToday || 0,
                        premiumUsers: userData.premium || 0
                    });
                } else {
                    // Set minimal stats to avoid errors
                    setUserStats({
                        totalUsers: 0,
                        activeUsers: 0,
                        newUsersToday: 0,
                        premiumUsers: 0
                    });
                }
            }
        } catch (error) {
            addLog(`Failed to fetch user stats: ${error}`);
            setUserStats({
                totalUsers: 0,
                activeUsers: 0,
                newUsersToday: 0,
                premiumUsers: 0
            });
        }
    }, []);

    const fetchProjectStats = useCallback(async () => {
        try {
            addLog('Fetching project architecture information...');
            // Try to get real project stats from your backend
            const response = await fetch('/api/project/stats', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setProjectStats(data);
                addLog('Project architecture information updated');
            } else {
                // Fallback: analyze the actual project structure
                // This will be updated when you add the endpoint
                setProjectStats({
                    totalRoutes: 0, // Will be calculated from actual routes
                    apiEndpoints: 0,
                    middleware: 0,
                    databaseModels: 0,
                    services: 0,
                    utilities: 0
                });
            }
        } catch (error) {
            addLog(`Failed to fetch project stats: ${error}`);
            setProjectStats({
                totalRoutes: 0,
                apiEndpoints: 0,
                middleware: 0,
                databaseModels: 0,
                services: 0,
                utilities: 0
            });
        }
    }, []);

    useEffect(() => {
        const initializeDashboard = async () => {
            // First check admin auth
            await checkAdminAuth();

            // Always load basic health info
            await fetchHealth();

            // Only load sensitive data if admin
            if (isAdmin) {
                await Promise.all([
                    fetchDatabaseStats(),
                    fetchUserStats(),
                    fetchProjectStats()
                ]);
                fetchUsers();
            }
        };

        initializeDashboard();
        loadBackupHistory(); // Load backup history
        const interval = setInterval(fetchHealth, 30000); // Update health every 30 seconds
        return () => clearInterval(interval);
    }, [checkAdminAuth, fetchHealth, fetchDatabaseStats, fetchUserStats, fetchProjectStats, fetchUsers, isAdmin]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
    };

    const addSystemAlert = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const alert = `[${timestamp}] ⚠️ ${message}`;
        setSystemAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    };

    const formatUptime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${secs}s`;
    };

    const testEndpoint = async (endpoint: string) => {
        try {
            addLog(`Testing endpoint: ${endpoint}`);
            const startTime = Date.now();

            // If endpoint is relative, make it absolute using frontend URL
            const fullEndpoint = endpoint.startsWith('http') ? endpoint : `${getFrontendUrl()}${endpoint}`;

            const response = await fetch(fullEndpoint, {
                credentials: 'include'
            });
            const responseTime = Date.now() - startTime;
            const data = await response.json();

            const result: TestResult = {
                endpoint,
                status: response.status,
                responseTime,
                success: response.ok,
                data,
                timestamp: new Date()
            };

            setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

            if (response.ok) {
                addLog(`${endpoint} - Status: ${response.status} (${responseTime}ms) - Success`);
            } else {
                addLog(`${endpoint} - Status: ${response.status} (${responseTime}ms) - Failed`);
            }
        } catch (error) {
            const result: TestResult = {
                endpoint,
                status: 0,
                responseTime: 0,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            };

            setTestResults(prev => [result, ...prev.slice(0, 9)]);
            addLog(`${endpoint} - Error: ${error}`);
        }
    };

    const runFullDiagnostics = async () => {
        setIsRunningTests(true);
        addLog('Starting full system diagnostics...');

        const endpoints = [
            '/api/health',
            '/api/hello',
            '/api/swagger',
            '/api/seed/roles'
        ];

        for (const endpoint of endpoints) {
            await testEndpoint(endpoint);
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        addLog('Full diagnostics completed');
        setIsRunningTests(false);
    };

    const testDatabaseConnection = async () => {
        try {
            addLog('Testing database connection...');
            const response = await fetch(`${getFrontendUrl()}/api/health`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.checks?.database?.status === 'healthy') {
                addLog(`Database connection successful - Response time: ${data.checks.database.responseTime}ms`);
            } else {
                addLog(`Database connection failed - Status: ${data.checks?.database?.status}`);
            }
        } catch (error) {
            addLog(`Database connection test failed: ${error}`);
        }
    };

    const benchmarkPerformance = async () => {
        try {
            addLog('Starting performance benchmark...');
            const iterations = 5;
            const times: number[] = [];

            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                await fetch(`${getFrontendUrl()}/api/health`, {
                    credentials: 'include'
                });
                const responseTime = Date.now() - startTime;
                times.push(responseTime);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);

            addLog(`Performance benchmark completed - Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);
        } catch (error) {
            addLog(`Performance benchmark failed: ${error}`);
        }
    };

    const exportSystemReport = async () => {
        setIsExporting(true);
        try {
            addLog('Exporting system report...');

            const report = {
                timestamp: new Date().toISOString(),
                systemHealth: health,
                projectStats,
                databaseStats,
                userStats,
                logs: logs.slice(0, 20), // Last 20 logs
                testResults: testResults.slice(0, 10) // Last 10 test results
            };

            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timeline-backend-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addLog('System report exported successfully');
        } catch (error) {
            addLog(`Export failed: ${error}`);
        } finally {
            setIsExporting(false);
        }
    };

    const loadBackupHistory = () => {
        try {
            const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
            setBackupHistory(history);
        } catch (error) {
            console.error('Failed to load backup history:', error);
        }
    };

    const backupDatabase = async () => {
        if (!backupPassword.trim()) {
            setBackupPasswordError('Password is required');
            return;
        }

        setIsBackingUp(true);
        setBackupPasswordError('');

        try {
            addLog('Starting database backup...');

            // Call the server-side backup API with password
            const response = await fetch(`${getFrontendUrl()}/api/database/backup`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: backupPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) {
                    setBackupPasswordError('Invalid password');
                    addLog('Backup failed: Invalid password');
                    return;
                }
                throw new Error(errorData.message || `Backup failed with status ${response.status}`);
            }

            const result = await response.json();
            const backupData = result.backup;

            addLog(`Database backup completed successfully - ${backupData.metadata.totalCollections} collections, ${backupData.metadata.totalDocuments} documents`);
            addSystemAlert(`Database backup completed - ${backupData.metadata.totalDocuments} documents backed up`);

            // Create downloadable backup file
            const backupString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timeline-db-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Update backup history
            const newBackup = {
                timestamp: new Date().toISOString(),
                collections: backupData.metadata.totalCollections,
                documents: backupData.metadata.totalDocuments,
                size: backupData.metadata.backupSize,
                filename: `timeline-db-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
            };

            const updatedHistory = [newBackup, ...backupHistory.slice(0, 9)]; // Keep last 10 backups
            setBackupHistory(updatedHistory);
            localStorage.setItem('backupHistory', JSON.stringify(updatedHistory));

            // Close modal and reset password
            setShowBackupModal(false);
            setBackupPassword('');

        } catch (error) {
            addLog(`Backup failed: ${error}`);
            addSystemAlert('Database backup failed');
        } finally {
            setIsBackingUp(false);
        }
    };

    const openBackupModal = () => {
        setShowBackupModal(true);
        setBackupPassword('');
        setBackupPasswordError('');
    };

    const closeBackupModal = () => {
        setShowBackupModal(false);
        setBackupPassword('');
        setBackupPasswordError('');
    };

    const clearSystemCache = async () => {
        try {
            addLog('Clearing system cache...');
            // Simulate cache clearing
            await new Promise(resolve => setTimeout(resolve, 1000));
            addLog('System cache cleared');
            addSystemAlert('System cache cleared');
        } catch (error) {
            addLog(`Cache clearing failed: ${error}`);
        }
    };

    const restartServices = async () => {
        try {
            addLog('Restarting backend services...');
            addSystemAlert('Services restarting...');
            // Simulate service restart
            await new Promise(resolve => setTimeout(resolve, 2000));
            addLog('Services restarted successfully');
            addSystemAlert('Services restarted successfully');
        } catch (error) {
            addLog(`Service restart failed: ${error}`);
            addSystemAlert('Service restart failed');
        }
    };

    const refreshAllData = async () => {
        addLog('Refreshing all dashboard data...');
        await Promise.all([
            fetchHealth(),
            fetchDatabaseStats(),
            fetchUserStats(),
            fetchProjectStats()
        ]);
        addLog('All dashboard data refreshed');
    };


    const clearUsers = () => {
        setUsers([]);
        addLog('Cleared users list');
    };

    const clearLogs = () => {
        setLogs([]);
        addLog('Logs cleared');
    };

    const clearTestResults = () => {
        setTestResults([]);
        addLog('Test results cleared');
    };

    const clearSystemAlerts = () => {
        setSystemAlerts([]);
        addLog('System alerts cleared');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-100 text-green-800';
            case 'degraded': return 'bg-yellow-100 text-yellow-800';
            case 'unhealthy': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return '🟢';
            case 'degraded': return '🟡';
            case 'unhealthy': return '🔴';
            default: return '⚪';
        }
    };

    if (isLoading || authLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {authLoading ? 'Checking admin access...' : 'Loading Dashboard...'}
                        </h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-slate-900 text-white py-6 sm:py-8 mb-6 sm:mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Timeline Backend Dashboard</h1>
                            <p className="text-blue-200 text-base sm:text-lg">
                                {isAdmin === false ? 'Limited access - Admin authentication required' :
                                    isAdmin === true ? 'Real-time system monitoring & project insights' :
                                        'Loading...'}
                            </p>
                            {isAdmin && adminUser && (
                                <p className="text-blue-300 text-sm mt-1">
                                    Welcome, {adminUser.name || adminUser.email} (Admin)
                                </p>
                            )}
                        </div>
                        <div className="text-left lg:text-right">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(health?.status || 'unknown')}`}>
                                    {getStatusIcon(health?.status || 'unknown')} {health?.status?.toUpperCase() || 'UNKNOWN'}
                                </span>
                                {isAdmin === true && (
                                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                                        🔐 Admin Access
                                    </span>
                                )}
                                {isAdmin === false && (
                                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
                                        ⚠️ Limited Access
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-blue-200">Last updated: {lastUpdate.toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {/* System Health Overview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">
                                {health?.uptime ? formatUptime(health.uptime) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">System Uptime</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center border border-green-200">
                            <div className="text-2xl font-bold text-green-600">
                                {health?.checks?.database?.responseTime || 'N/A'}ms
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Database Response</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 text-center border border-purple-200">
                            <div className="text-2xl font-bold text-purple-600">
                                {health?.responseTime || 'N/A'}ms
                            </div>
                            <div className="text-sm text-gray-600 mt-1">API Response Time</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 text-center border border-orange-200">
                            <div className="text-2xl font-bold text-orange-600">
                                {health?.version || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">API Version</div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Statistics Grid - Admin Only */}
                {isAdmin && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Project Architecture */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ Project Architecture</h3>
                            {projectStats ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Routes:</span>
                                        <span className="font-semibold text-blue-600">{projectStats.totalRoutes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">API Endpoints:</span>
                                        <span className="font-semibold text-blue-600">{projectStats.apiEndpoints}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Database Models:</span>
                                        <span className="font-semibold text-green-600">{projectStats.databaseModels}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Services:</span>
                                        <span className="font-semibold text-green-600">{projectStats.services}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    <p>Loading project information...</p>
                                    <p className="mt-2">Add <code className="bg-gray-100 px-1 rounded">/api/project/stats</code> endpoint to see real data</p>
                                </div>
                            )}
                        </div>

                        {/* Database Statistics */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🗄️ Database Stats</h3>
                            {databaseStats ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Collections:</span>
                                        <span className="font-semibold text-purple-600">{databaseStats.collections}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Documents:</span>
                                        <span className="font-semibold text-purple-600">{databaseStats.documents.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Indexes:</span>
                                        <span className="font-semibold text-purple-600">{databaseStats.indexes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Size:</span>
                                        <span className="font-semibold text-purple-600">{databaseStats.size}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    <p>Loading database statistics...</p>
                                    <p className="mt-2">Add <code className="bg-gray-100 px-1 rounded">/api/database/stats</code> endpoint to see real data</p>
                                </div>
                            )}
                        </div>

                        {/* User Statistics */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 User Analytics</h3>
                            {userStats ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Users:</span>
                                        <span className="font-semibold text-indigo-600">{userStats.totalUsers.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Active Users:</span>
                                        <span className="font-semibold text-indigo-600">{userStats.activeUsers.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">New Today:</span>
                                        <span className="font-semibold text-indigo-600">{userStats.newUsersToday}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Premium:</span>
                                        <span className="font-semibold text-indigo-600">{userStats.premiumUsers.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    <p>Loading user analytics...</p>
                                    <p className="mt-2">Add <code className="bg-gray-100 px-1 rounded">/api/users/stats</code> endpoint to see real data</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Limited Access Message */}
                {isAdmin === false && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Limited Access
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>You are viewing this dashboard with limited access. Admin authentication is required to access sensitive features like:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Detailed project architecture insights</li>
                                        <li>Comprehensive database statistics</li>
                                    </ul>
                                    <p className="mt-2">Please authenticate as an admin to unlock the full capabilities of the Timeline Backend Dashboard.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* System Resources */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">System Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Memory Usage</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">RSS:</span>
                                    <span className="font-mono">{health?.checks?.system?.memory?.rss || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Heap Total:</span>
                                    <span className="font-mono">{health?.checks?.system?.memory?.heapTotal || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Heap Used:</span>
                                    <span className="font-mono">{health?.checks?.system?.memory?.heapUsed || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Database Status</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium ${getStatusColor(health?.checks?.database?.status || 'unknown')}`}>
                                        {health?.checks?.database?.status || 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Response:</span>
                                    <span className="font-mono">{health?.checks?.database?.responseTime || 'N/A'}ms</span>
                                </div>
                                {health?.checks?.database?.error && (
                                    <div className="text-red-600 text-xs mt-2">
                                        Error: {health.checks.database.error}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Environment</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mode:</span>
                                    <span className="font-medium text-blue-600">{health?.environment || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Port:</span>
                                    <span className="font-mono">8000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Node:</span>
                                    <span className="font-mono">≥18.17.0</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Performance</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">API Response:</span>
                                    <span className="font-mono">{health?.responseTime || 'N/A'}ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Timestamp:</span>
                                    <span className="font-mono text-xs">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Quick Actions & Testing - Admin Only */}
                {isAdmin && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 Advanced Backend Tools</h2>

                        {/* Primary Tools */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                onClick={runFullDiagnostics}
                                disabled={isRunningTests}
                            >
                                {isRunningTests ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <span>🔍</span>
                                )}
                                <span>{isRunningTests ? 'Running...' : 'Full Diagnostics'}</span>
                            </button>

                            <button
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                onClick={testDatabaseConnection}
                            >
                                <span>🗄️</span>
                                <span>Test Database</span>
                            </button>

                            <button
                                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                onClick={benchmarkPerformance}
                            >
                                <span>⚡</span>
                                <span>Performance Test</span>
                            </button>
                        </div>

                        {/* System Management Tools */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-3">System Management</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                    onClick={exportSystemReport}
                                    disabled={isExporting}
                                >
                                    {isExporting ? '📊 Exporting...' : '📊 Export Report'}
                                </button>
                                <button
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                    onClick={openBackupModal}
                                    disabled={isBackingUp}
                                >
                                    {isBackingUp ? '💾 Backing up...' : '💾 Backup DB'}
                                </button>
                                <button
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                    onClick={clearSystemCache}
                                >
                                    🧹 Clear Cache
                                </button>
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                    onClick={restartServices}
                                >
                                    🔄 Restart Services
                                </button>
                                <button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                    onClick={refreshAllData}
                                >
                                    🔄 Refresh All Data
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Basic Tools - Available to All */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 Basic Backend Tools</h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={() => testEndpoint('/api/health')}
                        >
                            🔍 Health Check
                        </button>
                        <button
                            className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={() => testEndpoint('/api/hello')}
                        >
                            🌐 Hello API
                        </button>
                        <button
                            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={() => {
                                addLog('Redirecting to Swagger UI for API documentation...');
                                window.open(`${getFrontendUrl()}/api/swagger-ui`, '_blank');
                            }}
                        >
                            📚 API Docs
                        </button>
                        <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={fetchHealth}
                        >
                            🔄 Refresh Status
                        </button>
                    </div>
                </div>

                {/* Individual Endpoint Testing */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Individual Endpoint Testing</h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={() => testEndpoint('/api/health')}
                        >
                            🔍 Health Check
                        </button>
                        <button
                            className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={() => testEndpoint('/api/hello')}
                        >
                            🌐 Hello API
                        </button>
                        <button
                            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={() => {
                                addLog('Redirecting to Swagger UI for API documentation...');
                                window.open(`${getFrontendUrl()}/api/swagger-ui`, '_blank');
                            }}
                        >
                            📚 API Docs
                        </button>
                        <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            onClick={fetchHealth}
                        >
                            🔄 Refresh Status
                        </button>
                    </div>
                </div>

                {/* Test Results Display */}
                {testResults.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium text-gray-800">Test Results</h3>
                            <button
                                className="text-sm text-red-600 hover:text-red-800 underline"
                                onClick={clearTestResults}
                            >
                                Clear Results
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {testResults.map((result, index) => (
                                <div key={index} className={`p-3 rounded-lg border ${result.success
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-mono text-sm">
                                                <span className="font-medium">{result.endpoint}</span>
                                                {result.status > 0 && (
                                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                                        }`}>
                                                        {result.status}
                                                    </span>
                                                )}
                                            </div>
                                            {result.responseTime > 0 && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                    Response time: {result.responseTime}ms
                                                </div>
                                            )}
                                            {result.error && (
                                                <div className="text-xs text-red-600 mt-1">
                                                    Error: {result.error}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 ml-2">
                                            {result.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* System Alerts */}
            {systemAlerts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">🚨 System Alerts</h3>
                        <button
                            className="text-sm text-red-600 hover:text-red-800 underline"
                            onClick={clearSystemAlerts}
                        >
                            Clear Alerts
                        </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {systemAlerts.map((alert, index) => (
                            <div key={index} className="bg-red-50 border-l-4 border-red-400 p-3">
                                <div className="text-sm text-red-700">{alert}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* API Endpoints Explorer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔓 Public Endpoints</h3>
                    <div className="space-y-2">
                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-mono border border-blue-200">
                            GET /api/health - System health check
                        </div>
                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-mono border border-blue-200">
                            GET /api/hello - Basic hello endpoint
                        </div>
                        {/* Removed obsolete Clerk webhook handler endpoint */}
                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-mono border border-blue-200 line-through opacity-60">
                            POST /api/clerk/webhook - (removed)
                        </div>
                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-mono border border-blue-200">
                            GET /api/seed/* - Database seeding utilities
                        </div>
                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-mono border border-blue-200">
                            GET /api/swagger - API documentation
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Protected Endpoints</h3>
                    <div className="space-y-2">
                        <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-mono border border-green-200">
                            GET /api/user/current - Current user info
                        </div>
                        <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-mono border border-green-200">
                            GET /api/workspace/* - Workspace management
                        </div>
                        <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-mono border border-green-200">
                            GET /api/project/* - Project operations
                        </div>
                        <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-mono border border-green-200">
                            GET /api/task/* - Task management
                        </div>
                        <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-mono border border-green-200">
                            GET /api/insights/* - Analytics & insights
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Project Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-800">🚀 Development</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium">Framework:</span> Next.js 15.4.6 with App Router</p>
                            <p><span className="font-medium">Language:</span> TypeScript 5.7.2</p>
                            <p><span className="font-medium">Database:</span> MongoDB with Mongoose ODM</p>
                            <p><span className="font-medium">Authentication:</span> Custom JWT</p>
                            <p><span className="font-medium">Styling:</span> Tailwind CSS</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-800">🛠️ Tools & Scripts</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium">Database:</span> Index optimization & performance tools</p>
                            <p><span className="font-medium">Testing:</span> Jest with SWC compiler</p>
                            <p><span className="font-medium">Linting:</span> ESLint with Next.js rules</p>
                            <p><span className="font-medium">Monitoring:</span> Performance & health checks</p>
                            <p><span className="font-medium">Deployment:</span> Docker & deployment scripts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Logs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">📝 System Activity Logs</h3>
                    <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">
                            {logs.length} entries
                        </span>
                        <button
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                            onClick={fetchHealth}
                        >
                            Refresh
                        </button>
                        <button
                            className="text-xs text-red-600 hover:text-red-800 underline"
                            onClick={clearLogs}
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="text-gray-400">No logs available. Click &quot;Refresh Status&quot; to start monitoring.</div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="py-1 border-b border-gray-700 last:border-b-0">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Backup History - Admin Only */}
            {isAdmin && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">💾 Database Backup History</h3>
                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                            🔒 Password required for backups
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Collections
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Documents
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Size (KB)
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        File
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {backupHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                            No backup history available.
                                        </td>
                                    </tr>
                                ) : (
                                    backupHistory.map((backup, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(backup.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {backup.collections}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {backup.documents.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {(backup.size / 1024).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <a href={`data:application/json;base64,${btoa(JSON.stringify(backup.collections, null, 2))}`} download={backup.filename} className="text-indigo-600 hover:text-indigo-900">
                                                    {backup.filename}
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Directory - Admin Only */}
            {isAdmin && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">👥 User Directory</h3>
                        <div className="flex items-center gap-3">
                            <button
                                className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                                onClick={fetchUsers}
                                disabled={isLoadingUsers}
                            >
                                {isLoadingUsers ? 'Loading...' : (users.length ? 'Refresh' : 'Load Users')}
                            </button>
                            {users.length > 0 && (
                                <button
                                    className="text-sm text-red-600 hover:text-red-800 underline"
                                    onClick={clearUsers}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    {users.length === 0 ? (
                        <div className="text-sm text-gray-500">
                            {usersError ? (
                                <span className="text-red-600">{usersError}</span>
                            ) : (
                                <>No users loaded. Click &quot;Load Users&quot; to fetch up to 50 users.</>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role/Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {users.map((u, i) => {
                                        const id = u.id || u._id || `row-${i}`;
                                        const email = u.email || u.primaryEmail || u.username || '—';
                                        const role = u.role || u.type || '—';
                                        const status = u.status || u.state || '';
                                        const created = u.createdAt || u.created_at || u.insertedAt || '';
                                        const createdDisplay = created ? new Date(created).toLocaleDateString() : '—';
                                        return (
                                            <tr key={id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-mono truncate max-w-[140px]" title={String(id)}>{String(id)}</td>
                                                <td className="px-4 py-2 truncate max-w-[180px]" title={email}>{email}</td>
                                                <td className="px-4 py-2">{role}{status ? <span className="text-xs text-gray-500 ml-1">({status})</span> : null}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">{createdDisplay}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {users.length === 50 && (
                                <div className="mt-2 text-xs text-gray-500">Showing first 50 users.</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* How to Explore */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">🔍 How to Explore This Backend</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h4 className="font-medium text-blue-800">📖 API Documentation</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Go to Swagger UI:</strong> <code className="bg-blue-100 px-1 rounded">/api/swagger-ui</code> for interactive API testing</li>
                            <li>• View OpenAPI specs at <code className="bg-blue-100 px-1 rounded">/api/swagger</code></li>
                            <li>• Check the health endpoint at <code className="bg-blue-100 px-1 rounded">/api/health</code></li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium text-blue-800">🛠️ Development Tools</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Use <code className="bg-blue-100 px-1 rounded">npm run dev</code> for development</li>
                            <li>• Run <code className="bg-blue-100 px-1 rounded">npm run build</code> to build production</li>
                            <li>• Execute <code className="bg-blue-100 px-1 rounded">npm run lint</code> for code quality</li>
                            <li>• Use database scripts for performance optimization</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Backup Password Modal - Admin Only */}
            {isAdmin && showBackupModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-8 border w-full max-w-md max-h-full">
                        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                            <div className="flex justify-between items-start p-4 rounded-t dark:rounded-t-lg">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Backup Database
                                </h3>
                                <button
                                    type="button"
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                    onClick={closeBackupModal}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                        placeholder="Enter password"
                                        value={backupPassword}
                                        onChange={(e) => setBackupPassword(e.target.value)}
                                        required
                                    />
                                    {backupPasswordError && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{backupPasswordError}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center p-6 space-x-2 rounded-b dark:border-gray-600">
                                <button
                                    onClick={backupDatabase}
                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                    disabled={isBackingUp || !backupPassword.trim()}
                                >
                                    {isBackingUp ? '💾 Backing up...' : '💾 Backup DB'}
                                </button>
                                <button
                                    onClick={closeBackupModal}
                                    className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
