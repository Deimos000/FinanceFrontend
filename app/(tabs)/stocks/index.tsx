import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDebounce } from './_utils/useDebounce';

import { searchStocks, getSandboxes, createSandbox, deleteSandbox, getMarketMovers, getSharedSandboxes } from './_utils/api';
import { useStockStore } from './_utils/store';
import { Stock, Sandbox } from './_utils/types';

import { StockListItem } from './_components/StockListItem';
import { WatchlistCard } from './_components/WatchlistCard';
import ShareSandboxModal from './_components/ShareSandboxModal';
import { useSandboxStore } from './_utils/sandboxStore';
import { useTheme } from '@/context/ThemeContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const BALANCE_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];

export default function StocksOverview() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { watchlist, loadWishlist, loading: wishlistLoading } = useStockStore();
    const { colors, theme } = useTheme();
    const isDesktop = useIsDesktop();

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 800);
    const [results, setResults] = useState<Stock[]>([]);
    const [marketMovers, setMarketMovers] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(false);

    // Sandbox State
    const { sandboxes, sharedSandboxes, loadSandboxes } = useSandboxStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [newSandboxName, setNewSandboxName] = useState('');
    const [newSandboxBalance, setNewSandboxBalance] = useState(10000);

    // Share Modal State
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareTargetSandbox, setShareTargetSandbox] = useState<Sandbox | null>(null);

    useEffect(() => {
        if (sandboxes.length === 0 && sharedSandboxes.length === 0) {
            loadSandboxes();
        }
        loadMarketMovers();
    }, []);

    const loadMarketMovers = async () => {
        const data = await getMarketMovers();
        setMarketMovers(data);
    };

    const handleCreateSandbox = async () => {
        if (!newSandboxName.trim()) return;
        await createSandbox(newSandboxName, newSandboxBalance);
        setNewSandboxName('');
        setNewSandboxBalance(10000);
        setModalVisible(false);
        loadSandboxes();
    };

    const handleDeleteSandbox = (sandbox: Sandbox) => {
        const doDelete = async () => {
            await deleteSandbox(sandbox.id);
            loadSandboxes();
        };
        if (Platform.OS === 'web') {
            if (window.confirm(`Delete "${sandbox.name}"? This cannot be undone.`)) doDelete();
        } else {
            Alert.alert(
                'Delete Sandbox',
                `Are you sure you want to delete "${sandbox.name}"? This cannot be undone.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: doDelete },
                ]
            );
        }
    };

    const handleShareSandbox = (sandbox: Sandbox) => {
        setShareTargetSandbox(sandbox);
        setShareModalVisible(true);
    };

    const formatCompactMoney = (amount: number) => {
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount}`;
    };

    // Initial Load & Search Logic
    useEffect(() => {
        loadWishlist();
    }, []);

    useEffect(() => {
        loadData(debouncedQuery);
    }, [debouncedQuery]);

    const loadData = async (text: string) => {
        setLoading(true);
        try {
            const data = await searchStocks(text);
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Derived State: Watchlist Stocks
    const watchlistData = watchlist;

    const getSandboxPnL = (sandbox: Sandbox) => {
        const initial = sandbox.initial_balance || 10000;
        const current = sandbox.total_equity ?? sandbox.balance;
        const pnl = current - initial;
        const pnlPercent = initial > 0 ? (pnl / initial) * 100 : 0;
        return { pnl, pnlPercent };
    };

    const dateString = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    // ─── Desktop Layout ───
    if (isDesktop) {
        return (
            <View style={[styles.container, { paddingTop: 20, backgroundColor: colors.background }]}>
                <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
                <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 40, maxWidth: 1400, alignSelf: 'center' as any, width: '100%' as any }} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 }}>
                        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.text }}>Stocks</Text>
                        <Text style={{ fontSize: 18, fontWeight: '500', color: colors.icon }}>{dateString}</Text>
                    </View>

                    {/* Centered Search */}
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View style={[styles.searchContainer, { width: '100%', maxWidth: 600, height: 56, borderRadius: 16, backgroundColor: colors.cardBackground, borderWidth: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }]}>
                            <Ionicons name="search" size={24} color={colors.icon} style={{ marginRight: 12, marginLeft: 8 }} />
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, fontSize: 18 },
                                    Platform.select({ web: { outlineStyle: 'none' } as any })
                                ]}
                                placeholder="Search stocks, ETFs, and more..."
                                placeholderTextColor={colors.icon}
                                value={query}
                                onChangeText={setQuery}
                            />
                            {loading && <ActivityIndicator style={{ marginRight: 8 }} color={colors.primary} />}
                        </View>
                    </View>

                    {/* Search Results (Overlay or replace content) */}
                    {query ? (
                        <View style={{ minHeight: 400 }}>
                            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Search Results</Text>
                            {loading ? (
                                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                            ) : results.length > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                    {results.map(item => (
                                        <TouchableOpacity
                                            key={item.symbol}
                                            onPress={() => router.push(`/stocks/${item.symbol}`)}
                                            style={{ width: '32%', backgroundColor: colors.cardBackground, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            <View>
                                                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{item.symbol}</Text>
                                                <Text style={{ color: colors.icon, fontSize: 12 }} numberOfLines={1}>{item.name}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <Text style={{ color: colors.icon, fontSize: 16 }}>No results found.</Text>
                            )}
                        </View>
                    ) : (
                        <>
                            {/* Market Movers */}
                            <View style={{ marginBottom: 40, backgroundColor: theme === 'dark' ? '#1A0B2E' : colors.cardBackground, borderRadius: 20, padding: 24, borderWidth: theme === 'light' ? 1 : 0, borderColor: colors.border }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <View style={{ padding: 8, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
                                        <Ionicons name="trending-up" size={20} color={colors.primary} />
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Market Movers</Text>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                                    {marketMovers.map(stock => (
                                        <TouchableOpacity
                                            key={stock.symbol}
                                            onPress={() => router.push(`/stocks/${stock.symbol}`)}
                                            style={{ width: 200, height: 120, backgroundColor: theme === 'dark' ? '#000000' : colors.background, borderRadius: 16, padding: 16, justifyContent: 'space-between', borderWidth: theme === 'light' ? 1 : 0, borderColor: colors.border }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 18 }}>{stock.symbol}</Text>
                                                <Text style={{ color: stock.changePercent >= 0 ? colors.secondary : colors.danger, fontWeight: '600', fontSize: 16 }}>
                                                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold' }}>${stock.price.toFixed(2)}</Text>
                                                <Text style={{ color: colors.icon, fontSize: 12 }} numberOfLines={1}>{stock.name}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    {marketMovers.length === 0 && Array(4).fill(0).map((_, i) => (
                                        <View key={i} style={{ width: 200, height: 120, backgroundColor: theme === 'dark' ? '#000000' : colors.background, borderRadius: 16, opacity: 0.5, borderWidth: theme === 'light' ? 1 : 0, borderColor: colors.border }} />
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Sandboxes & Watchlist - Two Columns */}
                            <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>

                                {/* Sandboxes Card */}
                                <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1A0B2E' : colors.cardBackground, borderRadius: 20, padding: 24, height: 500, borderWidth: theme === 'light' ? 1 : 0, borderColor: colors.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ padding: 8, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
                                                <Ionicons name="flask" size={20} color={colors.primary} />
                                            </View>
                                            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>My Sandboxes</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setModalVisible(true)} style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                                            <Text style={{ color: '#FFF', fontWeight: '600' }}>+ New Sandbox</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                                        {sandboxes.length === 0 ? (
                                            <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                <Ionicons name="flask-outline" size={48} color={colors.icon} style={{ opacity: 0.5 }} />
                                                <Text style={{ color: colors.icon, marginTop: 16, fontSize: 16 }}>Simulate trades without risk.</Text>
                                            </View>
                                        ) : (
                                            <View style={{ gap: 12, paddingBottom: 20 }}>
                                                {sandboxes.map((sb) => {
                                                    const { pnl, pnlPercent } = getSandboxPnL(sb);
                                                    const isUp = pnl >= 0;
                                                    return (
                                                        <TouchableOpacity key={sb.id} onPress={() => router.push(`/stocks/sandbox/${sb.id}`)} onLongPress={() => handleDeleteSandbox(sb)}
                                                            style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : colors.background, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: theme === 'dark' ? 0 : 1, borderColor: colors.border }}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{sb.name}</Text>
                                                                <Text style={{ color: colors.icon, fontSize: 13, marginTop: 4 }}>Equity: ${(sb.total_equity ?? sb.balance).toLocaleString()}</Text>
                                                            </View>
                                                            <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                                                                <Text style={{ color: isUp ? colors.secondary : colors.danger, fontSize: 16, fontWeight: '700' }}>{isUp ? '+' : ''}{pnlPercent.toFixed(2)}%</Text>
                                                                <Text style={{ color: isUp ? colors.secondary : colors.danger, fontSize: 12, opacity: 0.8 }}>{isUp ? '+' : ''}{pnl.toFixed(2)}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <TouchableOpacity onPress={() => handleShareSandbox(sb)} style={{ padding: 8 }}>
                                                                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => handleDeleteSandbox(sb)} style={{ padding: 8 }}>
                                                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        )}

                                        {/* Shared With Me - inside same card */}
                                        {sharedSandboxes.length > 0 && (
                                            <View style={{ marginTop: 8 }}>
                                                <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16, opacity: 0.5 }} />
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                    <Ionicons name="people" size={16} color="#FFA500" />
                                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.icon }}>Shared With Me</Text>
                                                </View>
                                                <View style={{ gap: 12, paddingBottom: 20 }}>
                                                    {sharedSandboxes.map((sb) => {
                                                        const { pnl, pnlPercent } = getSandboxPnL(sb);
                                                        const isUp = pnl >= 0;
                                                        return (
                                                            <TouchableOpacity key={`shared-${sb.id}`} onPress={() => router.push(`/stocks/sandbox/${sb.id}`)}
                                                                style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : colors.background, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: theme === 'dark' ? 0 : 1, borderColor: colors.border }}>
                                                                <View style={{ flex: 1 }}>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{sb.name}</Text>
                                                                        <View style={{ backgroundColor: sb.permission === 'edit' ? '#4cd96420' : colors.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                                            <Text style={{ color: sb.permission === 'edit' ? '#4cd964' : colors.primary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>{sb.permission}</Text>
                                                                        </View>
                                                                    </View>
                                                                    <Text style={{ color: colors.icon, fontSize: 12, marginTop: 4 }}>by {sb.owner_username}</Text>
                                                                </View>
                                                                <View style={{ alignItems: 'flex-end' }}>
                                                                    <Text style={{ color: isUp ? colors.secondary : colors.danger, fontSize: 16, fontWeight: '700' }}>{isUp ? '+' : ''}{pnlPercent.toFixed(2)}%</Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>

                                {/* Watchlist Card */}
                                <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1A0B2E' : colors.cardBackground, borderRadius: 20, padding: 24, height: 500, borderWidth: theme === 'light' ? 1 : 0, borderColor: colors.border }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <View style={{ padding: 8, borderRadius: 8, backgroundColor: '#FFD70020' }}>
                                            <Ionicons name="star" size={20} color="#FFD700" />
                                        </View>
                                        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>My Watchlist</Text>
                                    </View>

                                    {wishlistLoading ? (
                                        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                                    ) : watchlistData.length === 0 ? (
                                        <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                            <Ionicons name="star-outline" size={48} color={colors.icon} style={{ opacity: 0.5 }} />
                                            <Text style={{ color: colors.icon, marginTop: 16, fontSize: 16 }}>Your starred stocks will appear here.</Text>
                                        </View>
                                    ) : (
                                        <FlatList
                                            key={'desktop-watchlist-2'}
                                            data={watchlistData}
                                            keyExtractor={(item) => item.symbol}
                                            scrollEnabled={true}
                                            nestedScrollEnabled={true}
                                            numColumns={2}
                                            showsVerticalScrollIndicator={false}
                                            columnWrapperStyle={{ gap: 16 }}
                                            contentContainerStyle={{ paddingBottom: 20 }}
                                            renderItem={({ item }) => (
                                                <WatchlistCard
                                                    item={item}
                                                    onPress={() => router.push(`/stocks/${item.symbol}`)}
                                                    style={{ flex: 1, marginBottom: 16 }}
                                                />
                                            )}
                                        />
                                    )}
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Sandbox Create Modal */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, maxWidth: 460, alignSelf: 'center' as any, width: '90%' as any }]}>
                            <View style={styles.modalHandle} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>New Sandbox</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
                            </View>
                            <TextInput style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} placeholder="Sandbox name..." placeholderTextColor={colors.icon} value={newSandboxName} onChangeText={setNewSandboxName} />
                            <Text style={{ color: colors.icon, marginBottom: 8 }}>Starting balance:</Text>
                            <View style={styles.presetGrid}>
                                {BALANCE_PRESETS.map((amount) => (
                                    <TouchableOpacity key={amount} onPress={() => setNewSandboxBalance(amount)} style={[styles.presetButton, { backgroundColor: newSandboxBalance === amount ? colors.primary : colors.background, borderColor: colors.border }]}>
                                        <Text style={{ color: newSandboxBalance === amount ? '#FFF' : colors.text, fontWeight: '600', fontSize: 12 }}>{formatCompactMoney(amount)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity onPress={handleCreateSandbox} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                                <Ionicons name="rocket" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>Create Sandbox</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Share Sandbox Modal */}
                {shareTargetSandbox && (
                    <ShareSandboxModal
                        visible={shareModalVisible}
                        sandboxId={shareTargetSandbox.id}
                        sandboxName={shareTargetSandbox.name}
                        onClose={() => { setShareModalVisible(false); setShareTargetSandbox(null); }}
                    />
                )}
            </View>
        );
    }

    // ─── Mobile Layout ───
    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { justifyContent: 'flex-end' }]}>
                <View style={[styles.profileBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Ionicons name="person" size={20} color={colors.text} />
                </View>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.icon} />
                <TextInput
                    style={[
                        styles.input,
                        { color: colors.text },
                        Platform.select({ web: { outlineStyle: 'none' } as any })
                    ]}
                    placeholder="Search for symbol or company..."
                    placeholderTextColor={colors.icon}
                    value={query}
                    onChangeText={setQuery}
                />
                {loading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Market Movers Section - TOP */}
                {!query && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <View style={{ padding: 6, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
                                <Ionicons name="trending-up" size={16} color={colors.primary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Market Movers</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                            {marketMovers.map(stock => (
                                <TouchableOpacity
                                    key={stock.symbol}
                                    onPress={() => router.push(`/stocks/${stock.symbol}`)}
                                    style={{ width: 160, height: 100, backgroundColor: theme === 'dark' ? colors.cardBackground : '#FFFFFF', borderRadius: 14, padding: 14, justifyContent: 'space-between', borderWidth: theme === 'dark' ? 0 : 1, borderColor: colors.border }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{stock.symbol}</Text>
                                        <Text style={{ color: stock.changePercent >= 0 ? colors.secondary : colors.danger, fontWeight: '600', fontSize: 13 }}>
                                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>${stock.price.toFixed(2)}</Text>
                                        <Text style={{ color: colors.icon, fontSize: 10 }} numberOfLines={1}>{stock.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {marketMovers.length === 0 && Array(4).fill(0).map((_, i) => (
                                <View key={i} style={{ width: 160, height: 100, backgroundColor: colors.cardBackground, borderRadius: 14, opacity: 0.4 }} />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Sandboxes Section - Row-based single column */}
                {!query && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ padding: 6, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
                                    <Ionicons name="flask" size={16} color={colors.primary} />
                                </View>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>My Sandboxes</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(true)}>
                                <Ionicons name="add-circle" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {sandboxes.length === 0 ? (
                            <TouchableOpacity
                                style={[styles.emptySandboxCard, { backgroundColor: theme === 'dark' ? colors.cardBackground : '#FFFFFF', borderColor: colors.border }]}
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="flask-outline" size={32} color={colors.primary} />
                                <Text style={{ color: colors.text, fontWeight: '600', marginTop: 8 }}>Create Your First Sandbox</Text>
                                <Text style={{ color: colors.icon, fontSize: 12, marginTop: 4 }}>Practice trading with virtual money</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ gap: 10 }}>
                                {sandboxes.map(sandbox => {
                                    const { pnl, pnlPercent } = getSandboxPnL(sandbox);
                                    const isPnlPositive = pnl >= 0;
                                    return (
                                        <TouchableOpacity
                                            key={sandbox.id}
                                            style={{ backgroundColor: theme === 'dark' ? colors.cardBackground : '#FFFFFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: theme === 'dark' ? 0 : 1, borderColor: colors.border }}
                                            onPress={() => router.push({ pathname: `/stocks/sandbox/[id]`, params: { id: sandbox.id, name: sandbox.name } })}
                                            onLongPress={() => handleDeleteSandbox(sandbox)}
                                        >
                                            <View style={[styles.sandboxIconBadge, { backgroundColor: colors.primary + '20' }]}>
                                                <Ionicons name="flask" size={14} color={colors.primary} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{sandbox.name}</Text>
                                                <Text style={{ color: colors.icon, fontSize: 12, marginTop: 2 }}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sandbox.total_equity ?? sandbox.balance)}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                                                <Text style={{ color: isPnlPositive ? colors.secondary : colors.danger, fontSize: 14, fontWeight: '700' }}>
                                                    {isPnlPositive ? '+' : ''}{pnlPercent.toFixed(1)}%
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <TouchableOpacity onPress={() => handleShareSandbox(sandbox)} style={{ padding: 4 }}>
                                                    <Ionicons name="share-outline" size={16} color={colors.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteSandbox(sandbox)} style={{ padding: 4 }}>
                                                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                                                </TouchableOpacity>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* Shared With Me */}
                        {sharedSandboxes.length > 0 && (
                            <View style={{ marginTop: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                                    <Ionicons name="people" size={16} color="#FFA500" />
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.icon }}>Shared With Me</Text>
                                </View>
                                <View style={{ gap: 10 }}>
                                    {sharedSandboxes.map(sandbox => {
                                        const { pnl, pnlPercent } = getSandboxPnL(sandbox);
                                        const isPnlPositive = pnl >= 0;
                                        return (
                                            <TouchableOpacity
                                                key={`shared-${sandbox.id}`}
                                                style={{ backgroundColor: theme === 'dark' ? colors.cardBackground : '#FFFFFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: theme === 'dark' ? 0 : 1, borderColor: colors.border }}
                                                onPress={() => router.push({ pathname: `/stocks/sandbox/[id]`, params: { id: sandbox.id, name: sandbox.name } })}
                                            >
                                                <View style={[styles.sandboxIconBadge, { backgroundColor: '#FFA50020' }]}>
                                                    <Ionicons name="people" size={14} color="#FFA500" />
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{sandbox.name}</Text>
                                                    <Text style={{ color: colors.icon, fontSize: 11, marginTop: 2 }}>by {sandbox.owner_username}</Text>
                                                </View>
                                                <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                                                    <Text style={{ color: isPnlPositive ? colors.secondary : colors.danger, fontSize: 14, fontWeight: '700' }}>
                                                        {isPnlPositive ? '+' : ''}{pnlPercent.toFixed(1)}%
                                                    </Text>
                                                    <View style={{ backgroundColor: sandbox.permission === 'edit' ? '#4cd96420' : colors.primary + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, marginTop: 2 }}>
                                                        <Text style={{ color: sandbox.permission === 'edit' ? '#4cd964' : colors.primary, fontSize: 9, fontWeight: '600', textTransform: 'uppercase' }}>{sandbox.permission}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Watchlist Section - single column, no chart */}
                {watchlistData.length > 0 && !query && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <View style={{ padding: 6, borderRadius: 8, backgroundColor: '#FFD70020' }}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>My Watchlist</Text>
                        </View>
                        <View style={{ gap: 10 }}>
                            {watchlistData.map(item => (
                                <WatchlistCard
                                    key={item.symbol}
                                    item={item}
                                    onPress={() => router.push(`/stocks/${item.symbol}`)}
                                    hideChart
                                    style={{ width: '100%', marginBottom: 0 }}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Search Results - only when searching */}
                {query && (
                    <View style={[styles.section, { flex: 1 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Results</Text>

                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                        ) : results.length > 0 ? (
                            results.map(item => (
                                <StockListItem
                                    key={item.symbol}
                                    item={item}
                                    onPress={() => router.push(`/stocks/${item.symbol}`)}
                                />
                            ))
                        ) : (
                            <Text style={{ color: colors.icon, textAlign: 'center', marginTop: 20 }}>
                                No stocks found.
                            </Text>
                        )}
                    </View>
                )}

            </ScrollView>

            {/* Create Sandbox Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Sandbox</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.icon }]}>Practice trading with virtual money — no risk!</Text>

                        <TextInput
                            style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                            placeholder="Sandbox Name"
                            placeholderTextColor={colors.icon}
                            value={newSandboxName}
                            onChangeText={setNewSandboxName}
                        />

                        <Text style={[styles.fieldLabel, { color: colors.text }]}>Starting Cash</Text>
                        <View style={styles.presetGrid}>
                            {BALANCE_PRESETS.map(amount => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[
                                        styles.presetButton,
                                        {
                                            backgroundColor: newSandboxBalance === amount ? colors.primary : colors.background,
                                            borderColor: newSandboxBalance === amount ? colors.primary : colors.border,
                                        }
                                    ]}
                                    onPress={() => setNewSandboxBalance(amount)}
                                >
                                    <Text style={{
                                        color: newSandboxBalance === amount ? '#FFFFFF' : colors.text,
                                        fontWeight: '600',
                                        fontSize: 14,
                                    }}>
                                        {formatCompactMoney(amount)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.background }]}>
                                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateSandbox}
                                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 2 }]}
                            >
                                <Ionicons name="flask" size={18} color="white" style={{ marginRight: 6 }} />
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Create Sandbox</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Share Sandbox Modal */}
            {shareTargetSandbox && (
                <ShareSandboxModal
                    visible={shareModalVisible}
                    sandboxId={shareTargetSandbox.id}
                    sandboxName={shareTargetSandbox.name}
                    onClose={() => { setShareModalVisible(false); setShareTargetSandbox(null); }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    profileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    scrollContent: {
        paddingBottom: 150,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    emptySandboxCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sandboxCard: {
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        minWidth: 160,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sandboxCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sandboxIconBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    sandboxName: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    sandboxBalance: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    pnlBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#666', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    modalSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
    modalInput: { padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 20, borderWidth: 1 },
    fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    presetButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    modalButtons: { flexDirection: 'row', gap: 10 },
    modalBtn: { padding: 14, borderRadius: 12, minWidth: 80, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flex: 1 },
});
