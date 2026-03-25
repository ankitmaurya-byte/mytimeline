"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/useAuthContext';

interface UseOnboardingReturn {
  shouldShowOnboarding: boolean;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  isOnboardingComplete: boolean;
  markOnboardingComplete: () => void;
  markWorkspaceOnboardingSkipped: () => void; // New function for workspace-specific skip
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [manuallyTriggered, setManuallyTriggered] = useState(false);
  const { user, isLoading } = useAuthContext();

  // Configuration: Set to false to disable automatic tour triggering
  const ENABLE_AUTOMATIC_TOURS = false;

  // Helper: dispatch a cross-app event so any mounted tour can react
  const dispatchOnboardingEvent = useCallback((action: 'show' | 'hide' | 'complete') => {
    if (typeof window === 'undefined') return;
    try {
      window.dispatchEvent(new CustomEvent('timeline:onboarding', { detail: { action } }));
    } catch { }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user has completed onboarding
      const hasCompletedTour = localStorage.getItem('timeline-tour-completed') === 'true';
      const userSpecificKey = `timeline-tour-completed-${user._id}`;
      const hasCompletedUserTour = localStorage.getItem(userSpecificKey) === 'true';

      setIsOnboardingComplete(hasCompletedTour || hasCompletedUserTour);

      // If manually triggered, always show the tour regardless of completion status
      if (manuallyTriggered) {
        setShouldShowOnboarding(true);
        return;
      }

      // Only auto-show onboarding for new users who haven't seen the tour
      if (ENABLE_AUTOMATIC_TOURS && !hasCompletedTour && !hasCompletedUserTour && !shouldShowOnboarding) {
        // Small delay to ensure the UI has loaded
        const timer = setTimeout(() => {
          setShouldShowOnboarding(true);
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading, manuallyTriggered]);

  // Listen for onboarding events across the app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ action?: 'show' | 'hide' | 'complete' }>;
      const action = ce.detail?.action;
      if (!action) return;
      if (action === 'show') {
        setShouldShowOnboarding(true);
      } else if (action === 'hide') {
        setShouldShowOnboarding(false);
        setManuallyTriggered(false);
      } else if (action === 'complete') {
        if (user) {
          const userSpecificKey = `timeline-tour-completed-${user._id}`;
          localStorage.setItem('timeline-tour-completed', 'true');
          localStorage.setItem(userSpecificKey, 'true');
        }
        setIsOnboardingComplete(true);
        setShouldShowOnboarding(false);
        setManuallyTriggered(false);
      }
    };
    window.addEventListener('timeline:onboarding', handler as EventListener);
    return () => window.removeEventListener('timeline:onboarding', handler as EventListener);
  }, [user]);

  const showOnboarding = useCallback(() => {
    setManuallyTriggered(true);
    setShouldShowOnboarding(true);
    dispatchOnboardingEvent('show');
  }, [dispatchOnboardingEvent]);

  const hideOnboarding = useCallback(() => {
    setShouldShowOnboarding(false);
    setManuallyTriggered(false);
    dispatchOnboardingEvent('hide');
  }, [dispatchOnboardingEvent]);

  const markOnboardingComplete = useCallback(() => {
    if (user) {
      const userSpecificKey = `timeline-tour-completed-${user._id}`;
      localStorage.setItem('timeline-tour-completed', 'true');
      localStorage.setItem(userSpecificKey, 'true');
      setIsOnboardingComplete(true);
      setShouldShowOnboarding(false);
      setManuallyTriggered(false);
    }
    dispatchOnboardingEvent('complete');
  }, [user, dispatchOnboardingEvent]);

  const markWorkspaceOnboardingSkipped = useCallback(() => {
    // This function only hides the current onboarding without marking global completion
    // This allows future new workspace tours to still show
    setShouldShowOnboarding(false);
    setManuallyTriggered(false);
    dispatchOnboardingEvent('hide');
  }, [dispatchOnboardingEvent]);

  return {
    shouldShowOnboarding,
    showOnboarding,
    hideOnboarding,
    isOnboardingComplete,
    markOnboardingComplete,
    markWorkspaceOnboardingSkipped
  };
};
