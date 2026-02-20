import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/context/ThemeContext';
import { TimeRange } from './TimeRangeSelector';

// Modern, vibrant color palette (consistent with CategoryBreakdown)
const MODERN_COLORS = [
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#6366F1', // Indigo
    '#F43F5E', // Rose
    '#84CC16', // Lime
    '#14B8A6', // Teal
];

interface TrendChartProps {
    data: Record<string, { date: string; amount: number }[]>; // Multi-line data
    categoryColors: Record<string, string>; // Map category name to color
    width?: number;
    timeRange: TimeRange;
}

export default function TrendChart({ data, categoryColors, width: propWidth, timeRange }: TrendChartProps) {
    const { colors: theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const chartWidth = propWidth || (windowWidth - 50);

    // Process data into stacked bar format
    const chartData = useMemo(() => {
        const categories = Object.keys(data);
        if (!categories.length) return [];

        // 1. Identify all buckets based on timeRange
        // Use an array to guarantee order
        const buckets: { key: string, label: string, date: Date }[] = [];
        const now = new Date();

        // Helper to formatting ISO dates (YYYY-MM-DD)
        const toIso = (d: Date) => d.toISOString().split('T')[0];

        // Generate last 10 buckets
        for (let i = 9; i >= 0; i--) {
            const d = new Date();
            let key = '';
            let label = '';

            if (timeRange === 'week') {
                d.setDate(now.getDate() - (i * 7));
                // Find start of week (Monday)
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                d.setDate(diff);
                const isoDate = toIso(d);
                key = isoDate; // Group by week start date
                label = `${d.getDate()}/${d.getMonth() + 1}`;
            } else if (timeRange === 'month') {
                d.setMonth(now.getMonth() - i);
                d.setDate(1); // Start of month
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                label = d.toLocaleString('default', { month: 'short' });
            } else if (timeRange === 'year') {
                d.setFullYear(now.getFullYear() - i);
                key = String(d.getFullYear()); // Group by year
                label = key;
            }
            buckets.push({ key, label, date: d });
        }

        // 2. Aggregate data into buckets
        // Map: BucketKey -> { CategoryName -> Amount }
        const aggregated: Record<string, Record<string, number>> = {};
        buckets.forEach(b => aggregated[b.key] = {});

        // Determine category total values for consistent coloring order
        const categoryTotals: Record<string, number> = {};
        categories.forEach(cat => categoryTotals[cat] = 0);

        categories.forEach(cat => {
            data[cat].forEach(txn => {
                const date = new Date(txn.date);
                let key = '';

                if (timeRange === 'week') {
                    // Find start of week for this txn
                    const day = date.getDay();
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                    const weekStart = new Date(date);
                    weekStart.setDate(diff);
                    key = toIso(weekStart);
                } else if (timeRange === 'month') {
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                } else if (timeRange === 'year') {
                    key = String(date.getFullYear());
                }

                if (aggregated[key]) {
                    if (!aggregated[key][cat]) aggregated[key][cat] = 0;
                    aggregated[key][cat] += txn.amount;
                    categoryTotals[cat] += txn.amount;
                }
            });
        });

        // 3. Create StackData
        // Sort categories by total spending to assign colors consistently
        const sortedCategories = [...categories].sort((a, b) => categoryTotals[b] - categoryTotals[a]);

        // Create color map
        const colorMap: Record<string, string> = {};
        sortedCategories.forEach((cat, idx) => {
            colorMap[cat] = MODERN_COLORS[idx % MODERN_COLORS.length];
        });

        const result = buckets.map(bucket => {
            const bucketData = aggregated[bucket.key];
            let stacks = sortedCategories.map(cat => {
                const value = bucketData[cat] || 0;
                if (value <= 0) return null;
                return {
                    value,
                    color: colorMap[cat],
                    marginBottom: 1, // slight separation
                };
            }).filter(Boolean) as { value: number, color: string }[];

            // Ensure stacks is never incorrectly empty which might crash the chart lib
            if (stacks.length === 0) {
                stacks = [{ value: 0, color: 'transparent' }];
            }

            return {
                stacks,
                label: bucket.label,
                spacing: 30,
                labelTextStyle: { color: theme.icon, fontSize: 10 },
            };
        });

        return result;

    }, [data, timeRange, theme]);


    if (!chartData || chartData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={{ color: theme.icon }}>No trend data available</Text>
            </View>
        );
    }

    // Determine Y max
    const maxValue = Math.max(...chartData.map(item =>
        item.stacks.reduce((sum, stack) => sum + stack.value, 0)
    ), 1);

    // Calculate dynamic bar width and spacing
    const numItems = chartData.length;
    // We want the chart to take up full width.
    // Total Width ≈ (barWidth + spacing) * numItems
    // Let spacing = barWidth * 0.5 (half as wide as bar)
    // Width = barWidth * (1 + 0.5) * numItems = barWidth * 1.5 * numItems
    // barWidth = Width / (1.5 * numItems)

    // Adjust slightly for initial spacing if needed, but simple ratio is good start.
    // Let's reserve some padding on sides (e.g. 20px total)
    const availableWidth = chartWidth - 32;
    let dynamicBarWidth = availableWidth / (numItems * 1.5);

    // Clamp bar width
    if (dynamicBarWidth > 60) dynamicBarWidth = 60;
    if (dynamicBarWidth < 10) dynamicBarWidth = 10;

    const dynamicSpacing = dynamicBarWidth * 0.5;

    return (
        <View style={[styles.container, { width: chartWidth, overflow: 'hidden' }]}>
            <BarChart
                width={chartWidth}
                height={220}
                noOfSections={4}
                stackData={chartData}
                barWidth={dynamicBarWidth}
                spacing={dynamicSpacing}
                initialSpacing={16}
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: theme.icon, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.icon, fontSize: 10 }}
                maxValue={maxValue * 1.1} // +10% padding
                isAnimated
                yAxisLabelPrefix="€"
                yAxisLabelWidth={40}
                rulesType="solid"
                rulesColor={theme.border + '40'}
                rulesLength={chartWidth - 40} // Ensure rules don't overflow
            />
            {/* Simple Legend for top 5 */}
            <View style={styles.legendContainer}>
                {Object.keys(data)
                    .sort((a, b) => {
                        // We need the totals again for the legend to match color processing order
                        // But for simplicity let's just use the `colorMap` logic or just map keys
                        // Re-calculating totals is safer
                        const totalA = data[a].reduce((s, t) => s + t.amount, 0);
                        const totalB = data[b].reduce((s, t) => s + t.amount, 0);
                        return totalB - totalA;
                    })
                    .slice(0, 5) // Show top 5
                    .map((cat, idx) => (
                        <View key={cat} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: MODERN_COLORS[idx % MODERN_COLORS.length] }]} />
                            <Text style={[styles.legendText, { color: theme.text }]}>{cat}</Text>
                        </View>
                    ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    }
});
