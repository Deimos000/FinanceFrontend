import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop, Circle, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

const CHART_HEIGHT = 250;

interface InteractiveChartProps {
    data: { timestamp: number; value: number }[];
    color: string;
    width?: number;
    onScrub: (value: number | null, timestamp: number | null) => void;
}

export const InteractiveChart = ({ data, color, width, onScrub }: InteractiveChartProps) => {
    const { colors: theme } = useTheme();
    const [measuredWidth, setMeasuredWidth] = React.useState(0);

    // If explicit width is provided, use it. Otherwise use measured width.
    const CHART_WIDTH = width || measuredWidth;

    const prices = data?.map(d => d.value) || [];
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;

    // Normalize points
    const points = useMemo(() => {
        if (!data || data.length < 2) return [];
        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * CHART_WIDTH;
            const y = CHART_HEIGHT - ((d.value - min) / range) * (CHART_HEIGHT - 60) - 30; // Increased padding for labels
            return { x, y, value: d.value, timestamp: d.timestamp };
        });
    }, [data, min, range, CHART_WIDTH]);

    const minPoint = useMemo(() => points.reduce((prev, curr) => (curr.value < prev.value ? curr : prev), points[0]), [points]);
    const maxPoint = useMemo(() => points.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), points[0]), [points]);

    // Path string
    const d = useMemo(() => {
        if (points.length === 0) return '';
        return `M ${points.map(p => `${p.x},${p.y}`).join(' ')}`;
    }, [points]);

    // Graph Area (optional fill)
    const areaD = useMemo(() => {
        if (!d) return '';
        return `${d} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;
    }, [d, CHART_WIDTH]);

    // Interaction
    const activeX = useSharedValue(-100);
    const activeY = useSharedValue(-100);
    const isActive = useSharedValue(false);

    const updateScrub = (x: number) => {
        'worklet';
        if (points.length === 0) return;
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

    // If no width provided and haven't measured yet, render specific measuring container
    if (!width && measuredWidth === 0) {
        return (
            <View
                style={{ flex: 1, minHeight: CHART_HEIGHT }}
                onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
            />
        );
    }

    if (!data || data.length < 2) return null;

    const formatDate = (ts: number) => {
        const date = new Date(ts);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
        <GestureHandlerRootView style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
            <GestureDetector gesture={gesture}>
                <View style={{ flex: 1 }}>
                    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                        <Defs>
                            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={color} stopOpacity="0.5" />
                                <Stop offset="1" stopColor={color} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>

                        <Path d={areaD} fill="url(#gradient)" />
                        <Path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Min Point Indicator */}
                        {minPoint && (
                            <>
                                <Circle cx={minPoint.x} cy={minPoint.y} r={4} fill={theme.background} stroke={color} strokeWidth={2} />
                                <SvgText
                                    x={Math.min(Math.max(minPoint.x, 20), CHART_WIDTH - 20)}
                                    y={minPoint.y - 20}
                                    fill={theme.text}
                                    fontSize="10"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                >
                                    {minPoint.value.toFixed(2)}
                                </SvgText>
                                <SvgText
                                    x={Math.min(Math.max(minPoint.x, 20), CHART_WIDTH - 20)}
                                    y={minPoint.y - 8}
                                    fill={theme.icon}
                                    fontSize="10"
                                    textAnchor="middle"
                                >
                                    {formatDate(minPoint.timestamp)}
                                </SvgText>
                            </>
                        )}

                        {/* Max Point Indicator */}
                        {maxPoint && (
                            <>
                                <Circle cx={maxPoint.x} cy={maxPoint.y} r={4} fill={theme.background} stroke={color} strokeWidth={2} />
                                <SvgText
                                    x={Math.min(Math.max(maxPoint.x, 20), CHART_WIDTH - 20)}
                                    y={maxPoint.y - 20}
                                    fill={theme.text}
                                    fontSize="10"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                >
                                    {maxPoint.value.toFixed(2)}
                                </SvgText>
                                <SvgText
                                    x={Math.min(Math.max(maxPoint.x, 20), CHART_WIDTH - 20)}
                                    y={maxPoint.y - 8}
                                    fill={theme.icon}
                                    fontSize="10"
                                    textAnchor="middle"
                                >
                                    {formatDate(maxPoint.timestamp)}
                                </SvgText>
                            </>
                        )}
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
        pointerEvents: 'none',
    },
    cursorLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1, // Thinner line
        pointerEvents: 'none',
        opacity: 0.5,
    },
});
