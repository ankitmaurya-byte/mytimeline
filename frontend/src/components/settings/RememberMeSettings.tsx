import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Monitor,
    Smartphone,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Clock,
    Shield,
    Globe,
    Computer,
    Tablet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/useAuthContext';
import { useTheme } from '@/context/theme-context';
import API from '@/lib/axios-client';

interface RememberMeSession {
    tokenId: string;
    deviceId: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent: string;
    lastUsed: string;
    createdAt: string;
    expiresAt: string;
}

interface RememberMeSettingsProps {
    className?: string;
    onStatusChange?: () => void;
}

export function RememberMeSettings({ className, onStatusChange }: RememberMeSettingsProps) {
    const [isRememberMeEnabled, setIsRememberMeEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<RememberMeSession[]>([]);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);

    const { toast } = useToast();
    const { user } = useAuthContext();
    const { isDark } = useTheme();

    useEffect(() => {
        loadRememberMeSessions();
    }, []);

    const loadRememberMeSessions = async () => {
        try {
            const response = await API.get('/auth/remember-me');
            setSessions(response.data.sessions || []);
            setIsRememberMeEnabled(response.data.sessions && response.data.sessions.length > 0);
        } catch (error) {
            console.error('Error loading remember me sessions:', error);
        }
    };

    const handleRememberMeToggle = async (enabled: boolean) => {
        if (!enabled) {
            // Disable remember me by revoking all tokens
            setIsLoading(true);
            try {
                await revokeAllTokens();
                setIsRememberMeEnabled(false);
                onStatusChange?.(); // Notify parent component of status change
                toast({
                    title: "Remember me disabled",
                    description: "All remembered devices have been logged out.",
                });
            } catch (error) {
                console.error('Error disabling remember me:', error);
                toast({
                    title: "Error",
                    description: "Failed to disable remember me. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Enable remember me by generating a token for current device
        setIsGeneratingToken(true);
        try {
            await generateRememberMeToken();
            setIsRememberMeEnabled(true);
            onStatusChange?.(); // Notify parent component of status change
            toast({
                title: "Remember me enabled",
                description: "This device will now be remembered for future logins.",
            });
        } catch (error) {
            console.error('Error enabling remember me:', error);
            toast({
                title: "Failed to enable remember me",
                description: "Please try again or contact support.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const generateRememberMeToken = async () => {
        try {
            // Generate a unique device ID
            const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Get device info
            const deviceInfo = getDeviceInfo();

            await API.post('/auth/remember-me', {
                deviceId,
                deviceInfo
            });
            await loadRememberMeSessions();
        } catch (error) {
            console.error('Error generating remember me token:', error);
            throw error;
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

    const revokeToken = async (tokenId: string) => {
        try {
            await API.delete(`/auth/remember-me?tokenId=${tokenId}`);
            await loadRememberMeSessions();
            onStatusChange?.(); // Notify parent component of status change
            toast({
                title: "Device removed",
                description: "This device will no longer be remembered.",
            });
        } catch (error) {
            console.error('Error revoking token:', error);
            toast({
                title: "Error",
                description: "Failed to remove device. Please try again.",
                variant: "destructive",
            });
        }
    };

    const revokeAllTokens = async () => {
        try {
            await API.delete('/auth/remember-me?action=all');
            setSessions([]);
            onStatusChange?.(); // Notify parent component of status change
        } catch (error) {
            console.error('Error revoking all tokens:', error);
            throw error;
        }
    };

    const getDeviceIcon = (deviceInfo: string) => {
        const iconClass = `h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`;

        if (deviceInfo.includes('Mobile')) {
            return <Smartphone className={iconClass} />;
        } else if (deviceInfo.includes('Tablet')) {
            return <Tablet className={iconClass} />;
        } else if (deviceInfo.includes('Mac') || deviceInfo.includes('Windows') || deviceInfo.includes('Linux')) {
            return <Computer className={iconClass} />;
        } else {
            return <Monitor className={iconClass} />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const isCurrentDevice = (session: RememberMeSession) => {
        // Simple check - you might want to implement a more sophisticated device identification
        const currentDeviceInfo = getDeviceInfo();
        return session.deviceInfo === currentDeviceInfo;
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Remember Me
                </CardTitle>
                <CardDescription>
                    Stay logged in on trusted devices for up to 14 days
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium">Enable Remember Me</h4>
                        <p className="text-sm text-muted-foreground">
                            Stay logged in on this device without entering your password
                        </p>
                    </div>
                    <Switch
                        checked={isRememberMeEnabled}
                        onCheckedChange={handleRememberMeToggle}
                        disabled={isLoading || isGeneratingToken}
                        className={`${isRememberMeEnabled
                            ? isDark
                                ? 'data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
                                : 'data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600'
                            : isDark
                                ? 'data-[state=unchecked]:bg-muted-foreground/20 data-[state=unchecked]:border-muted-foreground/30'
                                : 'data-[state=unchecked]:bg-muted-foreground/20 data-[state=unchecked]:border-muted-foreground/30'
                            }`}
                    />
                </div>

                <Separator />

                {/* Active Sessions */}
                {isRememberMeEnabled && sessions.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Trusted Devices</h4>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    {sessions.length} device{sessions.length !== 1 ? 's' : ''}
                                </Badge>
                                {sessions.length > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={revokeAllTokens}
                                        disabled={isLoading}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        Revoke All
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={session.tokenId}
                                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isCurrentDevice(session)
                                        ? isDark
                                            ? 'bg-primary/10 border-primary/30'
                                            : 'bg-primary/5 border-primary/20'
                                        : isDark
                                            ? 'bg-muted/30 border-border hover:bg-muted/50'
                                            : 'bg-background border-border hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full transition-colors ${isDark ? 'bg-primary/20' : 'bg-primary/10'
                                            }`}>
                                            {getDeviceIcon(session.deviceInfo)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">
                                                    {session.deviceInfo}
                                                </p>
                                                {isCurrentDevice(session) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Current Device
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Last used: {formatDate(session.lastUsed)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                IP: {session.ipAddress}
                                            </p>
                                        </div>
                                    </div>

                                    {!isCurrentDevice(session) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => revokeToken(session.tokenId)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Status Indicator */}
                <div className="flex items-start gap-2 text-sm">
                    {isRememberMeEnabled ? (
                        <>
                            <CheckCircle className={`h-4 w-4 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                            <span className={isDark ? 'text-green-300' : 'text-green-700'}>
                                Remember me is active on {sessions.length} device{sessions.length !== 1 ? 's' : ''}
                                {sessions.length > 0 && (
                                    <span className="block text-xs text-muted-foreground mt-1">
                                        You'll be automatically logged in on these devices
                                    </span>
                                )}
                            </span>
                        </>
                    ) : (
                        <>
                            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Remember me is disabled</span>
                        </>
                    )}
                </div>
                {/* Security Information */}
                <div className="p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5" />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Security Features</h4>
                            <ul className="text-xs dark:text-white space-y-1">
                                <li>• Maximum 3 devices per user</li>
                                <li>• 14-day session expiry with automatic cleanup</li>
                                <li>• IP address and device tracking</li>
                                <li>• Revoke individual devices anytime</li>
                                <li>• Secure token generation and storage</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Security Warnings */}
                {isRememberMeEnabled && (
                    <div className="space-y-3">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Security Tip:</strong> Only enable "Remember Me" on your personal devices.
                                Avoid using this feature on public computers or shared devices.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

