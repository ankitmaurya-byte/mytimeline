'use client';

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy load heavy components
const HeroScrollDemo = dynamic(() => import("@/components/landing/HeroScroll").then(mod => ({ default: mod.HeroScrollDemo })), {
    ssr: false,
    loading: () => <div className="h-96 bg-gradient-to-b from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-lg animate-pulse" />
});

const Features = dynamic(() => import("@/components/landing/Features").then(mod => ({ default: mod.Features })), {
    ssr: false,
    loading: () => <div className="h-96 bg-gradient-to-b from-pink-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-lg animate-pulse" />
});

const AppleCardsCarouselDemo = dynamic(() => import("@/components/landing/CardsCarousel").then(mod => ({ default: mod.AppleCardsCarouselDemo })), {
    ssr: false,
    loading: () => <div className="h-96 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 rounded-lg animate-pulse" />
});

const Footer = dynamic(() => import("@/components/landing/Footer").then(mod => ({ default: mod.Footer })), {
    ssr: false,
    loading: () => <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse" />
});

export function LazyLandingComponents() {
    return (
        <>
            <Suspense fallback={<div className="h-96 bg-gradient-to-b from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-lg animate-pulse" />}>
                <div className="relative">
                    <HeroScrollDemo />
                </div>
            </Suspense>
            <Suspense fallback={<div className="h-96 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 rounded-lg animate-pulse" />}>
                <div className="relative">
                    <AppleCardsCarouselDemo />
                </div>
            </Suspense>
            <Suspense fallback={<div className="h-96 bg-gradient-to-b from-pink-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-lg animate-pulse" />}>
                <div className="relative">
                    <Features />
                </div>
            </Suspense>
            <Suspense fallback={<div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse" />}>
                <Footer />
            </Suspense>
        </>
    );
}



























