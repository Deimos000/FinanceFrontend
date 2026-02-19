import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stock } from '../_utils/types';

interface StockHeaderProps {
    stock: Stock;
    theme: any;
    range: string;
    displayPrice: number;
    scrubTime: number | null;
    isComparisonEnabled: boolean;
    handleToggleComparison: () => void;
    isFav: boolean;
    toggleFav: () => void;
}

export default function StockHeader({
    stock,
    theme,
    range,
    displayPrice,
    scrubTime,
    isComparisonEnabled,
    handleToggleComparison,
    isFav,
    toggleFav
}: StockHeaderProps) {
    const isPositive = stock.change >= 0;
    const color = isPositive ? theme.secondary : theme.danger;

    const formatDate = (ts: number | null) => {
        if (!ts) return '';
        const date = new Date(ts);

        if (range === '1d' || range === '5d') {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } else if (range === '1mo' || range === '3mo') {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
    };

    return (
        <View>
            {/* Header Actions */}
            <View style={styles.navBar}>
                <View style={{ width: 40 }} />
                <Text style={[styles.navTitle, { color: theme.text }]}>{stock.symbol}</Text>
                <TouchableOpacity onPress={toggleFav} style={[styles.iconBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Ionicons
                        name={isFav ? "star" : "star-outline"}
                        size={20}
                        color={isFav ? '#EAB308' : theme.text}
                    />
                </TouchableOpacity>
            </View>

            {/* Main Price Header */}
            <View style={styles.header}>
                <Text style={[styles.name, { color: theme.icon }]}>{stock.name}</Text>
                <Text style={[styles.price, { color: theme.text }]}>${displayPrice?.toFixed(2)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {scrubTime === null ? (
                        <>
                            <Text style={[styles.change, { color }]}>
                                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                            </Text>
                            <Text style={[styles.todayLabel, { color: theme.icon }]}>
                                {stock.snapshotDate ? `as of ${stock.snapshotDate}` : 'Today'}
                            </Text>
                        </>
                    ) : (
                        <Text style={[styles.todayLabel, { color: theme.icon }]}>{formatDate(scrubTime)}</Text>
                    )}

                    <TouchableOpacity
                        onPress={handleToggleComparison}
                        style={[
                            styles.compareToggle,
                            {
                                marginLeft: 12,
                                backgroundColor: isComparisonEnabled ? theme.primary + '20' : 'transparent',
                                borderColor: isComparisonEnabled ? theme.primary : theme.border
                            }
                        ]}
                    >
                        <Ionicons
                            name="swap-horizontal"
                            size={14}
                            color={isComparisonEnabled ? theme.primary : theme.icon}
                        />
                        <Text style={[styles.compareToggleText, { color: isComparisonEnabled ? theme.primary : theme.icon }]}>
                            Compare 2Y
                        </Text>
                    </TouchableOpacity>
                </View>

                {stock.sector && (
                    <View style={styles.tags}>
                        <View style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}><Text style={[styles.tagText, { color: theme.icon }]}>{stock.sector}</Text></View>
                        {stock.industry && <View style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}><Text style={[styles.tagText, { color: theme.icon }]}>{stock.industry}</Text></View>}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    name: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    price: {
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 4,
    },
    change: {
        fontSize: 16,
        fontWeight: '600',
    },
    todayLabel: {
        fontSize: 14,
        marginLeft: 6,
    },
    tags: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        minWidth: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    compareToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    compareToggleText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
});
