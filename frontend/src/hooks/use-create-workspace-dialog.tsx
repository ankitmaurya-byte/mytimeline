'use client';

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UseCreateWorkspaceDialogReturn {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useCreateWorkspaceDialog = (): UseCreateWorkspaceDialogReturn => {
  const router = useRouter();
  const [open, setOpenState] = useState(false);

  // Check URL params on mount and when URL changes
  useEffect(() => {
    const checkUrlParams = () => {
      if (typeof window !== "undefined" && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        const isOpen = urlParams.get("new-workspace") === "true";
        setOpenState(isOpen);
      }
    };

    // Check on mount
    checkUrlParams();

    // Listen for URL changes
    const handlePopState = () => {
      checkUrlParams();
    };

    window.addEventListener('popstate', handlePopState);

    // Also listen for pushstate/replacestate (for programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(checkUrlParams, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(checkUrlParams, 0);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);

    if (typeof window === "undefined") return;

    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);

    if (value) {
      // Only set new-workspace, don't interfere with other params
      params.set("new-workspace", "true");
    } else {
      // Only remove new-workspace, leave other params alone
      params.delete("new-workspace");
    }

    const newUrl = `${currentUrl.pathname}${params.toString() ? `?${params.toString()}` : ''}`;

    router.replace(newUrl, { scroll: false });
  }, [router]);

  const onOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return {
    open,
    onOpen,
    onClose,
  };
};

export default useCreateWorkspaceDialog;
