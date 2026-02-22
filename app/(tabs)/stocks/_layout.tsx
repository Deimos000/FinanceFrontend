import { Stack } from 'expo-router';
import { STOCK_THEME } from './_utils/theme';
import TabScreenWrapper from '@/components/ui/TabScreenWrapper';

export default function StockLayout() {
    return (
        <TabScreenWrapper>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: STOCK_THEME.background },
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
