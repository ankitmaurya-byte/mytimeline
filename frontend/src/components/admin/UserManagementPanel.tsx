import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Users,
    UserX,
    UserCheck,
    Trash2,
    AlertTriangle,
    Shield,
    Clock,
    Crown,
    UserMinus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/useAuthContext';

interface DismissedUser {
    userId: string;
    userName: string;
    userEmail: string;
    dismissedAt: string;
    dismissedBy: string;
    dismissedByUserName: string;
    reason?: string;
    canBeReinstated: boolean;
}

interface UserManagementPanelProps {
    workspaceId: string;
    className?: string;
}

export function UserManagementPanel({ workspaceId, className }: UserManagementPanelProps) {
    const [dismissedUsers, setDismissedUsers] = useState<DismissedUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState<'dismiss' | 'remove' | 'reinstate' | null>(null);
    const [selectedUser, setSelectedUser] = useState<DismissedUser | null>(null);
    const [reason, setReason] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const { toast } = useToast();
    const { user } = useAuthContext();

    useEffect(() => {
        loadDismissedUsers();
    }, [workspaceId]);

    const loadDismissedUsers = async () => {
        try {
            const response = await fetch(`/api/admin/users?workspaceId=${workspaceId}&type=dismissed`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDismissedUsers(data.dismissedUsers || []);
            }
        } catch (error) {
            console.error('Error loading dismissed users:', error);
        }
    };

    const handleUserAction = async (action: 'dismiss' | 'remove' | 'reinstate', targetUserId: string, userName: string) => {
        setSelectedAction(action);
        setSelectedUser({ userId: targetUserId, userName } as DismissedUser);
        setShowConfirmDialog(true);
    };

    const confirmUserAction = async () => {
        if (!selectedAction || !selectedUser) return;

        setIsLoading(true);
        try {
            let response;

            switch (selectedAction) {
                case 'dismiss':
                    response = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                        },
                        body: JSON.stringify({
                            action: 'dismiss',
                            targetUserId: selectedUser.userId,
                            workspaceId,
                            reason: reason || undefined
                        })
                    });
                    break;

                case 'remove':
                    response = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                        },
                        body: JSON.stringify({
                            action: 'remove',
                            targetUserId: selectedUser.userId,
                            workspaceId,
                            reason: reason || undefined
                        })
                    });
                    break;

                case 'reinstate':
                    // For reinstatement, you'd need to select a role
                    // This is a simplified version - you might want to add role selection
                    response = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                        },
                        body: JSON.stringify({
                            action: 'reinstate',
                            targetUserId: selectedUser.userId,
                            workspaceId,
                            roleId: 'member' // Default role - you might want to make this selectable
                        })
                    });
                    break;
            }

            if (response?.ok) {
                const data = await response.json();
                toast({
                    title: "Action completed",
                    description: data.message,
                });

                // Reload dismissed users list
                await loadDismissedUsers();
            } else {
                const errorData = await response?.json();
                throw new Error(errorData?.error || 'Action failed');
            }
        } catch (error: any) {
            console.error('Error performing user action:', error);
            toast({
                title: "Action failed",
                description: error.message || 'An unexpected error occurred.',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setShowConfirmDialog(false);
            setSelectedAction(null);
            setSelectedUser(null);
            setReason('');
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'dismiss':
                return <UserMinus className="h-4 w-4" />;
            case 'remove':
                return <Trash2 className="h-4 w-4" />;
            case 'reinstate':
                return <UserCheck className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'dismiss':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'remove':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'reinstate':
                return 'text-green-600 bg-green-50 border-green-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    User Management
                </CardTitle>
                <CardDescription>
                    Manage workspace members - dismiss, remove, or reinstate users
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Dismissed Users List */}
                {dismissedUsers.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Dismissed Users</h4>
                            <Badge variant="secondary" className="text-xs">
                                {dismissedUsers.length} user{dismissedUsers.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {dismissedUsers.map((dismissedUser) => (
                                <div
                                    key={dismissedUser.userId}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-full">
                                            <Clock className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{dismissedUser.userName}</p>
                                            <p className="text-xs text-muted-foreground">{dismissedUser.userEmail}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Dismissed: {formatDate(dismissedUser.dismissedAt)}
                                            </p>
                                            {dismissedUser.reason && (
                                                <p className="text-xs text-muted-foreground">
                                                    Reason: {dismissedUser.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {dismissedUser.canBeReinstated && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUserAction('reinstate', dismissedUser.userId, dismissedUser.userName)}
                                                disabled={isLoading}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                <UserCheck className="h-4 w-4 mr-1" />
                                                Reinstate
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUserAction('remove', dismissedUser.userId, dismissedUser.userName)}
                                            disabled={isLoading}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No dismissed users</p>
                        <p className="text-sm">All workspace members are currently active</p>
                    </div>
                )}

                <Separator />

                {/* Security Information */}
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5" />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Permission Levels</h4>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li className="flex items-center gap-2">
                                    <Crown className="h-3 w-3" />
                                    <span><strong>OWNER:</strong> Can dismiss, remove, and reinstate users</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Shield className="h-3 w-3" />
                                    <span><strong>ADMIN:</strong> Can dismiss and reinstate users (cannot permanently remove)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    <span><strong>MEMBER:</strong> No user management permissions</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Safety Features */}
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Safety Features</h4>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• Cannot dismiss/remove workspace owner</li>
                                <li>• Admins cannot dismiss/remove themselves</li>
                                <li>• All actions are logged with timestamps</li>
                                <li>• Database operations use transactions for consistency</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                {showConfirmDialog && selectedAction && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-full ${getActionColor(selectedAction)}`}>
                                    {getActionIcon(selectedAction)}
                                </div>
                                <h3 className="text-lg font-semibold">
                                    {selectedAction === 'dismiss' && 'Dismiss User'}
                                    {selectedAction === 'remove' && 'Remove User'}
                                    {selectedAction === 'reinstate' && 'Reinstate User'}
                                </h3>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4">
                                {selectedAction === 'dismiss' && `Are you sure you want to dismiss "${selectedUser.userName}" from the workspace?`}
                                {selectedAction === 'remove' && `Are you sure you want to permanently remove "${selectedUser.userName}" from the workspace? This action cannot be undone.`}
                                {selectedAction === 'reinstate' && `Are you sure you want to reinstate "${selectedUser.userName}" to the workspace?`}
                            </p>

                            {(selectedAction === 'dismiss' || selectedAction === 'remove') && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Enter reason for this action..."
                                        className="w-full p-2 border rounded-md text-sm"
                                        rows={3}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmDialog(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant={selectedAction === 'remove' ? 'destructive' : 'default'}
                                    onClick={confirmUserAction}
                                    disabled={isLoading}
                                    className={getActionColor(selectedAction)}
                                >
                                    {isLoading ? 'Processing...' : (
                                        <>
                                            {selectedAction === 'dismiss' && 'Dismiss User'}
                                            {selectedAction === 'remove' && 'Remove User'}
                                            {selectedAction === 'reinstate' && 'Reinstate User'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

