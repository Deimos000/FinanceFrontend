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
import { useTheme } from '@/context/ThemeContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const BALANCE_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];

export default function StocksOverview() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { watchlist, loadWishlist, loading: wishlistLoading } = useStockStore();
    const { colors: theme } = useTheme();
    const isDesktop = useIsDesktop();

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 800);
    const [results, setResults] = useState<Stock[]>([]);
    const [marketMovers, setMarketMovers] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(false);

    // Sandbox State
    const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
    const [sharedSandboxes, setSharedSandboxes] = useState<Sandbox[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newSandboxName, setNewSandboxName] = useState('');
    const [newSandboxBalance, setNewSandboxBalance] = useState(10000);

    // Share Modal State
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareTargetSandbox, setShareTargetSandbox] = useState<Sandbox | null>(null);

    useEffect(() => {
        loadSandboxes();
        loadMarketMovers();
    }, []);

    const loadSandboxes = async () => {
        const [data, shared] = await Promise.all([
            getSandboxes(),
            getSharedSandboxes()
        ]);
        console.log('Sandbox Data:', JSON.stringify(data, null, 2));
        setSandboxes(data);
        setSharedSandboxes(shared);
    };

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
            <View style={[styles.container, { paddingTop: 20, backgroundColor: theme.background }]}>
                <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />
                <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 40, maxWidth: 1400, alignSelf: 'center' as any, width: '100%' as any }} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 }}>
                        <Text style={{ fontSize: 36, fontWeight: '800', color: theme.text }}>Stocks</Text>
                        <Text style={{ fontSize: 18, fontWeight: '500', color: theme.icon }}>{dateString}</Text>
                    </View>

                    {/* Centered Search */}
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View style={[styles.searchContainer, { width: '100%', maxWidth: 600, height: 56, borderRadius: 16, backgroundColor: theme.cardBackground, borderWidth: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }]}>
                            <Ionicons name="search" size={24} color={theme.icon} style={{ marginRight: 12, marginLeft: 8 }} />
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: theme.text, fontSize: 18 },
                                    Platform.select({ web: { outlineStyle: 'none' } as any })
                                ]}
                                placeholder="Search stocks, ETFs, and more..."
                                placeholderTextColor={theme.icon}
                                value={query}
                                onChangeText={setQuery}
                            />
                            {loading && <ActivityIndicator style={{ marginRight: 8 }} color={theme.primary} />}
                        </View>
                    </View>

                    {/* Search Results (Overlay or replace content) */}
                    {query ? (
                        <View style={{ minHeight: 400 }}>
                            <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 16 }}>Search Results</Text>
                            {loading ? (
                                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                            ) : results.length > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                    {results.map(item => (
                                        <TouchableOpacity
                                            key={item.symbol}
                                            onPress={() => router.push(`/stocks/${item.symbol}`)}
                                            style={{ width: '32%', backgroundColor: theme.cardBackground, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            <View>
                                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{item.symbol}</Text>
                                                <Text style={{ color: theme.icon, fontSize: 12 }} numberOfLines={1}>{item.name}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color={theme.icon} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <Text style={{ color: theme.icon, fontSize: 16 }}>No results found.</Text>
                            )}
                        </View>
                    ) : (
                        <>
                            {/* Market Movers */}
                            <View style={{ marginBottom: 40, backgroundColor: '#1A0B2E', borderRadius: 20, padding: 24 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <View style={{ padding: 8, borderRadius: 8, backgroundColor: theme.primary + '20' }}>
                                        <Ionicons name="trending-up" size={20} color={theme.primary} />
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>Market Movers</Text>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                                    {marketMovers.map(stock => (
                                        <TouchableOpacity
                                            key={stock.symbol}
                                            onPress={() => router.push(`/stocks/${stock.symbol}`)}
                                            style={{ width: 200, height: 120, backgroundColor: '#000000', borderRadius: 16, padding: 16, justifyContent: 'space-between' }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18 }}>{stock.symbol}</Text>
                                                <Text style={{ color: stock.changePercent >= 0 ? theme.secondary : theme.danger, fontWeight: '600', fontSize: 16 }}>
                                                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={{ color: theme.text, fontSize: 22, fontWeight: 'bold' }}>${stock.price.toFixed(2)}</Text>
                                                <Text style={{ color: theme.icon, fontSize: 12 }} numberOfLines={1}>{stock.name}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    {marketMovers.length === 0 && Array(4).fill(0).map((_, i) => (
                                        <View key={i} style={{ width: 200, height: 120, backgroundColor: '#000000', borderRadius: 16, opacity: 0.5 }} />
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Sandboxes & Watchlist - Two Columns */}
                            <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>

                                {/* Sandboxes Card */}
                                <View style={{ flex: 1, backgroundColor: '#1A0B2E', borderRadius: 20, padding: 24, height: 500 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ padding: 8, borderRadius: 8, backgroundColor: theme.primary + '20' }}>
                                                <Ionicons name="flask" size={20} color={theme.primary} />
                                            </View>
                                            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>My Sandboxes</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setModalVisible(true)} style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                                            <Text style={{ color: '#FFF', fontWeight: '600' }}>+ New Sandbox</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                                        {sandboxes.length === 0 ? (
                                            <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                <Ionicons name="flask-outline" size={48} color={theme.icon} style={{ opacity: 0.5 }} />
                                                <Text style={{ color: theme.icon, marginTop: 16, fontSize: 16 }}>Simulate trades without risk.</Text>
                                            </View>
                                        ) : (
                                            <View style={{ gap: 12, paddingBottom: 20 }}>
                                                {sandboxes.map((sb) => {
                                                    const { pnl, pnlPercent } = getSandboxPnL(sb);
                                                    const isUp = pnl >= 0;
                                                    return (
                                                        <TouchableOpacity key={sb.id} onPress={() => router.push(`/stocks/sandbox/${sb.id}`)} onLongPress={() => handleDeleteSandbox(sb)}
                                                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{sb.name}</Text>
                                                                <Text style={{ color: theme.icon, fontSize: 13, marginTop: 4 }}>Equity: ${(sb.total_equity ?? sb.balance).toLocaleString()}</Text>
                                                            </View>
                                                            <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                                                                <Text style={{ color: isUp ? theme.secondary : theme.danger, fontSize: 16, fontWeight: '700' }}>{isUp ? '+' : ''}{pnlPercent.toFixed(2)}%</Text>
                                                                <Text style={{ color: isUp ? theme.secondary : theme.danger, fontSize: 12, opacity: 0.8 }}>{isUp ? '+' : ''}{pnl.toFixed(2)}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <TouchableOpacity onPress={() => handleShareSandbox(sb)} style={{ padding: 8 }}>
                                                                    <Ionicons name="share-outline" size={20} color={theme.primary} />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => handleDeleteSandbox(sb)} style={{ padding: 8 }}>
                                                                    <Ionicons name="trash-outline" size={20} color={theme.danger} />
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
                                                <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 16, opacity: 0.5 }} />
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                    <Ionicons name="people" size={16} color="#FFA500" />
                                                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.icon }}>Shared With Me</Text>
                                                </View>
                                                <View style={{ gap: 12, paddingBottom: 20 }}>
                                                    {sharedSandboxes.map((sb) => {
                                                        const { pnl, pnlPercent } = getSandboxPnL(sb);
                                                        const isUp = pnl >= 0;
                                                        return (
                                                            <TouchableOpacity key={`shared-${sb.id}`} onPress={() => router.push(`/stocks/sandbox/${sb.id}`)}
                                                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <View style={{ flex: 1 }}>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{sb.name}</Text>
                                                                        <View style={{ backgroundColor: sb.permission === 'edit' ? '#4cd96420' : theme.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                                            <Text style={{ color: sb.permission === 'edit' ? '#4cd964' : theme.primary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>{sb.permission}</Text>
                                                                        </View>
                                                                    </View>
                                                                    <Text style={{ color: theme.icon, fontSize: 12, marginTop: 4 }}>by {sb.owner_username}</Text>
                                                                </View>
                                                                <View style={{ alignItems: 'flex-end' }}>
                                                                    <Text style={{ color: isUp ? theme.secondary : theme.danger, fontSize: 16, fontWeight: '700' }}>{isUp ? '+' : ''}{pnlPercent.toFixed(2)}%</Text>
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
                                <View style={{ flex: 1, backgroundColor: '#1A0B2E', borderRadius: 20, padding: 24, height: 500 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <View style={{ padding: 8, borderRadius: 8, backgroundColor: '#FFD70020' }}>
                                            <Ionicons name="star" size={20} color="#FFD700" />
                                        </View>
                                        <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>My Watchlist</Text>
                                    </View>

                                    {wishlistLoading ? (
                                        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
                                    ) : watchlistData.length === 0 ? (
                                        <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                            <Ionicons name="star-outline" size={48} color={theme.icon} style={{ opacity: 0.5 }} />
                                            <Text style={{ color: theme.icon, marginTop: 16, fontSize: 16 }}>Your starred stocks will appear here.</Text>
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
                        <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, maxWidth: 460, alignSelf: 'center' as any, width: '90%' as any }]}>
                            <View style={styles.modalHandle} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>New Sandbox</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
                            </View>
                            <TextInput style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]} placeholder="Sandbox name..." placeholderTextColor={theme.icon} value={newSandboxName} onChangeText={setNewSandboxName} />
                            <Text style={{ color: theme.icon, marginBottom: 8 }}>Starting balance:</Text>
                            <View style={styles.presetGrid}>
                                {BALANCE_PRESETS.map((amount) => (
                                    <TouchableOpacity key={amount} onPress={() => setNewSandboxBalance(amount)} style={[styles.presetButton, { backgroundColor: newSandboxBalance === amount ? theme.primary : theme.background, borderColor: theme.border }]}>
                                        <Text style={{ color: newSandboxBalance === amount ? '#FFF' : theme.text, fontWeight: '600', fontSize: 12 }}>{formatCompactMoney(amount)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity onPress={handleCreateSandbox} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
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

    // ─── Mobile Layout (unchanged) ───
    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { justifyContent: 'flex-end' }]}>
                <View style={[styles.profileBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Ionicons name="person" size={20} color={theme.text} />
                </View>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.icon} />
                <TextInput
                    style={[
                        styles.input,
                        { color: theme.text },
                        Platform.select({ web: { outlineStyle: 'none' } as any })
                    ]}
                    placeholder="Search for symbol or company..."
                    placeholderTextColor={theme.icon}
                    value={query}
                    onChangeText={setQuery}
                />
                {loading && <ActivityIndicator size="small" color={theme.primary} />}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Sandboxes Section - Only show if not searching */}
                {!query && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>My Sandboxes</Text>
                            <TouchableOpacity onPress={() => setModalVisible(true)}>
                                <Ionicons name="add-circle" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        {sandboxes.length === 0 ? (
                            <TouchableOpacity
                                style={[styles.emptySandboxCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="flask-outline" size={32} color={theme.primary} />
                                <Text style={{ color: theme.text, fontWeight: '600', marginTop: 8 }}>Create Your First Sandbox</Text>
                                <Text style={{ color: theme.icon, fontSize: 12, marginTop: 4 }}>Practice trading with virtual money</Text>
                            </TouchableOpacity>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {sandboxes.map(sandbox => {
                                    const { pnl, pnlPercent } = getSandboxPnL(sandbox);
                                    const isPnlPositive = pnl >= 0;
                                    return (
                                        <TouchableOpacity
                                            key={sandbox.id}
                                            style={[styles.sandboxCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                                            onPress={() => router.push({ pathname: `/stocks/sandbox/[id]`, params: { id: sandbox.id, name: sandbox.name } })}
                                            onLongPress={() => handleDeleteSandbox(sandbox)}
                                        >
                                            <View style={styles.sandboxCardHeader}>
                                                <View style={[styles.sandboxIconBadge, { backgroundColor: theme.primary + '20' }]}>
                                                    <Ionicons name="flask" size={16} color={theme.primary} />
                                                </View>
                                                <Text style={[styles.sandboxName, { color: theme.text }]} numberOfLines={1}>{sandbox.name}</Text>
                                                <TouchableOpacity onPress={() => handleShareSandbox(sandbox)} style={{ padding: 4 }}>
                                                    <Ionicons name="share-outline" size={16} color={theme.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteSandbox(sandbox)} style={{ padding: 4 }}>
                                                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                                                </TouchableOpacity>
                                            </View>
                                            <Text style={[styles.sandboxBalance, { color: theme.text }]}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sandbox.total_equity ?? sandbox.balance)}
                                            </Text>
                                            <View style={[styles.pnlBadge, { backgroundColor: isPnlPositive ? theme.secondary + '18' : theme.danger + '18' }]}>
                                                <Ionicons name={isPnlPositive ? "trending-up" : "trending-down"} size={12} color={isPnlPositive ? theme.secondary : theme.danger} />
                                                <Text style={{ color: isPnlPositive ? theme.secondary : theme.danger, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                                                    {isPnlPositive ? '+' : ''}{pnlPercent.toFixed(1)}%
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Shared With Me - inside same section */}
                        {sharedSandboxes.length > 0 && (
                            <View style={{ marginTop: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                                    <Ionicons name="people" size={16} color="#FFA500" />
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.icon }}>Shared With Me</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {sharedSandboxes.map(sandbox => {
                                        const { pnl, pnlPercent } = getSandboxPnL(sandbox);
                                        const isPnlPositive = pnl >= 0;
                                        return (
                                            <TouchableOpacity
                                                key={`shared-${sandbox.id}`}
                                                style={[styles.sandboxCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                                                onPress={() => router.push({ pathname: `/stocks/sandbox/[id]`, params: { id: sandbox.id, name: sandbox.name } })}
                                            >
                                                <View style={styles.sandboxCardHeader}>
                                                    <View style={[styles.sandboxIconBadge, { backgroundColor: '#FFA50020' }]}>
                                                        <Ionicons name="people" size={14} color="#FFA500" />
                                                    </View>
                                                    <Text style={[styles.sandboxName, { color: theme.text }]} numberOfLines={1}>{sandbox.name}</Text>
                                                </View>
                                                <Text style={{ color: theme.icon, fontSize: 11, marginBottom: 4 }}>by {sandbox.owner_username}</Text>
                                                <Text style={[styles.sandboxBalance, { color: theme.text, fontSize: 18 }]}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sandbox.total_equity ?? sandbox.balance)}
                                                </Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <View style={[styles.pnlBadge, { backgroundColor: isPnlPositive ? theme.secondary + '18' : theme.danger + '18' }]}>
                                                        <Text style={{ color: isPnlPositive ? theme.secondary : theme.danger, fontSize: 11, fontWeight: '600' }}>
                                                            {isPnlPositive ? '+' : ''}{pnlPercent.toFixed(1)}%
                                                        </Text>
                                                    </View>
                                                    <View style={{ backgroundColor: sandbox.permission === 'edit' ? '#4cd96420' : theme.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                        <Text style={{ color: sandbox.permission === 'edit' ? '#4cd964' : theme.primary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>{sandbox.permission}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}



                {/* Watchlist Section */}
                {watchlistData.length > 0 && !query && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Watchlist</Text>
                        <FlatList
                            key={'mobile-watchlist-2'}
                            data={watchlistData}
                            keyExtractor={item => item.symbol}
                            numColumns={2}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <WatchlistCard
                                    item={item}
                                    onPress={() => router.push(`/stocks/${item.symbol}`)}
                                    style={{ width: '48%' }}
                                />
                            )}
                            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
                        />
                    </View>
                )}

                {/* Market List */}
                <View style={[styles.section, { flex: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{query ? 'Results' : 'Market Movers'}</Text>

                    {results.map(item => (
                        <StockListItem
                            key={item.symbol}
                            item={item}
                            onPress={() => router.push(`/stocks/${item.symbol}`)}
                        />
                    ))}

                    {results.length === 0 && !loading && (
                        <Text style={{ color: theme.icon, textAlign: 'center', marginTop: 20 }}>
                            No stocks found.
                        </Text>
                    )}
                </View>

            </ScrollView>

            {/* Create Sandbox Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: theme.text }]}>New Sandbox</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.icon }]}>Practice trading with virtual money — no risk!</Text>

                        <TextInput
                            style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            placeholder="Sandbox Name"
                            placeholderTextColor={theme.icon}
                            value={newSandboxName}
                            onChangeText={setNewSandboxName}
                        />

                        <Text style={[styles.fieldLabel, { color: theme.text }]}>Starting Cash</Text>
                        <View style={styles.presetGrid}>
                            {BALANCE_PRESETS.map(amount => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[
                                        styles.presetButton,
                                        {
                                            backgroundColor: newSandboxBalance === amount ? theme.primary : theme.background,
                                            borderColor: newSandboxBalance === amount ? theme.primary : theme.border,
                                        }
                                    ]}
                                    onPress={() => setNewSandboxBalance(amount)}
                                >
                                    <Text style={{
                                        color: newSandboxBalance === amount ? '#FFFFFF' : theme.text,
                                        fontWeight: '600',
                                        fontSize: 14,
                                    }}>
                                        {formatCompactMoney(amount)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: theme.background }]}>
                                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateSandbox}
                                style={[styles.modalBtn, { backgroundColor: theme.primary, flex: 2 }]}
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
        paddingBottom: 40,
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
