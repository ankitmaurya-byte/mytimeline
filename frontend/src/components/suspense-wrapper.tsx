'use client';

import { Suspense } from 'react';

export function SearchParamsSuspense({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="animate-pulse h-screen w-full bg-gray-100" />}>
            {children}
        </Suspense>
    );
}
