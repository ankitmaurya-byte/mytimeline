'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
    isDark: boolean;
    isLight: boolean;
    toggleTheme: () => void;
    systemTheme: 'light' | 'dark';
    isSystemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

    // Initialize system theme detection
    useEffect(() => {
        const detectSystemTheme = () => {
            const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return isDarkSystem ? 'dark' : 'light';
        };
        
        setSystemTheme(detectSystemTheme());
    }, []);

    useEffect(() => {
        // Get theme from localStorage on mount
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        // Remove existing theme classes
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setResolvedTheme(systemTheme);
            root.classList.add(systemTheme);
        } else {
            setResolvedTheme(theme);
            root.classList.add(theme);
        }

        // Save to localStorage
        localStorage.setItem('theme', theme);

        // Add smooth transition class for theme switching
        root.classList.add('transition-colors', 'duration-300');
    }, [theme]);

    useEffect(() => {
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            setSystemTheme(newSystemTheme);
            
            if (theme === 'system') {
                setResolvedTheme(newSystemTheme);
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(newSystemTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Toggle function for easy theme switching
    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    const value = {
        theme,
        setTheme,
        resolvedTheme,
        isDark: resolvedTheme === 'dark',
        isLight: resolvedTheme === 'light',
        toggleTheme,
        systemTheme,
        isSystemTheme: theme === 'system',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
