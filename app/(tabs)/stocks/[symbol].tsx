import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InteractiveChart } from './_components/InteractiveChart';
import { getStockDetails } from './_utils/api';
import { useStockStore } from './_utils/store';
import { Stock } from './_utils/types';
import { useTheme } from '@/context/ThemeContext';

const RANGES = ['1d', '5d', '1mo', '3mo', '1y', 'ytd'];

export default function StockDetail() {
    const { symbol } = useLocalSearchParams<{ symbol: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isWatched, addToWatchlist, removeFromWatchlist } = useStockStore();
    const { colors: theme } = useTheme();

    const [stock, setStock] = useState<Stock | null>(null);
    const [range, setRange] = useState('3mo');
    const [loading, setLoading] = useState(true);

    // Scrubber state
    const [scrubPrice, setScrubPrice] = useState<number | null>(null);
    const [scrubTime, setScrubTime] = useState<number | null>(null);

    const fetchStock = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        // Map range to Yahoo interval
        let interval = '1d';
        if (range === '1d' || range === '5d') interval = '15m'; // More granular for short term

        try {
            const data = await getStockDetails(symbol, range, interval);
            setStock(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [symbol, range]);

    useEffect(() => {
        fetchStock();
    }, [fetchStock]);

    const isFav = symbol ? isWatched(symbol) : false;

    const toggleFav = () => {
        if (!symbol) return;
        if (isFav) removeFromWatchlist(symbol);
        else addToWatchlist(symbol);
    };

    if (loading && !stock) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
                <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    if (!stock) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Failed to load stock data.</Text>
                <TouchableOpacity onPress={fetchStock} style={{ marginTop: 20, padding: 10, backgroundColor: theme.cardBackground, borderRadius: 8 }}>
                    <Text style={{ color: theme.primary }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isPositive = stock.change >= 0;
    const color = isPositive ? theme.secondary : theme.danger;

    // Displayed Price (Scrubbed or Current)
    const displayPrice = scrubPrice !== null ? scrubPrice : stock.price;

    // Formatting Date for Scrubber
    const formatDate = (ts: number | null) => {
        if (!ts) return 'Today';
        const date = new Date(ts);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} scrollEnabled={scrubPrice === null}>
            <View style={[styles.content, { paddingTop: insets.top }]}>
                <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

                {/* Header Actions */}
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <Ionicons name="arrow-back" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: theme.text }]}>{stock.symbol}</Text>
                    <TouchableOpacity onPress={toggleFav} style={[styles.iconBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <Ionicons
                            name={isFav ? "star" : "star-outline"}
                            size={20}
                            color={isFav ? '#EAB308' : theme.text}
                        />
                    </TouchableOpacity>
                </View>

                {/* Main Price Header */}
                <View style={styles.header}>
                    <Text style={[styles.name, { color: theme.icon }]}>{stock.name}</Text>
                    <Text style={[styles.price, { color: theme.text }]}>${displayPrice?.toFixed(2)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {scrubPrice === null ? (
                            <>
                                <Text style={[styles.change, { color }]}>
                                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                </Text>
                                <Text style={[styles.todayLabel, { color: theme.icon }]}>Today</Text>
                            </>
                        ) : (
                            <Text style={[styles.todayLabel, { color: theme.icon }]}>{formatDate(scrubTime)}</Text>
                        )}
                    </View>

                    {stock.sector && (
                        <View style={styles.tags}>
                            <View style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}><Text style={[styles.tagText, { color: theme.icon }]}>{stock.sector}</Text></View>
                            {stock.industry && <View style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}><Text style={[styles.tagText, { color: theme.icon }]}>{stock.industry}</Text></View>}
                        </View>
                    )}
                </View>

                {/* Chart */}
                <View style={{ marginTop: 20 }}>
                    <InteractiveChart
                        data={stock.history}
                        color={color}
                        onScrub={(val, ts) => {
                            setScrubPrice(val);
                            setScrubTime(ts);
                        }}
                    />
                </View>

                {/* Range Selector */}
                <View style={styles.rangeSelector}>
                    {RANGES.map((r) => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.rangeBtn, range === r && { backgroundColor: theme.cardBackground }]}
                            onPress={() => setRange(r)}
                        >
                            <Text style={[styles.rangeText, { color: theme.icon }, range === r && { color: theme.primary }]}>{r.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Stats Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Statistics</Text>
                    <View style={styles.statsGrid}>
                        <StatBox label="OPEN" value={stock.open?.toFixed(2)} theme={theme} />
                        <StatBox label="HIGH" value={stock.high?.toFixed(2)} theme={theme} />
                        <StatBox label="LOW" value={stock.low?.toFixed(2)} theme={theme} />
                        <StatBox label="MKT CAP" value={formatLargeNumber(stock.marketCap)} theme={theme} />
                        <StatBox label="VOL" value={formatLargeNumber(stock.volume)} theme={theme} />
                        <StatBox label="P/E" value={stock.peRatio?.toFixed(2)} theme={theme} />
                        <StatBox label="DIV YIELD" value={stock.dividendYield ? `${(stock.dividendYield * 100).toFixed(2)}%` : '-'} theme={theme} />
                        <StatBox label="PREV CLOSE" value={stock.previousClose?.toFixed(2)} theme={theme} />
                        <StatBox label="52W HIGH" value={stock.fiftyTwoWeekHigh?.toFixed(2)} theme={theme} />
                        <StatBox label="52W LOW" value={stock.fiftyTwoWeekLow?.toFixed(2)} theme={theme} />
                    </View>
                </View>

                {/* Company Profile Section */}
                {stock.description && (
                    <View style={[styles.section, { marginBottom: 40 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Company Profile</Text>

                        <View style={[styles.profileGrid, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            {stock.country && <ProfileRow label="Headquarters" value={`${stock.city ? stock.city + ', ' : ''}${stock.country}`} theme={theme} />}
                            {stock.employees && <ProfileRow label="Employees" value={stock.employees.toLocaleString()} theme={theme} />}
                            {stock.website && <ProfileRow label="Website" value={stock.website} theme={theme} />}
                            {stock.sector && <ProfileRow label="Sector" value={stock.sector} theme={theme} />}
                            {stock.industry && <ProfileRow label="Industry" value={stock.industry} theme={theme} />}
                        </View>

                        <Text style={[styles.description, { marginTop: 16, color: theme.icon }]}>
                            {stock.description}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const StatBox = ({ label, value, theme }: { label: string, value?: string | number, theme: any }) => (
    <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.statLabel, { color: theme.icon }]}>{label}</Text>
        <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value || '-'}</Text>
    </View>
);

const ProfileRow = ({ label, value, theme }: { label: string, value: string, theme: any }) => (
    <View style={[styles.profileRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.profileLabel, { color: theme.icon }]}>{label}</Text>
        <Text style={[styles.profileValue, { color: theme.text }]}>{value}</Text>
    </View>
);

const formatLargeNumber = (num?: number) => {
    if (!num) return '-';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    name: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    price: {
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 4,
    },
    change: {
        fontSize: 16,
        fontWeight: '600',
    },
    todayLabel: {
        fontSize: 14,
        marginLeft: 6,
    },
    tags: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        minWidth: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    rangeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
        marginTop: 10,
    },
    rangeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    rangeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statBox: {
        width: '31%',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    profileGrid: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
    },
    profileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    profileLabel: {
        fontSize: 14,
    },
    profileValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
    },
});
