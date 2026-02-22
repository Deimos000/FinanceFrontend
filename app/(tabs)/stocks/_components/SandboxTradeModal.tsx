import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { searchStocks, tradeStock, getStockQuote } from '../_utils/api';
import { Stock, SandboxPortfolioItem, SandboxTransaction } from '../_utils/types';
import { StockListItem } from './StockListItem';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface SandboxTradeModalProps {
    sandboxId: number;
    onClose: () => void;
    onSuccess: () => void;
    initialStock?: Partial<Stock> | null;
    currentPosition?: SandboxPortfolioItem | null;
    tradeHistory?: SandboxTransaction[];
}


export const SandboxTradeModal = ({ sandboxId, onClose, onSuccess, initialStock, currentPosition, tradeHistory = [] }: SandboxTradeModalProps) => {
    const { colors: theme } = useTheme();
    const isDesktop = useIsDesktop();
    const [step, setStep] = useState<'SEARCH' | 'TRADE'>(initialStock ? 'TRADE' : 'SEARCH');
    // Cast initialStock to Stock if present, relying on it being populated enough or fetched shortly
    const [selectedStock, setSelectedStock] = useState<Stock | null>(initialStock as Stock || null);


    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Stock[]>([]);
    const [searching, setSearching] = useState(false);

    // Trade State
    const [mode, setMode] = useState<'DOLLARS' | 'SHARES'>('DOLLARS');
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [amount, setAmount] = useState('');
    const [trading, setTrading] = useState(false);

    useEffect(() => {
        if (initialStock && initialStock.symbol) {
            setStep('TRADE');
            getStockQuote(initialStock.symbol).then(quote => {
                if (quote) setSelectedStock(quote);
            });
        }
    }, [initialStock]);

    useEffect(() => {
        if (query.length > 1) {
            const timer = setTimeout(async () => {
                setSearching(true);
                try {
                    const data = await searchStocks(query);
                    setResults(data);
                } catch (e) {
                    console.error(e);
                } finally {
                    setSearching(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setResults([]);
        }
    }, [query]);

    const handleSelectStock = (stock: Stock) => {
        setSelectedStock(stock);
        setStep('TRADE');
        // Fetch fresh quote to get real-time price
        getStockQuote(stock.symbol).then(quote => {
            if (quote) setSelectedStock(quote);
        });
    };

    const handleTrade = async () => {
        if (!selectedStock || !amount) return;
        setTrading(true);
        try {
            const num = parseFloat(amount);
            if (isNaN(num) || num <= 0) {
                Alert.alert("Invalid Amount", "Please enter a valid positive number.");
                return;
            }

            if (mode === 'DOLLARS') {
                await tradeStock(sandboxId, selectedStock.symbol, tradeType, undefined, num);
            } else {
                await tradeStock(sandboxId, selectedStock.symbol, tradeType, num, undefined);
            }

            Alert.alert("Success", `Successfully ${tradeType === 'BUY' ? 'bought' : 'sold'} ${selectedStock.symbol}`);
            onSuccess();
        } catch (e: any) {
            Alert.alert("Trade Failed", e.message || "An error occurred");
        } finally {
            setTrading(false);
        }
    };

    const maxShares = currentPosition ? currentPosition.quantity : 0;
    const maxDollars = currentPosition && selectedStock ? currentPosition.quantity * selectedStock.price : 0;

    const handleAmountChange = (text: string) => {
        if (text === '') {
            setAmount('');
            return;
        }

        let cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
        }

        if (tradeType === 'SELL') {
            const num = parseFloat(cleaned);
            if (!isNaN(num)) {
                if (mode === 'SHARES' && num > maxShares) {
                    cleaned = maxShares.toString();
                } else if (mode === 'DOLLARS' && num > maxDollars) {
                    cleaned = maxDollars.toFixed(2).toString();
                }
            }
        }

        setAmount(cleaned);
    };

    const handleIncrement = () => {
        let current = parseFloat(amount) || 0;
        let step = mode === 'DOLLARS' ? 100 : 1;
        let next = current + step;

        if (tradeType === 'SELL') {
            if (mode === 'SHARES' && next > maxShares) next = maxShares;
            if (mode === 'DOLLARS' && next > maxDollars) next = maxDollars;
        }

        setAmount(next.toString());
    };

    const handleDecrement = () => {
        let current = parseFloat(amount) || 0;
        let step = mode === 'DOLLARS' ? 100 : 1;
        let next = current - step;
        if (next < 0) next = 0;
        setAmount(next.toString());
    };

    const setMaxAmount = () => {
        if (tradeType === 'SELL') {
            if (mode === 'DOLLARS') {
                setAmount(maxDollars.toFixed(2));
            } else {
                setAmount(maxShares.toString());
            }
        }
    };

    const renderPositionCard = () => {
        if (!currentPosition) return null;
        const isPos = currentPosition.gain_loss >= 0;
        return (
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 8 }}>Your Position</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: theme.secondary }}>Shares</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{currentPosition.quantity}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: theme.secondary }}>Avg Cost</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>${currentPosition.average_buy_price.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: theme.secondary }}>Market Value</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>${currentPosition.current_value.toFixed(2)}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.secondary }}>Total Return</Text>
                    <Text style={{ color: isPos ? '#4cd964' : theme.danger, fontWeight: 'bold' }}>
                        {isPos ? '+' : ''}{currentPosition.gain_loss.toFixed(2)} ({currentPosition.gain_loss_percent.toFixed(2)}%)
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={isDesktop ? styles.desktopOverlay : { flex: 1, backgroundColor: '#000000' }}>
            <View style={[
                isDesktop ? styles.desktopModalCard : { flex: 1 },
                { backgroundColor: isDesktop ? theme.cardBackground : '#000000', borderColor: theme.border }
            ]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {step === 'SEARCH' ? 'Select Stock' : `Trade ${selectedStock?.symbol}`}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {step === 'SEARCH' ? (
                    <View style={{ flex: 1, padding: 20 }}>
                        <View style={[styles.searchBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <Ionicons name="search" size={20} color={theme.icon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: theme.text },
                                    Platform.select({ web: { outlineStyle: 'none' } as any })
                                ]}
                                placeholder="Search symbol..."
                                placeholderTextColor={theme.icon}
                                value={query}
                                onChangeText={setQuery}
                                autoFocus
                            />
                            {searching && <ActivityIndicator size="small" color={theme.primary} />}
                        </View>

                        <FlatList
                            data={results}
                            keyExtractor={item => item.symbol}
                            renderItem={({ item }) => (
                                <StockListItem item={item} onPress={() => handleSelectStock(item)} />
                            )}
                            contentContainerStyle={{ paddingTop: 20 }}
                        />
                    </View>
                ) : (
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: isDesktop ? 32 : 20 }}>
                            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 48 : 32 }}>
                                {/* Left Column (Desktop) / Top Section (Mobile) */}
                                <View style={{ flex: 1 }}>
                                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.text }}>
                                            ${selectedStock?.price.toFixed(2)}
                                        </Text>
                                        <Text style={{ color: (selectedStock?.changePercent || 0) >= 0 ? '#4cd964' : theme.danger }}>
                                            {(selectedStock?.changePercent || 0) >= 0 ? '+' : ''}{selectedStock?.changePercent.toFixed(2)}%
                                        </Text>
                                    </View>

                                    {renderPositionCard()}

                                    <TouchableOpacity onPress={() => setStep('SEARCH')} style={{ alignItems: 'center', marginTop: 30, marginBottom: 20 }}>
                                        <Text style={{ color: theme.secondary }}>Back to Search</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Right Column (Desktop) / Bottom Section (Mobile) */}
                                <View style={{ flex: 1 }}>
                                    {/* Buy/Sell Toggles */}
                                    <View style={[styles.toggleContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border, marginTop: isDesktop ? 0 : 20 }]}>
                                        <TouchableOpacity
                                            style={[styles.toggleBtn, tradeType === 'BUY' && { backgroundColor: theme.primary }]}
                                            onPress={() => { setTradeType('BUY'); setAmount(''); }}
                                        >
                                            <Text style={[styles.toggleText, { color: tradeType === 'BUY' ? '#fff' : theme.text }]}>Buy</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.toggleBtn, tradeType === 'SELL' && { backgroundColor: theme.danger }]}
                                            onPress={() => { setTradeType('SELL'); setAmount(''); }}
                                        >
                                            <Text style={[styles.toggleText, { color: tradeType === 'SELL' ? '#fff' : theme.text }]}>Sell</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Mode Toggles */}
                                    <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: mode === 'DOLLARS' ? theme.primary : 'transparent' }}
                                            onPress={() => { setMode('DOLLARS'); setAmount(''); }}
                                        >
                                            <Text style={{ color: mode === 'DOLLARS' ? '#fff' : theme.text, fontWeight: 'bold' }}>Dollars ($)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: mode === 'SHARES' ? theme.primary : 'transparent' }}
                                            onPress={() => { setMode('SHARES'); setAmount(''); }}
                                        >
                                            <Text style={{ color: mode === 'SHARES' ? '#fff' : theme.text, fontWeight: 'bold' }}>Shares (Qty)</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Input Display Area */}
                                    <View style={{ backgroundColor: theme.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <TouchableOpacity
                                                onPress={handleDecrement}
                                                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Ionicons name="remove" size={24} color={theme.text} />
                                            </TouchableOpacity>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                                {mode === 'DOLLARS' && <Text style={{ fontSize: 32, color: theme.text, fontWeight: 'bold', marginRight: 4 }}>$</Text>}
                                                <TextInput
                                                    style={[
                                                        styles.amountInput,
                                                        { color: theme.text },
                                                        Platform.select({ web: { outlineStyle: 'none' } as any })
                                                    ]}
                                                    placeholder="0"
                                                    placeholderTextColor={theme.icon}
                                                    keyboardType="numeric"
                                                    value={amount}
                                                    onChangeText={handleAmountChange}
                                                />
                                                {mode === 'SHARES' && <Text style={{ fontSize: 24, color: theme.text, fontWeight: 'bold', marginLeft: 8 }}>sh</Text>}
                                            </View>

                                            <TouchableOpacity
                                                onPress={handleIncrement}
                                                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Ionicons name="add" size={24} color={theme.text} />
                                            </TouchableOpacity>
                                        </View>

                                        {tradeType === 'SELL' && maxShares > 0 && (
                                            <View style={{ alignItems: 'center', marginTop: 10 }}>
                                                <TouchableOpacity onPress={setMaxAmount} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                                    <Text style={{ color: theme.secondary, fontSize: 13, fontWeight: '600' }}>
                                                        Max Available: {mode === 'DOLLARS' ? `$${maxDollars.toFixed(2)}` : `${maxShares.toFixed(4)} sh`}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {amount && !isNaN(parseFloat(amount)) && selectedStock ? (
                                            <Text style={{ textAlign: 'center', color: theme.secondary, marginTop: 16, fontSize: 15 }}>
                                                {mode === 'DOLLARS'
                                                    ? `≈ ${(parseFloat(amount) / selectedStock.price).toFixed(4)} shares`
                                                    : `≈ $${(parseFloat(amount) * selectedStock.price).toFixed(2)}`
                                                }
                                            </Text>
                                        ) : (
                                            <Text style={{ textAlign: 'center', color: 'transparent', marginTop: 16, fontSize: 15 }}>≈ 0</Text>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.executeBtn, { backgroundColor: tradeType === 'BUY' ? theme.primary : theme.danger, opacity: trading ? 0.7 : 1 }]}
                                        onPress={handleTrade}
                                        disabled={trading}
                                    >
                                        {trading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.executeBtnText}>
                                                {tradeType} {selectedStock?.symbol}
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    {(tradeHistory && tradeHistory.length > 0) && (
                                        <View style={{ marginTop: 30, flex: 1 }}>
                                            <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 15, fontSize: 18 }}>History</Text>
                                            {tradeHistory.map(tx => (
                                                <View key={tx.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                                    <View>
                                                        <Text style={{ color: tx.type === 'BUY' ? theme.primary : theme.danger, fontWeight: 'bold' }}>
                                                            {tx.type}
                                                        </Text>
                                                        <Text style={{ color: theme.secondary, fontSize: 12 }}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={{ color: theme.text }}>{Number(tx.quantity).toFixed(4)} sh @ ${Number(tx.price).toFixed(2)}</Text>
                                                        <Text style={{ color: theme.secondary }}>Total: ${(Number(tx.quantity) * Number(tx.price)).toFixed(2)}</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                )}
            </View>
        </View>
    );
};

export default SandboxTradeModal;

const styles = StyleSheet.create({
    desktopOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    desktopModalCard: {
        width: '100%',
        maxWidth: 800,
        maxHeight: '90%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        flexShrink: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    closeBtn: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 8,
    },
    amountInput: {
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        minWidth: 80,
    },
    executeBtn: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 10,
    },
    executeBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
