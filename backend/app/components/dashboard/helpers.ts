import { TestResult } from './types';

export const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
};

export const statusColor = (status?: string) => ({
  healthy: 'bg-green-100 text-green-800',
  degraded: 'bg-yellow-100 text-yellow-800',
  unhealthy: 'bg-red-100 text-red-800'
} as Record<string, string>)[status || ''] || 'bg-gray-100 text-gray-800';

export const statusIcon = (status?: string) => ({
  healthy: '🟢',
  degraded: '🟡',
  unhealthy: '🔴'
} as Record<string, string>)[status || ''] || '⚪';

export const buildLog = (message: string) => `[${new Date().toLocaleTimeString()}] ${message}`;
export const buildAlert = (message: string) => `[${new Date().toLocaleTimeString()}] ⚠️ ${message}`;

export const endpointList = ['\/api/health', '/api/hello', '/api/swagger', '/api/seed/roles'];

export async function timedFetch(url: string) {
  const start = Date.now();
  const res = await fetch(url);
  const ms = Date.now() - start;
  return { res, ms };
}

export function makeTestResult(endpoint: string, status: number, responseTime: number, success: boolean, data?: any, error?: string): TestResult {
  return { endpoint, status, responseTime, success, data, error, timestamp: new Date() };
}
