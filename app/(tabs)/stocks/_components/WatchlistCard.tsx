
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { WishlistItem } from '../_utils/types';
import { useTheme } from '@/context/ThemeContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';

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

export const WatchlistCard = ({ item, onPress, style, hideChart }: { item: WishlistItem; onPress?: () => void; style?: any; hideChart?: boolean }) => {
    const { colors, theme } = useTheme();
    const isDesktop = useIsDesktop();
    // Prefer current data, fallback to snapshot
    const stock = item.current || item.snapshot;

    // Fallback if no snapshot
    if (!stock) {
        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: theme === 'dark' ? colors.cardBackground : (isDesktop ? colors.background : '#FFFFFF'), borderColor: colors.border, borderWidth: theme === 'dark' ? 0 : 1 }, style]}
                onPress={onPress}
            >
                <View style={styles.topRow}>
                    <Text style={[styles.symbol, { color: colors.text }]}>{item.symbol}</Text>
                </View>
                <View style={styles.bottomRow}>
                    <Text style={[styles.price, { color: colors.text, fontSize: 14 }]}>
                        Initial: ${item.initial_price?.toFixed(2)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    const isPositive = stock.change >= 0;
    const color = isPositive ? colors.secondary : colors.danger;
    const historyValues = stock.history?.map(h => h.value) || [];

    const dateAdded = item.added_at ? new Date(item.added_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

    if (hideChart) {
        return (
            <TouchableOpacity
                style={[styles.card, { height: 'auto' as any, backgroundColor: theme === 'dark' ? colors.cardBackground : (isDesktop ? colors.background : '#FFFFFF'), borderColor: colors.border, borderWidth: theme === 'dark' ? 0 : 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }, style]}
                onPress={onPress}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.symbol, { color: colors.text }]}>{item.symbol}</Text>
                    {dateAdded ? <Text style={{ fontSize: 10, color: colors.icon, marginTop: 2 }}>{dateAdded}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.price, { color: colors.text, fontSize: 16 }]}>${stock.price?.toFixed(2)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={[styles.percent, { color }]}>
                            {isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                        </Text>
                        {item.initial_price && (
                            <Text style={{ fontSize: 10, color: stock.price >= item.initial_price ? colors.secondary : colors.danger, fontWeight: '600' }}>
                                {((stock.price - item.initial_price) / item.initial_price * 100).toFixed(1)}%
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme === 'dark' ? colors.cardBackground : (isDesktop ? colors.background : '#FFFFFF'), borderColor: colors.border, borderWidth: theme === 'dark' ? 0 : 1 }, style]}
            onPress={onPress}
        >
            <View style={styles.topRow}>
                <Text style={[styles.symbol, { color: colors.text }]}>{item.symbol}</Text>
                <Text style={[styles.percent, { color }]}>
                    {isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                </Text>
            </View>

            <View style={styles.chartContainer}>
                {historyValues.length > 0 && <Sparkline data={historyValues} color={color} />}
            </View>

            <View style={styles.bottomRow}>
                <Text style={[styles.price, { color: colors.text }]}>
                    ${stock.price?.toFixed(2)}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    {dateAdded ? (
                        <Text style={{ fontSize: 10, color: colors.icon }}>
                            {dateAdded}
                        </Text>
                    ) : <View />}

                    {/* Show gain/loss since added */}
                    {item.initial_price && (
                        <Text style={{
                            fontSize: 10,
                            color: stock.price >= item.initial_price ? colors.secondary : colors.danger,
                            fontWeight: '600'
                        }}>
                            {((stock.price - item.initial_price) / item.initial_price * 100).toFixed(1)}% since add
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {

        height: 150,
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        // borderWidth: 1, // Removed to match Market Movers
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
