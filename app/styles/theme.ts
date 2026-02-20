
// app/styles/theme.ts

const persianIndigo = '#4B0082';

export const Palette = {
    // Dark Theme
    darkBackground: '#000000', // Pitch Black
    darkCard: '#1a0b2e',       // Dark Purple for cards (Deep, not too blue)
    darkText: '#FFFFFF',

    // Accents
    primaryPurple: persianIndigo, // Restored to Persian Indigo
    secondaryGreen: '#32D74B',

    // Light Theme
    lightBackground: '#F2F2F7',
    lightCard: '#FFFFFF',
    lightText: '#000000',
};

export const Theme = {
    dark: {
        background: Palette.darkBackground,
        cardBackground: Palette.darkCard,
        text: Palette.darkText,
        primary: Palette.primaryPurple,
        secondary: Palette.secondaryGreen,
        icon: '#9BA1A6',
        border: '#2A2A2D', // Darker border for black background
    },
    light: {
        background: Palette.lightBackground,
        cardBackground: Palette.lightCard,
        text: Palette.lightText,
        primary: Palette.primaryPurple,
        secondary: Palette.secondaryGreen,
        icon: '#687076',
        border: '#E5E5EA',
    }
};
