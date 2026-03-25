"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function DeleteAccountDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: DeleteAccountDialogProps) {
    const [confirmationText, setConfirmationText] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleTextChange = (value: string) => {
        setConfirmationText(value);
        setIsConfirmed(value === "DELETE");
    };

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm();
        }
    };

    const handleClose = () => {
        setConfirmationText("");
        setIsConfirmed(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Delete Account
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </DialogDescription>
                </DialogHeader>

                <Alert className="border-destructive/20 bg-destructive/5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                        <strong>Warning:</strong> This will permanently delete:
                        <ul className="mt-2 ml-4 list-disc text-sm">
                            <li>Your account and profile</li>
                            <li>All your workspaces and projects</li>
                            <li>All your tasks and data</li>
                            <li>Your team memberships</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label htmlFor="confirmation">
                        To confirm, type <span className="font-mono font-bold">DELETE</span> in the box below:
                    </Label>
                    <Input
                        id="confirmation"
                        type="text"
                        placeholder="Type DELETE to confirm"
                        value={confirmationText}
                        onChange={(e) => handleTextChange(e.target.value)}
                        className={isConfirmed ? "border-green-500 focus:border-green-500" : ""}
                        disabled={isLoading}
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!isConfirmed || isLoading}
                        className="min-w-[100px]"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Deleting...
                            </div>
                        ) : (
                            "Delete Account"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
