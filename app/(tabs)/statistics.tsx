import { useTheme } from '@/context/ThemeContext';
import {
    fetchCategories,
    fetchCategorySpending,
    fetchCategoryTrends,
    fetchUncategorizedTransactions,
    fetchTransactions,
    triggerCategorization,
    updateTransactionCategory,
    createCategory
} from '@/utils/api';
import CategoryBreakdown from '@/components/stats/CategoryBreakdown';
import TrendChart from '@/components/stats/TrendChart';
import TimeRangeSelector, { TimeRange } from '@/components/stats/TimeRangeSelector';
import TransactionList from '@/components/stats/TransactionList';
import BudgetSection from '@/components/stats/BudgetSection';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDesktop } from '@/hooks/useIsDesktop';

type Tab = 'overview' | 'transactions' | 'budget';

export default function StatisticsScreen() {
    const insets = useSafeAreaInsets();
    const { colors: theme } = useTheme();
    const isDesktop = useIsDesktop();

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [categorizing, setCategorizing] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Data State
    const [categoryTrends, setCategoryTrends] = useState<Record<string, { date: string; amount: number }[]>>({});
    const [categorySpending, setCategorySpending] = useState<{ name: string; value: number; color: string; icon: string }[]>([]);
    const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});

    const [uncategorized, setUncategorized] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [totalSpending, setTotalSpending] = useState(0);

    // Budget state – budgets map from category name → limit (€)
    const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

    // Modal State
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    // Add Category State
    const [addCategoryMode, setAddCategoryMode] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#FF9800');
    const [newCatIcon, setNewCatIcon] = useState('pricetag');

    // Category Detail State
    const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<string | null>(null);

    // Calculate dates based on range
    const getDateRange = (range: TimeRange) => {
        const end = new Date();
        const start = new Date();

        switch (range) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(end.getFullYear() - 1);
                break;
            default:
                start.setMonth(end.getMonth() - 1);
        }

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRange(timeRange);

            const [trends, catSpending, uncategorizedTx, allTx, allCats] = await Promise.all([
                fetchCategoryTrends(startDate, endDate),
                fetchCategorySpending(startDate, endDate),
                fetchUncategorizedTransactions(),
                fetchTransactions(undefined, undefined, startDate, endDate),
                fetchCategories()
            ]);

            setCategoryTrends(trends);
            setCategorySpending(catSpending);
            setUncategorized(uncategorizedTx.transactions || []);
            setAllTransactions(allTx.transactions || []);
            setCategories(allCats);

            const colors: Record<string, string> = {};
            allCats.forEach(c => colors[c.name] = c.color);
            setCategoryColors(colors);

            const total = catSpending.reduce((acc, curr) => acc + curr.value, 0);
            setTotalSpending(total);

        } catch (e) {
            console.error('Failed to load statistics:', e);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadData(); }, [timeRange]);

    useFocusEffect(
        useCallback(() => { loadData(); }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleAutoCategorize = async () => {
        setCategorizing(true);
        try {
            const res = await triggerCategorization();
            Alert.alert(
                "Gemini AI",
                `Categorized ${res.updated} transactions.\n${res.message}`
            );
            loadData();
        } catch (e) {
            Alert.alert("Error", "Failed to run AI categorization");
        } finally {
            setCategorizing(false);
        }
    };

    const handleManualCategorize = async (categoryName: string) => {
        if (!selectedTx) return;
        try {
            await updateTransactionCategory(selectedTx.transaction_id, categoryName);
            setCategoryModalVisible(false);
            setSelectedTx(null);
            loadData();
        } catch (e) {
            Alert.alert("Error", "Failed to update category");
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim()) {
            Alert.alert('Validation', 'Category name is required');
            return;
        }
        try {
            await createCategory({
                name: newCatName.trim(),
                color: newCatColor,
                icon: newCatIcon
            });
            setAddCategoryMode(false);
            setNewCatName('');
            const allCats = await fetchCategories();
            setCategories(allCats);
        } catch (e) {
            Alert.alert('Error', 'Failed to create category');
        }
    };

    const openCategoryPicker = (tx: any) => {
        setSelectedTx(tx);
        setCategoryModalVisible(true);
        setAddCategoryMode(false);
    };

    // Build spending map for BudgetSection: categoryName → amount spent this period
    const currentSpendingMap = useMemo(() => {
        const map: Record<string, number> = {};
        categorySpending.forEach(c => { map[c.name] = c.value; });
        return map;
    }, [categorySpending]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingHorizontal: 20,
            paddingBottom: 8,
        },
        headerTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 32,
            fontWeight: 'bold',
            color: theme.text,
        },
        tabContainer: {
            flexDirection: 'row',
            marginBottom: 8,
            backgroundColor: theme.cardBackground,
            padding: 4,
            borderRadius: 12,
        },
        tabButton: {
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 10,
        },
        activeTab: {
            backgroundColor: theme.primary,
        },
        activeTabText: {
            color: '#FFFFFF',
        },
        tabText: {
            fontWeight: '600',
            fontSize: 14,
            color: theme.text,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingBottom: 120,
        },
        card: {
            backgroundColor: theme.cardBackground,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 16,
        },
        statRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        uncategorizedItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.background,
            padding: 12,
            borderRadius: 12,
            marginBottom: 8,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: theme.cardBackground,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: '85%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: theme.text,
        },
        catButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme.background,
            borderRadius: 16,
            marginBottom: 12,
        },
        input: {
            backgroundColor: theme.background,
            padding: 16,
            borderRadius: 12,
            color: theme.text,
            marginBottom: 16,
            fontSize: 16,
        },
        colorPicker: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
        },
        colorOption: {
            width: 32,
            height: 32,
            borderRadius: 16,
        },
        primaryButton: {
            backgroundColor: theme.primary,
            padding: 16,
            borderRadius: 16,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
        }
    });

    const { width: windowWidth } = useWindowDimensions();
    const contentWidth = Math.min(windowWidth, 1200) - 64;

    // ── Shared modals (used by both layouts) ──────────────
    const categoryPickerModal = (
        <Modal visible={categoryModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, isDesktop && { maxWidth: 500, alignSelf: 'center', width: '100%' as any }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {addCategoryMode ? 'New Category' : 'Select Category'}
                        </Text>
                        <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    {addCategoryMode ? (
                        <View>
                            <TextInput
                                style={styles.input}
                                placeholder="Category Name"
                                placeholderTextColor={theme.icon}
                                value={newCatName}
                                onChangeText={setNewCatName}
                                autoFocus
                            />
                            <Text style={{ color: theme.text, marginBottom: 8 }}>Pick a Color:</Text>
                            <View style={styles.colorPicker}>
                                {['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'].map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.colorOption, { backgroundColor: c, borderWidth: newCatColor === c ? 2 : 0, borderColor: theme.text }]}
                                        onPress={() => setNewCatColor(c)}
                                    />
                                ))}
                            </View>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleAddCategory}>
                                <Text style={styles.primaryButtonText}>Create Category</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={() => setAddCategoryMode(false)}>
                                <Text style={{ color: theme.icon }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                            <TouchableOpacity
                                style={[styles.catButton, { justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }]}
                                onPress={() => setAddCategoryMode(true)}
                            >
                                <Ionicons name="add" size={24} color={theme.primary} style={{ marginRight: 8 }} />
                                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>Add New Category</Text>
                            </TouchableOpacity>

                            {categories.map((cat, idx) => (
                                <TouchableOpacity key={idx} style={styles.catButton} onPress={() => handleManualCategorize(cat.name)}>
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        backgroundColor: cat.color + '20',
                                        alignItems: 'center', justifyContent: 'center',
                                        marginRight: 16
                                    }}>
                                        <Ionicons name={cat.icon as any || 'pricetag'} size={20} color={cat.color} />
                                    </View>
                                    <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );

    const categoryDetailsModal = (
        <Modal
            visible={!!selectedCategoryDetails}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedCategoryDetails(null)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: '80%' }, isDesktop && { maxWidth: 500, alignSelf: 'center', width: '100%' as any }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{selectedCategoryDetails}</Text>
                        <TouchableOpacity onPress={() => setSelectedCategoryDetails(null)}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                        <TransactionList
                            transactions={allTransactions.filter(t => t.category === selectedCategoryDetails)}
                            onTransactionPress={(tx) => {
                                setSelectedCategoryDetails(null);
                                openCategoryPicker(tx);
                            }}
                        />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // ─── Desktop Layout ───────────────────────────────────
    if (isDesktop) {
        return (
            <View style={[styles.container, { paddingTop: 20 }]}>
                <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 40, maxWidth: 1200, alignSelf: 'center' as any, width: '100%' as any }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={[styles.title, { fontSize: 32 }]}>Statistics</Text>
                            <TouchableOpacity onPress={handleAutoCategorize} disabled={categorizing} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '20', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
                                {categorizing ? <ActivityIndicator size="small" color={theme.primary} /> : (
                                    <><Ionicons name="sparkles" size={16} color={theme.primary} style={{ marginRight: 6 }} /><Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>Auto-Categorize</Text></>
                                )}
                            </TouchableOpacity>
                        </View>
                        <TimeRangeSelector selectedRange={timeRange} onSelectRange={setTimeRange} />
                        {/* Tabs: Overview / Transactions / Budget */}
                        <View style={styles.tabContainer}>
                            {(['overview', 'transactions', 'budget'] as Tab[]).map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tabButton, activeTab === tab && styles.activeTab]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {loading ? (
                        <View style={{ paddingTop: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : activeTab === 'overview' ? (
                        <>
                            {/* Spending Breakdown – pie chart LEFT, list RIGHT */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Spending Breakdown</Text>
                                <CategoryBreakdown
                                    data={categorySpending}
                                    total={totalSpending}
                                    onCategoryPress={setSelectedCategoryDetails}
                                    horizontal={true}
                                    categoryBudgets={categoryBudgets}
                                />
                            </View>

                            {/* Spending Trends – full width */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Spending Trends</Text>
                                <TrendChart data={categoryTrends} categoryColors={categoryColors} width={contentWidth - 40} />
                            </View>

                            {/* Uncategorized */}
                            {uncategorized.length > 0 && (
                                <View style={styles.card}>
                                    <Text style={styles.cardTitle}>Uncategorized ({uncategorized.length})</Text>
                                    {uncategorized.map((tx: any) => (
                                        <TouchableOpacity key={tx.transaction_id} style={styles.uncategorizedItem} onPress={() => openCategoryPicker(tx)}>
                                            <Ionicons name="help-circle" size={20} color={theme.icon} style={{ marginRight: 12 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: theme.text, fontWeight: '500' }}>{tx.recipient || tx.creditor_name || tx.remittance_information || 'Unknown'}</Text>
                                                <Text style={{ color: theme.icon, fontSize: 12 }}>{new Date(tx.date).toLocaleDateString()}</Text>
                                            </View>
                                            <Text style={{ color: theme.danger, fontWeight: '600' }}>{tx.amount?.toFixed(2)}€</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </>
                    ) : activeTab === 'budget' ? (
                        <BudgetSection
                            currentSpending={currentSpendingMap}
                            chartWidth={contentWidth}
                            onBudgetsUpdated={setCategoryBudgets}
                        />
                    ) : (
                        <TransactionList transactions={allTransactions} onTransactionPress={openCategoryPicker} />
                    )}
                </ScrollView>

                {categoryPickerModal}
                {categoryDetailsModal}
            </View>
        );
    }

    // ─── Mobile Layout (unchanged) ────────────────────────
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Statistics</Text>
                    <TouchableOpacity
                        onPress={handleAutoCategorize}
                        disabled={categorizing}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.primary + '20',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 12
                        }}
                    >
                        {categorizing ? <ActivityIndicator size="small" color={theme.primary} /> : (
                            <>
                                <Ionicons name="sparkles" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>Auto-Categorize</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.tabContainer}>
                    {(['overview', 'transactions'] as Tab[]).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, { color: activeTab === tab ? '#FFF' : theme.text }]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TimeRangeSelector selectedRange={timeRange} onSelectRange={setTimeRange} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
                ) : (
                    <>
                        {activeTab === 'overview' ? (
                            <>
                                <View style={styles.card}>
                                    <Text style={styles.cardTitle}>Spending Breakdown</Text>
                                    <CategoryBreakdown
                                        data={categorySpending}
                                        total={totalSpending}
                                        onCategoryPress={setSelectedCategoryDetails}
                                    />
                                </View>

                                <View style={styles.card}>
                                    <Text style={styles.cardTitle}>Spending Trend (By Category)</Text>
                                    <View style={{ overflow: 'hidden' }}>
                                        <TrendChart data={categoryTrends} categoryColors={categoryColors} />
                                    </View>
                                </View>

                                {uncategorized.length > 0 && (
                                    <View style={styles.card}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <Text style={styles.cardTitle}>Uncategorized ({uncategorized.length})</Text>
                                            <TouchableOpacity onPress={() => setActiveTab('transactions')}>
                                                <Text style={{ color: theme.primary }}>View All</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {uncategorized.slice(0, 3).map((tx, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.uncategorizedItem}
                                                onPress={() => openCategoryPicker(tx)}
                                            >
                                                <View style={{
                                                    width: 40, height: 40, borderRadius: 20,
                                                    backgroundColor: '#FF980020',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    marginRight: 12
                                                }}>
                                                    <Ionicons name="help" size={20} color="#FF9800" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '500' }} numberOfLines={1}>
                                                        {tx.remittance_information || tx.creditor_name || 'Unknown'}
                                                    </Text>
                                                    <Text style={{ color: theme.icon, fontSize: 12 }}>
                                                        {new Date(tx.booking_date).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View>
                                <Text style={{ color: theme.icon, marginBottom: 10, textAlign: 'center' }}>
                                    {allTransactions.length} transactions in this period
                                </Text>
                                <TransactionList
                                    transactions={allTransactions}
                                    onTransactionPress={openCategoryPicker}
                                />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {categoryPickerModal}
            {categoryDetailsModal}
        </View>
    );
}
