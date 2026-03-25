// Re-export all sidebar components from their respective modules
export * from "./sidebar-config";
export * from "./sidebar-context";
export * from "./sidebar-core";
export * from "./sidebar-layout";
export * from "./sidebar-group";
export * from "./sidebar-menu";

// Re-export the main components for backward compatibility
export {
  SidebarProvider,
  SidebarContext,
  useSidebar,
} from "./sidebar-context";

export {
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from "./sidebar-core";

export {
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarSeparator,
  SidebarInput,
} from "./sidebar-layout";

export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./sidebar-group";

export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./sidebar-menu";
