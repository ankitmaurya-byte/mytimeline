"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Sidebar header component
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-3", className || "")}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

// Sidebar footer component
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("", className || "")}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

// Sidebar content component
export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-auto group-data-[collapsible=icon]:overflow-hidden bg-background",
        // Custom scrollbar - visible only on hover (desktop)
        "scrollbar-thin",
        className || ""
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

// Sidebar separator component
export const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-3 w-auto bg-gradient-to-r from-transparent via-slate-200/50 to-transparent h-px", className || "")}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

// Sidebar input component
export const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-9 w-full bg-background/80 backdrop-blur-sm border-border/50 shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring rounded-lg transition-all duration-200 hover:bg-background hover:shadow-md",
        className
      )}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";
