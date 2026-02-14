import { Stack } from 'expo-router';
import { STOCK_THEME } from './_utils/theme';

export default function StockLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: STOCK_THEME.background },
                headerTintColor: STOCK_THEME.text,
                contentStyle: { backgroundColor: STOCK_THEME.background },
                headerShadowVisible: false,
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
                name="[symbol]"
                options={{
                    presentation: 'modal', // Nice touch for details
                    headerTitle: '',
                    headerTransparent: true,
                }}
            />
        </Stack>
    );
}
