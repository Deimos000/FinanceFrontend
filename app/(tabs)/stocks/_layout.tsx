import { Stack } from 'expo-router';
import TabScreenWrapper from '@/components/ui/TabScreenWrapper';
import { useTheme } from '@/context/ThemeContext';

export default function StockLayout() {
    const { colors, backgroundStyle, theme } = useTheme();
    const isCanvasBg = theme === 'dark' && (backgroundStyle === 'universe' || backgroundStyle === 'aurora');

    return (
        <TabScreenWrapper>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: isCanvasBg ? 'transparent' : colors.background },
                    presentation: 'card',
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen
                    name="[symbol]"
                    options={{
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="sandbox/[id]"
                    options={{
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
            </Stack>
        </TabScreenWrapper>
    );
}
