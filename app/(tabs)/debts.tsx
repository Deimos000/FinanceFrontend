import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Stack } from 'expo-router';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import PersonList from '@/components/debts/PersonList';
import DebtsList from '@/components/debts/DebtsList';
import AddDebtModal from '@/components/debts/AddDebtModal';
import { useDebtsDatabase } from '@/hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';

type Tab = 'OVERALL' | 'OWED_BY_ME' | 'OWED_TO_ME';

export default function DebtsScreen() {
    const { isReady, getTotals } = useDebtsDatabase();
    const [activeTab, setActiveTab] = useState<Tab>('OVERALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [totals, setTotals] = useState({ iOwe: 0, owedToMe: 0 });
    const { colors } = useTheme();

    const refresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    useEffect(() => {
        if (isReady) {
            loadTotals();
        }
    }, [isReady, refreshTrigger]);

    const loadTotals = async () => {
        try {
            const data = await getTotals();
            setTotals(data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                title: 'Debts',
                headerShown: false
            }} />

            <View style={[styles.header, { justifyContent: 'flex-end' }]}>
                <TouchableOpacity onPress={() => setIsModalOpen(true)} style={[styles.addButton, { backgroundColor: colors.primary }]}>
                    <Plus color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <TouchableOpacity
                    style={[styles.summaryCard, styles.oweCard]}
                    onPress={() => setActiveTab('OWED_BY_ME')}
                >
                    <View style={styles.summaryIcon}>
                        <ArrowUpRight color={colors.danger} size={24} />
                    </View>
                    <View>
                        <Text style={[styles.summaryLabel, { color: colors.icon }]}>I Owe</Text>
                        <Text style={[styles.summaryAmount, { color: colors.danger }]}>
                            {totals.iOwe.toFixed(2)} €
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.summaryCard, styles.owedCard]}
                    onPress={() => setActiveTab('OWED_TO_ME')}
                >
                    <View style={styles.summaryIcon}>
                        <ArrowDownLeft color={colors.secondary} size={24} />
                    </View>
                    <View>
                        <Text style={[styles.summaryLabel, { color: colors.icon }]}>Owed to Me</Text>
                        <Text style={[styles.summaryAmount, { color: colors.secondary }]}>
                            {totals.owedToMe.toFixed(2)} €
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={[styles.tabsContainer, { backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'OVERALL' && { backgroundColor: colors.border }]}
                    onPress={() => setActiveTab('OVERALL')}
                >
                    <Text style={[styles.tabText, { color: colors.icon }, activeTab === 'OVERALL' && { color: colors.text }]}>Overall</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'OWED_BY_ME' && { backgroundColor: colors.border }]}
                    onPress={() => setActiveTab('OWED_BY_ME')}
                >
                    <Text style={[styles.tabText, { color: colors.icon }, activeTab === 'OWED_BY_ME' && { color: colors.text }]}>I Owe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'OWED_TO_ME' && { backgroundColor: colors.border }]}
                    onPress={() => setActiveTab('OWED_TO_ME')}
                >
                    <Text style={[styles.tabText, { color: colors.icon }, activeTab === 'OWED_TO_ME' && { color: colors.text }]}>Owed to Me</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'OVERALL' && <PersonList refreshTrigger={refreshTrigger} />}
                {activeTab === 'OWED_BY_ME' && <DebtsList type="OWED_BY_ME" refreshTrigger={refreshTrigger} onRefresh={refresh} />}
                {activeTab === 'OWED_TO_ME' && <DebtsList type="OWED_TO_ME" refreshTrigger={refreshTrigger} onRefresh={refresh} />}
            </View>

            <AddDebtModal
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refresh}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 10,
        borderRadius: 50,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    oweCard: {
        backgroundColor: 'rgba(255, 69, 58, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 58, 0.3)',
    },
    owedCard: {
        backgroundColor: 'rgba(50, 215, 75, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(50, 215, 75, 0.3)',
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 13,
        marginBottom: 2,
    },
    summaryAmount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    }
});
