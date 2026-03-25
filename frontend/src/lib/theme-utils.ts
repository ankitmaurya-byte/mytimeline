import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Theme-aware background color classes
 */
export const themeColors = {
    background: {
        primary: "bg-background",
        secondary: "bg-card",
        muted: "bg-muted",
        white: "bg-white dark:bg-gray-900",
        whiteMuted: "bg-white/80 dark:bg-gray-900/80",
        whiteTransparent: "bg-white/90 dark:bg-gray-900/90",
    },
    border: {
        primary: "border-border",
        secondary: "border-border/50",
        muted: "border-muted",
        gray: "border-gray-200 dark:border-gray-700",
        grayLight: "border-gray-100 dark:border-gray-800",
    },
    text: {
        primary: "text-foreground",
        secondary: "text-muted-foreground",
        muted: "text-muted-foreground",
    },
    hover: {
        background: "hover:bg-muted/50",
        white: "hover:bg-gray-50 dark:hover:bg-gray-800",
    },
} as const;

/**
 * Common theme-aware component styles
 */
export const componentStyles = {
    card: cn(
        "bg-card",
        "border border-border",
        "rounded-lg",
        "shadow-sm"
    ),
    cardHover: cn(
        "bg-card",
        "border border-border",
        "rounded-lg",
        "shadow-sm",
        "hover:shadow-md",
        "transition-all duration-200"
    ),
    input: cn(
        "bg-background",
        "border border-border",
        "rounded-md",
        "px-3 py-2",
        "focus:ring-2 focus:ring-ring focus:border-ring",
        "transition-colors"
    ),
    button: cn(
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90",
        "px-4 py-2",
        "rounded-md",
        "transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
} as const;

/**
 * Helper function to create theme-aware background classes
 */
export function getThemeBackground(variant: 'primary' | 'secondary' | 'muted' | 'white' | 'whiteMuted' | 'whiteTransparent' = 'primary') {
    return themeColors.background[variant];
}

/**
 * Helper function to create theme-aware border classes
 */
export function getThemeBorder(variant: 'primary' | 'secondary' | 'muted' | 'gray' | 'grayLight' = 'primary') {
    return themeColors.border[variant];
}

/**
 * Helper function to create theme-aware text classes
 */
export function getThemeText(variant: 'primary' | 'secondary' | 'muted' = 'primary') {
    return themeColors.text[variant];
}

/**
 * Advanced theme-aware component presets
 */
export const advancedStyles = {
    // Card variants with enhanced styling
    cardPrimary: cn(
        "bg-card border border-border rounded-lg shadow-sm",
        "hover:shadow-md hover:border-border/80",
        "transition-all duration-300 ease-in-out",
        "dark:shadow-lg dark:shadow-black/10"
    ),
    cardSecondary: cn(
        "bg-muted/50 border border-border/50 rounded-lg",
        "hover:bg-muted/70 hover:border-border/70",
        "transition-all duration-300 ease-in-out"
    ),
    cardElevated: cn(
        "bg-card border border-border rounded-xl shadow-lg",
        "hover:shadow-xl hover:scale-[1.02]",
        "transition-all duration-300 ease-out",
        "dark:shadow-2xl dark:shadow-black/20"
    ),

    // Button variants with enhanced styling
    buttonPrimary: cn(
        "bg-primary text-primary-foreground font-medium",
        "hover:bg-primary/90 hover:shadow-md",
        "active:scale-95 focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "px-4 py-2 rounded-md transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    ),
    buttonSecondary: cn(
        "bg-secondary text-secondary-foreground font-medium border border-border",
        "hover:bg-secondary/80 hover:border-border/80",
        "active:scale-95 focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "px-4 py-2 rounded-md transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    ),
    buttonGhost: cn(
        "text-foreground hover:bg-muted/50",
        "active:scale-95 focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "px-4 py-2 rounded-md transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    ),

    // Input variants
    inputPrimary: cn(
        "bg-background border border-border rounded-md px-3 py-2",
        "focus:ring-2 focus:ring-ring focus:border-ring focus:ring-offset-0",
        "placeholder:text-muted-foreground",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
    inputSearch: cn(
        "bg-muted/50 border border-border/50 rounded-lg px-4 py-3",
        "focus:bg-background focus:border-ring focus:ring-2 focus:ring-ring/20",
        "placeholder:text-muted-foreground",
        "transition-all duration-300",
        "disabled:opacity-50 disabled:cursor-not-allowed"
    ),

    // Overlay and modal styles
    overlay: cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    ),
    modal: cn(
        "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
        "bg-card border border-border rounded-lg shadow-2xl",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "duration-200"
    ),

    // Navigation styles
    navItem: cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted/50 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    ),
    navItemActive: cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
        "text-foreground bg-muted border border-border/50",
        "transition-all duration-200"
    ),

    // Data visualization styles
    chartTooltip: cn(
        "bg-card/95 border border-border rounded-lg shadow-lg backdrop-blur-sm",
        "px-3 py-2 text-sm",
        "dark:shadow-xl dark:shadow-black/20"
    ),
    statCard: cn(
        "bg-gradient-to-br from-card via-card to-muted/20",
        "border border-border/50 rounded-xl p-6",
        "hover:shadow-lg hover:border-border/80",
        "transition-all duration-300 ease-out",
        "dark:shadow-lg dark:shadow-black/10"
    ),
    progressBar: cn(
        "h-2 bg-muted rounded-full overflow-hidden",
        "relative before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-primary/50 before:to-primary",
        "before:rounded-full before:transition-all before:duration-500"
    ),
} as const;

