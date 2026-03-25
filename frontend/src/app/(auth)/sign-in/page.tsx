"use client";
import Link from "next/link";
import { ArrowLeft, GanttChartSquare, Eye, EyeOff, Loader2, Fingerprint } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useEffect } from "react";
import API from "@/lib/axios-client";
import { login } from "@/lib/auth/client-auth";
import { attemptRememberMeLogin } from "@/lib/auth/remember-me-auth";
import { motion } from "framer-motion";
import {
  checkBiometricSupport,
  parseBiometricError,
  logBiometricError,
  getBiometricSupportMessage,
  getBiometricRequirementsMessage,
  type BiometricSupportInfo
} from "@/lib/biometric-utils";
import ModernAuthCard from "@/components/modern-auth-card"; // Modern auth component

export default function SignInPage() {
  // Debug: Check cookies on page load
  useEffect(() => {
  }, []);
  // Debug: Check if API is imported correctly

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricSupportInfo, setBiometricSupportInfo] = useState<BiometricSupportInfo | null>(null);
  const [isCheckingRememberMe, setIsCheckingRememberMe] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // Modern auth card state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check biometric support and remember me on mount
  useEffect(() => {
    checkBiometricSupportStatus();
    testBackendConnectivity();
    checkRememberMeLogin();
  }, []);

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

  // Check for remember me automatic login
  const checkRememberMeLogin = async () => {
    try {
      const result = await attemptRememberMeLogin();

      if (result.success) {
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          window.location.assign("/workspace");
        }, 500);
      } else {
      }
    } catch (error) {
      console.error('[SignInPage] Remember me check error:', error);
    } finally {
      setIsCheckingRememberMe(false);
    }
  };

  const checkBiometricSupportStatus = async () => {
    try {
      const supportInfo = await checkBiometricSupport();
      setBiometricSupportInfo(supportInfo);
      setBiometricSupported(supportInfo.isSupported);

    } catch (error) {
      setBiometricSupported(false);
    }
  };

  const testBackendConnectivity = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.warn('[auth] Backend connectivity test failed (non-blocking):', error);
    }
  };

  // Check for verification messages in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('errorMessage');

    if (message === 'email-verified') {
      setVerificationMessage('✅ Your email has been verified successfully! You can now sign in.');
    } else if (error === 'verification-failed') {
      setError(errorMessage || 'Email verification failed. Please try again or request a new verification email.');
    } else if (error === 'verification-error') {
      setError('Email verification encountered an error. Please try again.');
    } else if (error === 'invalid-verification') {
      setError('Invalid verification link. Please request a new verification email.');
    }

    // Clean up URL parameters
    if (message || error) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

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

  async function socialSignIn(provider: 'google' | 'github') {
    try {
      // Check if API is available
      if (!API) {
        console.error('API is undefined in socialSignIn');
        setError('Authentication service is not available. Please refresh the page and try again.');
        return;
      }

      setSocialLoading(provider);
      setError(null);


      // Try redirect-based handshake (adjust endpoint paths as per backend)
      const { data } = await API.get(`/auth/oauth/${provider}/init`);

      if (data?.url) {
        window.location.href = data.url; // server provides authorization URL
      } else {
        console.error(`[OAuth] No authorization URL received from ${provider} init`);
        setError(`${provider} authentication is not properly configured. Please try again later.`);
        setSocialLoading(null);
      }
    } catch (e: any) {
      console.error('Social sign-in failed', e);
      setError(e?.response?.data?.message || `${provider} authentication failed. Please try again.`);
      setSocialLoading(null);
    }
  }

  // Modern auth card handlers
  const handleModernSignIn = async (email: string, password: string) => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (user) {
        // Handle remember me if checked
        if (rememberMe) {
          const deviceInfo = getDeviceInfo();
          // Store remember me info (implementation depends on your backend)
        }
        // Redirect to dashboard or wherever needed
        window.location.href = `/workspace/${user.currentWorkspace}`;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleModernSignUp = async (email: string, password: string) => {
    // Redirect to sign-up page since this is the sign-in page
    window.location.href = "/sign-up";
  };

  const handleModernSocialLogin = (provider: string) => {
    socialSignIn(provider as 'google' | 'github');
  };

  const handleModernForgotPassword = (email: string) => {
    setError("Password reset functionality will be available soon");
  };

  async function handleBiometricLogin() {
    // Pre-flight checks
    if (!window.isSecureContext) {
      setError('🔒 Biometric authentication requires HTTPS. Please access this site securely.');
      return;
    }

    if (!window.PublicKeyCredential) {
      setError('🔧 Biometric authentication is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      return;
    }

    if (!navigator.credentials) {
      setError('🔧 WebAuthn is not available in this browser. Please use a modern browser that supports biometric authentication.');
      return;
    }

    // Check if API is available
    if (!API) {
      console.error('API is undefined');
      setError('❌ Authentication service is not available. Please refresh the page and try again.');
      return;
    }

    setBiometricLoading(true);
    setError(null);

    try {
      // First, get authentication options from backend
      const optionsResponse = await API.post('/auth/biometric/options', {
        rpId: window.location.hostname
      });

      if (!optionsResponse.data.success) {
        const backendError = optionsResponse.data.error || 'Failed to get authentication options';
        if (backendError.includes('No biometric sessions found') ||
          backendError.includes('No user found with this biometric credential')) {
          throw new Error('BIOMETRIC_NOT_SETUP');
        } else if (backendError.includes('Database connection') ||
          backendError.includes('Service unavailable')) {
          throw new Error('SERVICE_UNAVAILABLE');
        } else {
          throw new Error(`BACKEND_ERROR: ${backendError}`);
        }
      }

      const { challenge, allowCredentials, timeout } = optionsResponse.data;
      // Trigger WebAuthn authentication with proper options
      const publicKeyOptions: any = {
        challenge: new Uint8Array(challenge),
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: timeout || 60000,
      };

      // Only add allowCredentials if we have some
      if (allowCredentials && allowCredentials.length > 0) {
        publicKeyOptions.allowCredentials = allowCredentials.map((cred: any) => ({
          id: new Uint8Array(cred.id),
          type: 'public-key',
          transports: cred.transports || ['internal']
        }));
      }

      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions
      });

      if (!credential) {
        throw new Error('USER_CANCELLED');
      }

      // Send credential to backend for verification
      const response = await API.post('/auth/biometric/login', {
        credential: credential
      });

      if (response.data.success) {
        // User is logged in without password!
        // Full reload so RSC boundary picks up cookie
        window.location.assign("/workspace");
      } else {
        const loginError = response.data.error || 'Biometric login failed';
        throw new Error(`LOGIN_ERROR: ${loginError}`);
      }
    } catch (error: any) {
      logBiometricError(error, 'Biometric Login');
      const errorInfo = parseBiometricError(error);
      setError(errorInfo.userFriendlyMessage);
    } finally {
      setBiometricLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!unverifiedEmail) return;

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
        body: JSON.stringify({ email: unverifiedEmail }),
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;


    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);
    setResendMessage(null);
    setResendCount(0);

    try {
      const user = await login(email, password);

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
          console.error('[auth] Failed to create remember me token:', rememberMeError);
          // Don't fail the login if remember me fails
        }
      }

      // Add a small delay to ensure cookie is set
      setTimeout(() => {
        window.location.assign("/workspace");
      }, 1000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Invalid credentials";

      // Check if the error is about email not being verified
      if (errorMessage.toLowerCase().includes('email not verified') ||
        errorMessage.toLowerCase().includes('verify your email') ||
        errorMessage.toLowerCase().includes('check your inbox')) {

        // Set the unverified email for resend functionality
        setUnverifiedEmail(email);

        // Automatically send verification email
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
            setError(`${errorMessage} I've sent you a new verification email. Please check your inbox. Verification emails expire after 15 minutes.`);
          } else {
            setError(`${errorMessage} Please check your inbox for the verification email. Verification emails expire after 15 minutes. If you don't see it, check your spam folder.`);
          }
        } catch (verificationError) {
          setError(`${errorMessage} Please check your inbox for the verification email. Verification emails expire after 15 minutes. If you don't see it, check your spam folder.`);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while checking remember me
  if (isCheckingRememberMe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking for saved login...</p>
        </div>
      </div>
    );
  }

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
          <div className="absolute inset-0 bg-[radial-gradient(.125rem_.125rem_at_1.25rem_1.875rem,#eee,transparent),radial-gradient(.125rem_.125rem_at_2.5rem_4.375rem,rgba(255,255,255,0.8),transparent),radial-gradient(.0625rem_.0625rem_at_5.625rem_2.5rem,#fff,transparent),radial-gradient(.0625rem_.0625rem_at_8.125rem_5rem,rgba(255,255,255,0.6),transparent),radial-gradient(.125rem_.125rem_at_10rem_1.875rem,#ddd,transparent)] bg-[length:12.5rem_12.5rem] animate-[galaxy_20s_linear_infinite]" />
          <div className="absolute inset-0 bg-[radial-gradient(.0625rem_.0625rem_at_1.5625rem_.3125rem,#fff,transparent),radial-gradient(.0625rem_.0625rem_at_3.125rem_1.25rem,rgba(255,255,255,0.8),transparent),radial-gradient(.0625rem_.0625rem_at_4.6875rem_3.125rem,#fff,transparent),radial-gradient(.0625rem_.0625rem_at_6.25rem_.625rem,rgba(255,255,255,0.6),transparent),radial-gradient(.0625rem_.0625rem_at(9.375rem_3.75rem),#ddd,transparent)] bg-[length:9.375rem_9.375rem] animate-[galaxy_15s_linear_infinite_-7s]" />
          <div className="absolute inset-0 bg-[radial-gradient(.0625rem_.0625rem_at_.9375rem_1.5625rem,#fff,transparent),radial-gradient(.0625rem_.0625rem_at_2.1875rem_2.8125rem,rgba(255,255,255,0.8),transparent),radial-gradient(.0625rem_.0625rem_at(4.0625rem_.9375rem),#fff,transparent),radial-gradient(.0625rem_.0625rem_at(5.3125rem_2.1875rem),rgba(255,255,255,0.6),transparent),radial-gradient(.0625rem_.0625rem_at(7.1875rem_3.75rem),#ddd,transparent)] bg-[length:6.25rem_6.25rem] animate-[galaxy_10s_linear_infinite_-15s]" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-blue-400/10" />
          <div className="absolute inset-0 bg-gradient-to-tl from-slate-800/25 via-transparent to-blue-600/20" />
        </div>
        <div className="relative z-20 flex flex-grow flex-col items-center justify-center text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <GanttChartSquare className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold max-w-md text-white">All your work, in one single timeline</h2>
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
        <div className="absolute inset-0 pointer-events-none" />
        <div className="w-full max-w-md mx-auto relative px-4 sm:px-6 space-y-4">
          {/* Notification Messages - Above the card for better visibility */}
          <div className="space-y-3">
            {/* Success verification message */}
            {verificationMessage && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 p-4 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10" />
                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-emerald-100 leading-relaxed">
                    {verificationMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Resend success message */}
            {resendMessage && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 p-4 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10" />
                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-blue-100 leading-relaxed">
                    {resendMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Error messages */}
            {error && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 p-4 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-rose-400/10" />
                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-red-100 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Unverified email message with actions */}
            {unverifiedEmail && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 p-4 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-400/10" />
                <div className="relative space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-amber-100">
                        Your email address <span className="font-semibold text-amber-200">({unverifiedEmail})</span> is not yet verified.
                      </p>
                      <p className="text-xs text-amber-200/80">
                        ⏱️ Verification emails expire after 15 minutes
                      </p>
                    </div>
                  </div>

                  {resendCount < 2 && (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={isResending || resendCount >= 2}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm"
                      >
                        {isResending ? (
                          <>
                            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            📧 Resend Email
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUnverifiedEmail(null);
                          setResendMessage(null);
                          setError(null);
                        }}
                        className="px-4 py-2 text-xs font-medium bg-gray-600/80 hover:bg-gray-500/80 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
            onBiometricLogin={handleBiometricLogin}
            biometricSupported={biometricSupported}
            biometricLoading={biometricLoading}
          />
        </div>
      </div>
    </div>
  );
}
