import React from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/context/ThemeContext';

interface TrendChartProps {
    data: Record<string, { date: string; amount: number }[]>; // Multi-line data
    categoryColors: Record<string, string>; // Map category name to color
    width?: number;
}

export default function TrendChart({ data, categoryColors = {}, width: propWidth }: TrendChartProps) {
    const { colors: theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const chartWidth = propWidth || (windowWidth - 50);

    const categories = Object.keys(data);
    if (!categories || categories.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={{ color: theme.icon }}>No trend data available</Text>
            </View>
        );
    }

    // 1. Determine full date range from all data
    let allDates: string[] = [];
    categories.forEach(cat => {
        data[cat].forEach(d => allDates.push(d.date));
    });
    // Deduplicate and sort
    allDates = Array.from(new Set(allDates)).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (allDates.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={{ color: theme.icon }}>No trend data available</Text>
            </View>
        );
    }

    // Fill gaps? better to just ensure we have start/end.
    // Let's assume the API returns what it has, we should probably fill gaps between min and max date.

    const startDate = new Date(allDates[0]);
    const endDate = new Date(allDates[allDates.length - 1]);
    const filledDates: string[] = [];

    // Safety check loop to prevent infinite loop if dates are weird
    let loopDate = new Date(startDate);
    let iterations = 0;
    while (loopDate <= endDate && iterations < 366 * 2) { // limit to 2 years
        filledDates.push(loopDate.toISOString().split('T')[0]);
        loopDate.setDate(loopDate.getDate() + 1);
        iterations++;
    }

    // 2. Build datasets
    const dataSet = categories.map(cat => {
        const color = categoryColors[cat] || theme.primary;
        const catData = filledDates.map((dateStr, index) => {
            const existing = data[cat].find(d => d.date === dateStr);
            const amount = existing ? existing.amount : 0;

            // Show label rules (same as before)
            const showLabel = filledDates.length < 10 || index % Math.ceil(filledDates.length / 5) === 0;

            return {
                value: amount,
                // Only show labels for one dataset to avoid duplicates? Or handle x-axis separately.
                // Gifted charts usually takes labels from the first dataset or `data`.
                // label: showLabel ? new Date(dateStr).getDate().toString() : '', 
                labelTextStyle: { color: theme.icon, fontSize: 10 },
                dataPointText: amount > 0 && showLabel && categories.length <= 3 ? Math.round(amount).toString() : '', // Only show values if few lines
            };
        });

        return {
            data: catData,
            color: color,
            dataPointsColor: color,
            thickness: 3,
            startFillColor: color,
            endFillColor: color,
            startOpacity: 0.05,
            endOpacity: 0.0,
            curved: true,
            hideDataPoints: false,
        };
    });

    // Add labels to the first dataset for X-Axis
    if (dataSet.length > 0) {
        dataSet[0].data = dataSet[0].data.map((item, index) => {
            const showLabel = filledDates.length < 10 || index % Math.ceil(filledDates.length / 5) === 0;
            const d = new Date(filledDates[index]);
            return {
                ...item,
                label: showLabel ? d.getDate().toString() : '',
            }
        })
    }

    const maxValue = Math.max(...categories.map(cat => Math.max(...data[cat].map(d => d.amount)))) || 100;

    return (
        <View style={styles.container}>
            <LineChart
                dataSet={dataSet}
                width={chartWidth}
                height={220}
                spacing={chartWidth / (filledDates.length + 2)}
                thickness={3}
                dataPointsRadius={3}
                textColor={theme.text}
                initialSpacing={20}
                yAxisThickness={0}
                xAxisType="solid"
                xAxisColor={theme.border}
                yAxisTextStyle={{ color: theme.icon }}
                rulesType="solid"
                rulesColor={theme.border + '40'}
                maxValue={maxValue * 1.1}
                hideRules={false}
                yAxisLabelPrefix="€"
                yAxisLabelWidth={40}
                isAnimated
            />
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
});
