import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface TransactionListProps {
    transactions: any[];
    onTransactionPress: (tx: any) => void;
}

export default function TransactionList({ transactions, onTransactionPress }: TransactionListProps) {
    const { colors: theme } = useTheme();

    if (!transactions || transactions.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={{ color: theme.icon }}>No transactions found for this period</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.item, { backgroundColor: theme.cardBackground }]}
            onPress={() => onTransactionPress(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                {/* Use category icon if available, else generic */}
                <Ionicons name="receipt" size={20} color={theme.primary} />
            </View>
            <View style={styles.details}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {item.remittance_information || item.creditor_name || 'Unknown'}
                </Text>
                <Text style={[styles.date, { color: theme.icon }]}>
                    {new Date(item.booking_date).toLocaleDateString()}
                    {item.category ? ` • ${item.category}` : ' • Uncategorized'}
                </Text>
            </View>
            <Text style={[
                styles.amount,
                { color: item.amount > 0 ? '#4CAF50' : theme.text }
            ]}>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.amount)}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {transactions.map(item => (
                <View key={item.transaction_id} style={{ marginBottom: 12 }}>
                    {renderItem({ item })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    details: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
    },
});
