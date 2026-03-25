"use client";
import Link from "next/link";
import { ArrowLeft, GanttChartSquare, Eye, EyeOff, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";
import API from "@/lib/axios-client";
import { register } from "@/lib/auth/client-auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ModernAuthCard from "@/components/modern-auth-card"; // Modern auth component

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Modern auth card state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Get device information for remember me
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent);

    if (isMobile) {
      if (userAgent.includes('iPhone')) return 'iPhone';
      if (userAgent.includes('Android')) return 'Android Phone';
      return 'Mobile Device';
    } else if (isTablet) {
      if (userAgent.includes('iPad')) return 'iPad';
      return 'Android Tablet';
    } else {
      if (userAgent.includes('Mac')) return 'Mac Computer';
      if (userAgent.includes('Windows')) return 'Windows Computer';
      if (userAgent.includes('Linux')) return 'Linux Computer';
      return 'Desktop Computer';
    }
  };

  // Brand icons (inline SVG for accuracy & no extra deps)
  const GoogleIcon = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.8v3.84h5.39c-.24 1.26-.97 2.33-2.07 3.05l3.34 2.59c1.95-1.8 3.08-4.45 3.08-7.64 0-.73-.07-1.43-.2-2.11H12Z" />
      <path fill="#34A853" d="M6.56 14.32 5.73 14.96l-2.67 2.07C5.06 20.79 8.27 22.8 12 22.8c2.7 0 4.97-.9 6.63-2.45l-3.34-2.59c-.9.6-2.05.96-3.29.96-2.53 0-4.68-1.7-5.44-3.99Z" />
      <path fill="#4A90E2" d="M20.96 6.91 17.63 9.5c.77.46 1.42 1.05 1.88 1.73.41.6.72 1.23.92 1.92.19.69.29 1.42.29 2.18 0 .74-.1 1.47-.29 2.16a7.66 7.66 0 0 1-.92 1.92l-.02.03c1.95-1.8 3.08-4.45 3.08-7.64 0-.73-.07-1.43-.2-2.11a10.7 10.7 0 0 0-.82-2.69Z" />
      <path fill="#FBBC05" d="M12 5.2c1.47 0 2.78.5 3.82 1.47l2.85-2.85C16.96 1.8 14.7.8 12 .8 8.27.8 5.06 2.81 3.06 6.17L6.56 9.68C7.32 7.39 9.47 5.2 12 5.2Z" />
      <path fill="#fff" fillOpacity="0" d="M2 2h20v20H2z" />
    </svg>
  );
  const GitHubIcon = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path fill="currentColor" fillRule="evenodd" d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.94.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.69-3.88-1.36-3.88-1.36-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.74 1.27 3.41.97.1-.76.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.25 5.69.42.36.8 1.07.8 2.16 0 1.56-.01 2.81-.01 3.2 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" clipRule="evenodd" />
    </svg>
  );

  async function socialSignUp(provider: 'google' | 'github') {
    try {
      setSocialLoading(provider);
      setError(null);


      const { data } = await API.get(`/auth/oauth/${provider}/init`);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error(`[OAuth] No authorization URL received from ${provider} init`);
        setError(`${provider} authentication is not properly configured. Please try again later.`);
        setSocialLoading(null);
      }
    } catch (e: any) {
      console.error('Social sign-up failed', e);
      setError(e?.response?.data?.message || `${provider} authentication failed. Please try again.`);
      setSocialLoading(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    setLoading(true);
    setError(null);
    try {
      // Use the email prefix as default name
      const name = email.split('@')[0];
      const result = await register(name, email, password);
      setVerificationEmail(email);
      setRegistrationSuccess(true);

      // Create remember me token if checkbox is checked
      if (rememberMe) {
        try {
          const deviceId = crypto.randomUUID();
          const deviceInfo = getDeviceInfo();

          await API.post('/auth/remember-me', {
            deviceId,
            deviceInfo
          });

        } catch (rememberMeError) {
          console.error('[signup] Failed to create remember me token:', rememberMeError);
          // Don't fail the registration if remember me fails
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!verificationEmail) return;

    if (resendCount >= 2) {
      setResendMessage('Maximum resend attempts (2) reached. Please contact support.');
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
        body: JSON.stringify({ email: verificationEmail }),
      });

      if (response.ok) {
        setResendCount(prev => prev + 1);
        setResendMessage(`✅ Verification email sent successfully! Please check your inbox. (${resendCount + 1}/2 attempts used)`);
      } else {
        const errorData = await response.json();
        setResendMessage(`❌ Failed to send verification email: ${errorData.message}`);
      }
    } catch (error) {
      setResendMessage('❌ Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  // Modern auth card handlers
  const handleModernSignIn = async (email: string, password: string) => {
    router.push('/sign-in');
  };

  const handleModernSignUp = async (email: string, password: string) => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, we'll use a default name or modify the register function
      const result = await register(email.split('@')[0], email, password);
      setVerificationEmail(email);
      setRegistrationSuccess(true);

      // Create remember me token if checkbox is checked
      if (rememberMe) {
        try {
          const deviceId = crypto.randomUUID();
          const deviceInfo = getDeviceInfo();

          await API.post('/auth/remember-me', {
            deviceId,
            deviceInfo
          });

        } catch (rememberMeError) {
          console.error('[signup] Failed to create remember me token:', rememberMeError);
          // Don't fail the registration if remember me fails
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleModernSocialLogin = async (provider: string) => {
    await socialSignUp(provider as 'google' | 'github');
  };

  const handleModernForgotPassword = async (email: string) => {
    // Redirect to forgot password page
    router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="w-full min-h-screen bg-white grid grid-cols-1 lg:grid-cols-2 overflow-x-hidden max-w-full">
      {/* Left Panel: Branding & Visuals (legacy styling adapted) */}
      <div className="hidden lg:flex flex-col items-center justify-center overflow-hidden bg-slate-900 p-12 text-white min-h-screen">
        <div className="absolute inset-0 z-0 bg-black">
          {/* Back arrow button for md+ screens */}
          <div className="absolute top-8 left-8 md:block hidden z-50">
            <Link
              href="/"
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-semibold text-sm">Back to Home</span>
            </Link>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-black" />
          <div className="absolute inset-0 bg-gradient-to-bl from-blue-800/30 via-transparent to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-radial from-black/15 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(2px_2px_at_20px_30px,#eee,transparent),radial-gradient(2px_2px_at_40px_70px,rgba(255,255,255,0.8),transparent),radial-gradient(1px_1px_at_90px_40px,#fff,transparent),radial-gradient(1px_1px_at_130px_80px,rgba(255,255,255,0.6),transparent),radial-gradient(2px_2px_at_160px_30px,#ddd,transparent)] bg-[length:200px_200px] animate-[galaxy_20s_linear_infinite]" />
          <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_25px_5px,#fff,transparent),radial-gradient(1px_1px_at_50px_20px,rgba(255,255,255,0.8),transparent),radial-gradient(1px_1px_at_75px_50px,#fff,transparent),radial-gradient(1px_1px_at_100px_10px,rgba(255,255,255,0.6),transparent),radial-gradient(1px_1px_at(150px_60px),#ddd,transparent)] bg-[length:150px_150px] animate-[galaxy_15s_linear_infinite_-7s]" />
          <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_15px_25px,#fff,transparent),radial-gradient(1px_1px_at_35px_45px,rgba(255,255,255,0.8),transparent),radial-gradient(1px_1px_at(65px_15px),#fff,transparent),radial-gradient(1px_1px_at(85px_35px),rgba(255,255,255,0.6),transparent),radial-gradient(1px_1px_at(115px_60px),#ddd,transparent)] bg-[length:100px_100px] animate-[galaxy_10s_linear_infinite_-15s]" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-blue-400/10" />
          <div className="absolute inset-0 bg-gradient-to-tl from-slate-800/25 via-transparent to-blue-600/20" />
        </div>
        <div className="relative z-20 flex flex-grow flex-col items-center justify-center text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <GanttChartSquare className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold max-w-md">All your work, in one single timeline</h2>
          <p className="text-slate-200 text-lg max-w-md mx-auto mt-4">Ship projects faster and more efficiently</p>
        </div>
        <div className="relative z-20 text-center text-sm text-slate-300">
          © {new Date().getFullYear()} Timeline Inc. All Rights Reserved
        </div>
      </div>

      {/* Right Panel: Modern Auth Card */}
      <div
        className="flex flex-col items-center justify-center px-4 py-6 sm:py-8 relative w-full overflow-x-hidden min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 md:bg-none md:bg-transparent"
      >
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0" />

        {/* Mobile back button - visible on mobile only */}
        <div className="absolute top-4 left-4 lg:hidden z-50">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium text-sm">Back</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto relative px-4">
          {/* Modern Auth Card */}
          <ModernAuthCard
            isLoading={loading || !!socialLoading}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            onSignIn={handleModernSignIn}
            onSignUp={handleModernSignUp}
            onSocialLogin={handleModernSocialLogin}
            onForgotPassword={handleModernForgotPassword}
            defaultMode="sign-up"
          />

          {/* Display errors */}
          {error && (
            <div className="mt-4 text-sm text-red-300 font-medium bg-red-900/20 border border-red-500/30 px-4 py-3 rounded-2xl backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Display resend messages */}
          {resendMessage && (
            <div className="mt-4 text-sm text-green-300 font-medium bg-green-900/20 border border-green-500/30 px-4 py-3 rounded-2xl backdrop-blur-sm">
              {resendMessage}
            </div>
          )}
        </div>
      </div>

      {/* Verification Email Modal Overlay */}
      {registrationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-auto">
            {/* Background gradient and effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/15 to-green-500/10 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-green-400/10 rounded-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)] rounded-3xl"></div>

            {/* Main content */}
            <div className="relative bg-green-900/40 border border-green-500/50 backdrop-blur-xl px-8 py-8 rounded-3xl shadow-2xl shadow-green-500/20">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setRegistrationSuccess(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 group"
              >
                <svg className="w-4 h-4 text-green-200 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Success icon and header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-green-100 font-bold text-xl mb-2">Registration Successful!</h3>
                <p className="text-green-200/90 text-sm leading-relaxed">
                  Please check your email <span className="font-semibold text-green-100">{verificationEmail}</span> for a verification link.
                </p>
              </div>

              {/* Warning message */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-amber-200 text-sm">
                  Verification emails expire after 15 minutes
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                {/* Open Gmail button */}
                <button
                  type="button"
                  onClick={() => window.open('https://mail.google.com', '_blank')}
                  className="w-full px-6 py-4 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v9.273L12 8.09l6.545 4.004V3.821h3.819A1.636 1.636 0 0 1 24 5.457z" />
                  </svg>
                  Open Gmail
                </button>

                {/* Resend button */}
                {resendCount < 2 && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending || resendCount >= 2}
                    className="w-full px-6 py-4 text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 text-white rounded-xl transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isResending ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : resendCount >= 2 ? (
                      'Max attempts reached'
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Resend Verification Email
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
