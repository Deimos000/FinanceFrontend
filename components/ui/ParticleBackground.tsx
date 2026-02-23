import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
    Canvas,
    Circle,
    Group,
    BlurMask,
} from '@shopify/react-native-skia';
import Animated, { useSharedValue, withRepeat, withTiming, useDerivedValue, Easing, withSequence } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ParticleBackground() {
    const pulse = useSharedValue(0.8);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const radius1 = useDerivedValue(() => Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.45 * pulse.value);
    const radius2 = useDerivedValue(() => Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.30 * pulse.value);
    const radius3 = useDerivedValue(() => Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.15 * pulse.value);

    return (
        <Animated.View pointerEvents="none" style={{ flex: 1, backgroundColor: '#000', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
            <Canvas style={{ flex: 1 }}>
                <Group>
                    <BlurMask blur={80} style="normal" />
                    <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT / 2} r={radius1} color="rgba(140,20,220,0.15)" />
                    <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT / 2} r={radius2} color="rgba(220,100,255,0.30)" />
                    <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT / 2} r={radius3} color="rgba(255,230,255,0.55)" />
                </Group>
            </Canvas>
        </Animated.View>
    );
}

