/**
 * Unified Color Scheme Definitions
 * ---------------------------------
 * This is the SINGLE source of truth for all color values in the app.
 * Every component should reference colors through ThemeContext → this file.
 * Do NOT hardcode hex color values anywhere else.
 */

import { Ionicons } from '@expo/vector-icons';

export interface ColorScheme {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    /** The preview swatch color shown in settings */
    preview: string;

    // ── Scheme-specific accent colors ──
    primary: string;
    primaryLight: string;
    /** Card background tint in dark mode (scheme-flavored dark) */
    darkCard: string;
    /** Background in light mode — a soft tint of the scheme primary */
    lightBackground: string;
    /** Card in light mode — slightly off-white tint */
    lightCard: string;

    // ── Shared semantic colors ──
    success: string;
    danger: string;
    warning: string;

    // ── Shared structural dark-mode colors ──
    darkText: string;
    darkIcon: string;
    darkBorder: string;
    darkBackground: string;

    // ── Shared structural light-mode colors ──
    lightText: string;
    lightIcon: string;
    lightBorder: string;
}

export type BackgroundStyle = 'pitch' | 'charcoal' | 'midnight' | 'indigo' | 'aurora' | 'universe' | 'forest' | 'slate';

export interface BackgroundOption {
    id: BackgroundStyle;
    name: string;
    color: string;
    description: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
    { id: 'pitch', name: 'Pitch Black', color: '#000000', description: 'Deep OLED black for maximum battery saving.' },
    { id: 'charcoal', name: 'Charcoal', color: '#121212', description: 'Softer gray, less intense than pure black.' },
    { id: 'slate', name: 'Deep Slate', color: '#0F172A', description: 'Cool blue-gray for a modern, professional feel.' },
    { id: 'midnight', name: 'Midnight', color: '#0B1117', description: 'A sophisticated navy/blue-tinted dark.' },
    { id: 'forest', name: 'Dark Forest', color: '#061710', description: 'Very deep green, excellent with Emerald or Teal.' },
    { id: 'indigo', name: 'Indigo Night', color: '#0F0B1E', description: 'Deep purple-indigo matching the Persian theme.' },
    { id: 'aurora', name: 'Aurora Mesh', color: '#1A1A2E', description: 'Subtle, shifting animated gradient.' },
    { id: 'universe', name: '✨ Universe', color: '#000000', description: 'Live galaxy particle animation.' },
];

// ────────────────────────────────────────────────
// Shared values that don't change between schemes
// ────────────────────────────────────────────────

const shared = {
    success: '#32D74B',
    danger: '#FF453A',
    warning: '#FFA500',

    // Dark mode structural colors
    darkText: '#FFFFFF',
    darkIcon: '#9BA1A6',
    darkBorder: '#2A2A2D',
    darkBackground: '#000000', // Default - will be overridden by style selection

    // Light mode structural colors
    lightText: '#111827',
    lightIcon: '#6B7280',
    lightBorder: '#D1D5DB',
};

// ────────────────────────────────────────────────
// Color Schemes
// ────────────────────────────────────────────────

