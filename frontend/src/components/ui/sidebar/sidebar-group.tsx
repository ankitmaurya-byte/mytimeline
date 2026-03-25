"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

// Sidebar group component
export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("flex items-center justify-between w-full flex-col gap-3", className || "")}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

// Sidebar group label component
export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-300 flex h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold text-slate-600 outline-none ring-blue-500/20 transition-all ease-out focus-visible:ring-2 focus-visible:bg-blue-50 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-slate-500",
        "group-data-[collapsible=icon]:-mt-9 group-data-[collapsible=icon]:opacity-0",
        "hover:text-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800 dark:text-white/70 dark:hover:text-white dark:focus-visible:bg-slate-800/20",
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

// Sidebar group action component
export const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-6 items-center justify-center rounded-lg p-0 text-slate-500 outline-none ring-blue-500/20 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:scale-110 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

// Sidebar group content component
export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className || "")}
    {...props}
  />
));
SidebarGroupContent.displayName = "SidebarGroupContent";
