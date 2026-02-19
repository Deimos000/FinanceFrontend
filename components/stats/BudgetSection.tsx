import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import {
    fetchMonthlyCashflow,
    fetchBudgetSettings,
    updateBudgetSettings,
    fetchCategoryBudgets,
    updateCategoryBudget,
} from '@/utils/api';

interface CategoryBudget {
    name: string;
    color: string;
    icon: string;
    monthly_budget: number;
}

interface MonthlyCashflow {
    month: string;
    income: number;
    spending: number;
}

interface BudgetSectionProps {
    /** Current month spending per category (from the main stats load) */
    currentSpending: Record<string, number>;
    chartWidth: number;
    /** Called after budgets are saved so parent can refresh warning state */
    onBudgetsUpdated?: (budgets: Record<string, number>) => void;
}

export default function BudgetSection({ currentSpending, chartWidth, onBudgetsUpdated }: BudgetSectionProps) {
    const { colors: theme } = useTheme();

    const [loading, setLoading] = useState(true);
    const [cashflow, setCashflow] = useState<MonthlyCashflow[]>([]);
    const [monthlyIncome, setMonthlyIncome] = useState('');
    const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
    const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});
    const [savingIncome, setSavingIncome] = useState(false);
    const [savingCategory, setSavingCategory] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const [cf, settings, cats] = await Promise.all([
                fetchMonthlyCashflow(6),
                fetchBudgetSettings(),
                fetchCategoryBudgets(),
            ]);
            setCashflow(cf);
            setMonthlyIncome(settings.monthly_income > 0 ? String(settings.monthly_income) : '');
            setCategoryBudgets(cats);
            const inputs: Record<string, string> = {};
            cats.forEach(c => {
                inputs[c.name] = c.monthly_budget > 0 ? String(c.monthly_budget) : '';
            });
            setBudgetInputs(inputs);

            // Notify parent of current budgets
            const budgetMap: Record<string, number> = {};
            cats.forEach(c => { budgetMap[c.name] = c.monthly_budget; });
            onBudgetsUpdated?.(budgetMap);
        } catch (e) {
            console.error('BudgetSection load error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, []);

    const handleSaveIncome = async () => {
        const val = parseFloat(monthlyIncome.replace(',', '.'));
        if (isNaN(val) || val < 0) {
            Alert.alert('Invalid', 'Please enter a valid income amount.');
            return;
        }
        setSavingIncome(true);
        try {
            await updateBudgetSettings(val);
        } catch {
            Alert.alert('Error', 'Failed to save income setting.');
        } finally {
            setSavingIncome(false);
        }
    };

    const handleSaveCategoryBudget = async (catName: string) => {
        const raw = budgetInputs[catName] || '0';
        const val = parseFloat(raw.replace(',', '.'));
        if (isNaN(val) || val < 0) {
            Alert.alert('Invalid', 'Please enter a valid budget amount.');
            return;
        }
        setSavingCategory(catName);
        try {
            await updateCategoryBudget(catName, val);
            // Refresh budgets map for parent
            const updated = { ...budgetInputs };
            updated[catName] = String(val);
            setBudgetInputs(updated);
            const budgetMap: Record<string, number> = {};
            categoryBudgets.forEach(c => {
                budgetMap[c.name] = c.name === catName ? val : (parseFloat(budgetInputs[c.name] || '0') || 0);
            });
            onBudgetsUpdated?.(budgetMap);
        } catch {
            Alert.alert('Error', 'Failed to save budget.');
        } finally {
            setSavingCategory(null);
        }
    };

    // ── Build bar chart data ──────────────────────────────
    const barData: any[] = [];
    const incomeColor = '#4CAF50';
    const spendColor = '#FF5252';

    cashflow.forEach((m, i) => {
        const shortMonth = m.month.substring(5); // "MM"
        const monthLabel = new Date(m.month + '-01').toLocaleString('default', { month: 'short' });
        barData.push({
            value: m.income,
            label: monthLabel,
            frontColor: incomeColor,
            spacing: 4,
        });
        barData.push({
            value: m.spending,
            frontColor: spendColor,
            spacing: i < cashflow.length - 1 ? 20 : 4,
        });
    });

    const maxBarValue = Math.max(...cashflow.map(m => Math.max(m.income, m.spending)), 100);

    const styles = StyleSheet.create({
        card: {
            backgroundColor: theme.cardBackground,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 16,
        },
        sectionLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.icon,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        incomeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
        },
        incomeInput: {
            flex: 1,
            backgroundColor: theme.background,
            color: theme.text,
            padding: 12,
            borderRadius: 12,
            fontSize: 16,
        },
        saveBtn: {
            backgroundColor: theme.primary,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
        },
        saveBtnText: {
            color: '#fff',
            fontWeight: '600',
            fontSize: 14,
        },
        legend: {
            flexDirection: 'row',
            gap: 20,
            marginBottom: 16,
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        legendDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
        },
        legendText: {
            color: theme.icon,
            fontSize: 13,
        },
        catRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
            gap: 12,
        },
        catIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
        catName: {
            flex: 1,
            color: theme.text,
            fontSize: 14,
            fontWeight: '600',
        },
        catSpend: {
            color: theme.icon,
            fontSize: 13,
            minWidth: 70,
            textAlign: 'right',
        },
        catInput: {
            backgroundColor: theme.background,
            color: theme.text,
            padding: 8,
            borderRadius: 10,
            fontSize: 14,
            width: 90,
            textAlign: 'right',
        },
        catSaveBtn: {
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: theme.primary + '20',
        },
        warningDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#FF5252',
        },
    });

    if (loading) {
        return (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
                <ActivityIndicator color={theme.primary} />
            </View>
        );
    }

    return (
        <View>
            {/* ── Income vs Spending Chart ── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Income vs. Spending</Text>

                {/* Monthly income target input */}
                <Text style={styles.sectionLabel}>Expected Monthly Income</Text>
                <View style={styles.incomeRow}>
                    <TextInput
                        style={styles.incomeInput}
                        value={monthlyIncome}
                        onChangeText={setMonthlyIncome}
                        placeholder="e.g. 2000"
                        placeholderTextColor={theme.icon}
                        keyboardType="decimal-pad"
                    />
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveIncome} disabled={savingIncome}>
                        {savingIncome
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.saveBtnText}>Save</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: incomeColor }]} />
                        <Text style={styles.legendText}>Actual Income</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: spendColor }]} />
                        <Text style={styles.legendText}>Spending</Text>
                    </View>
                </View>

                {cashflow.length === 0 ? (
                    <Text style={{ color: theme.icon, textAlign: 'center', paddingVertical: 20 }}>No cashflow data available</Text>
                ) : (
                    <View style={{ alignItems: 'center' }}>
                        <BarChart
                            data={barData}
                            width={chartWidth - 40}
                            height={200}
                            barWidth={22}
                            noOfSections={4}
                            yAxisThickness={0}
                            xAxisColor={theme.border}
                            yAxisTextStyle={{ color: theme.icon, fontSize: 11 }}
                            xAxisLabelTextStyle={{ color: theme.icon, fontSize: 11 }}
                            rulesColor={theme.border + '40'}
                            maxValue={maxBarValue * 1.15}
                            yAxisLabelPrefix="€"
                            isAnimated
                            roundedTop
                            initialSpacing={16}
                        />
                    </View>
                )}
            </View>

            {/* ── Category Budget Limits ── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Category Budgets</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={[styles.sectionLabel, { flex: 1 }]}>Category</Text>
                    <Text style={[styles.sectionLabel, { minWidth: 80, textAlign: 'right' }]}>This Month</Text>
                    <Text style={[styles.sectionLabel, { width: 100, textAlign: 'right' }]}>Budget (€)</Text>
                    <View style={{ width: 44 }} />
                </View>
                {categoryBudgets.map((cat) => {
                    const spent = currentSpending[cat.name] || 0;
                    const budget = parseFloat(budgetInputs[cat.name] || '0') || 0;
                    const over = budget > 0 && spent > budget;
                    return (
                        <View key={cat.name} style={styles.catRow}>
                            <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                                <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                            </View>
                            <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                            {over && <View style={styles.warningDot} />}
                            <Text style={[styles.catSpend, { color: over ? '#FF5252' : theme.icon }]}>
                                €{spent.toFixed(2)}
                            </Text>
                            <TextInput
                                style={styles.catInput}
                                value={budgetInputs[cat.name] || ''}
                                onChangeText={(v) => setBudgetInputs(prev => ({ ...prev, [cat.name]: v }))}
                                placeholder="0"
                                placeholderTextColor={theme.icon}
                                keyboardType="decimal-pad"
                            />
                            <TouchableOpacity
                                style={styles.catSaveBtn}
                                onPress={() => handleSaveCategoryBudget(cat.name)}
                                disabled={savingCategory === cat.name}
                            >
                                {savingCategory === cat.name
                                    ? <ActivityIndicator size="small" color={theme.primary} />
                                    : <Ionicons name="checkmark" size={18} color={theme.primary} />
                                }
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
