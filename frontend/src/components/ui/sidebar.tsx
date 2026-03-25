// Re-export all sidebar components from the optimized sidebar module
// This maintains backward compatibility while using the optimized structure

export * from "./sidebar/index";

// Re-export the context for direct access
export { SidebarContext, type SidebarContextType } from "./sidebar/sidebar-context";
