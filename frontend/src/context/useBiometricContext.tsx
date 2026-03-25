import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthContext } from './useAuthContext';
import API from '@/lib/axios-client';

interface BiometricContextType {
    isBiometricEnabled: boolean;
    hasBiometricSessions: boolean;
    isLoading: boolean;
    checkBiometricStatus: () => Promise<void>;
    refreshBiometricStatus: () => Promise<void>;
    // Add method to check biometric status without user dependency
    checkBiometricStatusForAuth: (email?: string) => Promise<boolean>;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export function BiometricProvider({ children }: { children: ReactNode }) {
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [hasBiometricSessions, setHasBiometricSessions] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Try to get user from auth context, but don't fail if not available
    let user: any = null;
    try {
        const authContext = useAuthContext();
        user = authContext?.user;
    } catch (error) {
        // Auth context not available (e.g., on auth pages)
        user = null;
    }

    const checkBiometricStatus = async () => {
        if (!user) {
            setIsBiometricEnabled(false);
            setHasBiometricSessions(false);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await API.get('/auth/biometric');
            const sessions = response.data.sessions || [];
            const hasSessions = sessions.length > 0;

            /*      console.log('🔐 [BiometricContext] Status check result:', {
                     sessionsCount: sessions.length,
                     hasSessions,
                     sessions: sessions.map(s => ({ deviceId: s.deviceId, deviceInfo: s.deviceInfo }))
                 }); */

            setHasBiometricSessions(hasSessions);
            setIsBiometricEnabled(hasSessions);
        } catch (error) {
            console.error('Error checking biometric status:', error);
            setHasBiometricSessions(false);
            setIsBiometricEnabled(false);
        } finally {
            setIsLoading(false);
        }
    };

    const checkBiometricStatusForAuth = async (email?: string): Promise<boolean> => {
        // For auth pages, we can't check biometric status without user being logged in
        // This will be handled by the backend when the user attempts biometric login
        return false;
    };

    const refreshBiometricStatus = async () => {
        await checkBiometricStatus();
    };

    useEffect(() => {
        if (user) {
            checkBiometricStatus();
        } else {
            // No user available (e.g., on auth pages)
            setIsLoading(false);
            setHasBiometricSessions(false);
            setIsBiometricEnabled(false);
        }
    }, [user]);

    const value: BiometricContextType = {
        isBiometricEnabled,
        hasBiometricSessions,
        isLoading,
        checkBiometricStatus,
        refreshBiometricStatus,
        checkBiometricStatusForAuth,
    };

    return (
        <BiometricContext.Provider value={value}>
            {children}
        </BiometricContext.Provider>
    );
}

export function useBiometricContext() {
    const context = useContext(BiometricContext);
    if (context === undefined) {
        throw new Error('useBiometricContext must be used within a BiometricProvider');
    }
    return context;
}
