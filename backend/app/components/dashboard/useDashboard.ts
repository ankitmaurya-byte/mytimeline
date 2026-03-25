"use client";
import { useState, useEffect, useCallback } from 'react';
import { SystemHealth, ProjectStats, DatabaseStats, UserStats, TestResult, UserLite } from './types';
import { buildLog, buildAlert, timedFetch, makeTestResult, endpointList } from './helpers';

interface UseDashboardOptions { autoIntervalMs?: number }

export function useDashboard({ autoIntervalMs = 30000 }: UseDashboardOptions = {}) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [aiStatus, setAIStatus] = useState<any | null>(null);
  const [aiStatusError, setAIStatusError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordError, setBackupPasswordError] = useState('');
  const [users, setUsers] = useState<UserLite[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const addLog = useCallback((m: string) => {
    setLogs(p => [buildLog(m), ...p.slice(0, 49)]);
  }, []);
  const addAlert = useCallback((m: string) => {
    setAlerts(p => [buildAlert(m), ...p.slice(0, 9)]);
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data); setLastUpdate(new Date()); addLog(`Health: ${data.status}`);
      if (data.checks?.database?.status !== 'healthy') addAlert(`Database ${data.checks?.database?.status}`);
      if (data.responseTime && data.responseTime > 1000) addAlert(`High API latency ${data.responseTime}ms`);
    } catch {
      addLog('Health check failed'); addAlert('Health check failed'); setHealth(null);
    }
  }, [addLog, addAlert]);

  // Generic endpoint fetch helper (loosely typed)
  // Using underscore to indicate the incoming value variable not directly referenced here.
  // Generic endpoint fetch helper (loosely typed). We always call the setter with the JSON (or fallback)
  const fetchEndpoint = useCallback(async (url: string, setterFn: any, fallback?: any) => {
    try {
      const r = await fetch(url);
      if (r.ok) { const json = await r.json(); setterFn(json); addLog(`Loaded ${url}`); }
      else { setterFn(fallback ?? null); addLog(`Failed ${url} ${r.status}`); }
    } catch {
      setterFn(fallback ?? null); addLog(`Error ${url}`);
    }
  }, [addLog]);

  const fetchDatabaseStats = useCallback(() => fetchEndpoint('/api/database/stats', setDatabaseStats, { collections: 0, documents: 0, indexes: 0, size: 'N/A' }), [fetchEndpoint]);
  const fetchUserStats = useCallback(() => fetchEndpoint('/api/users/stats', setUserStats, { totalUsers: 0, activeUsers: 0, newUsersToday: 0, premiumUsers: 0 }), [fetchEndpoint]);
  const fetchProjectStats = useCallback(() => fetchEndpoint('/api/project/stats', setProjectStats, { totalRoutes: 0, apiEndpoints: 0, middleware: 0, databaseModels: 0, services: 0, utilities: 0 }), [fetchEndpoint]);
  const fetchAIStatus = useCallback(async () => { try { const r = await fetch('/api/ai/status'); if (r.ok) { setAIStatus(await r.json()); setAIStatusError(null); } else { setAIStatus(null); setAIStatusError('unavailable'); } } catch { setAIStatus(null); setAIStatusError('not configured'); } }, []);

  const fetchUsers = useCallback(async () => { setUsersLoading(true); setUsersError(null); try { const r = await fetch('/api/users?limit=100'); if (!r.ok) throw new Error(String(r.status)); const d = await r.json(); setUsers(d.users || []); addLog(`Users: ${d.users?.length || 0}`); } catch (e: any) { setUsersError(e.message); addLog('Users fetch failed'); } finally { setUsersLoading(false); } }, [addLog]);

  const testEndpoint = useCallback(async (endpoint: string) => { try { const { res, ms } = await timedFetch(endpoint); const data = await res.json(); const tr = makeTestResult(endpoint, res.status, ms, res.ok, data); setTestResults(p => [tr, ...p.slice(0, 9)]); addLog(`${endpoint} ${res.status} ${ms}ms`); } catch (e: any) { const tr = makeTestResult(endpoint, 0, 0, false, undefined, e.message); setTestResults(p => [tr, ...p.slice(0, 9)]); addLog(`${endpoint} error`); } }, [addLog]);

  const runDiagnostics = useCallback(async () => { setIsRunningTests(true); addLog('Diagnostics start'); for (const ep of endpointList) { await testEndpoint(ep); await new Promise(r => setTimeout(r, 300)); } addLog('Diagnostics done'); setIsRunningTests(false); }, [testEndpoint, addLog]);

  const benchmark = useCallback(async () => { addLog('Benchmark start'); const times: number[] = []; for (let i = 0; i < 5; i++) { const { ms } = await timedFetch('/api/health'); times.push(ms); await new Promise(r => setTimeout(r, 80)); } const avg = times.reduce((a, b) => a + b, 0) / times.length; addLog(`Benchmark avg ${avg.toFixed(1)}ms range ${Math.min(...times)}-${Math.max(...times)}`); }, [addLog]);

  const exportReport = useCallback(() => { setIsExporting(true); try { const report = { timestamp: new Date().toISOString(), health, projectStats, databaseStats, userStats, aiStatus, logs: logs.slice(0, 20), testResults: testResults.slice(0, 10) }; const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'timeline-report.json'; a.click(); URL.revokeObjectURL(url); addLog('Report exported'); } finally { setIsExporting(false); } }, [health, projectStats, databaseStats, userStats, aiStatus, logs, testResults, addLog]);

  const openBackup = () => { setShowBackupModal(true); setBackupPassword(''); setBackupPasswordError(''); };
  const closeBackup = () => { setShowBackupModal(false); };
  const loadBackupHistory = () => { try { setBackupHistory(JSON.parse(localStorage.getItem('backupHistory') || '[]')); } catch {/**/ } };
  const backup = useCallback(async () => {
    if (!backupPassword.trim()) { setBackupPasswordError('Password required'); return; }
    setIsBackingUp(true); setBackupPasswordError('');
    try {
      const r = await fetch('/api/database/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: backupPassword }) });
      if (!r.ok) { if (r.status === 401) { setBackupPasswordError('Invalid password'); return; } throw new Error('Backup failed'); }
      const data = await r.json(); const b = data.backup; addLog(`Backup ok docs:${b.metadata.totalDocuments}`); addAlert('Backup completed');
      const filename = `timeline-db-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      const entry = { timestamp: new Date().toISOString(), collections: b.metadata.totalCollections, documents: b.metadata.totalDocuments, size: b.metadata.backupSize, filename };
      const hist = [entry, ...backupHistory.slice(0, 9)]; setBackupHistory(hist); localStorage.setItem('backupHistory', JSON.stringify(hist)); setShowBackupModal(false);
    } catch {
      addLog('Backup failed'); addAlert('Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  }, [backupPassword, backupHistory, addAlert, addLog]);

  const refreshAll = useCallback(() => Promise.all([fetchHealth(), fetchDatabaseStats(), fetchUserStats(), fetchProjectStats(), fetchAIStatus()]).then(() => addLog('Data refreshed')), [fetchHealth, fetchDatabaseStats, fetchUserStats, fetchProjectStats, fetchAIStatus, addLog]);

  useEffect(() => { (async () => { await refreshAll(); loadBackupHistory(); })(); const id = setInterval(fetchHealth, autoIntervalMs); return () => clearInterval(id); }, [refreshAll, fetchHealth, autoIntervalMs]);

  return { health, projectStats, databaseStats, userStats, aiStatus, aiStatusError, logs, alerts, testResults, lastUpdate, isRunningTests, isExporting, isBackingUp, backupHistory, showBackupModal, backupPassword, backupPasswordError, users, usersLoading, usersError, setBackupPassword, openBackup, closeBackup, backup, runDiagnostics, testEndpoint, benchmark, exportReport, refreshAll, fetchUsers, fetchAIStatus, setUsers, addLog, addAlert, setUsersError, setTestResults };
}
