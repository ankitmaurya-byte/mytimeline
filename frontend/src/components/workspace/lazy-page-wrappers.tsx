'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { PageLoading } from '@/components/loading/LoadingComponents';

// Lazy load Tasks page
const TasksPage = dynamic(() => import("@/page/workspace/Tasks"), {
    ssr: false,
    loading: () => <PageLoading pageName="tasks" />
});

export const LazyTasksWrapper = () => (
    <Suspense fallback={<PageLoading pageName="tasks" />}>
        <TasksPage />
    </Suspense>
);

// Lazy load Project Details page (instead of non-existent Projects page)
const ProjectDetailsPage = dynamic(() => import("@/page/workspace/ProjectDetails"), {
    ssr: false,
    loading: () => <PageLoading pageName="project details" />
});

export const LazyProjectDetailsWrapper = () => (
    <Suspense fallback={<PageLoading pageName="project details" />}>
        <ProjectDetailsPage />
    </Suspense>
);

// Lazy load Members page
const MembersPage = dynamic(() => import("@/page/workspace/Members"), {
    ssr: false,
    loading: () => <PageLoading pageName="members" />
});

export const LazyMembersWrapper = () => (
    <Suspense fallback={<PageLoading pageName="members" />}>
        <MembersPage />
    </Suspense>
);

// Lazy load Analytics page
const AnalyticsPage = dynamic(() => import("@/page/workspace/Analytics"), {
    ssr: false,
    loading: () => <PageLoading pageName="analytics" />
});

export const LazyAnalyticsWrapper = () => (
    <Suspense fallback={<PageLoading pageName="analytics" />}>
        <AnalyticsPage />
    </Suspense>
);

// Lazy load Settings page
const SettingsPage = dynamic(() => import("@/page/workspace/Settings"), {
    ssr: false,
    loading: () => <PageLoading pageName="settings" />
});

export const LazySettingsWrapper = () => (
    <Suspense fallback={<PageLoading pageName="settings" />}>
        <SettingsPage />
    </Suspense>
);

// Lazy load Profile page
const ProfilePage = dynamic(() => import("@/page/workspace/Profile"), {
    ssr: false,
    loading: () => <PageLoading pageName="profile" />
});

export const LazyProfileWrapper = () => (
    <Suspense fallback={<PageLoading pageName="profile" />}>
        <ProfilePage />
    </Suspense>
);
