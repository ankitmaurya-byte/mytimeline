"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'loading' | 'error'>('loading');
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (resendCount >= 2) {
      setResendMessage('Maximum resend attempts reached. Please contact support.');
      return;
    }

    setIsResending(true);
    const email = searchParams?.get('email');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      if (response.ok) {
        setResendCount(prev => prev + 1);
        setResendMessage(`Verification email sent! (${resendCount + 1}/2 attempts used)`);
      } else {
        const errorData = await response.json();
        setResendMessage(`Failed to send verification email: ${errorData.message}`);
      }
    } catch (error) {
      setResendMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams?.get('token');
      const email = searchParams?.get('email');

      if (!token || !email) {
        // Invalid link, redirect to sign-in
        router.replace('/sign-in?error=invalid-verification');
        return;
      }

      try {
        // Call backend verification API
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

        // First check if backend is reachable
        try {
          const healthResponse = await fetch(`${backendUrl}/api/health`, {
            method: 'GET',
            cache: 'no-store'
          });
        } catch (healthError) {
          console.error('Backend health check failed:', healthError);
          router.replace('/sign-in?error=backend-unreachable&message=Backend server is not accessible');
          return;
        }

        const response = await fetch(`${backendUrl}/api/auth/verify-email?token=${token}&email=${email}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include' // Include cookies for authentication
        });


        if (response.ok) {
          // Verification successful, user is now logged in (backend sets auth cookie)
          // Show success message briefly, then redirect to workspace
          setVerificationStatus('success');
          setTimeout(() => {
            router.replace('/workspace');
          }, 2000); // 2 second delay
        } else {
          // Verification failed, try to get error details
          let errorMessage = 'Verification failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If response isn't JSON, get the text content
            try {
              const errorText = await response.text();
              errorMessage = `Verification failed (Status: ${response.status})`;
            } catch (textError) {
              errorMessage = `Verification failed (Status: ${response.status})`;
            }
          }
          router.replace(`/sign-in?error=verification-failed&message=${encodeURIComponent(errorMessage)}`);
        }
      } catch (error) {
        // Network error, redirect to sign-in with error
        console.error('Verification error details:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        router.replace('/sign-in?error=verification-error');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  // Show minimal loading state while verification happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {verificationStatus === 'loading' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        )}
        {verificationStatus === 'success' && (
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">Email Verified Successfully!</h1>
            <p className="text-green-600 mb-4">Your account has been activated and you are now logged in.</p>
            <p className="text-gray-600 text-sm">Redirecting to your workspace in a few seconds...</p>
          </div>
        )}
        {verificationStatus === 'error' && (
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h1>
            <p className="text-red-600 mb-4">Unable to verify your email. Please try again.</p>

            {/* Resend verification section */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Need a new verification link?</h3>
              <p className="text-gray-600 text-sm mb-3">
                You can request a new verification email up to 2 times. Verification emails expire after 15 minutes.
              </p>

              {resendMessage && (
                <div className={`text-sm p-2 rounded mb-3 ${resendMessage.includes('sent')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}>
                  {resendMessage}
                </div>
              )}

              <button
                onClick={handleResendVerification}
                disabled={isResending || resendCount >= 2}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${resendCount >= 2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isResending
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {isResending ? 'Sending...' : resendCount >= 2 ? 'Max attempts reached' : 'Send New Verification Email'}
              </button>

              <p className="text-xs text-gray-500 mt-2">
                Attempts used: {resendCount}/2
              </p>
            </div>

            <button
              onClick={() => router.replace('/sign-in')}
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
