"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Shield,
    Smartphone,
    Clock,
    ArrowLeft,
    Settings as SettingsIcon,
    CheckCircle,
    AlertTriangle,
    XCircle
} from "lucide-react";
import { useAuthContext } from "@/context/useAuthContext";
import { useBiometricContext } from "@/context/useBiometricContext";
import { useTheme } from "@/context/theme-context";
import useWorkspaceId from "@/hooks/use-workspace-id";
import Link from "next/link";
import { BiometricAuthSettings } from "@/components/settings/BiometricAuthSettings";
import { RememberMeSettings } from "@/components/settings/RememberMeSettings";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { Permissions } from "@/constant";
import ClientOnly from "@/components/client-only";
import API from "@/lib/axios-client";

const SecuritySettings = () => {
    return (
        <ClientOnly fallback={
            <div className="w-full min-h-[80vh] py-6 bg-gradient-to-br from-background to-muted/40 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading security settings...</p>
                </div>
            </div>
        }>
            <SecuritySettingsContent />
        </ClientOnly>
    );
};

// Separate component that uses context - only rendered on client
const SecuritySettingsContent = () => {
    const { user, hasPermission, isLoading } = useAuthContext();
    const { isBiometricEnabled, hasBiometricSessions } = useBiometricContext();
    const { isDark } = useTheme();
    const workspaceId = useWorkspaceId();
    const [activeTab, setActiveTab] = useState("biometric");
    const [rememberMeSessions, setRememberMeSessions] = useState<any[]>([]);
    const [isLoadingSecurityStatus, setIsLoadingSecurityStatus] = useState(true);

    // Load security status data
    useEffect(() => {
        loadSecurityStatus();
    }, []);

    const loadSecurityStatus = async () => {
        try {
            setIsLoadingSecurityStatus(true);
            // Load remember me sessions
            const rememberMeResponse = await API.get('/auth/remember-me');
            setRememberMeSessions(rememberMeResponse.data.sessions || []);
        } catch (error) {
            console.error('Error loading security status:', error);
        } finally {
            setIsLoadingSecurityStatus(false);
        }
    };

    // Function to refresh security status (can be called by child components)
    const refreshSecurityStatus = () => {
        loadSecurityStatus();
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return null;
    }

    // Calculate security status
    const biometricStatus = hasBiometricSessions ? 'enabled' : 'disabled';
    const rememberMeStatus = rememberMeSessions.length > 0 ? 'enabled' : 'disabled';
    const accountStatus = user ? 'verified' : 'unverified'; // Assume verified if user exists

    return (
        <div className="w-full min-h-[80vh] py-3 sm:py-6 bg-gradient-to-br from-background to-muted/40">
            <main>
                <div className="w-full max-w-4xl mx-auto px-3 sm:px-6">
                    {/* Breadcrumb Navigation */}
                    <div className="flex items-center gap-2 mb-4 sm:mb-6 text-sm text-muted-foreground">
                        <Link href={`/workspace/${workspaceId}/settings`} className="hover:text-primary transition-colors">
                            <SettingsIcon className="h-4 w-4 inline mr-1" />
                            Settings
                        </Link>
                        <span>/</span>
                        <span className="text-primary font-medium">Security</span>
                    </div>

                    <div className="bg-white/90 dark:bg-black/60 rounded-xl sm:rounded-2xl shadow-xl border border-border p-3 sm:p-6">
                        <div className="flex items-center gap-3 mb-4 sm:mb-6">
                            <Link href={`/workspace/${workspaceId}/settings`}>
                                <Button variant="ghost" size="sm" className="p-2">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-white tracking-tight">
                                    Security Settings
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground">
                                    Manage your workspace security preferences and authentication methods
                                </p>
                            </div>
                        </div>

                        {/* Security Overview */}
                        <Card className={`mb-6 transition-all duration-300 ${accountStatus === 'verified' && biometricStatus === 'enabled' && rememberMeStatus === 'enabled'
                            ? isDark
                                ? 'bg-gradient-to-r from-green-950/30 to-emerald-950/30 border-green-800/50 shadow-green-500/10'
                                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-500/10'
                            : isDark
                                ? 'bg-gradient-to-r from-amber-950/30 to-orange-950/30 border-amber-800/50 shadow-amber-500/10'
                                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-amber-500/10'
                            }`}>
                            <CardHeader>
                                <CardTitle className={`flex items-center gap-2 ${accountStatus === 'verified' && biometricStatus === 'enabled' && rememberMeStatus === 'enabled'
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-amber-700 dark:text-amber-300'
                                    }`}>
                                    <Shield className="h-5 w-5" />
                                    Security Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSecurityStatus ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        <span className="ml-2 text-sm text-muted-foreground">Loading security status...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                {accountStatus === 'verified' ? (
                                                    <CheckCircle className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                                ) : (
                                                    <XCircle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                                                )}
                                                <div className={`text-lg font-bold ${accountStatus === 'verified'
                                                    ? isDark ? 'text-green-400' : 'text-green-600'
                                                    : isDark ? 'text-red-400' : 'text-red-600'
                                                    }`}>
                                                    {accountStatus === 'verified' ? 'Verified' : 'Unverified'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">Email Status</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                {biometricStatus === 'enabled' ? (
                                                    <CheckCircle className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                                ) : (
                                                    <AlertTriangle className={`h-5 w-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                                                )}
                                                <div className={`text-lg font-bold ${biometricStatus === 'enabled'
                                                    ? isDark ? 'text-blue-400' : 'text-blue-600'
                                                    : isDark ? 'text-orange-400' : 'text-orange-600'
                                                    }`}>
                                                    {biometricStatus === 'enabled' ? 'Enabled' : 'Disabled'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">Biometric Auth</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                {rememberMeStatus === 'enabled' ? (
                                                    <CheckCircle className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                                ) : (
                                                    <Clock className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                                )}
                                                <div className={`text-lg font-bold ${rememberMeStatus === 'enabled'
                                                    ? isDark ? 'text-purple-400' : 'text-purple-600'
                                                    : isDark ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    {rememberMeStatus === 'enabled' ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">Remember Me</div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tab Navigation */}
                        <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
                            <Button
                                variant={activeTab === "biometric" ? "default" : "outline"}
                                onClick={() => setActiveTab("biometric")}
                                className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                            >
                                <Smartphone className="h-4 w-4" />
                                Biometric Auth
                            </Button>
                            <Button
                                variant={activeTab === "remember-me" ? "default" : "outline"}
                                onClick={() => setActiveTab("remember-me")}
                                className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                            >
                                <Clock className="h-4 w-4" />
                                Remember Me
                            </Button>
                            {hasPermission && hasPermission(Permissions.MANAGE_WORKSPACE_SETTINGS) && (
                                <Button
                                    variant={activeTab === "user-management" ? "default" : "outline"}
                                    onClick={() => setActiveTab("user-management")}
                                    className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                                >
                                    <Shield className="h-4 w-4" />
                                    User Management
                                </Button>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-6">
                            {activeTab === "biometric" && (
                                <BiometricAuthSettings onStatusChange={refreshSecurityStatus} />
                            )}

                            {activeTab === "remember-me" && (
                                <RememberMeSettings onStatusChange={refreshSecurityStatus} />
                            )}

                            {activeTab === "user-management" && hasPermission && hasPermission(Permissions.MANAGE_WORKSPACE_SETTINGS) && (
                                <UserManagementPanel workspaceId={workspaceId} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SecuritySettings;

// Prevent static generation to avoid context errors
export const dynamic = 'force-dynamic';
