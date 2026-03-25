import { useTheme } from "@/context/theme-context";

export { useTheme };

// Convenience hook for checking if dark mode is active
export const useIsDark = () => {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark';
};

// Convenience hook for checking if light mode is active
export const useIsLight = () => {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'light';
};

// Hook for theme-aware styling
export const useThemeClass = (lightClass: string, darkClass: string) => {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark' ? darkClass : lightClass;
};

// Hook for conditional theme values
export const useThemeValue = <T>(lightValue: T, darkValue: T): T => {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark' ? darkValue : lightValue;
};

// Hook for getting theme-aware CSS variables
export const useThemeVariable = (variable: string) => {
    const { resolvedTheme } = useTheme();
    return `hsl(var(--${variable}))`;
};

// Hook for getting multiple theme variables
export const useThemeVariables = (variables: string[]) => {
    return variables.reduce((acc, variable) => {
        acc[variable] = `hsl(var(--${variable}))`;
        return acc;
    }, {} as Record<string, string>);
};
