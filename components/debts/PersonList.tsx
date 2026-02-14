import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useDebtsDatabase, Person } from '../../hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';

export default function PersonList({ refreshTrigger }: { refreshTrigger: number }) {
    const { isReady, getPeopleSummary, error } = useDebtsDatabase();
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors: theme } = useTheme();

    useEffect(() => {
        if (isReady) {
            fetchData();
        }
    }, [refreshTrigger, isReady]);

    const fetchData = async () => {
        try {
            const data = await getPeopleSummary();
            setPeople(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isReady || loading) return <ActivityIndicator color={theme.primary} />;
    if (error) return <Text style={[styles.emptyText, { color: theme.danger }]}>Database error: {error}</Text>;

    return (
        <FlatList
            data={people}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.leftContent}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
                            <Text style={styles.iconText}>{item.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <View style={styles.rightContent}>
                        <Text style={[
                            styles.balance,
                            { color: item.netBalance > 0 ? theme.secondary : (item.netBalance < 0 ? theme.danger : theme.icon) }
                        ]}>
                            {item.netBalance > 0 ? '+' : ''}{item.netBalance.toFixed(2)} €
                        </Text>
                        <Text style={[styles.balanceLabel, { color: theme.icon }]}>
                            {item.netBalance > 0 ? 'owes you' : (item.netBalance < 0 ? 'you owe' : 'settled')}
                        </Text>
                    </View>
                </View>
            )}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.icon }]}>No debts recorded yet.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    balanceLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16
    }
});
