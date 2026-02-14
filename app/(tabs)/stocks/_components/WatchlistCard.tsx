import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { Stock } from '../_utils/types';
import { useTheme } from '@/context/ThemeContext';

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 40;

    // Normalize points
    const points = data.map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <Svg height={height} width={width}>
            <Polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
        </Svg>
    );
};

export const WatchlistCard = ({ item }: { item: Stock }) => {
    const { colors: theme } = useTheme();
    const isPositive = item.change >= 0;
    const color = isPositive ? theme.secondary : theme.danger;
    const historyValues = item.history.map(h => h.value);

    return (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.topRow}>
                <Text style={[styles.symbol, { color: theme.text }]}>{item.symbol}</Text>
                <Text style={[styles.percent, { color }]}>
                    {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                </Text>
            </View>

            <View style={styles.chartContainer}>
                <Sparkline data={historyValues} color={color} />
            </View>

            <View style={styles.bottomRow}>
                <Text style={[styles.price, { color: theme.text }]}>
                    ${item.price.toFixed(2)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 140,
        height: 140,
        borderRadius: 16,
        padding: 12,
        marginRight: 10,
        borderWidth: 1,
        justifyContent: 'space-between'
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    symbol: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    percent: {
        fontSize: 12,
        fontWeight: '600',
    },
    chartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
    },
    bottomRow: {},
    price: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
