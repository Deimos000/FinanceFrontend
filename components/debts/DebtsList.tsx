import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useDebtsDatabase, Debt } from '../../hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';
import { createDebtsListStyles } from '@/app/styles/components/DebtsList.styles';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function DebtsList({ type, refreshTrigger, onRefresh }: { type: 'OWED_BY_ME' | 'OWED_TO_ME', refreshTrigger: number, onRefresh?: () => void }) {
    const { isReady, getDebtsList, createSubDebt } = useDebtsDatabase();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [subAmount, setSubAmount] = useState('');
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createDebtsListStyles(theme), [theme]);

    useEffect(() => {
        if (isReady) {
            fetchData();
        }
    }, [type, refreshTrigger, isReady]);

    const fetchData = async () => {
        try {
            const data = await getDebtsList(type);
            setDebts(data);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
        setSubAmount('');
    };

    const handleAddSubDebt = async (debtId: number) => {
        if (!subAmount || isNaN(Number(subAmount))) return;

        try {
            await createSubDebt(debtId, Number(subAmount), 'Partial payment');
            fetchData();
            setSubAmount('');
            setExpandedId(null); // Collapse after payment (debt may have been deleted)
            if (onRefresh) onRefresh();
        } catch (e) {
            Alert.alert('Error', 'Failed to add payment');
        }
    };

    return (
        <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            data={debts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
                const isExpanded = expandedId === item.id;
                return (
                    <View style={styles.card}>
                        <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.cardHeader}>
                            <View>
                                <Text style={styles.desc}>{item.description}</Text>
                                <Text style={styles.subtext}>{item.person_name} • {new Date(item.created_at).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.right}>
                                <Text style={[styles.amount, { color: type === 'OWED_TO_ME' ? theme.secondary : theme.danger }]}>
                                    {item.remaining_amount.toFixed(2)} €
                                </Text>
                                {isExpanded ? <ChevronUp color={theme.icon} size={20} /> : <ChevronDown color={theme.icon} size={20} />}
                            </View>
                        </TouchableOpacity>

                        {isExpanded && (
                            <View style={styles.expandedContent}>
                                <Text style={styles.originalAmount}>Original debt: {item.amount.toFixed(2)} €</Text>

                                <View style={styles.subList}>
                                    {item.sub_debts.map(sub => (
                                        <View key={sub.id} style={styles.subRow}>
                                            <Text style={styles.subNote}>Paid back</Text>
                                            <Text style={styles.subAmount}>-{sub.amount.toFixed(2)} €</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Add Payment - debt auto-deletes when fully paid */}
                                <View style={styles.addContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        placeholderTextColor={theme.icon}
                                        keyboardType="numeric"
                                        value={subAmount}
                                        onChangeText={setSubAmount}
                                    />
                                    <TouchableOpacity style={styles.addBtn} onPress={() => handleAddSubDebt(item.id)}>
                                        <Text style={styles.addBtnText}>Add Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>Nothing here.</Text>}
        />
    );
}
