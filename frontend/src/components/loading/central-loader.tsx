'use client';

import { useAuthContext } from "@/context/useAuthContext";
import { createContext, useContext, useEffect, useState } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";

const LoadingContext = createContext<{
    isStrategicLoading: boolean;
}>({
    isStrategicLoading: false
});

export const useLoadingContext = () => useContext(LoadingContext);

interface CentralLoaderProps {
    children: React.ReactNode;
    route?: string;
}

export function CentralLoader({ children, route }: CentralLoaderProps) {
    const { loading, isSignedIn } = useAuthContext();
    const { shouldShowOnboarding } = useOnboarding();
    const [showLoader, setShowLoader] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const isWorkspaceRoute = route?.startsWith('/workspace') || false;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isWorkspaceRoute) {
            setShowLoader(false);
            return;
        }

        // Don't show loader if onboarding tour is active
        if (shouldShowOnboarding) {
            setShowLoader(false);
            return;
        }

        // No automatic timer - let the progress bar complete naturally
        // The loader will be hidden when progress reaches 100%
    }, [isWorkspaceRoute, shouldShowOnboarding]);

    const handleLoadingComplete = () => {
        setShowLoader(false);
    };

    // Don't render anything until mounted to prevent hydration mismatch
    if (!isMounted || !route) {
        return <>{children}</>;
    }

    if (!isWorkspaceRoute || shouldShowOnboarding) {
        return (
            <LoadingContext.Provider value={{ isStrategicLoading: false }}>
                {children}
            </LoadingContext.Provider>
        );
    }

    if (!showLoader) {
        return (
            <LoadingContext.Provider value={{ isStrategicLoading: false }}>
                {children}
            </LoadingContext.Provider>
        );
    }

    // Only render loader when all conditions are met
    if (!route || !isMounted || loading === undefined) {
        return <>{children}</>;
    }

    return (
        <div key={`loader-${route}`} className="w-full h-screen min-h-screen overflow-hidden">
            {!loading && isSignedIn === false ? (
                <SimpleLoader onComplete={handleLoadingComplete} />
            ) : (
                <PageLoader message="Preparing your workspace..." onComplete={handleLoadingComplete} />
            )}
        </div>
    );
}

function SimpleLoader({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    // Call completion handler after a brief delay
                    setTimeout(() => onComplete(), 500);
                    return 100;
                }
                return Math.min(prev + 2, 100);
            });
        }, 70);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden p-2 sm:p-4">

            {/* Cyber grid background */}
            <div className="absolute inset-0">
                <div className="w-full h-full" style={{
                    backgroundImage: `
                        linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            {/* Main content - balanced sizing for all devices */}
            <div className="text-center space-y-6 sm:space-y-8 relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto px-6 sm:px-8">
                {/* Futuristic logo */}
                <div className="relative">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 mx-auto relative">
                        <div className="absolute inset-0 w-full h-full border-2 border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                        <div className="absolute inset-2 w-full h-full border-2 border-blue-400 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                        <div className="absolute inset-4 w-full h-full border-2 border-purple-400 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>

                        {/* Center hexagon logo */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div
                                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-cyan-400 to-blue-500 animate-pulse"
                                style={{
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                }}
                            ></div>
                        </div>
                    </div>

                </div>

                {/* App title with neon effect */}
                <div className="space-y-3">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-pulse">
                        TIMELINE
                    </h1>
                    <div className="text-cyan-300 text-base sm:text-lg md:text-xl font-mono tracking-widest animate-pulse">
                        SYSTEM_INITIALIZING...
                    </div>
                </div>

                {/* Futuristic progress bar */}
                <div className="space-y-4">
                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-3 sm:h-4 bg-black border-2 border-cyan-400 rounded-full mx-auto overflow-hidden relative">
                        {/* Progress fill */}
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 transition-all duration-100 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Scanning line effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>

                        {/* Glitch effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    </div>

                    {/* Progress info */}
                    <div className="flex justify-between items-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto text-cyan-300 font-mono text-sm sm:text-base">
                        <span>PROGRESS</span>
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold">{progress}%</span>
                        <span>COMPLETE</span>
                    </div>
                </div>

                {/* Status indicators */}
                <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                    <div className="text-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full mx-auto mb-2 animate-pulse"></div>
                        <div className="text-green-400 text-xs sm:text-sm font-mono">AUTH_READY</div>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full mx-auto mb-2 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                        <div className="text-yellow-400 text-xs sm:text-sm font-mono">DATA_LOADING</div>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full mx-auto mb-2 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="text-red-400 text-xs sm:text-sm font-mono">SYSTEM_OK</div>
                    </div>
                </div>

            </div>

        </div>
    );
}

function PageLoader({ message, onComplete }: { message: string; onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    // Call completion handler after a brief delay to show 100%
                    setTimeout(() => onComplete(), 500);
                    return 100;
                }
                return Math.min(prev + 2, 100);
            });
        }, 70);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden p-2 sm:p-4">
            {/* Cyber grid background */}
            <div className="absolute inset-0">
                <div className="w-full h-full" style={{
                    backgroundImage: `
                        linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            {/* Main content - balanced sizing for all devices */}
            <div className="text-center space-y-6 sm:space-y-8 relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto px-6 sm:px-8">
                {/* Futuristic logo */}
                <div className="relative">
                    {/* Outer ring */}
                    <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 mx-auto relative">
                        <div className="absolute inset-0 w-full h-full border-2 border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                        <div className="absolute inset-2 w-full h-full border-2 border-blue-400 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                        <div className="absolute inset-4 w-full h-full border-2 border-purple-400 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>

                        {/* Center hexagon */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div
                                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 bg-gradient-to-br from-cyan-400 to-blue-500 animate-pulse"
                                style={{
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* App title with neon effect */}
                <div className="space-y-3">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                        TIMELINE
                    </h1>
                    <div className="text-cyan-300 text-base sm:text-lg md:text-xl font-mono tracking-widest">
                        {message}
                    </div>
                </div>

                {/* Futuristic progress bar */}
                <div className="space-y-4">
                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-3 sm:h-4 bg-black border-2 border-cyan-400 rounded-full mx-auto overflow-hidden relative">
                        {/* Progress fill */}
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 transition-all duration-100 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Scanning line effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>

                        {/* Glitch effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    </div>

                    {/* Progress info */}
                    <div className="flex justify-between items-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto text-cyan-300 font-mono text-sm sm:text-base">
                        <span>PROGRESS</span>
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold">{progress}%</span>
                        <span>COMPLETE</span>
                    </div>
                </div>

                {/* Status indicators */}
                <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                    <div className="text-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full mx-auto mb-2 animate-pulse"></div>
                        <div className="text-green-400 text-xs sm:text-sm font-mono">AUTH_READY</div>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full mx-auto mb-2 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                        <div className="text-yellow-400 text-xs sm:text-sm font-mono">DATA_LOADING</div>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full mx-auto mb-2 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="text-red-400 text-xs sm:text-sm font-mono">SYSTEM_OK</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
