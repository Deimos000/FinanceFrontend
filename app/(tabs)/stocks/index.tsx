import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDebounce } from './_utils/useDebounce';

import { searchStocks } from './_utils/api';
import { useStockStore } from './_utils/store';
import { Stock } from './_utils/types';

import { StockListItem } from './_components/StockListItem';
import { WatchlistCard } from './_components/WatchlistCard';
import { useTheme } from '@/context/ThemeContext';

export default function StocksOverview() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { watchlist } = useStockStore();
    const { colors: theme } = useTheme();

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 800);
    const [results, setResults] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial Load & Search Logic
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
    const watchlistData = useMemo(() => {
        return results.filter(s => watchlist.includes(s.symbol));
    }, [results, watchlist]);

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
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Search for symbol or company..."
                    placeholderTextColor={theme.icon}
                    value={query}
                    onChangeText={setQuery}
                />
                {loading && <ActivityIndicator size="small" color={theme.primary} />}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Watchlist Section */}
                {watchlistData.length > 0 && !query && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Watchlist</Text>
                        <FlatList
                            horizontal
                            data={watchlistData}
                            keyExtractor={item => item.symbol}
                            renderItem={({ item }) => (
                                <WatchlistCard item={item} />
                            )}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20 }}
                            style={{ marginHorizontal: -20 }}
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
});
