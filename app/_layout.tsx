import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { View, Platform, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, useSegments } from 'expo-router';

// Use web-safe canvas version on web to avoid Skia PictureRecorder error
const DynamicBackground = Platform.OS === 'web'
  ? require('../components/ui/DynamicBackground.web').default
  : require('../components/ui/DynamicBackground').default;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { theme, colors, backgroundStyle } = useTheme();
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const authGroups: string[] = ['(auth)', 'login'];
    const inAuthGroup = authGroups.includes(segments[0]);

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoading]);

  if (isLoading) return null;

  // Use proper React Navigation themes for both light and dark mode
  const navTheme = theme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  // When universe or aurora are active the background is rendered on document.body (web)
  // or by the DynamicBackground component (native) — the root View must be transparent.
  const isCanvasBackground = theme === 'dark' && (backgroundStyle === 'universe' || backgroundStyle === 'aurora');
  const rootBg = isCanvasBackground ? 'transparent' : colors.background;

  return (
    <NavThemeProvider value={navTheme}>
      {/* Container that adapts to light/dark mode */}
      <View style={{ flex: 1, backgroundColor: rootBg }}>
        {Platform.OS === 'web' && (
          <style dangerouslySetInnerHTML={{
            __html: `
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus, 
            input:-webkit-autofill:active{
                -webkit-box-shadow: 0 0 0 30px rgba(0,0,0,0) inset !important;
                -webkit-text-fill-color: #fff !important;
                transition: background-color 5000s ease-in-out 0s;
            }
          ` }} />
        )}
        <DynamicBackground />

        <Stack screenOptions={{
          contentStyle: { backgroundColor: 'transparent' }
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
