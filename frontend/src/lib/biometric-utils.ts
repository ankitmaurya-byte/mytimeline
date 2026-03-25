/**
 * Biometric Authentication Utilities
 * Provides comprehensive error handling and support detection for WebAuthn/biometric authentication
 */

export interface BiometricSupportInfo {
    isSupported: boolean;
    isSecureContext: boolean;
    hasWebAuthn: boolean;
    hasCredentials: boolean;
    isMobile: boolean;
    userAgent: string;
    protocol: string;
    hostname: string;
    error?: string;
}

export interface BiometricErrorInfo {
    type: string;
    message: string;
    userFriendlyMessage: string;
    canRetry: boolean;
    requiresSetup?: boolean;
}

/**
 * Check if biometric authentication is supported on the current device/browser
 */
export async function checkBiometricSupport(): Promise<BiometricSupportInfo> {
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const isSecureContext = window.isSecureContext;
    const hasWebAuthn = !!window.PublicKeyCredential;
    const hasCredentials = !!navigator.credentials;

    const isMobileDevice = isMobile || (isTouchDevice && isSmallScreen);

    const supportInfo: BiometricSupportInfo = {
        isSupported: false,
        isSecureContext,
        hasWebAuthn,
        hasCredentials,
        isMobile: isMobileDevice,
        userAgent: userAgent.substring(0, 100) + '...',
        protocol: window.location.protocol,
        hostname: window.location.hostname
    };

    try {
        // Check basic requirements
        if (!isSecureContext) {
            supportInfo.error = 'Not in secure context - biometric authentication requires HTTPS';
            return supportInfo;
        }

        if (!hasWebAuthn || !hasCredentials) {
            supportInfo.error = 'WebAuthn not available in this browser';
            return supportInfo;
        }

        if (isMobileDevice) {
            // For mobile devices, assume biometric support is available
            supportInfo.isSupported = true;
        } else {
            // For desktop devices, check WebAuthn support
            try {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                supportInfo.isSupported = available;
                if (!available) {
                    supportInfo.error = 'No platform authenticator available on this device';
                }
            } catch (webauthnError) {
                supportInfo.error = `WebAuthn availability check failed: ${webauthnError}`;
            }
        }
    } catch (error) {
        supportInfo.error = `Error checking biometric support: ${error}`;
    }

    return supportInfo;
}

/**
 * Parse and categorize biometric authentication errors
 */
