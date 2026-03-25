import React from 'react';
import { AuthContext } from './auth-context-helpers';
import { AuthContextInstance } from './auth-context-instance';

interface AuthProviderProps {
    children: React.ReactNode;
    authInstance: AuthContextInstance;
}

export function AuthProvider({ children, authInstance }: AuthProviderProps) {
    return (
        <AuthContext.Provider value={authInstance}>
            {children}
        </AuthContext.Provider>
    );
}
