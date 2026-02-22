
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { getSandboxPortfolio, tradeStock, getSandboxTransactions, getStockQuote } from '../_utils/api';
import { SandboxPortfolio, SandboxTransaction, SandboxPortfolioItem, Stock } from '../_utils/types';
import { InteractiveChart } from '../_components/InteractiveChart';
import { useFocusEffect } from '@react-navigation/native';
import SandboxTradeModal from '../_components/SandboxTradeModal';
import { Ionicons } from '@expo/vector-icons';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export default function SandboxDetail() {
    const { id } = useLocalSearchParams();
    const sandboxId = Number(id);
    const { colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isDesktop = useIsDesktop();

    const [portfolio, setPortfolio] = useState<SandboxPortfolio | null>(null);
    const [transactions, setTransactions] = useState<SandboxTransaction[]>([]);
    const [stockDetails, setStockDetails] = useState<Record<string, Stock>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permission, setPermission] = useState<string>('owner');

    // Trade State
    const [tradeModalVisible, setTradeModalVisible] = useState(false);
    const [tradeInitialStock, setTradeInitialStock] = useState<Stock | null>(null);
    const [tradeInitialPosition, setTradeInitialPosition] = useState<SandboxPortfolioItem | null>(null);

    // Scrubber State
    const [scrubValue, setScrubValue] = useState<number | null>(null);
    const [scrubTime, setScrubTime] = useState<number | null>(null);

    const canEdit = permission === 'owner' || permission === 'edit';

    const loadData = useCallback(async () => {
        try {
            setError(null);
            const [portData, txData] = await Promise.all([
                getSandboxPortfolio(sandboxId),
                getSandboxTransactions(sandboxId)
            ]);

            if (portData) {
                setPortfolio(portData);
                setTransactions(txData);
                if (portData.permission) setPermission(portData.permission);

                // Fetch details for all symbols in portfolio
                if (portData.portfolio && portData.portfolio.length > 0) {
                    const symbols = portData.portfolio.map(p => p.symbol);
                    const detailsPromises = symbols.map(sym => getStockQuote(sym));
                    const detailsResults = await Promise.all(detailsPromises);

                    const detailsMap: Record<string, Stock> = {};
                    detailsResults.forEach((detail, index) => {
                        if (detail) {
                            detailsMap[symbols[index]] = detail;
                        }
                    });
                    setStockDetails(detailsMap);
                }
            } else {
                setError("Failed to load portfolio.");
            }
        } catch (e) {
            console.error(e);
            setError("An error occurred while loading data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sandboxId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleAddStock = () => {
        setTradeInitialStock(null);
        setTradeInitialPosition(null);
        setTradeModalVisible(true);
    };

    const handleTradeStock = (item: SandboxPortfolioItem) => {
        // We can pass a partial object now, the modal will fetch the full quote
        setTradeInitialStock({
            symbol: item.symbol,
            price: item.current_price,
            changePercent: item.gain_loss_percent,
        } as Stock);
        setTradeInitialPosition(item);
        setTradeModalVisible(true);
    };

    const navigateToDetails = (symbol: string) => {
        router.push(`/stocks/${symbol}`);
    };

    // Calculations for Header
    const currentEquity = scrubValue ?? portfolio?.total_equity ?? 0;
    const initialBalance = portfolio?.initial_balance ?? 10000;

    const totalGain = currentEquity - initialBalance;
    const totalGainPercent = initialBalance > 0 ? (totalGain / initialBalance) * 100 : 0;
    const isPositive = totalGain >= 0;
    const displayColor = isPositive ? '#4cd964' : colors.danger;

    const formatDate = (ts: number | null) => {
        if (!ts) return '';
        return new Date(ts).toLocaleString();
    };

    const onScrub = (value: number | null, timestamp: number | null) => {
        if (value === null || timestamp === null) {
            setScrubValue(null);
            setScrubTime(null);
        } else {
            setScrubValue(value);
            setScrubTime(timestamp);
        }
    };

    if (loading && !portfolio && !error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
                <Text style={{ color: colors.text, fontSize: 16, marginBottom: 10, textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity onPress={() => { setLoading(true); loadData(); }} style={{ padding: 10, backgroundColor: colors.primary, borderRadius: 8 }}>
                    <Text style={{ color: '#fff' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{
                headerTitle: "Sandbox",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
            }} />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
            >
                {/* Header Summary */}
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: colors.secondary, fontSize: 16 }}>Total Equity</Text>
                    <Text style={{ color: colors.text, fontSize: 36, fontWeight: 'bold', marginVertical: 5 }}>
                        ${currentEquity.toFixed(2)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: displayColor, fontSize: 16, fontWeight: 'bold' }}>
                            {totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)} ({totalGainPercent.toFixed(2)}%)
                        </Text>
                        {scrubTime && (
                            <Text style={{ color: colors.secondary, marginLeft: 10, fontSize: 12 }}>
                                {formatDate(scrubTime)}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Shared Badge */}
                {permission !== 'owner' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 6 }}>
                        <Ionicons name="people-outline" size={14} color={permission === 'edit' ? '#4cd964' : colors.primary} />
                        <Text style={{ color: permission === 'edit' ? '#4cd964' : colors.primary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
                            Shared • {permission} access
                        </Text>
                    </View>
                )}

                {/* Chart */}
                <View style={{ height: 300, marginBottom: 20 }}>
                    {portfolio?.equity_history && portfolio.equity_history.length > 0 ? (
                        <InteractiveChart
                            data={portfolio.equity_history}
                            color={isPositive ? '#4cd964' : colors.danger}
                            onScrub={onScrub}
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: colors.secondary }}>No chart data available</Text>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                {portfolio && (
                    <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ color: colors.secondary, fontSize: 12, marginBottom: 4 }}>Cash Balance</Text>
                            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>${portfolio.cash_balance.toFixed(2)}</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: colors.border }} />
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ color: colors.secondary, fontSize: 12, marginBottom: 4 }}>Invested</Text>
                            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                                ${(portfolio.total_equity - portfolio.cash_balance).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Positions Section */}
                <View style={{ marginHorizontal: 20, backgroundColor: '#1A0B2E', borderRadius: 20, padding: 24, marginBottom: 40 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ padding: 8, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
                                <Ionicons name="list" size={20} color={colors.primary} />
                            </View>
                            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Positions</Text>
                        </View>
                        {canEdit && (
                            <TouchableOpacity onPress={handleAddStock} style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                                <Text style={{ color: '#FFF', fontWeight: '600' }}>+ Add Stock</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ gap: 12 }}>
                        {portfolio?.portfolio.map((item) => {
                            const details = stockDetails[item.symbol];
                            const isPositive = item.gain_loss >= 0;
                            return (
                                <TouchableOpacity
                                    key={item.symbol}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 12,
                                        padding: 16,
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onPress={() => navigateToDetails(item.symbol)}
                                >
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{item.symbol[0]}</Text>
                                        </View>
                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{item.symbol}</Text>
                                            <Text style={{ color: colors.icon, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                                                {details?.name || `${item.quantity} shares`}
                                            </Text>
                                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                                <Text style={{ color: colors.icon, fontSize: 12 }}>{item.quantity} shares @ ${item.average_buy_price.toFixed(2)}</Text>
                                                {details?.peRatio && (
                                                    <Text style={{ color: colors.secondary, fontSize: 12 }}>P/E: {details.peRatio.toFixed(1)}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 16 }}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                                                ${item.current_value.toFixed(2)}
                                            </Text>
                                            <Text style={{ color: isPositive ? colors.secondary : colors.danger, fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                                                {isPositive ? '+' : ''}{item.gain_loss.toFixed(2)} ({item.gain_loss_percent.toFixed(2)}%)
                                            </Text>
                                        </View>

                                        {canEdit && (
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleTradeStock(item);
                                                }}
                                                style={{
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 20,
                                                    backgroundColor: colors.primary,
                                                    borderRadius: 12,
                                                    shadowColor: colors.primary,
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 4,
                                                    elevation: 4
                                                }}
                                            >
                                                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>TRADE</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {(!portfolio?.portfolio || portfolio.portfolio.length === 0) && (
                            <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="bar-chart-outline" size={48} color={colors.icon} style={{ opacity: 0.5 }} />
                                <Text style={{ color: colors.icon, marginTop: 16, fontSize: 16 }}>No positions yet.</Text>
                                <Text style={{ color: colors.icon, marginTop: 4 }}>Tap "Add Stock" to start trading!</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <Modal
                visible={tradeModalVisible}
                animationType="slide"
                presentationStyle={isDesktop ? "overFullScreen" : "pageSheet"}
                transparent={isDesktop}
                onRequestClose={() => setTradeModalVisible(false)}
            >
                <SandboxTradeModal
                    sandboxId={Number(id)}
                    availableCash={portfolio?.cash_balance ?? 0}
                    initialStock={tradeInitialStock}
                    currentPosition={tradeInitialPosition}
                    tradeHistory={tradeInitialStock ? transactions.filter(t => t.symbol === tradeInitialStock.symbol) : []}
                    onClose={() => setTradeModalVisible(false)}
                    onSuccess={() => {
                        setTradeModalVisible(false);
                        loadData();
                    }}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({});