export function parseBiometricError(error: any): BiometricErrorInfo {
    const errorInfo: BiometricErrorInfo = {
        type: 'UNKNOWN',
        message: error.message || 'Unknown error',
        userFriendlyMessage: 'Biometric authentication failed',
        canRetry: true,
        requiresSetup: false
    };

    // Handle WebAuthn specific errors
    if (error.name === 'NotAllowedError') {
        errorInfo.type = 'NOT_ALLOWED';
        errorInfo.userFriendlyMessage = '🚫 Biometric authentication was denied. Please allow biometric access when prompted, or try again.';
        errorInfo.canRetry = true;
    } else if (error.name === 'NotSupportedError') {
        errorInfo.type = 'NOT_SUPPORTED';
        errorInfo.userFriendlyMessage = '🔧 Biometric authentication is not supported on this device. Please use email/password login.';
        errorInfo.canRetry = false;
    } else if (error.name === 'SecurityError') {
        errorInfo.type = 'SECURITY_ERROR';
        errorInfo.userFriendlyMessage = '🔒 Security error occurred. Please ensure you\'re using HTTPS and try again.';
        errorInfo.canRetry = true;
    } else if (error.name === 'InvalidStateError') {
        errorInfo.type = 'INVALID_STATE';
        errorInfo.userFriendlyMessage = '⚠️ Biometric authentication is already in progress. Please wait and try again.';
        errorInfo.canRetry = true;
    } else if (error.name === 'ConstraintError') {
        errorInfo.type = 'CONSTRAINT_ERROR';
        errorInfo.userFriendlyMessage = '🔧 Biometric authentication constraint error. Please check your device settings.';
        errorInfo.canRetry = true;
    } else if (error.name === 'TimeoutError') {
        errorInfo.type = 'TIMEOUT';
        errorInfo.userFriendlyMessage = '⏰ Biometric authentication timed out. Please try again.';
        errorInfo.canRetry = true;
    } else if (error.name === 'AbortError') {
        errorInfo.type = 'USER_CANCELLED';
        errorInfo.userFriendlyMessage = '👆 Biometric authentication was cancelled. Please try again when ready.';
        errorInfo.canRetry = true;
    }
    // Handle custom error messages
    else if (error.message === 'USER_CANCELLED') {
        errorInfo.type = 'USER_CANCELLED';
        errorInfo.userFriendlyMessage = '👆 Biometric authentication was cancelled. Please try again when ready.';
        errorInfo.canRetry = true;
    } else if (error.message === 'BIOMETRIC_NOT_SETUP') {
        errorInfo.type = 'NOT_SETUP';
        errorInfo.userFriendlyMessage = '🔧 Biometric authentication is not set up for your account. Please sign in with email/password first, then enable biometric authentication in your account settings.';
        errorInfo.canRetry = false;
        errorInfo.requiresSetup = true;
    } else if (error.message?.includes('SERVICE_UNAVAILABLE')) {
        errorInfo.type = 'SERVICE_UNAVAILABLE';
        errorInfo.userFriendlyMessage = '🔧 Authentication service is temporarily unavailable. Please try again in a moment or use email/password login.';
        errorInfo.canRetry = true;
    } else if (error.message?.includes('BACKEND_ERROR:')) {
        errorInfo.type = 'BACKEND_ERROR';
        const backendError = error.message.replace('BACKEND_ERROR: ', '');
        errorInfo.userFriendlyMessage = `🔧 Server error: ${backendError}. Please try again or use email/password login.`;
        errorInfo.canRetry = true;
    } else if (error.message?.includes('LOGIN_ERROR:')) {
        errorInfo.type = 'LOGIN_ERROR';
        const loginError = error.message.replace('LOGIN_ERROR: ', '');
        errorInfo.userFriendlyMessage = `🔐 Login failed: ${loginError}. Please try again or use email/password login.`;
        errorInfo.canRetry = true;
    } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        errorInfo.type = 'NETWORK_ERROR';
        errorInfo.userFriendlyMessage = '🌐 Network error occurred. Please check your internet connection and try again.';
        errorInfo.canRetry = true;
    } else {
        errorInfo.type = 'UNKNOWN';
        errorInfo.userFriendlyMessage = `❌ Biometric authentication failed: ${error.message || 'Unknown error'}. Please try again or use email/password login.`;
        errorInfo.canRetry = true;
    }

    return errorInfo;
}

/**
 * Get user-friendly error message for biometric authentication
 */
export function getBiometricErrorMessage(error: any): string {
    const errorInfo = parseBiometricError(error);
    return errorInfo.userFriendlyMessage;
}

/**
 * Check if biometric authentication can be retried after an error
 */
export function canRetryBiometric(error: any): boolean {
    const errorInfo = parseBiometricError(error);
    return errorInfo.canRetry;
}

/**
 * Check if biometric setup is required
 */
export function requiresBiometricSetup(error: any): boolean {
    const errorInfo = parseBiometricError(error);
    return errorInfo.requiresSetup || false;
}

/**
 * Log biometric error with detailed information for debugging
 */
export function logBiometricError(error: any, context: string = 'Biometric Authentication') {
    const errorInfo = parseBiometricError(error);

    }

/**
 * Get biometric support status message for UI
 */
export function getBiometricSupportMessage(supportInfo: BiometricSupportInfo): string {
    if (supportInfo.isSupported) {
        return '🔐 Biometric authentication is available on this device.';
    } else if (!supportInfo.isSecureContext) {
        return '🔒 Biometric authentication requires HTTPS connection.';
    } else if (!supportInfo.hasWebAuthn || !supportInfo.hasCredentials) {
        return '🔧 Biometric authentication is not supported in this browser.';
    } else if (supportInfo.error) {
        return `🔧 ${supportInfo.error}`;
    } else {
        return '🔧 Biometric authentication not available on this device.';
    }
}

/**
 * Get biometric requirements message for UI
 */
export function getBiometricRequirementsMessage(): string {
    return 'Requirements: HTTPS connection, modern browser, and biometric-capable device.';
}
