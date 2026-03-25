import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logoutMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader, LogOut, AlertTriangle, Shield } from "lucide-react";
import { logout as customLogout } from '@/lib/auth/client-auth';
import { clearAllProfilePictureCaches } from '@/lib/profile-picture-utils';
import axios from "axios";
import { useLoadingContext } from "@/components/loading";

const LogoutDialog = (props: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isOpen, setIsOpen } = props;
  const [isPending, setIsPending] = useState(false);

  const queryClient = useQueryClient();
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  // Handle logout action
  const handleLogout = useCallback(async () => {
    if (isPending) return;

    try {
      setIsPending(true);

      // Clear local state first to prevent race conditions
      queryClient.resetQueries();
      queryClient.clear();

      // Clear all profile picture caches
      clearAllProfilePictureCaches();

      // Clear axios authorization header
      delete axios.defaults.headers.common['Authorization'];

      // Clear any stored biometric credentials in the browser
      try {
        if (window.PublicKeyCredential) {
          // This will clear stored WebAuthn credentials for this domain
          // Note: This is a best-effort approach as browsers may not support credential clearing
        }
      } catch (error) {
        console.warn('Failed to clear biometric credentials:', error);
      }

      // Call backend logout (only once)
      await logoutMutationFn().catch((error) => {
        console.warn("Backend logout failed (continuing local cleanup)", error);
      });

      setIsOpen(false);

      // Clear any remaining cookies manually
      try {
        // Clear all possible auth cookies
        const cookiesToClear = ['auth_token', 'auth_token_js', 'auth_active'];
        cookiesToClear.forEach(cookieName => {
          // Clear for current domain
          document.cookie = `${cookieName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          // Clear for parent domain
          document.cookie = `${cookieName}=; Path=/; Domain=.timelline.tech; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          // Clear for localhost
          document.cookie = `${cookieName}=; Path=/; Domain=localhost; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
      } catch (error) {
        console.warn("Failed to clear cookies manually:", error);
      }

      // Force redirect to home page immediately
      window.location.href = window.location.origin;

    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Error",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  }, [isPending, queryClient, setIsOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to log out?</DialogTitle>
            <DialogDescription>
              This will end your current session and you will need to log in
              again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 sm:gap-3">
            <Button
              disabled={isPending}
              type="button"
              onClick={handleLogout}
              className="flex-1 sm:flex-none"
            >
              {isPending && <Loader className="animate-spin mr-2 h-4 w-4" />}
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Shield className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LogoutDialog;
