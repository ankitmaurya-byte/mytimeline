// OAuth configuration constants
export const getGoogleOAuthConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/oauth/google/callback`;
    
    return {
        clientId,
        clientSecret,
        redirectUri,
        isConfigured: !!(clientId && clientSecret)
    };
};

export const getGitHubOAuthConfig = () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:8000'}/api/auth/oauth/github/callback`;
    
    return {
        clientId,
        clientSecret,
        redirectUri,
        isConfigured: !!(clientId && clientSecret)
    };
};
