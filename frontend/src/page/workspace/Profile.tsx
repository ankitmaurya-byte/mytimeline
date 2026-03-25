"use client";

import { useState, useRef } from "react";
import { useAuthContext } from "@/context/useAuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { getProfilePictureUrl, clearProfilePictureCache } from "@/lib/profile-picture-utils";
import { Camera, Mail, User, CalendarDays, Shield, Edit2, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserMutationFn, deleteAccountMutationFn } from "@/lib/api";
import { createAuthHeaders } from "@/lib/auth-utils";
import "@/lib/auth-debug"; // Import debug utilities
import { toast } from "@/hooks/use-toast";
import { DeleteAccountDialog } from "@/components/ui/delete-account-dialog";
import { useRouter } from "next/navigation";

const Profile = () => {
    const { user, isLoading } = useAuthContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(user?.name || "");
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const router = useRouter();

    const updateUserMutation = useMutation({
        mutationFn: updateUserMutationFn,
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Profile updated successfully",
                variant: "success",
            });
            setIsEditing(false);
            // Refresh user data with correct query key
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: deleteAccountMutationFn,
        onSuccess: () => {
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted",
                variant: "success",
            });
            // Clear all data and redirect to home
            queryClient.clear();
            router.push("/");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete account",
                variant: "destructive",
            });
        },
    });

    // Profile picture upload mutation
    const uploadProfilePictureMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('profilePicture', file);

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

            // Get authentication headers
            const headers = createAuthHeaders();

            const response = await fetch(`${backendUrl}/api/auth/update-profile-picture`, {
                method: 'POST',
                body: formData,
                credentials: 'include', // This will send HttpOnly cookies automatically
                headers: headers, // Include Authorization header
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Success",
                description: "Profile picture updated successfully",
                variant: "success",
            });
            // Clear profile picture cache for this user to force refresh
            if (user?._id) {
                clearProfilePictureCache(user._id);
            }
            // Refresh user data with correct query key
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to upload profile picture",
                variant: "destructive",
            });
        },
        onSettled: () => {
            setIsUploadingPicture(false);
        }
    });

    // Remove profile picture mutation
    const removeProfilePictureMutation = useMutation({
        mutationFn: async () => {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

            // Get authentication headers
            const headers = createAuthHeaders();

            const response = await fetch(`${backendUrl}/api/auth/update-profile-picture`, {
                method: 'DELETE',
                credentials: 'include', // Use HttpOnly cookies for auth
                headers: headers, // Include Authorization header
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Remove failed');
            }

            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Profile picture removed successfully",
                variant: "success",
            });
            // Clear profile picture cache for this user to force refresh
            if (user?._id) {
                clearProfilePictureCache(user._id);
            }
            // Refresh user data with correct query key
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to remove profile picture",
                variant: "destructive",
            });
        },
    });

    const handleSaveProfile = () => {
        if (!editedName.trim()) {
            toast({
                title: "Error",
                description: "Name cannot be empty",
                variant: "destructive",
            });
            return;
        }
        updateUserMutation.mutate({ name: editedName.trim() });
    };

    const handleCancelEdit = () => {
        setEditedName(user?.name || "");
        setIsEditing(false);
    };

    const handleProfilePictureClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "Please select a JPEG, PNG, WebP, or GIF image",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast({
                title: "File too large",
                description: "Please select an image smaller than 5MB",
                variant: "destructive",
            });
            return;
        }

        setIsUploadingPicture(true);
        uploadProfilePictureMutation.mutate(file);

        // Clear the input so the same file can be selected again
        event.target.value = '';
    };

    const handleRemoveProfilePicture = () => {
        if (!user?.profilePicture) return;

        const confirmed = window.confirm('Are you sure you want to remove your profile picture?');
        if (confirmed) {
            removeProfilePictureMutation.mutate();
        }
    };

    const handleChangePassword = () => {
        toast({
            title: "Feature not available",
            description: "Password change will be available soon",
        });
    };

    const handleViewSessions = () => {
        toast({
            title: "Feature not available",
            description: "Session management will be available soon",
        });
    };

    const handleDeleteAccount = () => {
        setShowDeleteDialog(true);
    };

    const handleConfirmDeleteAccount = () => {
        deleteAccountMutation.mutate();
    };

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 md:pt-6 max-w-4xl mx-auto">

            {/* Show loading state while user data is being fetched */}
            {isLoading && !user && (
                <Card>
                    <CardContent className="flex items-center justify-center p-4 sm:p-6 md:p-8">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                            <span className="text-xs sm:text-sm md:text-base">Loading profile...</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Show main profile content only when user data is loaded */}
            {user && (
                <div className="grid gap-6 sm:gap-8">
                    {/* Profile Header Card */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="text-base sm:text-lg md:text-xl">Profile Information</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Update your personal information and profile picture
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-6">
                                <div className="relative group">
                                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                                        <AvatarImage
                                            src={getProfilePictureUrl(user?.profilePicture || undefined) ?? undefined}
                                            alt={user?.name || "User"}
                                        />
                                        <AvatarFallback className={`text-lg sm:text-xl font-bold ${getAvatarColor(user?.name || "")}`}>
                                            {getAvatarFallbackText(user?.name || "")}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Upload button */}
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
                                        onClick={handleProfilePictureClick}
                                        disabled={isUploadingPicture || uploadProfilePictureMutation.isPending}
                                    >
                                        {isUploadingPicture || uploadProfilePictureMutation.isPending ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                    </Button>

                                    {/* Remove button (shown on hover if user has profile picture) */}
                                    {user?.profilePicture && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={handleRemoveProfilePicture}
                                            disabled={removeProfilePictureMutation.isPending}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                                <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
                                    <h3 className="text-base sm:text-lg font-semibold">{user?.name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2 break-all overflow-hidden">
                                        <Mail className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{user?.email}</span>
                                    </p>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                                        <CalendarDays className="h-4 w-4" />
                                        Joined {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "Recently"}
                                    </div>
                                    {/* Upload instructions */}
                                    <p className="text-xs text-muted-foreground">
                                        Click camera icon to upload new picture • Max 5MB
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Editable Fields */}
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="flex items-center gap-2 text-sm sm:text-base">
                                        <User className="h-4 w-4" />
                                        Display Name
                                    </Label>
                                    {isEditing ? (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Input
                                                id="name"
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="flex-1"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveProfile}
                                                    disabled={updateUserMutation.isPending}
                                                    className="flex-1 sm:flex-none"
                                                >
                                                    {updateUserMutation.isPending ? "Saving..." : "Save"}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <span className="text-sm sm:text-base">{user?.name}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-2 text-sm sm:text-base">
                                        <Mail className="h-4 w-4" />
                                        Email Address
                                    </Label>
                                    <div className="p-3 bg-muted/50 rounded-lg text-muted-foreground">
                                        <span className="text-sm sm:text-base break-all overflow-hidden min-w-0">{user?.email}</span>
                                        <span className="text-xs block mt-1">Email cannot be changed</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Security Card */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                                Account Security
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Manage your account security and authentication settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm sm:text-base">Active Sessions</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                        Manage devices that are signed in to your account
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleViewSessions} className="w-full sm:w-auto flex-shrink-0">
                                    View Sessions
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone Card */}
                    <Card className="border-destructive/20">
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="text-destructive text-base sm:text-lg md:text-xl">Danger Zone</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Irreversible and destructive actions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-destructive/20 rounded-lg">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-destructive text-sm sm:text-base">Delete Account</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                        Permanently delete your account and all associated data
                                    </p>
                                </div>
                                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="w-full sm:w-auto flex-shrink-0">
                                    Delete Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Account Dialog */}
            <DeleteAccountDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDeleteAccount}
                isLoading={deleteAccountMutation.isPending}
            />
        </div>
    );
};

export default Profile;

// Prevent static generation to avoid context errors
export const dynamic = 'force-dynamic';
