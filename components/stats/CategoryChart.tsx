import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface CategoryChartProps {
    data: { name: string; value: number; color: string; icon?: string }[];
}

export default function CategoryChart({ data }: CategoryChartProps) {
    const { colors: theme } = useTheme();
    const { width } = useWindowDimensions();

    if (!data || data.length === 0) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <Text style={{ color: theme.icon }}>No expense data available</Text>
            </View>
        );
    }

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    const chartData = data.map(item => ({
        value: item.value,
        color: item.color,
        text: item.name,
        // Gifted charts specific props can go here
    }));

    // Identify the largest category to show in center
    const topCategory = data[0];

    return (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <PieChart
                data={chartData}
                donut
                radius={width * 0.35}
                innerRadius={width * 0.25}
                showText={false}
                centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons
                            name={topCategory.icon as any || 'pricetag'}
                            size={24}
                            color={topCategory.color}
                        />
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>
                            {((topCategory.value / total) * 100).toFixed(0)}%
                        </Text>
                        <Text style={{ color: theme.icon, fontSize: 12 }}>
                            {topCategory.name}
                        </Text>
                    </View>
                )}
            />
            {/* Legend */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24, justifyContent: 'center' }}>
                {data.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
                        <Text style={{ color: theme.text, fontSize: 12 }}>{item.name}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
