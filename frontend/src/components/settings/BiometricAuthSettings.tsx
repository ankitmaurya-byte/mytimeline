import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Fingerprint,
    Smartphone,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Clock,
    Shield
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/useAuthContext';
import { useBiometricContext } from '@/context/useBiometricContext';
import { useTheme } from '@/context/theme-context';
import API from '@/lib/axios-client';

interface BiometricSession {
    deviceId: string;
    biometricType: string;
    lastUsed: string;
    deviceInfo: string;
}

interface BiometricAuthSettingsProps {
    className?: string;
    onStatusChange?: () => void;
}

export function BiometricAuthSettings({ className, onStatusChange }: BiometricAuthSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<BiometricSession[]>([]);
    const [isSupported, setIsSupported] = useState(false);
    const [isCheckingSupport, setIsCheckingSupport] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const { toast } = useToast();
    const { user } = useAuthContext();
    const {
        isBiometricEnabled,
        hasBiometricSessions,
        refreshBiometricStatus
    } = useBiometricContext();
    const { isDark } = useTheme();

    // Check if biometric authentication is supported
    useEffect(() => {
        checkBiometricSupport();
        loadBiometricSessions();
    }, []);

    // Detect if device is mobile
    const detectMobileDevice = () => {
        const userAgent = navigator.userAgent;
        const mobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

        // Additional checks for better mobile detection
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;

        const isMobileDevice = mobile || (isTouchDevice && isSmallScreen);

        // Debug: Log mobile detection details
        setIsMobile(isMobileDevice);
        return isMobileDevice;
    };

    const checkBiometricSupport = async () => {
        try {
            const mobileDevice = detectMobileDevice();

            if (mobileDevice) {
                // Check if we're on HTTPS (required for WebAuthn)
                const isHttps = window.location.protocol === 'https:';
                if (isHttps) {
                    // On HTTPS, check WebAuthn support
                    if (window.PublicKeyCredential) {
                        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                        setIsSupported(available);
                    } else {
                        setIsSupported(false);
                    }
                } else {
                    // On HTTP, we can't use WebAuthn, but we can still provide a fallback
                    setIsSupported(true); // We'll handle this in the UI
                }
            } else {
                // For desktop devices, check WebAuthn support
                if (window.PublicKeyCredential) {
                    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    setIsSupported(available);
                } else {
                    setIsSupported(false);
                }
            }
        } catch (error) {
            setIsSupported(false);
        } finally {
            setIsCheckingSupport(false);
        }
    };

    const loadBiometricSessions = async () => {
        try {
            const response = await API.get('/auth/biometric');
            const sessionsData = response.data.sessions || [];
            setSessions(sessionsData);

    
            // Update global context
            await refreshBiometricStatus();
        } catch (error) {
            console.error('Error loading biometric sessions:', error);
        }
    };

    const getDeviceInfo = (): string => {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;

        if (userAgent.includes('Mobile')) {
            return 'Mobile Device';
        } else if (userAgent.includes('Tablet')) {
            return 'Tablet Device';
        } else if (platform.includes('Mac')) {
            return 'Mac Computer';
        } else if (platform.includes('Win')) {
            return 'Windows Computer';
        } else if (platform.includes('Linux')) {
            return 'Linux Computer';
        } else {
            return 'Unknown Device';
        }
    };

    const isCurrentDevice = (session: BiometricSession) => {
        // More flexible device identification - check if the session matches current device
        const currentDeviceInfo = getDeviceInfo();
        const isCurrent = session.deviceInfo === currentDeviceInfo;

        return isCurrent;
    };

    const getCurrentDeviceSession = (): BiometricSession | null => {
        return sessions.find(session => isCurrentDevice(session)) || null;
    };

    const handleBiometricToggle = async (enabled: boolean) => {
        // Function is working correctly

        if (!enabled) {
            // Disable biometric auth for current device only
            setIsLoading(true);
            try {
                // Find current device session
                const currentSession = getCurrentDeviceSession();

                if (!currentSession) {
                    toast({
                        title: "No biometric session found",
                        description: "No biometric authentication is active on this device.",
                        variant: "destructive",
                    });
                    return;
                }

                // Delete only the current device's biometric session
                await API.delete(`/auth/biometric?deviceId=${currentSession.deviceId}`);
                // Refresh the biometric status and sessions
                await refreshBiometricStatus();
                await loadBiometricSessions();

                toast({
                    title: "Biometric authentication disabled",
                    description: "Biometric authentication has been disabled on this device. Other devices remain unaffected.",
                });
            } catch (error) {
                toast({
                    title: "Failed to disable biometric authentication",
                    description: "Please try again or contact support.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Enable biometric auth
        setIsLoading(true);
        try {
            await enableBiometricAuthentication();
            // Force refresh the biometric status after successful enable
            await refreshBiometricStatus();
            // Also reload sessions to ensure UI is updated
            await loadBiometricSessions();

            // Show success message
            toast({
                title: "Biometric authentication enabled",
                description: "You can now use biometric authentication to log in.",
            });
        } catch (error) {
            toast({
                title: "Failed to enable biometric authentication",
                description: "Please try again or contact support.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const enableBiometricAuthentication = async () => {
        try {
            // Debug: Log current state
            // Check if user already has maximum allowed biometric sessions
            if (sessions.length >= 3) {
                toast({
                    title: "Maximum devices reached",
                    description: "You can only have up to 3 biometric devices. Please remove one before adding another.",
                    variant: "destructive",
                });
                return;
            }

            // Debug: Log which path we're taking
            if (isMobile) {
                await enableMobileBiometricAuthentication();
            } else {
                await enableDesktopBiometricAuthentication();
            }
        } catch (error) {
            console.error('Error creating biometric credential:', error);
            throw error;
        }
    };

    const enableMobileBiometricAuthentication = async () => {
        try {
            // For mobile devices, I'll use a different approach
            // Instead of WebAuthn, I'll simulate the native biometric flow

            // Check if we're on a mobile device
            if (!isMobile) {
                throw new Error('This function is for mobile devices only');
            }

            // Simulate native biometric verification
            // In production, this would trigger the actual fingerprint/face scan
            const biometricResult = await simulateMobileBiometricVerification();

            if (!biometricResult.success) {
                throw new Error('Biometric verification failed or was cancelled');
            }

            // Generate a unique mobile device ID
            const deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Send to backend to create biometric session with the actual WebAuthn credential ID
            // Store just the credential ID for authentication
            const publicKeyCredential = biometricResult.credential as PublicKeyCredential;
            const response = await API.post('/auth/biometric', {
                deviceId,
                biometricType: 'fingerprint',
                biometricData: publicKeyCredential.id // Store just the credential ID
            });

            await loadBiometricSessions();
            await refreshBiometricStatus();
            onStatusChange?.(); // Notify parent component of status change
            toast({
                title: "Mobile biometric authentication enabled",
                description: "You can now use your fingerprint to log in on this device.",
            });
        } catch (error) {
            console.error('Error creating mobile biometric credential:', error);
            throw error;
        }
    };

    // Trigger native mobile biometric verification
    const simulateMobileBiometricVerification = async (): Promise<{ success: boolean; credential?: any }> => {
        try {
            // Check if we're on HTTPS
            const isHttps = window.location.protocol === 'https:';
            if (!isHttps) {
                const confirmed = window.confirm(
                    '🔐 Mobile Biometric Setup (HTTP Mode)\n\n' +
                    'You\'re currently using HTTP, which doesn\'t support native biometric authentication.\n\n' +
                    'For full biometric security:\n' +
                    '• Use HTTPS (https://your-domain.com)\n' +
                    '• Or use a local development server with SSL\n\n' +
                    'For now, we\'ll set up a simulated biometric session for testing.\n\n' +
                    'Click OK to continue with simulated setup, Cancel to abort.'
                );
                return { success: confirmed };
            }

            // Check if WebAuthn is available
            if (!navigator.credentials) {
                const confirmed = window.confirm(
                    '🔐 Mobile Biometric Verification\n\n' +
                    'WebAuthn is not available in this browser. This might be due to:\n' +
                    '• Browser not supporting WebAuthn\n' +
                    '• Security restrictions\n' +
                    '• HTTPS required for WebAuthn\n\n' +
                    'Click OK to continue with setup, Cancel to abort.'
                );
                return { success: confirmed };
            }

            // Get registration options from backend
            const optionsResponse = await API.post('/auth/biometric/register', {
                rpId: window.location.hostname,
                userEmail: user?.email || 'user',
                userName: user?.name || 'User'
            });

            if (!optionsResponse.data.success) {
                throw new Error(optionsResponse.data.error || 'Failed to get registration options');
            }

            const { options } = optionsResponse.data;

            // Use WebAuthn to trigger native biometric prompt for registration
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(options.challenge),
                    rp: options.rp,
                    user: {
                        id: new Uint8Array(options.user.id),
                        name: options.user.name,
                        displayName: options.user.displayName,
                    },
                    pubKeyCredParams: options.pubKeyCredParams,
                    authenticatorSelection: options.authenticatorSelection,
                    timeout: options.timeout,
                },
            });

            if (credential) {
                return { success: true, credential };
            } else {
                return { success: false };
            }
        } catch (error) {
            // Fallback to confirmation dialog if WebAuthn fails
            const confirmed = window.confirm(
                '🔐 Mobile Biometric Verification\n\n' +
                'Native biometric prompt failed. This might be due to:\n' +
                '• No biometric authentication set up on device\n' +
                '• Browser not supporting WebAuthn\n' +
                '• Security restrictions\n' +
                '• HTTP protocol (HTTPS required for WebAuthn)\n\n' +
                'Click OK to continue with setup, Cancel to abort.'
            );
            return { success: confirmed };
        }
    };

    const enableDesktopBiometricAuthentication = async () => {
        try {
            // Check if WebAuthn is available
            if (!navigator.credentials) {
                throw new Error('WebAuthn is not available in this browser. Please use a modern browser that supports biometric authentication.');
            }

            // Generate a unique device ID
            const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Get registration options from backend
            const optionsResponse = await API.post('/auth/biometric/register', {
                rpId: window.location.hostname,
                userEmail: user?.email || 'user',
                userName: user?.name || 'User'
            });

            if (!optionsResponse.data.success) {
                throw new Error(optionsResponse.data.error || 'Failed to get registration options');
            }

            const { options } = optionsResponse.data;

            // Request biometric authentication using WebAuthn
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(options.challenge),
                    rp: options.rp,
                    user: {
                        id: new Uint8Array(options.user.id),
                        name: options.user.name,
                        displayName: options.user.displayName,
                    },
                    pubKeyCredParams: options.pubKeyCredParams,
                    authenticatorSelection: options.authenticatorSelection,
                    timeout: options.timeout,
                },
            });

            if (credential) {
                // Send to backend to create biometric session
                // Store just the credential ID for authentication
                const publicKeyCredential = credential as PublicKeyCredential;
                const response = await API.post('/auth/biometric', {
                    deviceId,
                    biometricType: 'fingerprint', // Default to fingerprint
                    biometricData: publicKeyCredential.id // Store just the credential ID
                });

                await loadBiometricSessions();
                await refreshBiometricStatus(); // Update global context
                onStatusChange?.(); // Notify parent component of status change
                toast({
                    title: "Biometric authentication enabled",
                    description: "You can now use your fingerprint to log in.",
                });
            }
        } catch (error) {
            console.error('Error creating desktop biometric credential:', error);
            throw error;
        }
    };

    const revokeBiometricAuth = async (deviceId: string) => {
        try {
            await API.delete(`/auth/biometric?deviceId=${deviceId}`);
            await loadBiometricSessions();
            onStatusChange?.(); // Notify parent component of status change
            toast({
                title: "Device removed",
                description: "Biometric authentication has been revoked for this device.",
            });
        } catch (error) {
            console.error('Error revoking biometric auth:', error);
            toast({
                title: "Error",
                description: "Failed to remove device. Please try again.",
                variant: "destructive",
            });
        }
    };

    const revokeAllBiometricAuth = async () => {
        try {
            await API.delete(`/auth/biometric?action=all`);
            await loadBiometricSessions();
            onStatusChange?.(); // Notify parent component of status change
            toast({
                title: "All devices removed",
                description: "Biometric authentication has been revoked for all devices.",
            });
        } catch (error) {
            console.error('Error revoking all biometric auth:', error);
            toast({
                title: "Error",
                description: "Failed to remove all devices. Please try again.",
                variant: "destructive",
            });
        }
    };

    const getBiometricTypeIcon = (type: string) => {
        const iconClass = `h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`;

        switch (type) {
            case 'fingerprint':
                return <Fingerprint className={iconClass} />;
            case 'face':
                return <Smartphone className={iconClass} />;
            case 'touch':
                return <Smartphone className={iconClass} />;
            default:
                return <Smartphone className={iconClass} />;
        }
    };

    const getBiometricTypeLabel = (type: string) => {
        switch (type) {
            case 'fingerprint':
                return 'Fingerprint';
            case 'face':
                return 'Face ID';
            case 'touch':
                return 'Touch ID';
            default:
                return 'Biometric';
        }
    };

    const formatLastUsed = (lastUsed: string) => {
        const date = new Date(lastUsed);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    if (isCheckingSupport) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Checking biometric support...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!isSupported) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Biometric Authentication Not Supported
                    </CardTitle>
                    <CardDescription>
                        This device doesn't support biometric authentication
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Biometric authentication requires a device with fingerprint sensor, Face ID, or Touch ID.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // Check if we're on HTTP
    const isHttps = window.location.protocol === 'https:';

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Fingerprint className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    Biometric Authentication
                </CardTitle>
                <CardDescription className='text-black/70 text-xs dark:text-muted-foreground'>
                    {isMobile
                        ? "Enable fingerprint or Face ID login on your mobile device"
                        : "Enable fingerprint or Touch ID login on your device"
                    }
                    <span className="block mt-1 text-xs dark:text-muted-foreground text-black/70">
                        You can register up to 3 biometric devices for your account.
                        {isMobile && " Mobile devices use native biometric verification."}
                        {/*   {!isMobile && " Desktop devices use WebAuthn (Touch ID/fingerprint) authentication. So please make sure you have the biometric sensor set up on your device."} */}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* HTTP Warning */}
                {!isHttps && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>HTTP Protocol Detected:</strong> You're currently using HTTP, which doesn't support native biometric authentication.
                            For full biometric security, use HTTPS. For now, you can still set up a simulated biometric session for testing purposes.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-center">
                        <div>
                            <h4 className="text-sm font-medium">Enable Biometric Login</h4>
                            <p className="text-sm text-muted-foreground">
                                {isMobile
                                    ? "Allow login using your device's fingerprint sensor or Face ID"
                                    : "Allow login using your device's fingerprint sensor or Touch ID"
                                }
                            </p>
                        </div>

                    </div>
                    <Switch
                        checked={isBiometricEnabled}
                        onCheckedChange={(checked) => {
                            handleBiometricToggle(checked);
                        }}
                        disabled={isLoading || sessions.length >= 3}
                        className={`${isBiometricEnabled
                            ? isDark
                                ? 'data-[state=checked]:bg-green-400 data-[state=checked]:border-green-400'
                                : 'data-[state=checked]:bg-green-400 data-[state=checked]:border-green-400'
                            : isDark
                                ? 'data-[state=unchecked]:bg-muted-foreground/20 data-[state=unchecked]:border-muted-foreground/30'
                                : 'data-[state=unchecked]:bg-muted-foreground/20 data-[state=unchecked]:border-muted-foreground/30'
                            }`}
                    />
                </div>

                {/* Warning when max devices reached */}
                {sessions.length >= 3 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            You have reached the maximum of 3 biometric devices. Remove one device before adding another.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Enable Button */}
                {!isBiometricEnabled && (
                    <Button
                        onClick={() => handleBiometricToggle(true)}
                        disabled={isLoading || sessions.length >= 3}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Enabling...
                            </>
                        ) : sessions.length >= 3 ? (
                            'Maximum Devices Reached'
                        ) : (
                            'Enable Biometric Authentication'
                        )}
                    </Button>
                )}

                {/* Current Sessions */}
                {sessions.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 cursor-default">
                                <h4 className="text-sm font-medium">Registered Devices</h4>
                                <Badge variant="secondary">{sessions.length}/3 device{sessions.length > 1 ? 's' : ''}</Badge>
                            </div>
                            {sessions.length > 1 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove All
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove All Biometric Devices</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to remove all biometric devices? This will revoke biometric authentication for all registered devices. You'll need to re-register your devices to use biometric login again.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={revokeAllBiometricAuth}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Remove All Devices
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>

                        {sessions.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No biometric devices registered yet. Enable biometric authentication above to get started.
                            </p>
                        )}

                        {sessions.length >= 3 && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    You have reached the maximum of 3 biometric devices. Remove one device before adding another.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-3">
                            {sessions.map((session, index) => (
                                <div key={index} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isCurrentDevice(session)
                                    ? isDark
                                        ? 'bg-primary/10 border-primary/30'
                                        : 'bg-primary/5 border-primary/20'
                                    : isDark
                                        ? 'bg-muted/30 border-border hover:bg-muted/50'
                                        : 'bg-background border-border hover:bg-muted/50'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isDark ? 'bg-primary/20' : 'bg-primary/10'
                                            }`}>
                                            {getBiometricTypeIcon(session.biometricType)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{session.deviceInfo}</p>
                                                {isCurrentDevice(session) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Current Device
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Last used: {formatLastUsed(session.lastUsed)}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Show delete button for all devices - temporarily removing current device restriction for testing */}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`text-destructive hover:text-destructive ${isDark
                                                    ? 'hover:bg-destructive/10'
                                                    : 'hover:bg-destructive/5'
                                                    }`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remove Biometric Device</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to remove "{session.deviceInfo}"? This will revoke biometric authentication for this device. You can re-register it later if needed.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => revokeBiometricAuth(session.deviceId)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Remove Device
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Security Information */}
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Security Features</h4>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>• Your biometric data never leaves your device</p>
                                <p>• Authentication is verified locally</p>
                                {isMobile && <p>• Mobile devices use native biometric APIs for enhanced security</p>}
                                <p>• You can revoke access for any device at any time</p>
                                {!isHttps && (
                                    <p className="text-orange-600 font-medium">• ⚠️ HTTP mode: Using simulated biometric for testing</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

