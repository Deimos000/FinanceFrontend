import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export type TimeRange = 'week' | 'month' | 'year' | 'all';

interface TimeRangeSelectorProps {
    selectedRange: TimeRange;
    onSelectRange: (range: TimeRange) => void;
}

export default function TimeRangeSelector({ selectedRange, onSelectRange }: TimeRangeSelectorProps) {
    const { colors: theme } = useTheme();

    const ranges: { label: string; value: TimeRange }[] = [
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
        { label: 'Year', value: 'year' },
        // { label: 'All', value: 'all' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
            {ranges.map((range) => {
                const isSelected = selectedRange === range.value;
                return (
                    <TouchableOpacity
                        key={range.value}
                        style={[
                            styles.button,
                            isSelected && { backgroundColor: theme.primary },
                        ]}
                        onPress={() => onSelectRange(range.value)}
                    >
                        <Text
                            style={[
                                styles.text,
                                { color: isSelected ? '#FFFFFF' : theme.text },
                                isSelected && { fontWeight: 'bold' }
                            ]}
                        >
                            {range.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    text: {
        fontSize: 14,
    },
});
