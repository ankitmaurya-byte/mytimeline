"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const oauthSuccess = searchParams?.get('oauth') === 'success';
        const oauthToken = searchParams?.get('token');


        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.error('[OAuthCallback] Timeout reached, redirecting to sign-in');
            setError('OAuth login timed out. Please try again.');
            router.replace('/sign-in');
        }, 10000); // 10 second timeout

        if (oauthSuccess && oauthToken) {
            try {

                // Set the auth cookie from the token in the URL
                const maxAge = 7 * 24 * 60 * 60; // 7 days
                const secure = window.location.protocol === 'https:';
                const sameSite = secure ? 'None' : 'Lax';
                const securePart = secure ? 'Secure; ' : '';

                // Set both HttpOnly and JS-accessible cookies for cross-domain compatibility
                const httpOnlyCookie = `auth_token=${oauthToken}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}; ${securePart}`;
                const jsAccessibleCookie = `auth_token_js=${oauthToken}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}; ${securePart}`;

                document.cookie = httpOnlyCookie;
                document.cookie = jsAccessibleCookie;


                // Clear timeout and redirect to workspace
                clearTimeout(timeout);
                router.replace('/workspace');
            } catch (error) {
                console.error('[OAuthCallback] Error setting cookies:', error);
                clearTimeout(timeout);
                setError('Failed to complete OAuth login. Please try again.');
                setTimeout(() => router.replace('/sign-in'), 2000);
            }
        } else {
            clearTimeout(timeout);
            router.replace('/sign-in');
        }

        return () => clearTimeout(timeout);
    }, [searchParams, router]);

    if (error) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-sm sm:max-w-md mx-auto">
                    <div className="text-red-500 text-4xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">OAuth Login Error</h1>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">{error}</p>
                    <button
                        onClick={() => router.replace('/sign-in')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
            <div className="text-center max-w-sm sm:max-w-md mx-auto">
                <div className="animate-spin rounded-full h-20 w-20 sm:h-32 sm:w-32 border-b-2 border-gray-900 mx-auto mb-3 sm:mb-4"></div>
                <p className="text-base sm:text-lg text-gray-600 px-4">Completing OAuth login...</p>
            </div>
        </div>
    );
}
