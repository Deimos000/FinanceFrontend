import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'finance_app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Default to 'dark' to prevent unexpected flashes to white when native autofill or
    // keyboard events cause `useColorScheme()` to emit light mode on some devices.
    const [theme, setThemeState] = useState<Theme>('dark');

    useEffect(() => {
        // Load persisted theme
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (storedTheme) {
                    setThemeState(storedTheme as Theme);
                } else {
                    // Default to dark if no user preference is found
                    setThemeState('dark');
                }
            } catch (error) {
                console.error('Failed to load theme:', error);
            }
        };
        loadTheme();
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch((err) =>
            console.error('Failed to save theme:', err)
        );
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const colors = Colors[theme];

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colors }}>
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
