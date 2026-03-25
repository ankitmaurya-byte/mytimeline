'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Lazy load ReactQueryDevtools only in development
const ReactQueryDevtools =
    process.env.NODE_ENV === 'development'
        ? dynamic(() => import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })), {
            ssr: false,
            loading: () => null, // No loading state needed for devtools
        })
        : () => null; // Render nothing in production

interface LazyQueryDevtoolsProps {
    children: ReactNode;
}

export function LazyQueryDevtools({ children }: LazyQueryDevtoolsProps) {
    return (
        <>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </>
    );
}
