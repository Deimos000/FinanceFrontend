import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 250;
const CHART_WIDTH = SCREEN_WIDTH;

interface InteractiveChartProps {
    data: { timestamp: number; value: number }[];
    color: string;
    onScrub: (value: number | null, timestamp: number | null) => void;
}

export const InteractiveChart = ({ data, color, onScrub }: InteractiveChartProps) => {
    const { colors: theme } = useTheme();

    if (!data || data.length < 2) return null;

    const prices = data.map(d => d.value);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;

    // Normalize points
    const points = useMemo(() => {
        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * CHART_WIDTH;
            const y = CHART_HEIGHT - ((d.value - min) / range) * (CHART_HEIGHT - 40) - 20; // Padding
            return { x, y, value: d.value, timestamp: d.timestamp };
        });
    }, [data, min, range]);

    // Path string
    const d = useMemo(() => {
        return `M ${points.map(p => `${p.x},${p.y}`).join(' ')}`;
    }, [points]);

    // Graph Area (optional fill)
    const areaD = useMemo(() => {
        return `${d} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;
    }, [d]);

    // Interaction
    const activeX = useSharedValue(-100);
    const activeY = useSharedValue(-100);
    const isActive = useSharedValue(false);

    const updateScrub = (x: number) => {
        'worklet';
        const index = Math.round((x / CHART_WIDTH) * (data.length - 1));
        const point = points[Math.min(Math.max(index, 0), points.length - 1)];
        if (point) {
            activeX.value = point.x;
            activeY.value = point.y;
            runOnJS(onScrub)(point.value, point.timestamp);
        }
    };

    const gesture = Gesture.Pan()
        .onBegin((e) => {
            isActive.value = true;
            updateScrub(e.x);
        })
        .onUpdate((e) => {
            updateScrub(e.x);
        })
        .onEnd(() => {
            isActive.value = false;
            activeX.value = -100;
            runOnJS(onScrub)(null, null);
        });

    const cursorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: activeX.value - 10 }, { translateY: activeY.value - 10 }],
        opacity: isActive.value ? 1 : 0,
    }));

    const lineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: activeX.value }],
        opacity: isActive.value ? 1 : 0,
    }));

    return (
        <GestureHandlerRootView style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
            <GestureDetector gesture={gesture}>
                <View style={{ flex: 1 }}>
                    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                        <Defs>
                            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={color} stopOpacity="0.2" />
                                <Stop offset="1" stopColor={color} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>

                        <Path d={areaD} fill="url(#gradient)" />
                        <Path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>

                    {/* Cursor Line */}
                    <Animated.View style={[styles.cursorLine, lineStyle, { backgroundColor: theme.icon }]} />

                    {/* Cursor Dot */}
                    <Animated.View style={[styles.cursor, cursorStyle, { borderColor: color, backgroundColor: theme.background }]} />
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    cursor: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        top: 0,
        left: 0,
    },
    cursorLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        opacity: 0.5,
    },
});
