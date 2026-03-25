"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/useAuthContext";
import { toast } from "@/hooks/use-toast";
import { CheckIcon, CopyIcon, Loader } from "lucide-react";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";
import { useLoadingContext } from "@/components/loading";

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const [copied, setCopied] = useState(false);
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const inviteUrl = workspace
    ? `${window.location.origin}/invite/workspace/${workspace.inviteCode}/join`
    : "";

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        toast({
          title: "Copied",
          description: "Invite url copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };
  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-card/50 dark:bg-card/60 backdrop-blur-sm border border-border shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200">
      <h5 className="text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
        <span>Invite members to join you</span>
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      </h5>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        Anyone with an invite link can join this free workspace. You can also disable and create a new invite link for this workspace at any time.
      </p>

      <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>
        {workspaceLoading ? (
          <div className="flex justify-center items-center">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              disabled={true}
              className="disabled:opacity-100 disabled:pointer-events-none bg-muted/50 dark:bg-muted/30 border-border rounded-lg px-3 py-2 text-foreground font-mono text-sm flex-1 shadow-inner focus:outline-none overflow-x-auto whitespace-nowrap"
              value={inviteUrl}
              readOnly
              style={{ WebkitOverflowScrolling: 'touch' }}
            />
            <Button
              disabled={false}
              variant="default"
              size="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200 shadow-sm hover:shadow-md inline-flex items-center gap-2 px-4 py-2 w-full sm:w-auto justify-center"
              onClick={handleCopy}
              type="button"
              aria-label="Copy invite link"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Copy Link</span>
            </Button>
          </div>
        )}
      </PermissionsGuard>
    </div>
  );
};

export default InviteMember;
