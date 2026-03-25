// Sidebar configuration constants
export const SIDEBAR_CONFIG = {
  COOKIE_NAME: "sidebar:state",
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  WIDTH: "15rem", // Reduced from 16rem (256px) to 12rem (192px)
  WIDTH_MOBILE: "14rem", // Reduced from 18rem (288px) to 14rem (224px)
  WIDTH_ICON: "3.2rem", // Reduced from 3.5rem (56px) to 3rem (48px)
  KEYBOARD_SHORTCUT: "b",
} as const;

// Sidebar variants
export const SIDEBAR_VARIANTS = {
  SIDEBAR: "sidebar",
  FLOATING: "floating",
  INSET: "inset",
} as const;

// Collapsible modes
export const COLLAPSIBLE_MODES = {
  OFFCANVAS: "offcanvas",
  ICON: "icon",
  NONE: "none",
} as const;

// Sidebar sides
export const SIDEBAR_SIDES = {
  LEFT: "left",
  RIGHT: "right",
} as const;

// Menu button variants
export const MENU_BUTTON_VARIANTS = {
  DEFAULT: "default",
  OUTLINE: "outline",
} as const;

// Menu button sizes
export const MENU_BUTTON_SIZES = {
  SM: "sm",
  DEFAULT: "default",
  LG: "lg",
} as const;

// Sub button sizes
export const SUB_BUTTON_SIZES = {
  SM: "sm",
  MD: "md",
} as const;
