import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useDebtsDatabase, Debt } from '../../hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';

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
            data={debts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
                const isExpanded = expandedId === item.id;
                return (
                    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                        <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.cardHeader}>
                            <View>
                                <Text style={[styles.desc, { color: theme.text }]}>{item.description}</Text>
                                <Text style={[styles.subtext, { color: theme.icon }]}>{item.person_name} • {new Date(item.created_at).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.right}>
                                <Text style={[styles.amount, { color: type === 'OWED_TO_ME' ? theme.secondary : theme.danger }]}>
                                    {item.remaining_amount.toFixed(2)} €
                                </Text>
                                {isExpanded ? <ChevronUp color={theme.icon} size={20} /> : <ChevronDown color={theme.icon} size={20} />}
                            </View>
                        </TouchableOpacity>

                        {isExpanded && (
                            <View style={[styles.expandedContent, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                                <Text style={[styles.originalAmount, { color: theme.icon }]}>Original debt: {item.amount.toFixed(2)} €</Text>

                                <View style={styles.subList}>
                                    {item.sub_debts.map(sub => (
                                        <View key={sub.id} style={styles.subRow}>
                                            <Text style={[styles.subNote, { color: theme.icon }]}>Paid back</Text>
                                            <Text style={[styles.subAmount, { color: theme.secondary }]}>-{sub.amount.toFixed(2)} €</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Add Payment - debt auto-deletes when fully paid */}
                                <View style={styles.addContainer}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border, borderWidth: 1 }]}
                                        placeholder="0.00"
                                        placeholderTextColor={theme.icon}
                                        keyboardType="numeric"
                                        value={subAmount}
                                        onChangeText={setSubAmount}
                                    />
                                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={() => handleAddSubDebt(item.id)}>
                                        <Text style={styles.addBtnText}>Add Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                );
            }}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.icon }]}>Nothing here.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden'
    },
    cardHeader: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    desc: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtext: {
        fontSize: 13,
        marginTop: 4,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    amount: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    expandedContent: {
        padding: 16,
        borderTopWidth: 1,
    },
    originalAmount: {
        fontSize: 13,
        marginBottom: 10
    },
    subList: {
        marginBottom: 15
    },
    subRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    subNote: {
        fontSize: 14
    },
    subAmount: {
        fontSize: 14
    },
    addContainer: {
        flexDirection: 'row',
        gap: 10
    },
    input: {
        flex: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40
    },
    addBtn: {
        justifyContent: 'center',
        paddingHorizontal: 15,
        borderRadius: 8,
        height: 40
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16
    }
});
