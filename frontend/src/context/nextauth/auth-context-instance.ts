export interface AuthContextInstance {
    user: unknown;
    loading: boolean;
    signIn: (credentials: Record<string, unknown>) => Promise<unknown>;
    signOut: () => Promise<void>;
}

export const createAuthContextInstance = (): AuthContextInstance => {
    return {
        user: null,
        loading: false,
        signIn: async (credentials) => {
            return null;
        },
        signOut: async () => {
        }
    };
};
