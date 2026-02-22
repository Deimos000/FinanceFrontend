import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { View } from 'react-native';
import ParticleBackground from '../components/ui/ParticleBackground';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, useSegments } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { theme } = useTheme();
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

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

    if (!token && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/login');
    } else if (token && inAuthGroup) {
      // Redirect away from the login page.
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoading]);

  // Optionally render a loading screen or nothing while checking auth
  if (isLoading) return null;

  // Ensure React Navigation theme doesn't paint over the galaxy
  const navTheme = theme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } }
    : DefaultTheme;

  return (
    <NavThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* Render persistent background if theme is dark */}
        {theme === 'dark' && <ParticleBackground />}

        <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
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
