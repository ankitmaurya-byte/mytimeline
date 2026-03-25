"use client";
import { useEffect, useState, useRef } from 'react';
import { fetchCurrentUser, logout } from '@/lib/auth/client-auth';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedAuth = useRef(false);
  const isChecking = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent multiple simultaneous auth checks
    if (hasCheckedAuth.current || isChecking.current) return;

    // Check if OAuth is in progress - if so, don't make auth requests yet
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('oauth') === 'success';
      const oauthToken = urlParams.get('token');

      if (oauthSuccess && oauthToken) {
        setLoading(false);
        hasCheckedAuth.current = true;
        return;
      }
    }

    isChecking.current = true;

    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      isChecking.current = false;
      hasCheckedAuth.current = true;
    }, 10000); // 10 second timeout

    const checkAuth = async () => {
      try {
        // First try to get cached user (no API call)
        const userData = await fetchCurrentUser(false);

        if (userData) {
          // User is cached, no need for API call
          setUser(userData);
          hasCheckedAuth.current = true;
        } else {
          // No cached user, make API call to check auth
          const freshUserData = await fetchCurrentUser(true);
          setUser(freshUserData);
          hasCheckedAuth.current = true;
        }
      } catch (error) {
        console.error('[useAuth] Error checking authentication:', error);
        setUser(null);
        hasCheckedAuth.current = true;
      } finally {
        // Clear timeout and reset state
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setLoading(false);
        isChecking.current = false;
      }
    };

    checkAuth();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    user,
    loading,
    isSignedIn: !!user,
    signOut: async () => {
      await logout();
      setUser(null);
      hasCheckedAuth.current = false; // Reset for next auth check
    },
  };
}
