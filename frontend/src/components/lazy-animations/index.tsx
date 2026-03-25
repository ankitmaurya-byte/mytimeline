// Central lazy-loading utilities for heavier Framer Motion animations
import React, { lazy, Suspense } from 'react';

// Utility: DRY helper for dynamic import map with explicit casting
const pickDefault = <T, K extends keyof T, C extends React.ComponentType<any>>(promise: Promise<T>, key: K) =>
    promise.then(mod => ({ default: mod[key] as unknown as C }));

// Component dynamic imports (typed)
interface BackgroundBeamsWithCollisionProps {
    className?: string;
    children?: React.ReactNode;
    fullHeight?: boolean;
    density?: number;
    speedMultiplier?: number;
    colors?: string[];
    seed?: number;
}
interface TypewriterWord { text: string; className?: string }
interface TypewriterEffectProps { words: TypewriterWord[]; className?: string; cursorClassName?: string }
interface CarouselProps<T = unknown> { items: T[]; initialScroll?: number }

export const BackgroundBeamsLazy = lazy<React.ComponentType<BackgroundBeamsWithCollisionProps>>(() =>
    pickDefault(import('../ui/animations/background-beams-with-collision'), 'BackgroundBeamsWithCollision')
);

export const TypewriterEffectLazy = lazy<React.ComponentType<TypewriterEffectProps>>(() =>
    pickDefault(import('../ui/animations/typewriter-effect'), 'TypewriterEffect')
);

export const CarouselLazy = lazy<React.ComponentType<CarouselProps>>(() =>
    pickDefault(import('../ui/animations/apple-cards-carousel'), 'Carousel')
);

// Accessible loading fallback skeleton
export const AnimationFallback: React.FC<{ className?: string; label?: string; children?: React.ReactNode }> = ({ className = '', label = 'Loading animation', children }) => (
    <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={
            'relative overflow-hidden rounded-md bg-gradient-to-r from-gray-200 via-gray-200/60 to-gray-300 dark:from-slate-800 dark:via-slate-700/60 dark:to-slate-600 ' +
            'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] before:bg-[length:200%_100%] ' +
            className
        }
    >
        <span className="sr-only">{label}</span>
        {children}
    </div>
);

// Shared shimmer keyframes (scoped once)
const ShimmerStyle = () => (
    <style jsx>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
    `}</style>
);

// Wrapper with fallback override support
export const LazyBackgroundBeams: React.FC<BackgroundBeamsWithCollisionProps & { fallbackClassName?: string; fullHeight?: boolean }> = ({
    children,
    className,
    fallbackClassName,
    fullHeight,
    ...props
}) => (
    <Suspense fallback={<><AnimationFallback className={fallbackClassName || className || 'h-40 w-full'} /><ShimmerStyle /></>}>
        <BackgroundBeamsLazy className={className} fullHeight={fullHeight} {...props}>{children}</BackgroundBeamsLazy>
        <ShimmerStyle />
    </Suspense>
);

export const LazyTypewriter: React.FC<TypewriterEffectProps> = ({
    words,
    className,
    cursorClassName,
}) => (
    <Suspense fallback={<><AnimationFallback className="inline-block h-12 w-48" label="Loading typewriter" /><ShimmerStyle /></>}>
        <TypewriterEffectLazy words={words} className={className} cursorClassName={cursorClassName} />
        <ShimmerStyle />
    </Suspense>
);

export const LazyCarousel = <T,>({ items, initialScroll }: CarouselProps<T>) => (
    <Suspense fallback={<><AnimationFallback className="w-full h-96" label="Loading carousel" /><ShimmerStyle /></>}>
        <CarouselLazy items={items} initialScroll={initialScroll} />
        <ShimmerStyle />
    </Suspense>
);
