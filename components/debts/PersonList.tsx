import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useDebtsDatabase, Person } from '../../hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';
import { createPersonListStyles } from '@/app/styles/components/PersonList.styles';

export default function PersonList({ refreshTrigger }: { refreshTrigger: number }) {
    const { isReady, getPeopleSummary, error } = useDebtsDatabase();
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createPersonListStyles(theme), [theme]);

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
    if (error) return <Text style={styles.errorText}>Database error: {error}</Text>;

    return (
        <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            data={people}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <View style={styles.leftContent}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>{item.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <View style={styles.rightContent}>
                        <Text style={[
                            styles.balance,
                            { color: item.netBalance > 0 ? theme.secondary : (item.netBalance < 0 ? theme.danger : theme.icon) }
                        ]}>
                            {item.netBalance > 0 ? '+' : ''}{item.netBalance.toFixed(2)} €
                        </Text>
                        <Text style={styles.balanceLabel}>
                            {item.netBalance > 0 ? 'owes you' : (item.netBalance < 0 ? 'you owe' : 'settled')}
                        </Text>
                    </View>
                </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No debts recorded yet.</Text>}
        />
    );
}
