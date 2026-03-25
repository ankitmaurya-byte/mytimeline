"use client";

import * as React from "react";
import { PanelLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SIDEBAR_CONFIG } from "./sidebar-config";
import { useSidebar } from "./sidebar-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Main Sidebar component
export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-gradient-to-b from-background via-card to-background text-sidebar-foreground shadow-lg border-r border-border/50 backdrop-blur-sm",
            className || ""
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-gradient-to-b from-slate-50 via-white to-slate-50 p-0 text-sidebar-foreground [&>button]:hidden shadow-2xl border-r border-slate-200/50 backdrop-blur-sm"
            style={
              {
                "--sidebar-width": SIDEBAR_CONFIG.WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
            aria-describedby="sidebar-description"
            forceMount
          >
            <SheetTitle className="sr-only">Sidebar</SheetTitle>
            <SheetDescription id="sidebar-description" className="sr-only">
              Sidebar navigation and controls
            </SheetDescription>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        suppressHydrationWarning={true}
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* Sidebar gap handler */}
        <div
          className={cn(
            "duration-300 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-out",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-300 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-out md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className || ""
          )}
          {...props}
        >
          <div
            suppressHydrationWarning={true}
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-gradient-to-b from-background via-card to-background group-data-[variant=floating]:rounded-xl group-data-[variant=floating]:border group-data-[variant=floating]:border-border/50 group-data-[variant=floating]:shadow-2xl group-data-[variant=floating]:backdrop-blur-sm group-data-[variant=floating]:bg-card/80 group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-border/20"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

// Sidebar trigger component
export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, isMobile } = useSidebar();

  if (isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            data-sidebar="trigger"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background hover:shadow-md hover:scale-105 transition-all duration-200",
              className
            )}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              onClick?.(event);
              toggleSidebar();
            }}
            {...props}
          >
            <Menu className="h-4 w-4 text-foreground" />
            <span className="sr-only">Open or close sidebar</span>
          </Button>
        </TooltipTrigger>

      </Tooltip>
    );
  }

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background hover:shadow-md hover:scale-105 transition-all duration-200",
        className
      )}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="h-4 w-4 text-foreground" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

// Sidebar inset component
export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-gradient-to-br from-background via-muted/50 to-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))]",
        "md:peer-data-[variant=inset]:m-2",
        "md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2",
        "md:peer-data-[variant=inset]:ml-0",
        "md:peer-data-[variant=inset]:rounded-2xl",
        "md:peer-data-[variant=inset]:shadow-xl",
        "md:peer-data-[variant=inset]:border",
        "md:peer-data-[variant=inset]:border-border/50",
        "md:peer-data-[variant=inset]:backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = "SidebarInset";
