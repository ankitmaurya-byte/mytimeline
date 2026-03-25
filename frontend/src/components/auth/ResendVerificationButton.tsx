"use client";

import React, { useState } from 'react';

interface ResendVerificationButtonProps {
    email: string;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    maxAttempts?: number;
}

export default function ResendVerificationButton({
    email,
    className = '',
    variant = 'primary',
    size = 'md',
    maxAttempts = 2
}: ResendVerificationButtonProps) {
    const [isResending, setIsResending] = useState(false);
    const [resendCount, setResendCount] = useState(0);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    const handleResendVerification = async () => {
        if (resendCount >= maxAttempts) {
            setResendMessage(`Maximum resend attempts (${maxAttempts}) reached. Please contact support.`);
            return;
        }

        setIsResending(true);
        setResendMessage(null);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(`${backendUrl}/api/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setResendCount(prev => prev + 1);
                setResendMessage(`✅ Verification email sent! (${resendCount + 1}/${maxAttempts} attempts used)`);
            } else {
                const errorData = await response.json();
                setResendMessage(`❌ Failed to send verification email: ${errorData.message}`);
            }
        } catch (error) {
            setResendMessage('❌ Failed to send verification email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const getButtonClasses = () => {
        const baseClasses = 'font-medium rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base'
        };

        const variantClasses = {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white',
            secondary: 'bg-slate-600 hover:bg-slate-700 text-white',
            outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        };

        return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handleResendVerification}
                disabled={isResending || resendCount >= maxAttempts}
                className={getButtonClasses()}
            >
                {isResending ? (
                    <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Sending...
                    </>
                ) : resendCount >= maxAttempts ? (
                    'Max attempts reached'
                ) : (
                    <>
                        📧 Resend Verification Email
                        {resendCount > 0 && <span className="ml-1 text-xs opacity-75">({resendCount}/{maxAttempts})</span>}
                    </>
                )}
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                ⚠️ Verification emails expire after 15 minutes
            </p>

            {resendMessage && (
                <div className={`text-sm p-2 rounded ${resendMessage.includes('✅')
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {resendMessage}
                </div>
            )}

            {resendCount > 0 && resendCount < maxAttempts && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attempts used: {resendCount}/{maxAttempts}
                </p>
            )}
        </div>
    );
}
