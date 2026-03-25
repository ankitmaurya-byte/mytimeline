/**
 * Lazy-loaded components for better performance
 * These components are only loaded when needed, reducing initial bundle size
 */

import { lazy } from 'react';

// Only include components that actually exist in the codebase
// Heavy feature components - lazy load these
export const LazyAnalytics = lazy(() => import('@/page/workspace/Analytics'));
export const LazySettings = lazy(() => import('@/page/workspace/Settings'));
export const LazyProfile = lazy(() => import('@/page/workspace/Profile'));
export const LazyMembers = lazy(() => import('@/page/workspace/Members'));
export const LazyTasks = lazy(() => import('@/page/workspace/Tasks'));
export const LazyProjectDetails = lazy(() => import('@/page/workspace/ProjectDetails'));

// Chart components - lazy load these (removed recharts as it's not a React component)
