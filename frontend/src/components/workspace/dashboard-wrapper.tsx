'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { PageLoading } from '@/components/loading/LoadingComponents';

// Lazy load the entire dashboard to reduce initial bundle size
const WorkspaceDashboard = dynamic(() => import("@/page/workspace/Dashboard"), {
    ssr: false,
    loading: () => <PageLoading pageName="dashboard" />
});

export function DashboardWrapper() {
    return (
        <Suspense fallback={<PageLoading pageName="dashboard" />}>
            <WorkspaceDashboard />
        </Suspense>
    );
}
