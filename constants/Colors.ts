/**
 * Unified Dark Theme - Black with Persian Indigo Accent
 */

const persianIndigo = '#4B0082';

export const Colors = {
    light: {
        text: '#000000',
        background: '#F2F2F7', // System Gray 6 (standard iOS light background)
        tint: persianIndigo,
        icon: '#8e8e93',
        tabIconDefault: '#8e8e93',
        tabIconSelected: persianIndigo,
        cardBackground: '#FFFFFF',
        primary: persianIndigo,
        secondary: '#34C759', // Green
        accent: persianIndigo,
        border: '#E5E5EA',
        danger: '#FF3B30',
    },
    dark: {
        text: '#FFFFFF',
        background: '#000000', // Pitch Black
        tint: '#fff',
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: '#fff',
        cardBackground: '#1a0b2e', // Dark Purple Card
        primary: '#4B0082', // Persian Indigo
        secondary: '#32D74B',
        accent: '#4B0082', // Persian Indigo
        border: '#2A2A2D',
        danger: '#FF453A',
    },
};
