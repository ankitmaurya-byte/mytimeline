"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";
import { MENU_BUTTON_VARIANTS, MENU_BUTTON_SIZES, SUB_BUTTON_SIZES } from "./sidebar-config";

// Menu button variants
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-5 overflow-hidden rounded-xl text-left text-sm outline-none ring-blue-500/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-400 hover:shadow-sm dark:hover:shadow-blue-500/20 hover:scale-[1.02] focus-visible:ring-2 focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-10 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-100 data-[active=true]:to-indigo-100 dark:data-[active=true]:from-blue-900/50 dark:data-[active=true]:to-indigo-900/50 data-[active=true]:font-medium data-[active=true]:text-blue-800 dark:data-[active=true]:text-blue-300 data-[active=true]:shadow-md dark:data-[active=true]:shadow-blue-500/30 data-[active=true]:ring-1 data-[active=true]:ring-blue-200 dark:data-[active=true]:ring-blue-500/40 data-[state=open]:hover:bg-blue-50 dark:data-[state=open]:hover:bg-blue-900/30 data-[state=open]:hover:text-blue-700 dark:data-[state=open]:hover:text-blue-400 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-2.5 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-slate-500 dark:[&>svg]:text-gray-400 data-[active=true]:[&>svg]:text-blue-600 dark:data-[active=true]:[&>svg]:text-blue-400",
  {
    variants: {
      variant: {
        default: "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-400",
        outline:
          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-slate-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-400 hover:shadow-md dark:hover:shadow-blue-500/20 hover:border-blue-200 dark:hover:border-blue-500/40",
      },
      size: {
        sm: "h-9 text-xs",
        default: "h-10 text-sm",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Sidebar menu component
export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className || "")}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

// Sidebar menu item component
export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative px-1", className || "")}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

// Sidebar menu button component
export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          className="bg-slate-900 dark:bg-gray-800 text-white dark:text-gray-200 border-slate-700 dark:border-gray-600 shadow-lg dark:shadow-gray-900/50"
          {...tooltip}
        />
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

// Sidebar menu action component
export const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-2 top-2 flex aspect-square w-6 items-center justify-center rounded-lg p-0 text-slate-500 dark:text-gray-400 outline-none ring-blue-500/20 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 hover:shadow-sm dark:hover:shadow-blue-500/20 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1.5",
        "peer-data-[size=default]/menu-button:top-2",
        "peer-data-[size=lg]/menu-button:top-3",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
        "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-blue-600 dark:peer-data-[active=true]/menu-button:text-blue-400 md:opacity-0",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

// Sidebar menu badge component
export const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-2 flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-semibold tabular-nums text-white bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 shadow-sm dark:shadow-blue-500/30 select-none pointer-events-none",
      "peer-hover/menu-button:from-blue-600 peer-hover/menu-button:to-indigo-600 dark:peer-hover/menu-button:from-blue-500 dark:peer-hover/menu-button:to-indigo-500 peer-data-[active=true]/menu-button:from-blue-600 peer-data-[active=true]/menu-button:to-indigo-600 dark:peer-data-[active=true]/menu-button:from-blue-500 dark:peer-data-[active=true]/menu-button:to-indigo-500",
      "peer-data-[size=sm]/menu-button:top-1.5",
      "peer-data-[size=default]/menu-button:top-2",
      "peer-data-[size=lg]/menu-button:top-3",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

// Sidebar menu skeleton component
export const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-xl h-10 flex gap-3 px-3 items-center bg-slate-100/50 dark:bg-gray-800/50", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-lg bg-slate-200 dark:bg-gray-700"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width] rounded bg-slate-200 dark:bg-gray-700"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

// Sidebar menu sub component
export const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1.5 border-l-2 border-slate-200/50 dark:border-gray-700/50 px-3 py-1",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

// Sidebar menu sub item component
export const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

// Sidebar menu sub button component
export const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  // Ensure aria-describedby is always a string (never undefined)
  const descriptionId = React.useId();
  const ariaDescribedBy = props["aria-describedby"] || descriptionId;

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-8 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-lg px-2.5 text-slate-600 dark:text-gray-300 outline-none ring-blue-500/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 dark:hover:from-gray-800/50 dark:hover:to-blue-900/40 hover:text-blue-700 dark:hover:text-blue-400 hover:scale-[1.02] hover:shadow-sm dark:hover:shadow-blue-500/20 focus-visible:ring-2 focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-slate-500 dark:[&>svg]:text-gray-400",
        "data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-100 data-[active=true]:to-indigo-100 dark:data-[active=true]:from-blue-900/50 dark:data-[active=true]:to-indigo-900/50 data-[active=true]:text-blue-800 dark:data-[active=true]:text-blue-300 data-[active=true]:shadow-sm dark:data-[active=true]:shadow-blue-500/30 data-[active=true]:ring-1 data-[active=true]:ring-blue-200 dark:data-[active=true]:ring-blue-500/40",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {/* If no description is present, inject a visually hidden one for accessibility */}
      {!props["aria-describedby"] && (
        <span id={descriptionId} className="sr-only">
          Sidebar menu sub button
        </span>
      )}
      {props.children}
    </Comp>
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";
