import { useWindowDimensions } from 'react-native';

const DESKTOP_BREAKPOINT = 768;

/**
 * Returns true when the viewport is wide enough to be considered "desktop".
 * Automatically re-renders when the window is resized.
 */
export function useIsDesktop(): boolean {
    const { width } = useWindowDimensions();
    return width >= DESKTOP_BREAKPOINT;
}
