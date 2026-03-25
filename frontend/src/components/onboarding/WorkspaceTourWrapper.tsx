"use client";

import React, { useEffect } from "react";
import EnhancedOnboardingTour from "./EnhancedOnboardingTour";
import TourErrorBoundary from "./TourErrorBoundary";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAuthContext } from "@/context/useAuthContext";
import { useSearchParams } from "next/navigation";

export const WorkspaceTourWrapper: React.FC = () => {
    const { shouldShowOnboarding, hideOnboarding, showOnboarding } = useOnboarding();
    const { user } = useAuthContext();
    const searchParams = useSearchParams();

    // Check for tour query parameter and trigger tour
    useEffect(() => {
        const tourParam = searchParams?.get('tour');
        if (tourParam === '1') {
            // Remove the query parameter from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('tour');
            window.history.replaceState({}, '', url.toString());

            // Trigger the tour
            showOnboarding();
        }
    }, [searchParams, showOnboarding]);

    const handleOnboardingClose = () => {
        hideOnboarding();
    };

    return (
        <TourErrorBoundary>
            <EnhancedOnboardingTour
                key="workspace-tour" // Stable key to prevent remounting
                isOpen={shouldShowOnboarding}
                onClose={handleOnboardingClose}
                userName={user?.name?.split(' ')[0] || undefined}
            />
        </TourErrorBoundary>
    );
};

export default WorkspaceTourWrapper;
