import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/context/ThemeContext';

interface SpendingGraphProps {
    data: { date: string; amount: number }[];
}

export default function SpendingGraph({ data }: SpendingGraphProps) {
    const { colors: theme } = useTheme();
    const { width } = useWindowDimensions();

    if (!data || data.length === 0) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <Text style={{ color: theme.icon }}>No spending data available</Text>
            </View>
        );
    }

    const chartData = data.map(item => ({
        value: item.amount,
        label: new Date(item.date).getDate().toString(),
        frontColor: '#FF5252', // Red for expenses
    }));

    return (
        <View style={{ marginVertical: 20 }}>
            <BarChart
                data={chartData}
                width={width - 80} // Adjust for padding
                height={200}
                barWidth={12}
                spacing={16}
                roundedTop
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: theme.icon, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.icon, fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...data.map(d => d.amount)) * 1.2}
            />
        </View>
    );
}
