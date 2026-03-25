// Legacy Clerk-based hook removed
export function useAuth() {
    return {
        user: null,
        loading: false,
        signIn: async () => { window.location.href = '/sign-in'; },
        signOut: async () => { window.location.href = '/'; },
        isAuthenticated: false,
    };
}
