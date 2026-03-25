"use client";

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Eye, EyeOff, Loader2, Fingerprint } from "lucide-react"

interface ModernAuthCardProps {
  isLoading: boolean
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  rememberMe: boolean
  setRememberMe: (remember: boolean) => void
  onSignIn: (email: string, password: string) => void
  onSignUp: (email: string, password: string) => void
  onSocialLogin: (provider: string) => void
  onForgotPassword: (email: string) => void
  onBiometricLogin?: () => void
  biometricSupported?: boolean
  biometricLoading?: boolean
  defaultMode?: "sign-in" | "sign-up"
}

export default function ModernAuthCard({
  isLoading,
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  onSignIn,
  onSignUp,
  onSocialLogin,
  onForgotPassword,
  onBiometricLogin,
  biometricSupported = false,
  biometricLoading = false,
  defaultMode = "sign-in"
}: ModernAuthCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(defaultMode)
  const [showPassword, setShowPassword] = useState(false)

  // Update tab based on current URL
  useEffect(() => {
    if (pathname?.includes('/sign-up')) {
      setActiveTab('sign-up')
    } else if (pathname?.includes('/sign-in')) {
      setActiveTab('sign-in')
    }
  }, [pathname])

  // Handle tab change with URL navigation
  const handleTabChange = (tab: "sign-in" | "sign-up") => {
    setActiveTab(tab)
    if (tab === 'sign-in' && pathname?.includes('/sign-up')) {
      router.push('/sign-in')
    } else if (tab === 'sign-up' && pathname?.includes('/sign-in')) {
      router.push('/sign-up')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === "sign-in") {
      onSignIn(email, password)
    } else {
      onSignUp(email, password)
    }
  }

  const handleSocialLogin = (provider: string) => {
    onSocialLogin(provider)
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-slate-50/90 dark:bg-black/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-[24px] p-6 shadow-xl transition-all duration-300">
        {/* Header with tabs */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex bg-gray-100/80 dark:bg-black/30 backdrop-blur-sm rounded-full p-1 border border-gray-300/30 dark:border-white/10">
            <button
              onClick={() => handleTabChange("sign-up")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "sign-up"
                ? "bg-white dark:bg-white/20 backdrop-blur-sm text-gray-900 dark:text-white border border-gray-300/50 dark:border-white/20 shadow-lg"
                : "text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/5"
                }`}
            >
              Sign up
            </button>
            <button
              onClick={() => handleTabChange("sign-in")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === "sign-in"
                ? "bg-white dark:bg-white/20 backdrop-blur-sm text-gray-900 dark:text-white border border-gray-300/50 dark:border-white/20 shadow-lg"
                : "text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/5"
                }`}
            >
              Sign in
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-normal text-gray-900 dark:text-white mb-6 text-center transition-all duration-300">
          {activeTab === "sign-up" ? "Create an account" : "Welcome back"}
        </h1>

        <div className="relative overflow-hidden min-h-[240px]">
          <div
            className={`transition-all duration-700 ease-in-out transform ${activeTab === "sign-up" ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 absolute inset-0"
              }`}
          >
            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email field (icon removed; normalize padding) */}
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/10 rounded-xl h-11 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:border-blue-500 dark:focus:border-white/30 focus:ring-0 focus-visible:ring-0 focus:outline-none text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-black/30 focus:bg-white dark:focus:bg-black/30"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password field */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/10 rounded-xl h-11 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:border-blue-500 dark:focus:border-white/30 focus:ring-0 focus-visible:ring-0 focus:outline-none pr-10 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-black/30 focus:bg-white dark:focus:bg-black/30"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-black/20 text-blue-600 dark:text-white focus:ring-0 focus-visible:ring-0 focus:outline-none"
                  />
                  <span className="text-gray-600 dark:text-white/60 text-sm">Remember me</span>
                </label>
              </div>

              {/* Create account button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full rounded-xl h-10 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create an account"
                )}
              </Button>
            </form>
          </div>

          <div
            className={`transition-all duration-700 ease-in-out transform ${activeTab === "sign-in" ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 absolute inset-0"
              }`}
          >
            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email field */}
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/10 rounded-xl h-11 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:border-blue-500 dark:focus:border-white/30 focus:ring-0 focus-visible:ring-0 focus:outline-none text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-black/30 focus:bg-white dark:focus:bg-black/30"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password field */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/10 rounded-xl h-11 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:border-blue-500 dark:focus:border-white/30 focus:ring-0 focus-visible:ring-0 focus:outline-none pr-10 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-black/30 focus:bg-white dark:focus:bg-black/30"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-black/20 text-blue-600 dark:text-white focus:ring-0 focus-visible:ring-0 focus:outline-none"
                  />
                  <span className="text-gray-600 dark:text-white/60 text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => onForgotPassword(email)}
                  className="text-blue-600 dark:text-white/60 hover:text-blue-700 dark:hover:text-white text-sm transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign in button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full rounded-xl h-10 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>

              {/* Biometric Login Button - Only show for sign-in and if supported */}
              {biometricSupported && onBiometricLogin && (
                <Button
                  type="button"
                  onClick={onBiometricLogin}
                  disabled={biometricLoading || isLoading}
                  variant="success"
                  size="lg"
                  className="w-full rounded-xl h-10 mt-2"
                >
                  {biometricLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" />
                      Sign in with Biometrics
                    </span>
                  )}
                </Button>
              )}
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 h-px bg-gray-300/50 dark:bg-white/10"></div>
          <span className="px-3 text-gray-500 dark:text-white/40 text-xs font-medium">
            {activeTab === "sign-up" ? "OR SIGN UP WITH" : "OR CONTINUE WITH"}
          </span>
          <div className="flex-1 h-px bg-gray-300/50 dark:bg-white/10"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="bg-white/80 dark:bg-black/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/10 rounded-xl h-10 flex items-center justify-center hover:bg-white dark:hover:bg-black/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>
          <button
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="bg-white/80 dark:bg-black/20 backdrop-blur-sm border border-gray-300/50 dark:border-white/10 rounded-xl h-10 flex items-center justify-center hover:bg-white dark:hover:bg-black/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.94.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.69-3.88-1.36-3.88-1.36-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.74 1.27 3.41.97.1-.76.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.25 5.69.42.36.8 1.07.8 2.16 0 1.56-.01 2.81-.01 3.2 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <p className="text-center text-gray-500 dark:text-white/40 text-xs mt-4">
          {activeTab === "sign-up"
            ? "By creating an account, you agree to our Terms & Service"
            : "By signing in, you agree to our Terms & Service"}
        </p>
      </div>
    </div>
  )
}
