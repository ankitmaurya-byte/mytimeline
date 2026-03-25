"use client";

import * as React from "react";
import { SIDEBAR_CONFIG } from "./sidebar-config";

// Sidebar context type
export interface SidebarContextType {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (value: boolean | ((value: boolean) => boolean)) => void;
  toggleSidebar: () => void;
}

// Create the context
export const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

// Hook to use sidebar context
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

// Sidebar provider component
export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // Internal state management
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;

    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // Set cookie to persist sidebar state
        if (typeof window !== "undefined") {
          document.cookie = `${SIDEBAR_CONFIG.COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_CONFIG.COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open]
    );

    // Toggle sidebar helper
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Keyboard shortcut handler
    React.useEffect(() => {
      if (typeof window === "undefined") return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_CONFIG.KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // Context state
    const state = open ? "expanded" : "collapsed";
    const contextValue = React.useMemo<SidebarContextType>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            suppressHydrationWarning={true}
            style={
              {
                "--sidebar-width": SIDEBAR_CONFIG.WIDTH,
                "--sidebar-width-icon": SIDEBAR_CONFIG.WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-gradient-to-br has-[[data-variant=inset]]:from-slate-50 has-[[data-variant=inset]]:to-slate-100",
              className || ""
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);

SidebarProvider.displayName = "SidebarProvider";

// Import dependencies
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
