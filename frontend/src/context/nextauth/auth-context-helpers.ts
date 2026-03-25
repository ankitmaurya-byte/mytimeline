import { createContext, useContext } from 'react';
import { AuthContextInstance } from './auth-context-instance';

export const AuthContext = createContext<AuthContextInstance | null>(null);

export function useAuthContext(): AuthContextInstance {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
