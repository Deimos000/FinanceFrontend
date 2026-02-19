import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface CategoryData {
    name: string;
    value: number;
    color: string;
    icon: string;
}

interface CategoryBreakdownProps {
    data: CategoryData[];
    total: number;
    onCategoryPress: (categoryName: string) => void;
    /** Desktop mode: pie chart on left, list on right */
    horizontal?: boolean;
    /** Budget limits by category name – triggers ⚠️ if spending exceeds limit */
    categoryBudgets?: Record<string, number>;
}

export default function CategoryBreakdown({
    data,
    total,
    onCategoryPress,
    horizontal = false,
    categoryBudgets,
}: CategoryBreakdownProps) {
    const { colors: theme } = useTheme();

    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={{ color: theme.icon }}>No data for this period</Text>
            </View>
        );
    }

    const pieData = data.map(item => ({
        value: item.value,
        color: item.color,
        text: item.name,
        focused: false,
    }));

    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const pieChart = (
        <View style={[styles.chartContainer, horizontal && { marginBottom: 0, marginRight: 24, flex: 1 }]}>
            <PieChart
                data={pieData}
                donut
                radius={horizontal ? 130 : 120}
                innerRadius={horizontal ? 86 : 80}
                innerCircleColor={theme.cardBackground}
                showText={false}
                centerLabelComponent={() => (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: theme.text, fontSize: horizontal ? 20 : 24, fontWeight: 'bold' }}>
                            €{total.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={{ color: theme.icon, fontSize: 13 }}>Total</Text>
                    </View>
                )}
            />
        </View>
    );

    const list = (
        <View style={[styles.listContainer, horizontal && { flex: 1 }]}>
            {sortedData.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const budget = categoryBudgets?.[item.name];
                const overBudget = budget != null && budget > 0 && item.value > budget;
                return (
                    <TouchableOpacity
                        key={index}
                        style={[styles.listItem, { borderBottomColor: theme.border }]}
                        onPress={() => onCategoryPress(item.name)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon as any} size={18} color={item.color} />
                        </View>
                        <View style={styles.itemDetails}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                                {overBudget && (
                                    <View style={styles.warningBadge}>
                                        <Text style={styles.warningText}>⚠️ Over budget</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${Math.min(percentage, 100)}%`,
                                            backgroundColor: overBudget ? '#FF5252' : item.color,
                                        }
                                    ]}
                                />
                                {/* Budget marker line */}
                                {budget != null && budget > 0 && total > 0 && (
                                    <View
                                        style={[
                                            styles.budgetMarker,
                                            {
                                                left: `${Math.min((budget / total) * 100, 100)}%`,
                                                backgroundColor: theme.text,
                                            }
                                        ]}
                                    />
                                )}
                            </View>
                            {budget != null && budget > 0 && (
                                <Text style={{ color: overBudget ? '#FF5252' : theme.icon, fontSize: 11, marginTop: 2 }}>
                                    €{item.value.toFixed(2)} / €{budget.toFixed(2)} budget
                                </Text>
                            )}
                        </View>
                        <View style={styles.itemAmount}>
                            <Text style={[styles.amountText, { color: theme.text }]}>
                                €{item.value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            <Text style={[styles.percentText, { color: theme.icon }]}>
                                {percentage.toFixed(1)}%
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    if (horizontal) {
        return (
            <View style={[styles.container, { flexDirection: 'row', alignItems: 'flex-start' }]}>
                {pieChart}
                {list}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {pieChart}
            {list}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    emptyContainer: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    listContainer: {
        gap: 4,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    itemDetails: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: '#E0E0E030',
        borderRadius: 2,
        overflow: 'visible',
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    budgetMarker: {
        position: 'absolute',
        top: -3,
        width: 2,
        height: 10,
        borderRadius: 1,
    },
    itemAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 14,
        fontWeight: '600',
    },
    percentText: {
        fontSize: 12,
    },
    warningBadge: {
        backgroundColor: '#FF525220',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    warningText: {
        fontSize: 10,
        color: '#FF5252',
        fontWeight: '600',
    },
});
