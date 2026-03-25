"use client";
import React, { useState, useEffect } from "react";
import { DialogContent } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { SpotlightHighlight } from "./SpotlightHighlight";
import { useRouter } from "next/navigation";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useOnboarding } from "@/hooks/use-onboarding";
import { cn } from "@/lib/utils";
import { TourHeader } from "./TourHeader";
import { TourStepContent } from "./TourStepContent";
import { TourFooter } from "./TourFooter";
import { createTourSteps, createTourStepsSync, TourStep } from "./TourStepsData";
import { useIsMobile } from "@/hooks/use-mobile";

const CustomDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; isHighlightingSidebar: boolean; }> = ({ open, onOpenChange, children, isHighlightingSidebar }) => (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 overflow-y-auto max-h-screen grid place-items-center data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] transition-all duration-700 ease-in-out", isHighlightingSidebar ? "!backdrop-blur-none !filter-none !bg-transparent" : "backdrop-blur-sm bg-black/30")} style={isHighlightingSidebar ? { backdropFilter: 'none', filter: 'none', backgroundColor: 'transparent' } : {}} />
            {children}
        </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
);

const EnhancedOnboardingTour: React.FC<{ isOpen: boolean; onClose: () => void; userName?: string; }> = ({ isOpen, onClose, userName = "there" }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [showSpotlightArrow, setShowSpotlightArrow] = useState(false);
    const [isHighlightingSidebar, setIsHighlightingSidebar] = useState(false);
    const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
    const [isReappearing, setIsReappearing] = useState(false);
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const { markOnboardingComplete, markWorkspaceOnboardingSkipped } = useOnboarding();
    const isMobile = useIsMobile();

    const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load tour steps asynchronously
    useEffect(() => {
        const loadTourSteps = async () => {
            try {
                const steps = await createTourSteps(userName, workspaceId);
                setTourSteps(steps);
            } catch (error) {
                console.error('Failed to load tour steps:', error);
                // Fallback to sync version
                const fallbackSteps = createTourStepsSync(userName, workspaceId);
                setTourSteps(fallbackSteps);
            } finally {
                setIsLoading(false);
            }
        };

        loadTourSteps();
    }, [userName, workspaceId]);

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setIsAnimating(false);
            setIsTemporarilyHidden(false);
            setIsReappearing(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setProgress((currentStep / (tourSteps.length - 1)) * 100);

            const currentTourStep = tourSteps[currentStep];
            if (currentTourStep.spotlightSelector && !isAnimating) {
                if (currentTourStep.spotlightSelector.includes('nav-')) {
                    setIsHighlightingSidebar(true);
                    document.body.classList.add('sidebar-highlighting-active');
                    setTimeout(() => {
                        setIsHighlightingSidebar(false);
                        document.body.classList.remove('sidebar-highlighting-active');
                    }, 3000);
                } else {
                    setIsHighlightingSidebar(false);
                    document.body.classList.remove('sidebar-highlighting-active');
                }
                if (!isTemporarilyHidden) setShowSpotlight(true);
                setShowSpotlightArrow(true);
            } else {
                setShowSpotlight(false);
                setShowSpotlightArrow(false);
                document.body.classList.remove('sidebar-highlighting-active');
            }
        } else {
            setShowSpotlight(false);
            setShowSpotlightArrow(false);
            document.body.classList.remove('sidebar-highlighting-active');
        }
    }, [currentStep, isOpen, tourSteps.length, isAnimating]);

    useEffect(() => {
        // Only add interactive event listeners on desktop
        if (isMobile) return;

        const handleDialogHide = () => { setIsTemporarilyHidden(true); setShowSpotlight(false); };
        const handleDialogShow = () => {
            setIsReappearing(true);
            setTimeout(() => {
                setIsTemporarilyHidden(false);
                setShowSpotlight(true);
                setTimeout(() => setIsReappearing(false), 700);
            }, 100);
        };
        window.addEventListener('timeline:dialog-hide', handleDialogHide);
        window.addEventListener('timeline:dialog-show', handleDialogShow);
        return () => {
            window.removeEventListener('timeline:dialog-hide', handleDialogHide);
            window.removeEventListener('timeline:dialog-show', handleDialogShow);
        };
    }, [isMobile]);

    const navigateToStep = (stepIndex: number, nextTourStep?: TourStep) => {
        setIsAnimating(true);
        setShowSpotlight(false);

        // Disable interactive features on mobile
        if (!isMobile && nextTourStep?.spotlightSelector) {
            setIsTemporarilyHidden(true);
        }

        setTimeout(() => {
            setCurrentStep(stepIndex);
            setIsAnimating(false);

            // Only enable spotlight and interactive features on desktop
            if (!isMobile && nextTourStep?.spotlightSelector) {
                setTimeout(() => {
                    setIsReappearing(true);
                    setTimeout(() => {
                        setIsTemporarilyHidden(false);
                        setShowSpotlight(true);
                        setTimeout(() => setIsReappearing(false), 700);
                    }, 100);
                }, 7000);
            }
        }, 500);
    };

    const nextStep = () => currentStep < tourSteps.length - 1 && navigateToStep(currentStep + 1, tourSteps[currentStep + 1]);
    const prevStep = () => currentStep > 0 && navigateToStep(currentStep - 1, tourSteps[currentStep - 1]);

    const handleDialogClose = () => {
        if (!isMobile) {
            markWorkspaceOnboardingSkipped();
        }
        onClose();
    };
    const skipTour = () => {
        if (!isMobile) {
            markWorkspaceOnboardingSkipped();
        }
        onClose();
    };
    const finishTour = () => {
        if (!isMobile) {
            markOnboardingComplete();
        }
        onClose();
    };
    const handleActionClick = () => {
        const currentTourStep = tourSteps[currentStep];

        // Disable route navigation on mobile for better UX
        if (!isMobile && currentTourStep.action?.route && workspaceId) {
            onClose();
            router.push(currentTourStep.action.route);
        }
    };

    const currentTourStep = tourSteps[currentStep];

    if (!isOpen || isLoading || tourSteps.length === 0) return null;

    return (
        <>
            {!isMobile && (
                <SpotlightHighlight
                    isActive={showSpotlightArrow && currentTourStep.spotlightSelector !== undefined}
                    targetSelector={currentTourStep.spotlightSelector}
                    highlightColor="rgba(59, 130, 246, 0.8)"
                    onComplete={() => setShowSpotlightArrow(false)}
                />
            )}

            <CustomDialog
                open={isOpen && (!isTemporarilyHidden || isMobile) && (showSpotlight || !currentTourStep.spotlightSelector || isMobile)}
                onOpenChange={(open) => {
                    if (!open && isOpen) handleDialogClose();
                }}
                isHighlightingSidebar={isHighlightingSidebar}
            >
                <DialogContent className={`max-w-2xl w-[95vw] p-0 gap-0 max-h-[90vh] flex flex-col transform transition-all duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-105 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-bottom-[48%] ${isReappearing ? 'animate-fade-in-scale' : ''}`}>
                    <TourHeader
                        currentTourStep={currentTourStep}
                        currentStep={currentStep}
                        tourStepsLength={tourSteps.length}
                        progress={progress}
                        isAnimating={isAnimating}
                        isMobile={isMobile}
                    />

                    <TourStepContent
                        currentTourStep={currentTourStep}
                        isAnimating={isAnimating}
                        handleActionClick={handleActionClick}
                        isMobile={isMobile}
                    />

                    <TourFooter
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                        currentTourStep={currentTourStep}
                        navigateToStep={navigateToStep}
                        skipTour={skipTour}
                        finishTour={finishTour}
                        isMobile={isMobile}
                    />
                </DialogContent>
            </CustomDialog>

            <style jsx global>{`
                .sidebar-highlighting-active .fixed.inset-0.z-50, .sidebar-highlighting-active [data-radix-dialog-overlay] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; -moz-backdrop-filter: none !important; background-color: transparent !important; background: transparent !important; }
                @keyframes fade-in-scale { 0% { opacity: 0; transform: scale(0.95) translateY(-10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fade-in-scale { animation: fade-in-scale 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            `}</style>
        </>
    );
};

export default EnhancedOnboardingTour;