export const COLOR_SCHEMES: ColorScheme[] = [
    {
        id: 'persian-indigo',
        name: 'Persian Indigo',
        icon: 'diamond',
        preview: '#4B0082',
        primary: '#4B0082',
        primaryLight: '#7F5AF0',
        darkCard: '#1a0b2e',
        lightBackground: '#DDD6FE',  // Deep lavender
        lightCard: '#FDFCFF',
        ...shared,
    },
    {
        id: 'emerald',
        name: 'Emerald Green',
        icon: 'leaf',
        preview: '#10B981',
        primary: '#059669',
        primaryLight: '#34D399',
        darkCard: '#0b2e1a',
        lightBackground: '#A7F3D0',  // Deep mint
        lightCard: '#FAFFFD',
        ...shared,
    },
    {
        id: 'ocean',
        name: 'Ocean Blue',
        icon: 'water',
        preview: '#3B82F6',
        primary: '#2563EB',
        primaryLight: '#60A5FA',
        darkCard: '#0b1a2e',
        lightBackground: '#BFDBFE',  // Deep sky
        lightCard: '#FAFCFF',
        ...shared,
    },
    {
        id: 'royal-indigo',
        name: 'Royal Indigo',
        icon: 'sparkles',
        preview: '#6366F1',
        primary: '#4F46E5',
        primaryLight: '#818CF8',
        darkCard: '#0f0b2e',
        lightBackground: '#C7D2FE',  // Deep indigo
        lightCard: '#FAFAFF',
        ...shared,
    },
    {
        id: 'rose',
        name: 'Rose Pink',
        icon: 'rose',
        preview: '#F43F5E',
        primary: '#E11D48',
        primaryLight: '#FB7185',
        darkCard: '#2e0b1a',
        lightBackground: '#FECDD3',  // Deep rose
        lightCard: '#FFFAFB',
        ...shared,
    },
    {
        id: 'amber',
        name: 'Golden Amber',
        icon: 'sunny',
        preview: '#F59E0B',
        primary: '#D97706',
        primaryLight: '#FBBF24',
        darkCard: '#2e1a0b',
        lightBackground: '#FDE68A',  // Deep amber
        lightCard: '#FFFEF5',
        ...shared,
    },
    {
        id: 'graphite',
        name: 'Graphite',
        icon: 'business',
        preview: '#475569',
        primary: '#334155',
        primaryLight: '#94A3B8',
        darkCard: '#1E293B',
        lightBackground: '#F1F5F9',  // Cool gray
        lightCard: '#FFFFFF',
        ...shared,
    },
    {
        id: 'teal',
        name: 'Wealth Teal',
        icon: 'wallet',
        preview: '#0F766E',
        primary: '#0D9488',
        primaryLight: '#2DD4BF',
        darkCard: '#112A28',
        lightBackground: '#CCFBF1',  // Soft teal
        lightCard: '#F0FDFA',
        ...shared,
    },
    {
        id: 'cyber-cyan',
        name: 'Cyber Cyan',
        icon: 'hardware-chip',
        preview: '#06B6D4',
        primary: '#0891B2',
        primaryLight: '#22D3EE',
        darkCard: '#0f2933',
        lightBackground: '#CFFAFE',  // Cyan tint
        lightCard: '#ECFEFF',
        ...shared,
    },
    {
        id: 'crimson',
        name: 'Crimson Red',
        icon: 'flame',
        preview: '#E11D48',
        primary: '#BE123C',
        primaryLight: '#FB7185',
        darkCard: '#2F111B',
        lightBackground: '#FFE4E6',  // Rose tint
        lightCard: '#FFF1F2',
        ...shared,
    },
    {
        id: 'navy',
        name: 'Classic Navy',
        icon: 'briefcase',
        preview: '#1E3A8A',
        primary: '#1D4ED8',
        primaryLight: '#60A5FA',
        darkCard: '#0E172E',
        lightBackground: '#DBEAFE',  // Light Blue
        lightCard: '#EFF6FF',
        ...shared,
    }
];

export const DEFAULT_SCHEME_ID = 'persian-indigo';

export function getSchemeById(id: string): ColorScheme {
    return COLOR_SCHEMES.find((s) => s.id === id) ?? COLOR_SCHEMES[0];
}

/** Generate the full Colors object (light + dark) from a scheme and custom background style */
export function getColorsForScheme(scheme: ColorScheme, darkBackgroundOverride?: string) {
    const darkBg = darkBackgroundOverride || scheme.darkBackground;
    return {
        light: {
            text: scheme.lightText,
            background: scheme.lightBackground,
            tint: scheme.primary,
            icon: scheme.lightIcon,
            tabIconDefault: scheme.lightIcon,
            tabIconSelected: scheme.primary,
            cardBackground: scheme.lightCard,
            primary: scheme.primary,
            primaryLight: scheme.primaryLight,
            secondary: scheme.lightIcon,
            accent: scheme.primary,
            border: scheme.lightBorder,
            danger: scheme.danger,
            success: scheme.success,
            warning: scheme.warning,
        },
        dark: {
            text: scheme.darkText,
            background: darkBg,
            tint: '#fff',
            icon: scheme.darkIcon,
            tabIconDefault: scheme.darkIcon,
            tabIconSelected: '#fff',
            cardBackground: scheme.darkCard,
            primary: scheme.primary,
            primaryLight: scheme.primaryLight,
            secondary: scheme.darkIcon,
            accent: scheme.primary,
            border: scheme.darkBorder,
            danger: scheme.danger,
            success: scheme.success,
            warning: scheme.warning,
        },
    };
}
