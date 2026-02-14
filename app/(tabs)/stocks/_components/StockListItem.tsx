import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stock } from '../_utils/types';
import { useTheme } from '@/context/ThemeContext';

export const StockListItem = ({ item, onPress }: { item: Stock; onPress: () => void }) => {
    const { colors: theme } = useTheme();
    const isPositive = item.change >= 0;
    const color = isPositive ? theme.secondary : theme.danger;

    return (
        <TouchableOpacity
            style={[styles.container, { borderBottomColor: theme.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.left}>
                <View style={[styles.iconBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.iconText, { color: theme.text }]}>{item.symbol[0]}</Text>
                </View>
                <View>
                    <Text style={[styles.symbol, { color: theme.text }]}>{item.symbol}</Text>
                    <Text style={[styles.name, { color: theme.icon }]}>{item.name}</Text>
                </View>
            </View>

            <View style={styles.right}>
                <Text style={[styles.price, { color: theme.text }]}>${item.price.toFixed(2)}</Text>
                <View style={[styles.badge, { backgroundColor: isPositive ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)' }]}>
                    <Text style={[styles.change, { color }]}>
                        {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    iconText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    symbol: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    name: {
        fontSize: 12,
    },
    right: {
        alignItems: 'flex-end',
    },
    price: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    change: {
        fontSize: 12,
        fontWeight: '600',
    },
});
