import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import API from '@/lib/axios-client';

interface BiometricLoginButtonProps {
    className?: string;
    onSuccess?: (userData: any) => void;
    onError?: (error: string) => void;
}

export function BiometricLoginButton({
    className,
    onSuccess,
    onError
}: BiometricLoginButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Check biometric support on mount
    React.useEffect(() => {
        checkBiometricSupport();
    }, []);

    // Detect if device is mobile
    const detectMobileDevice = () => {
        const userAgent = navigator.userAgent;
        const mobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        setIsMobile(mobile);
        return mobile;
    };

    const checkBiometricSupport = async () => {
        try {
            const mobileDevice = detectMobileDevice();

            // For both mobile and desktop, check WebAuthn support
            if (window.PublicKeyCredential) {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                setIsSupported(available);
            } else {
                setIsSupported(false);
            }
        } catch (error) {
            console.error('Error checking biometric support:', error);
            setIsSupported(false);
        }
    };

    const handleBiometricLogin = async () => {
        if (!isSupported) {
            toast({
                title: "Biometric not supported",
                description: "Your device doesn't support biometric authentication.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            // Both mobile and desktop use the same WebAuthn approach
            await handleWebAuthnLogin();
        } catch (error: any) {
            console.error('Biometric login error:', error);
            handleLoginError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWebAuthnLogin = async () => {
        try {
            const deviceType = isMobile ? 'Mobile' : 'Desktop';
            // Check if WebAuthn is available
            if (!navigator.credentials) {
                throw new Error('WebAuthn is not available in this browser. Please use a modern browser that supports biometric authentication.');
            }

            // Get authentication options from backend
            const optionsResponse = await API.post('/auth/biometric/options', {
                rpId: window.location.hostname
            });

            if (!optionsResponse.data.success) {
                throw new Error(optionsResponse.data.error || 'Failed to get authentication options');
            }

            const { challenge, allowCredentials, timeout } = optionsResponse.data;

            // Trigger WebAuthn authentication (this will show fingerprint/face ID on mobile, Touch ID on desktop)
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
                throw new Error('Biometric authentication was cancelled or failed');
            }

            // Send minimal credential payload to avoid serialization issues
            const pkc = credential as PublicKeyCredential;
            const response = await API.post('/auth/biometric/login', {
                credential: {
                    id: pkc.id,
                    type: 'public-key'
                }
            });

            if (response.data.success) {
                handleLoginSuccess(response.data);
            } else {
                throw new Error(response.data.error || 'Login failed');
            }
        } catch (error: any) {
            const deviceType = isMobile ? 'Mobile' : 'Desktop';
            throw error;
        }
    };

    const handleLoginSuccess = (data: any) => {
        // User is logged in without password!
        toast({
            title: "Login successful!",
            description: "Welcome back!",
        });

        // Call success callback if provided
        if (onSuccess) {
            onSuccess(data.user);
        } else {
            // Default behavior: redirect to dashboard
            router.push('/dashboard');
        }
    };

    const handleLoginError = (error: any) => {
        const errorMessage = error.message || 'Biometric authentication failed';

        toast({
            title: "Login failed",
            description: errorMessage,
            variant: "destructive",
        });

        if (onError) {
            onError(errorMessage);
        }
    };

    if (!isSupported) {
        return null; // Don't render the button if not supported
    }

    return (
        <Button
            onClick={handleBiometricLogin}
            disabled={isLoading}
            variant="outline"
            className={className}
        >
            {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Authenticating...
                </>
            ) : (
                <>
                    {isMobile ? (
                        <Smartphone className="h-4 w-4 mr-2" />
                    ) : (
                        <Fingerprint className="h-4 w-4 mr-2" />
                    )}
                    Login with Biometrics
                </>
            )}
        </Button>
    );
}
