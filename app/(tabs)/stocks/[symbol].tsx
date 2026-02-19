import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Platform, UIManager, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InteractiveChart } from './_components/InteractiveChart';
import { getStockDetails } from './_utils/api';
import { useStockStore } from './_utils/store';
import { Stock } from './_utils/types';
import { useTheme } from '@/context/ThemeContext';
import StockHeader from './_components/StockHeader';
import StockStats, { StockMarketData, StockValuation, StockRatios, StockMargins } from './_components/StockStats';
import StockProfile from './_components/StockProfile';
import AnalystRatings from './_components/AnalystRatings';
import FinancialHealth from './_components/FinancialHealth';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const RANGES = ['1d', '5d', '1mo', '3mo', '1y', 'ytd'];

export default function StockDetail() {
    const { symbol } = useLocalSearchParams<{ symbol: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isWatched, addToWatchlist, removeFromWatchlist } = useStockStore();
    const { colors: theme } = useTheme();
    const isDesktop = useIsDesktop();
    const { width: windowWidth } = useWindowDimensions();

    const [stock, setStock] = useState<Stock | null>(null);
    const [range, setRange] = useState('3mo');
    const [loading, setLoading] = useState(true);
    const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    // Scrubber state
    const [scrubPrice, setScrubPrice] = useState<number | null>(null);
    const [scrubTime, setScrubTime] = useState<number | null>(null);
    const [historicalRange, setHistoricalRange] = useState<{ start: string, end: string } | null>(null);

    const fetchStock = useCallback(async (start?: string, end?: string) => {
        if (!symbol) return;
        setLoading(true);
        let interval = '1d';
        if (range === '1d' || range === '5d') interval = '15m';
        if (start && end) interval = '1d';

        try {
            const data = await getStockDetails(symbol, range, interval, start, end);
            setStock(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [symbol, range]);

    const handleToggleComparison = () => {
        const nextValue = !isComparisonEnabled;
        setIsComparisonEnabled(nextValue);

        if (nextValue && stock?.comparison?.years && stock.comparison.years.length >= 2) {
            const years = [...stock.comparison.years].sort();
            const rangeObj = {
                start: `${years[0]}-01-01`,
                end: `${years[years.length - 1]}-12-31`
            };
            setHistoricalRange(rangeObj);
            fetchStock(rangeObj.start, rangeObj.end);
        } else {
            setHistoricalRange(null);
            fetchStock();
        }
    };

    useEffect(() => {
        if (!isComparisonEnabled) {
            fetchStock();
        } else if (historicalRange) {
            fetchStock(historicalRange.start, historicalRange.end);
        }
    }, [fetchStock, isComparisonEnabled]);

    const isFav = symbol ? isWatched(symbol) : false;

    const toggleFav = () => {
        if (!symbol || !stock) return;
        if (isFav) removeFromWatchlist(symbol);
        else addToWatchlist(symbol, stock.price, stock);
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
                <TouchableOpacity onPress={() => fetchStock()} style={{ marginTop: 20, padding: 10, backgroundColor: theme.cardBackground, borderRadius: 8 }}>
                    <Text style={{ color: theme.primary }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isPositive = stock.change >= 0;
    const color = isPositive ? theme.secondary : theme.danger;
    const displayPrice = scrubPrice !== null ? scrubPrice : stock.price;

    // ─── Desktop: 3-Column Flexbox Grid ───
    const GRID_GAP = 24;
    const ROW_HEIGHT: any = Platform.select({ web: '58vh', default: 200 } as any);
    const DOUBLE_ROW_HEIGHT: any = Platform.select({ web: 'calc(116vh + 24px)', default: 1224 } as any);

    // Use calc() on web for perfect alignment with gaps
    // 3 columns with 2 gaps of 24px total 48px removed from 100%
    // col1 = (100% - 48px) / 3  =>  33.33% - 16px
    // col2 = col1 * 2 + 24px    =>  66.66% - 32px + 24px  =>  66.66% - 8px
    const col1Width: any = Platform.select({ web: 'calc(33.3333% - 16px)', default: '30%' });
    const col2Width: any = Platform.select({ web: 'calc(66.6667% - 8px)', default: '64%' });

    const gridCardBase = {
        backgroundColor: '#1A0B2E', // Purple Background
        borderRadius: 16,
        height: ROW_HEIGHT,
        overflow: 'hidden' as const,
    };

    const noSectionStyle = { paddingHorizontal: 0, marginBottom: 0 };

    if (isDesktop) {
        const startPrice = stock.history?.[0]?.value || 0;
        const endPrice = stock.history?.[stock.history.length - 1]?.value || 0;
        const rangeChange = endPrice - startPrice;
        const rangeChangePercent = startPrice !== 0 ? (rangeChange / startPrice) * 100 : 0;
        const isRangePositive = rangeChange >= 0;
        const rangeColor = isRangePositive ? theme.secondary : theme.danger;

        return (
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 60, maxWidth: 1400, alignSelf: 'center' as any, width: '100%' as any }}>
                    {/* Inline Back Button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                        <TouchableOpacity
                            onPress={() => router.push('/stocks')}
                            style={{
                                width: 40, height: 40, borderRadius: 12,
                                backgroundColor: theme.cardBackground,
                                justifyContent: 'center', alignItems: 'center',
                                marginRight: 16,
                            }}
                        >
                            <Ionicons name="arrow-back" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 14, color: theme.icon, fontWeight: '500' }}>Back to Stocks</Text>
                    </View>

                    {/* Advanced Grid Layout */}
                    <View style={{ gap: GRID_GAP }}>

                        {/* Row 1: Chart (2-col) & Ratings (1-col) */}
                        <View style={{ flexDirection: 'row', gap: GRID_GAP }}>
                            {/* Chart Card */}
                            <View style={[gridCardBase, { width: col2Width, position: 'relative' }]}>
                                {/* Header Section - Absolute Positioning */}
                                <View style={{ position: 'absolute', top: 24, left: 24, right: 24, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>{stock.symbol}</Text>
                                            <TouchableOpacity onPress={toggleFav}>
                                                <Ionicons
                                                    name={isFav ? "star" : "star-outline"}
                                                    size={22}
                                                    color={isFav ? '#EAB308' : theme.icon}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={{ fontSize: 16, color: theme.icon, marginBottom: 8 }}>{stock.name}</Text>

                                        {/* Range Change */}
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                                            <Text style={{ fontSize: 20, fontWeight: '700', color: rangeColor }}>
                                                {rangeChange > 0 ? '+' : ''}{rangeChangePercent.toFixed(2)}%
                                            </Text>
                                            <Text style={{ fontSize: 16, color: theme.icon }}>in {range.toUpperCase()}</Text>
                                        </View>

                                        {/* Today's Change & Sectors */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                                            <Text style={{ fontSize: 14, color: stock.change >= 0 ? theme.secondary : theme.danger, fontWeight: '500' }}>
                                                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%) Today
                                            </Text>

                                            {stock.sector && (
                                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }}>
                                                        <Text style={{ fontSize: 10, color: theme.icon }}>{stock.sector}</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Compare Button */}
                                    <View>
                                        <TouchableOpacity
                                            onPress={handleToggleComparison}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingHorizontal: 16,
                                                paddingVertical: 8,
                                                borderRadius: 20,
                                                backgroundColor: isComparisonEnabled ? theme.primary + '20' : theme.background,
                                                borderWidth: 1,
                                                borderColor: isComparisonEnabled ? theme.primary : theme.border
                                            }}
                                        >
                                            <Ionicons
                                                name="swap-horizontal"
                                                size={16}
                                                color={isComparisonEnabled ? theme.primary : theme.icon}
                                            />
                                            <Text style={{ fontSize: 13, fontWeight: '600', marginLeft: 8, color: isComparisonEnabled ? theme.primary : theme.text }}>
                                                Compare 2Y
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* The Graph - Fills container */}
                                <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 32 }}>
                                    <InteractiveChart
                                        data={stock.history}
                                        color={rangeColor}
                                        width={undefined} // Let it auto-measure or fill
                                        onScrub={(val, ts) => {
                                            setScrubPrice(val);
                                            setScrubTime(ts);
                                        }}
                                    />
                                </View>

                                {/* Range Selector - Absolute Bottom */}
                                <View style={[styles.rangeSelector, { position: 'absolute', bottom: 16, left: 24, right: 24, zIndex: 10, marginTop: 0, marginBottom: 0, paddingHorizontal: 0 }]}>
                                    {RANGES.map((r) => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.rangeBtn, range === r && { backgroundColor: theme.primary + '20' }]}
                                            onPress={() => setRange(r)}
                                        >
                                            <Text style={[styles.rangeText, { color: theme.icon }, range === r && { color: theme.primary, fontWeight: '700' }]}>{r.toUpperCase()}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Analyst Ratings Card */}
                            <View style={[gridCardBase, { width: col1Width, padding: 24 }]}>
                                {/* Current Price Header */}
                                <View style={{ marginBottom: 24, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, color: theme.icon, marginBottom: 4 }}>Current Price</Text>
                                    <Text style={{ fontSize: 42, fontWeight: '800', color: theme.text, letterSpacing: -1 }}>
                                        ${displayPrice?.toFixed(2)}
                                    </Text>
                                </View>

                                <ScrollView contentContainerStyle={{ padding: 0 }} showsVerticalScrollIndicator={false}>
                                    <AnalystRatings stock={stock} theme={theme} containerStyle={noSectionStyle} />
                                </ScrollView>
                            </View>
                        </View>

                        {/* Row 2: Profile (2-col, 2-row height) & Right Stack (1-col) */}
                        <View style={{ flexDirection: 'row', gap: GRID_GAP }}>
                            {/* Company Profile (Tall) */}
                            <View style={[gridCardBase, { width: col2Width, height: DOUBLE_ROW_HEIGHT }]}>
                                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                                    <StockProfile stock={stock} theme={theme} alwaysExpanded={true} containerStyle={noSectionStyle} />
                                </ScrollView>
                            </View>

                            {/* Right Stack */}
                            <View style={{ width: col1Width, flexDirection: 'column', gap: GRID_GAP }}>
                                {/* Market Data */}
                                <View style={[gridCardBase, { width: '100%' }]}>
                                    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                                        <StockMarketData stock={stock} theme={theme} containerStyle={noSectionStyle} />
                                    </ScrollView>
                                </View>
                                {/* Financial Health */}
                                <View style={[gridCardBase, { width: '100%' }]}>
                                    <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                                        <FinancialHealth stock={stock} theme={theme} isComparisonEnabled={isComparisonEnabled} containerStyle={noSectionStyle} />
                                    </ScrollView>
                                </View>
                            </View>
                        </View>

                        {/* Row 3: Remaining Items */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
                            {/* Valuation */}
                            <View style={[gridCardBase, { width: col1Width }]}>
                                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                                    <StockValuation stock={stock} theme={theme} isComparisonEnabled={isComparisonEnabled} containerStyle={noSectionStyle} />
                                </ScrollView>
                            </View>
                            {/* Ratios */}
                            <View style={[gridCardBase, { width: col1Width }]}>
                                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                                    <StockRatios stock={stock} theme={theme} containerStyle={noSectionStyle} />
                                </ScrollView>
                            </View>
                            {/* Margins */}
                            <View style={[gridCardBase, { width: col1Width }]}>
                                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                                    <StockMargins stock={stock} theme={theme} containerStyle={noSectionStyle} />
                                </ScrollView>
                            </View>
                        </View>

                    </View>
                </ScrollView>
            </View>
        );
    }

    // ─── Mobile Layout (unchanged) ───
    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView style={styles.container} scrollEnabled={scrubPrice === null}>
                <View style={[styles.content, { paddingTop: insets.top, paddingBottom: 100 + insets.bottom }]}>
                    <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

                    <StockHeader
                        stock={stock}
                        theme={theme}
                        range={range}
                        displayPrice={displayPrice}
                        scrubTime={scrubTime}
                        isComparisonEnabled={isComparisonEnabled}
                        handleToggleComparison={handleToggleComparison}
                        isFav={isFav}
                        toggleFav={toggleFav}
                    />

                    {/* Chart */}
                    <View style={{ marginTop: 20 }}>
                        <InteractiveChart
                            data={stock.history}
                            color={color}
                            width={windowWidth}
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

                    <AnalystRatings stock={stock} theme={theme} />

                    <StockStats
                        stock={stock}
                        theme={theme}
                        isComparisonEnabled={isComparisonEnabled}
                    />

                    <FinancialHealth
                        stock={stock}
                        theme={theme}
                        isComparisonEnabled={isComparisonEnabled}
                    />

                    <StockProfile stock={stock} theme={theme} />
                </View>
            </ScrollView>

            {/* Fixed Back Button */}
            <TouchableOpacity
                onPress={() => router.push('/stocks')}
                activeOpacity={0.7}
                hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                style={[
                    styles.fixedBackBtn,
                    {
                        top: 80,
                        backgroundColor: theme.primary,
                        borderColor: '#FFFFFF',
                        shadowColor: '#000',
                        elevation: 20,
                    }
                ]}
            >
                <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    fixedBackBtn: {
        position: 'absolute',
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 10,
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
});

