import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function BiometricLoginDemo() {
    const { toast } = useToast();

    const handleTraditionalLogin = async (email: string, password: string) => {
        // Simulate traditional login
        toast({
            title: "Login successful",
            description: "Traditional email/password login completed.",
        });
    };

    const handleBiometricSuccess = (userData: any) => {
        toast({
            title: "Biometric login successful!",
            description: `Welcome back, ${userData.name}!`,
        });
    };

    const handleBiometricError = (error: string) => {
        toast({
            title: "Biometric login failed",
            description: error,
            variant: "destructive",
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg">How It Works</CardTitle>
                        <CardDescription>
                            Smart login form that adapts to your biometric settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p>
                                <strong>Biometric Enabled:</strong> Shows biometric login button first,
                                then traditional form below
                            </p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p>
                                <strong>Biometric Disabled:</strong> Shows only traditional login form
                                with a hint to enable biometrics
                            </p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p>
                                <strong>True Passwordless:</strong> Users can log in with just
                                fingerprint/Face ID when enabled
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}