import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Stack } from 'expo-router';
import { Plus, ArrowUpRight, ArrowDownLeft, Users, PieChart } from 'lucide-react-native';
import PersonList from '@/components/debts/PersonList';
import DebtsList from '@/components/debts/DebtsList';
import AddDebtModal from '@/components/debts/AddDebtModal';
import { useDebtsDatabase } from '@/hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createDebtsStyles } from '@/app/styles/screens/debts.styles';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Platform } from 'react-native';

type Tab = 'OVERALL' | 'OWED_BY_ME' | 'OWED_TO_ME';

export default function DebtsScreen() {
    const insets = useSafeAreaInsets();
    const { isReady, getTotals } = useDebtsDatabase();
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createDebtsStyles(theme), [theme]);
    const isDesktop = useIsDesktop();

    const [activeTab, setActiveTab] = useState<Tab>('OVERALL');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [totals, setTotals] = useState({ iOwe: 0, owedToMe: 0 });

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

    // ─── Desktop Layout ───
    if (isDesktop) {
        return (
            <View style={[styles.container, { paddingTop: 20 }]}>
                <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

                <View style={{ maxWidth: 1200, alignSelf: 'center' as any, width: '100%' as any, flex: 1, paddingHorizontal: 32, paddingBottom: Platform.OS === 'web' ? '5vh' : 40 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { fontSize: 32 }]}>Debts</Text>
                        <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.addButton}>
                            <Plus color="#fff" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Desktop Split View - Full Height Flex Strategy */}
                    <View style={{ flexDirection: 'row', gap: 24, flex: 1 }}>
                        {/* Left Pane — Summary & Tabs */}
                        <View style={{ width: 320, gap: 24 }}>
                            {/* Summary Cards */}
                            <View style={{ backgroundColor: '#1A0B2E', borderRadius: 20, padding: 24 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <View style={{ padding: 10, borderRadius: 12, backgroundColor: theme.primary + '20', marginRight: 12 }}>
                                        <PieChart size={24} color={theme.primary} />
                                    </View>
                                    <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Overview</Text>
                                </View>

                                <View style={[styles.summaryContainer, { flexDirection: 'column', gap: 12, marginBottom: 0, paddingHorizontal: 0 }]}>
                                    <TouchableOpacity
                                        style={[styles.summaryCard, styles.oweCard, { flex: undefined }]}
                                        onPress={() => setActiveTab('OWED_BY_ME')}
                                    >
                                        <View style={styles.summaryIcon}>
                                            <ArrowUpRight color={theme.danger} size={24} />
                                        </View>
                                        <View>
                                            <Text style={styles.summaryLabel}>I Owe</Text>
                                            <Text style={[styles.summaryAmount, { color: theme.danger }]}>
                                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.iOwe)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.summaryCard, styles.owedCard, { flex: undefined }]}
                                        onPress={() => setActiveTab('OWED_TO_ME')}
                                    >
                                        <View style={styles.summaryIcon}>
                                            <ArrowDownLeft color={theme.secondary} size={24} />
                                        </View>
                                        <View>
                                            <Text style={styles.summaryLabel}>Owed to Me</Text>
                                            <Text style={[styles.summaryAmount, { color: theme.secondary }]}>
                                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.owedToMe)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Tabs */}
                            <View style={{ backgroundColor: '#1A0B2E', borderRadius: 20, padding: 24, flex: 1 }}>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 16 }}>Filters</Text>
                                <View style={[styles.tabsContainer, { flexDirection: 'column', gap: 4, padding: 0, backgroundColor: 'transparent' }]}>
                                    {(['OVERALL', 'OWED_BY_ME', 'OWED_TO_ME'] as Tab[]).map(tab => (
                                        <TouchableOpacity
                                            key={tab}
                                            style={[
                                                styles.tab,
                                                activeTab === tab && styles.activeTab,
                                                {
                                                    borderRadius: 12,
                                                    paddingVertical: 14,
                                                    backgroundColor: activeTab === tab ? theme.primary : 'transparent',
                                                }
                                            ]}
                                            onPress={() => setActiveTab(tab)}
                                        >
                                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                                {tab === 'OVERALL' ? 'Overall' : tab === 'OWED_BY_ME' ? 'I Owe' : 'Owed to Me'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Right Pane — Content */}
                        <View style={{ flex: 1, backgroundColor: '#1A0B2E', borderRadius: 20, padding: 24, height: '100%', overflow: 'hidden' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                <View style={{ padding: 10, borderRadius: 12, backgroundColor: theme.primary + '20', marginRight: 12 }}>
                                    <Users size={24} color={theme.primary} />
                                </View>
                                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                                    {activeTab === 'OVERALL' ? 'People' : activeTab === 'OWED_BY_ME' ? 'My Debts' : 'Owed to Me'}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                {activeTab === 'OVERALL' && <PersonList refreshTrigger={refreshTrigger} />}
                                {activeTab === 'OWED_BY_ME' && <DebtsList type="OWED_BY_ME" refreshTrigger={refreshTrigger} onRefresh={refresh} />}
                                {activeTab === 'OWED_TO_ME' && <DebtsList type="OWED_TO_ME" refreshTrigger={refreshTrigger} onRefresh={refresh} />}
                            </View>
                        </View>
                    </View>
                </View>

                <AddDebtModal
                    visible={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refresh}
                />
            </View>
        );
    }

    // ─── Mobile Layout (unchanged) ───
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

            <View style={styles.header}>
                <Text style={styles.title}>Debts</Text>
                <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.addButton}>
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
                        <ArrowUpRight color={theme.danger} size={24} />
                    </View>
                    <View>
                        <Text style={styles.summaryLabel}>I Owe</Text>
                        <Text style={[styles.summaryAmount, { color: theme.danger }]}>
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.iOwe)}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.summaryCard, styles.owedCard]}
                    onPress={() => setActiveTab('OWED_TO_ME')}
                >
                    <View style={styles.summaryIcon}>
                        <ArrowDownLeft color={theme.secondary} size={24} />
                    </View>
                    <View>
                        <Text style={styles.summaryLabel}>Owed to Me</Text>
                        <Text style={[styles.summaryAmount, { color: theme.secondary }]}>
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.owedToMe)}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'OVERALL' && styles.activeTab]}
                    onPress={() => setActiveTab('OVERALL')}
                >
                    <Text style={[styles.tabText, activeTab === 'OVERALL' && styles.activeTabText]}>Overall</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'OWED_BY_ME' && styles.activeTab]}
                    onPress={() => setActiveTab('OWED_BY_ME')}
                >
                    <Text style={[styles.tabText, activeTab === 'OWED_BY_ME' && styles.activeTabText]}>I Owe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'OWED_TO_ME' && styles.activeTab]}
                    onPress={() => setActiveTab('OWED_TO_ME')}
                >
                    <Text style={[styles.tabText, activeTab === 'OWED_TO_ME' && styles.activeTabText]}>Owed to Me</Text>
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