/**
 * Color palette utilities
 */
export const colorPalette = {
    // Status colors
    success: {
        bg: "bg-green-50 dark:bg-green-950/30",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
        accent: "bg-green-500 dark:bg-green-600"
    },
    warning: {
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        text: "text-yellow-700 dark:text-yellow-400",
        border: "border-yellow-200 dark:border-yellow-800",
        accent: "bg-yellow-500 dark:bg-yellow-600"
    },
    error: {
        bg: "bg-red-50 dark:bg-red-950/30",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
        accent: "bg-red-500 dark:bg-red-600"
    },
    info: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        accent: "bg-blue-500 dark:bg-blue-600"
    },
    
    // Chart colors optimized for dark mode
    chart: {
        primary: "hsl(var(--chart-1))",
        secondary: "hsl(var(--chart-2))",
        tertiary: "hsl(var(--chart-3))",
        quaternary: "hsl(var(--chart-4))",
        quinary: "hsl(var(--chart-5))"
    }
} as const;

/**
 * Animation utilities
 */
export const animations = {
    fadeIn: "animate-in fade-in-0 duration-300",
    fadeOut: "animate-out fade-out-0 duration-300",
    slideIn: "animate-in slide-in-from-bottom-4 duration-300",
    slideOut: "animate-out slide-out-to-bottom-4 duration-300",
    scaleIn: "animate-in zoom-in-95 duration-300",
    scaleOut: "animate-out zoom-out-95 duration-300",
    bounceIn: "animate-in zoom-in-50 duration-500 ease-out",
    shimmer: "animate-pulse",
} as const;

/**
 * Responsive utilities
 */
export const responsive = {
    container: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    flexStack: "flex flex-col gap-4",
    flexRow: "flex flex-row items-center gap-4",
    flexBetween: "flex items-center justify-between",
    flexCenter: "flex items-center justify-center",
} as const;

/**
 * Typography utilities
 */
export const typography = {
    h1: "text-4xl font-bold tracking-tight lg:text-5xl",
    h2: "text-3xl font-semibold tracking-tight",
    h3: "text-2xl font-semibold tracking-tight",
    h4: "text-xl font-semibold tracking-tight",
    h5: "text-lg font-medium",
    h6: "text-base font-medium",
    body: "text-sm leading-relaxed",
    caption: "text-xs text-muted-foreground",
    code: "font-mono text-sm bg-muted px-2 py-1 rounded",
} as const;
