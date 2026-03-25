/**
 * Web Worker Hook for Analytics
 * Provides a clean interface to use analytics workers with React
 * Includes timeout handling, error recovery, and automatic cleanup
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface WorkerRequest {
  type: 'TEAM_ANALYTICS' | 'PRODUCTIVITY_ANALYTICS' | 'PROJECT_ANALYTICS';
  payload: any;
  id: string;
}

export interface WorkerResponse {
  type: 'SUCCESS' | 'ERROR';
  id: string;
  payload?: any;
  error?: string;
}

interface UseAnalyticsWorkerOptions {
  timeout?: number; // Timeout in ms (default: 5000)
  onError?: (error: Error) => void;
}

interface WorkerState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAnalyticsWorker<T = any>(options: UseAnalyticsWorkerOptions = {}) {
  const { timeout = 5000, onError } = options;
  
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (value: T) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }>>(new Map());

  const [state, setState] = useState<WorkerState<T>>({
    data: null,
    loading: false,
    error: null
  });

  // Initialize worker
  useEffect(() => {
    // Check if Worker is supported
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers are not supported in this environment');
      return;
    }

    try {
      // Create worker
      workerRef.current = new Worker(
        new URL('../workers/analytics.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, payload, error } = event.data;
        
        const request = pendingRequestsRef.current.get(id);
        if (!request) return;

        // Clear timeout
        clearTimeout(request.timeoutId);
        pendingRequestsRef.current.delete(id);

        if (type === 'SUCCESS') {
          request.resolve(payload);
          setState({ data: payload, loading: false, error: null });
        } else {
          const err = new Error(error || 'Worker computation failed');
          request.reject(err);
          setState({ data: null, loading: false, error: err });
          onError?.(err);
        }
      };

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        const err = new Error('Worker encountered an error');
        setState({ data: null, loading: false, error: err });
        onError?.(err);
        
        // Reject all pending requests
        pendingRequestsRef.current.forEach((request) => {
          clearTimeout(request.timeoutId);
          request.reject(err);
        });
        pendingRequestsRef.current.clear();
      };

    } catch (error) {
      console.error('Failed to initialize worker:', error);
      const err = error instanceof Error ? error : new Error('Worker initialization failed');
      setState({ data: null, loading: false, error: err });
      onError?.(err);
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      // Clear all pending timeouts
      pendingRequestsRef.current.forEach((request) => {
        clearTimeout(request.timeoutId);
      });
      pendingRequestsRef.current.clear();
    };
  }, [timeout, onError]);

  // Execute worker task
  const execute = useCallback(
    (type: WorkerRequest['type'], payload: any): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          const err = new Error('Worker not initialized');
          reject(err);
          setState({ data: null, loading: false, error: err });
          return;
        }

        const id = `${type}-${Date.now()}-${Math.random()}`;

        // Set loading state
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Setup timeout
        const timeoutId = setTimeout(() => {
          pendingRequestsRef.current.delete(id);
          const err = new Error(`Worker task timed out after ${timeout}ms`);
          reject(err);
          setState({ data: null, loading: false, error: err });
          onError?.(err);
        }, timeout);

        // Store request
        pendingRequestsRef.current.set(id, { resolve, reject, timeoutId });

        // Send message to worker
        const request: WorkerRequest = { type, payload, id };
        workerRef.current.postMessage(request);
      });
    },
    [timeout, onError]
  );

  // Specific execution methods
  const calculateTeamAnalytics = useCallback(
    (members: any[], tasks: any[]) => {
      return execute('TEAM_ANALYTICS', { members, tasks });
    },
    [execute]
  );

  const calculateProductivityAnalytics = useCallback(
    (tasks: any[]) => {
      return execute('PRODUCTIVITY_ANALYTICS', { tasks });
    },
    [execute]
  );

  const calculateProjectAnalytics = useCallback(
    (projects: any[], tasks: any[]) => {
      return execute('PROJECT_ANALYTICS', { projects, tasks });
    },
    [execute]
  );

  return {
    state,
    execute,
    calculateTeamAnalytics,
    calculateProductivityAnalytics,
    calculateProjectAnalytics,
    isSupported: typeof Worker !== 'undefined'
  };
}
