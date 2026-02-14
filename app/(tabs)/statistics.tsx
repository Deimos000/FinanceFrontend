import { useTheme } from '@/context/ThemeContext';
import { fetchCategories, fetchDailySpending, fetchMonthlyIncome } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';

// Getting screen width
const screenWidth = Dimensions.get('window').width;

export default function StatisticsScreen() {
    const { colors: theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [dailySpending, setDailySpending] = useState<{ date: string; amount: number }[]>([]);
    const [monthlyIncome, setMonthlyIncome] = useState<{ month: string; amount: number }[]>([]);
    const [categories, setCategories] = useState<{ name: string; color: string; icon: string; total: number }[]>([]);
    const [selectedPoint, setSelectedPoint] = useState<any>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const spending = await fetchDailySpending(14); // Last 14 days
            const income = await fetchMonthlyIncome(6); // Last 6 months
            const cats = await fetchCategories();

            setDailySpending(spending);
            setMonthlyIncome(income);
            setCategories(cats);
        } catch (e) {
            console.error('Failed to load statistics:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Transform data for Gifted Charts (or simple SVG mapping if library not available)
    // Checking package.json... I see "react-native-svg" but NOT "react-native-gifted-charts". 
    // I must use "react-native-svg" directly or install "react-native-gifted-charts".
    // Since I cannot install new packages easily without user permission (and I should avoid big deps), 
    // I will build simple charts using basic Views or SVG if needed. 
    // Actually, for "WOW" factor, simple Views for bars are easiest and look good if styled well.

    const renderBarChart = (data: { label: string; value: number }[], color: string) => {
        if (data.length === 0) return <Text style={{ color: theme.icon }}>No data available</Text>;

        const maxVal = Math.max(...data.map(d => d.value), 1);

        return (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 8, paddingTop: 20 }}>
                {data.map((item, index) => {
                    const height = (item.value / maxVal) * 100;
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setSelectedPoint({ ...item, type: 'bar' })}
                            style={{ flex: 1, alignItems: 'center', gap: 5 }}
                        >
                            <View style={{
                                width: '100%',
                                height: `${height}%`,
                                backgroundColor: color,
                                borderRadius: 4,
                                opacity: 0.8
                            }} />
                            <Text style={{ color: theme.icon, fontSize: 10 }} numberOfLines={1}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Statistics</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Categories Preview */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {categories.map((cat, index) => (
                            <TouchableOpacity key={index} style={[styles.categoryCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
                                    <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                                </View>
                                <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Daily Spending */}
                <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Spending (14 Days)</Text>
                    {loading ? <ActivityIndicator /> : renderBarChart(
                        dailySpending.map(d => ({
                            label: new Date(d.date).getDate().toString(),
                            value: d.amount
                        })),
                        '#F44336'
                    )}
                </View>

                {/* Monthly Income */}
                <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Monthly Income</Text>
                    {loading ? <ActivityIndicator /> : renderBarChart(
                        monthlyIncome.map(d => ({
                            label: d.month.split('-')[1],
                            value: d.amount
                        })),
                        '#4CAF50'
                    )}
                </View>

                {/* Selected Item Detail Modal/Area */}
                {selectedPoint && (
                    <View style={[styles.detailBox, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                        <Ionicons name="information-circle" size={20} color={theme.primary} />
                        <Text style={{ color: theme.text, marginLeft: 10 }}>
                            {selectedPoint.label}: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(selectedPoint.value)}
                        </Text>
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
        gap: 20,
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    categoryCard: {
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 90,
        borderWidth: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '500',
    },
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        opacity: 0.8,
    },
    detailBox: {
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10
    }
});
