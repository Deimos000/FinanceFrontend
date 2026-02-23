/**
 * Unified Dark Theme - Derived from active Color Scheme
 * 
 * This file re-exports Colors derived from the default scheme for backward
 * compatibility. The actual active-scheme colors come from ThemeContext.
 */

import { Platform } from 'react-native';
import { getColorsForScheme, getSchemeById, DEFAULT_SCHEME_ID } from './colorSchemes';

const defaultScheme = getSchemeById(DEFAULT_SCHEME_ID);

/** Default Colors object (used by components that don't go through ThemeContext) */
export const Colors = getColorsForScheme(defaultScheme);

export const Fonts = Platform.select({
    ios: {
        /** iOS `UIFontDescriptorSystemDesignDefault` */
        sans: 'system-ui',
        /** iOS `UIFontDescriptorSystemDesignSerif` */
        serif: 'ui-serif',
        /** iOS `UIFontDescriptorSystemDesignRounded` */
        rounded: 'ui-rounded',
        /** iOS `UIFontDescriptorSystemDesignMonospaced` */
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});
