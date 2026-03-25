"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UseCreateProjectDialogReturn {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useCreateProjectDialog = (): UseCreateProjectDialogReturn => {
  const router = useRouter();
  const [open, setOpenState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);

    // Check URL params after mounting
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const isOpen = urlParams.get("new-project") === "true";
      setOpenState(isOpen);
    }
  }, []);

  // Listen for URL changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isOpen = urlParams.get("new-project") === "true";
      setOpenState(isOpen);
    };

    // Check on mount
    checkUrlParams();

    // Listen for popstate events
    window.addEventListener('popstate', checkUrlParams);

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
      window.removeEventListener('popstate', checkUrlParams);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [mounted]);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);

    // Only update URL if we're mounted and in browser
    if (!mounted || typeof window === "undefined") return;

    if (!value) {
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        params.delete("new-project");
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        router.replace(newUrl, { scroll: false });
      }, 120);
    } else {
      // Update URL immediately for opening
      const params = new URLSearchParams(window.location.search);
      params.set("new-project", "true");
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [router, mounted]);

  const onOpen = useCallback(() => {
    // Update state immediately for instant response
    setOpenState(true);
    // Then update URL
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

export default useCreateProjectDialog;
