import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import {
    Canvas,
    BlurMask,
    Circle,
    Group,
} from '@shopify/react-native-skia';
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    useDerivedValue,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import ParticleBackground from './ParticleBackground';

const { width: W_WIDTH, height: W_HEIGHT } = Dimensions.get('window');

export default function DynamicBackground() {
    const { theme, backgroundStyle, colorScheme } = useTheme();
    const isDark = theme === 'dark';
    const isAurora = backgroundStyle === 'aurora';
    const isUniverse = backgroundStyle === 'universe';

    // ─── UNIVERSE: delegate to the full galaxy background ───
    if (isDark && isUniverse) {
        return <ParticleBackground />;
    }

    // ─── AURORA ──────────────────────────────────────────────
    const anim1 = useSharedValue(0);
    const anim2 = useSharedValue(0);
    const anim3 = useSharedValue(0);

    React.useEffect(() => {
        if (isAurora && isDark) {
            anim1.value = withRepeat(withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.linear) }), -1, true);
            anim2.value = withRepeat(withTiming(1, { duration: 25000, easing: Easing.inOut(Easing.linear) }), -1, true);
            anim3.value = withRepeat(withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.linear) }), -1, true);
        }
    }, [isAurora, isDark]);

    const c1X = useDerivedValue(() => W_WIDTH * 0.2 + Math.sin(anim1.value * Math.PI * 2) * 50);
    const c1Y = useDerivedValue(() => W_HEIGHT * 0.3 + Math.cos(anim1.value * Math.PI * 2) * 50);
    const c2X = useDerivedValue(() => W_WIDTH * 0.8 + Math.cos(anim2.value * Math.PI * 2) * 60);
    const c2Y = useDerivedValue(() => W_HEIGHT * 0.7 + Math.sin(anim2.value * Math.PI * 2) * 60);
    const c3X = useDerivedValue(() => W_WIDTH * 0.5 + Math.sin(anim3.value * Math.PI * 2) * 40);
    const c3Y = useDerivedValue(() => W_HEIGHT * 0.5 + Math.cos(anim3.value * Math.PI * 2) * 40);

    if (!isDark || !isAurora) return null;

    const primaryColor = colorScheme.primary;
    const secondaryColor = colorScheme.id === 'persian-indigo' ? '#7F5AF0' : colorScheme.primaryLight;

    return (
        <View style={StyleSheet.absoluteFill}>
            <Canvas style={{ flex: 1 }}>
                <Group>
                    <BlurMask blur={100} style="normal" />
                    <Circle cx={c1X} cy={c1Y} r={W_WIDTH * 0.6} color={primaryColor} opacity={0.15} />
                    <Circle cx={c2X} cy={c2Y} r={W_WIDTH * 0.7} color={secondaryColor} opacity={0.12} />
                    <Circle cx={c3X} cy={c3Y} r={W_WIDTH * 0.5} color="#3b82f6" opacity={0.08} />
                </Group>
            </Canvas>
        </View>
    );
}
