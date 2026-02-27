import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    COLOR_SCHEMES,
    ColorScheme,
    DEFAULT_SCHEME_ID,
    getColorsForScheme,
    getSchemeById,
    BackgroundStyle,
    BACKGROUND_OPTIONS,
} from '../constants/colorSchemes';
import { fetchSettings, updateSettings } from '../utils/api';

type Theme = 'light' | 'dark';

type ColorValues = ReturnType<typeof getColorsForScheme>['light'];

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    colors: ColorValues;
    /** Active color scheme object */
    colorScheme: ColorScheme;
    /** Set active scheme by id */
    setColorScheme: (id: string) => void;
    /** All available color schemes */
    colorSchemes: ColorScheme[];
    /** Background style (dark mode only) */
    backgroundStyle: BackgroundStyle;
    setBackgroundStyle: (style: BackgroundStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'finance_app_theme';
const COLOR_SCHEME_STORAGE_KEY = 'finance_app_color_scheme';
const BACKGROUND_STYLE_STORAGE_KEY = 'finance_app_background_style';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [schemeId, setSchemeId] = useState<string>(DEFAULT_SCHEME_ID);
    const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>('pitch');

    useEffect(() => {
        const loadPrefs = async () => {
            try {
                // Step 1: load from AsyncStorage for instant (no-flicker) startup
                const [storedTheme, storedScheme, storedBgStyle] = await Promise.all([
                    AsyncStorage.getItem(THEME_STORAGE_KEY),
                    AsyncStorage.getItem(COLOR_SCHEME_STORAGE_KEY),
                    AsyncStorage.getItem(BACKGROUND_STYLE_STORAGE_KEY),
                ]);
                if (storedTheme) setThemeState(storedTheme as Theme);
                if (storedScheme) setSchemeId(storedScheme);
                if (storedBgStyle) setBackgroundStyleState(storedBgStyle as BackgroundStyle);

                // Step 2: fetch from DB — server is the source of truth
                const serverPrefs = await fetchSettings();
                if (serverPrefs.theme) {
                    const t = serverPrefs.theme as Theme;
                    setThemeState(t);
                    AsyncStorage.setItem(THEME_STORAGE_KEY, t).catch(() => { });
                }
                if (serverPrefs.color_scheme_id) {
                    setSchemeId(serverPrefs.color_scheme_id);
                    AsyncStorage.setItem(COLOR_SCHEME_STORAGE_KEY, serverPrefs.color_scheme_id).catch(() => { });
                }
                if (serverPrefs.background_style) {
                    setBackgroundStyleState(serverPrefs.background_style as BackgroundStyle);
                    AsyncStorage.setItem(BACKGROUND_STYLE_STORAGE_KEY, serverPrefs.background_style).catch(() => { });
                }
            } catch (error) {
                // Not logged in yet or network error — AsyncStorage values are fine
                console.warn('Theme: could not load server prefs, using local cache', error);
            }
        };
        loadPrefs();
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(() => { });
        updateSettings({ theme: newTheme }).catch((err) =>
            console.error('Failed to save theme to DB:', err)
        );
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const setColorScheme = (id: string) => {
        setSchemeId(id);
        AsyncStorage.setItem(COLOR_SCHEME_STORAGE_KEY, id).catch(() => { });
        updateSettings({ color_scheme_id: id }).catch((err) =>
            console.error('Failed to save color scheme to DB:', err)
        );
    };

    const setBackgroundStyle = (style: BackgroundStyle) => {
        setBackgroundStyleState(style);
        AsyncStorage.setItem(BACKGROUND_STYLE_STORAGE_KEY, style).catch(() => { });
        updateSettings({ background_style: style }).catch((err) =>
            console.error('Failed to save background style to DB:', err)
        );
    };

    const activeScheme = getSchemeById(schemeId);
    const isCanvasBg = theme === 'dark' && (backgroundStyle === 'universe' || backgroundStyle === 'aurora');
    const bgOverride = theme === 'dark'
        ? (isCanvasBg ? 'transparent' : BACKGROUND_OPTIONS.find(o => o.id === backgroundStyle)?.color)
        : undefined;
    const allColors = getColorsForScheme(activeScheme, bgOverride);
    const colors = allColors[theme];

    return (
        <ThemeContext.Provider
            value={{
                theme,
                toggleTheme,
                setTheme,
                colors,
                colorScheme: activeScheme,
                setColorScheme,
                colorSchemes: COLOR_SCHEMES,
                backgroundStyle,
                setBackgroundStyle,
            }}
        >
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
