import { AccountCard } from '@/components/finance/AccountCard';
import { useBankData, BankAccount, BankResult } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl,
    KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';

// ─── Types ──────────────────────────────────────────────────────────────────

type ConnectStep = 'search' | 'authorize' | 'processing' | 'success';

// ─── Country flag helper ─────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
    DE: '🇩🇪', AT: '🇦🇹', CH: '🇨🇭', FR: '🇫🇷', ES: '🇪🇸', NL: '🇳🇱',
    IT: '🇮🇹', BE: '🇧🇪', PL: '🇵🇱', FI: '🇫🇮', SE: '🇸🇪', DK: '🇩🇰',
};
const flagFor = (country?: string) => FLAG[country?.toUpperCase() ?? ''] ?? '🏦';

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step, primary }: { step: ConnectStep; primary: string }) {
    const steps: ConnectStep[] = ['search', 'authorize', 'processing', 'success'];
    const labels = ['Search', 'Authorise', 'Connecting', 'Done'];
    const idx = steps.indexOf(step);
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            {steps.map((s, i) => (
                <React.Fragment key={s}>
                    <View style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 28, height: 28, borderRadius: 14,
                            backgroundColor: i <= idx ? primary : 'rgba(128,128,128,0.2)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            {i < idx
                                ? <Ionicons name="checkmark" size={14} color="#fff" />
                                : <Text style={{ color: i <= idx ? '#fff' : '#888', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                            }
                        </View>
                        <Text style={{ fontSize: 10, color: i <= idx ? primary : '#888', marginTop: 3, fontWeight: i === idx ? '700' : '400' }}>
                            {labels[i]}
                        </Text>
                    </View>
                    {i < steps.length - 1 && (
                        <View style={{ height: 2, flex: 1, backgroundColor: i < idx ? primary : 'rgba(128,128,128,0.2)', marginBottom: 14, marginHorizontal: 4 }} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
}

// ─── Bank Search Panel ──────────────────────────────────────────────────────

interface ConnectPanelProps {
    theme: any;
    searchBanks: (q: string, country?: string) => void;
    bankResults: BankResult[];
    bankSearchLoading: boolean;
    connectBank: (name: string, country?: string) => Promise<void>;
    processCode: (code: string) => Promise<void>;
    onClose?: () => void;
    onSuccess?: () => void;
}

function ConnectPanel({ theme, searchBanks, bankResults, bankSearchLoading, connectBank, processCode, onClose, onSuccess }: ConnectPanelProps) {
    const [step, setStep] = useState<ConnectStep>('search');
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState('DE');
    const [selectedBank, setSelectedBank] = useState<BankResult | null>(null);
    const [manualUrl, setManualUrl] = useState('');
    const [showManual, setShowManual] = useState(false);

    const handleQueryChange = (text: string) => {
        setQuery(text);
        searchBanks(text, country);
    };

    const handleSelectBank = (bank: BankResult) => {
        setSelectedBank(bank);
        setStep('authorize');
    };

    const handleConnect = async () => {
        if (!selectedBank) return;
        setStep('processing');
        await connectBank(selectedBank.name, selectedBank.country || country);
    };

    const handleManualSubmit = async () => {
        const input = manualUrl.trim();
        if (!input) return;
        let code = input;
        if (input.includes('code=')) {
            try {
                const urlToParse = input.startsWith('http') ? input : `http://dummy.com/${input}`;
                const parsed = new URL(urlToParse);
                code = parsed.searchParams.get('code') || code;
            } catch {
                const match = input.match(/code=([^&]*)/);
                if (match?.[1]) code = match[1];
            }
        }
        setStep('processing');
        try {
            await processCode(code);
            setStep('success');
            if (onSuccess) onSuccess();
        } catch (e) {
            // processCode handles its own errors via setError usually, but if it throws we might stay in processing
            // or go back. For now let's stay in processing or go to error state if we had one.
            setStep('search'); // Reset on failure for now
        }
    };

    const cardBg = theme.cardBackground;
    const border = theme.border;
    const text = theme.text;
    const primary = theme.primary;
    const icon = theme.icon;

    return (
        <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                {step !== 'search' && (
                    <TouchableOpacity onPress={() => setStep(step === 'authorize' ? 'search' : 'authorize')} style={{ marginRight: 12 }}>
                        <Ionicons name="arrow-back" size={20} color={text} />
                    </TouchableOpacity>
                )}
                <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: text }}>Add Bank Account</Text>
                {onClose && (
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={22} color={icon} />
                    </TouchableOpacity>
                )}
            </View>

            <StepIndicator step={step} primary={primary} />

            {/* ── Step 1: Search ── */}
            {step === 'search' && (
                <View style={{ flex: 1 }}>
                    {/* Country selector row */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        {['DE', 'AT', 'CH', 'FR', 'NL'].map(c => (
                            <TouchableOpacity
                                key={c}
                                onPress={() => { setCountry(c); if (query) searchBanks(query, c); }}
                                style={{
                                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
                                    backgroundColor: country === c ? primary : 'rgba(128,128,128,0.1)',
                                    borderWidth: 1.5,
                                    borderColor: country === c ? primary : 'transparent',
                                }}>
                                <Text style={{ fontSize: 14 }}>{flagFor(c)} {c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Search input */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        borderWidth: 1.5, borderColor: border, borderRadius: 12,
                        paddingHorizontal: 12, backgroundColor: cardBg, marginBottom: 14,
                    }}>
                        <Ionicons name="search" size={16} color={icon} style={{ marginRight: 8 }} />
                        <TextInput
                            value={query}
                            onChangeText={handleQueryChange}
                            placeholder="Search bank name…"
                            placeholderTextColor={icon}
                            style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: text }}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {bankSearchLoading && <ActivityIndicator size="small" color={primary} style={{ marginLeft: 8 }} />}
                        {query.length > 0 && !bankSearchLoading && (
                            <TouchableOpacity onPress={() => { setQuery(''); searchBanks('', country); }}>
                                <Ionicons name="close-circle" size={18} color={icon} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Results */}
                    {bankResults.length === 0 && query.length === 0 && (
                        <View style={{ alignItems: 'center', paddingTop: 32, gap: 8 }}>
                            <Text style={{ fontSize: 40 }}>🏦</Text>
                            <Text style={{ color: icon, fontSize: 14, textAlign: 'center' }}>
                                Search for your bank to get started.{'\n'}We support 2000+ banks across Europe.
                            </Text>
                        </View>
                    )}

                    {bankResults.length === 0 && query.length > 0 && !bankSearchLoading && (
                        <Text style={{ color: icon, fontSize: 14, textAlign: 'center', marginTop: 20 }}>
                            No banks found for "{query}" in {flagFor(country)} {country}.{'\n'}Try a different country above.
                        </Text>
                    )}

                    <FlatList
                        data={bankResults
                            .filter(b => !query || b.name.toLowerCase().includes(query.toLowerCase()))
                            .slice(0, 3)}
                        keyExtractor={(item, i) => `${item.name}-${i}`}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleSelectBank(item)}
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    paddingVertical: 13, paddingHorizontal: 14,
                                    borderRadius: 12, marginBottom: 8,
                                    backgroundColor: cardBg,
                                    borderWidth: 1, borderColor: border,
                                }}>
                                <Text style={{ fontSize: 24, marginRight: 12 }}>{flagFor(item.country)}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: text, fontWeight: '600', fontSize: 15 }}>{item.name}</Text>
                                    {item.bic && <Text style={{ color: icon, fontSize: 12, marginTop: 1 }}>{item.bic}</Text>}
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={icon} />
                            </TouchableOpacity>
                        )}
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            )}

            {/* ── Step 2: Authorize ── */}
            {step === 'authorize' && selectedBank && (
                <View style={{ flex: 1 }}>
                    {/* Bank card */}
                    <View style={{
                        alignItems: 'center', padding: 28,
                        backgroundColor: cardBg, borderRadius: 16,
                        borderWidth: 1, borderColor: border, marginBottom: 20,
                    }}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>{flagFor(selectedBank.country)}</Text>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: text, textAlign: 'center' }}>
                            {selectedBank.name}
                        </Text>
                        {selectedBank.bic && (
                            <Text style={{ color: icon, fontSize: 13, marginTop: 4 }}>{selectedBank.bic}</Text>
                        )}
                    </View>

                    <Text style={{ color: icon, fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 19 }}>
                        You'll be redirected to your bank's secure login page.{'\n'}
                        After logging in, you'll return here automatically.
                    </Text>

                    <TouchableOpacity
                        onPress={handleConnect}
                        style={{
                            backgroundColor: primary, paddingVertical: 16,
                            borderRadius: 14, alignItems: 'center',
                            flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16,
                        }}>
                        <Ionicons name="shield-checkmark" size={18} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Connect Securely</Text>
                    </TouchableOpacity>

                    {/* Manual fallback toggle */}
                    <TouchableOpacity onPress={() => setShowManual(v => !v)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                        <Text style={{ color: primary, fontSize: 13, fontWeight: '500' }}>
                            {showManual ? '▲ Hide manual option' : '▾ Having trouble? Paste redirect URL manually'}
                        </Text>
                    </TouchableOpacity>

                    {showManual && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={{ color: icon, fontSize: 12, marginBottom: 8 }}>
                                After completing the bank login, copy the redirect URL from your browser and paste it below:
                            </Text>
                            <TextInput
                                value={manualUrl}
                                onChangeText={setManualUrl}
                                placeholder="https://localhost/?code=..."
                                placeholderTextColor={icon}
                                style={{
                                    borderWidth: 1.5, borderColor: border, borderRadius: 10,
                                    padding: 12, color: text, fontSize: 13, marginBottom: 8,
                                }}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                onPress={handleManualSubmit}
                                disabled={!manualUrl.trim()}
                                style={{
                                    backgroundColor: manualUrl.trim() ? primary : 'rgba(128,128,128,0.2)',
                                    paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                                }}>
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Connect with URL</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* ── Step 3: Processing ── */}
            {step === 'processing' && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <ActivityIndicator size="large" color={primary} />
                    <Text style={{ color: text, fontWeight: '600', fontSize: 17 }}>Connecting your account…</Text>
                    <Text style={{ color: icon, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                        Complete the bank login in the browser tab.{'\n'}This screen will update automatically when done.
                    </Text>
                </View>
            )}

            {/* ── Step 4: Success ── */}
            {step === 'success' && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={40} color="#fff" />
                    </View>
                    <Text style={{ color: text, fontWeight: '700', fontSize: 20 }}>Account Connected!</Text>
                    <Text style={{ color: icon, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                        Your transactions are now syncing.{'\n'}This may take a moment.
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            marginTop: 20,
                            backgroundColor: theme.primary, paddingHorizontal: 32, paddingVertical: 14,
                            borderRadius: 12,
                        }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// ─── Main Screen component ────────────────────────────────────────────────────

export default function AccountsScreen() {
    const { colors: theme } = useTheme();
    const router = useRouter();
    const { accounts, loading, error, refreshAccounts, connectBank, processCode, searchBanks, bankResults, bankSearchLoading, removeAccount } = useBankData();
    const isDesktop = useIsDesktop();
    const [refreshing, setRefreshing] = useState(false);
    const [showAddBank, setShowAddBank] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshAccounts();
        setRefreshing(false);
    }, [refreshAccounts]);

    const confirmDelete = useCallback((account: BankAccount) => {
        const doDelete = () => removeAccount(account.id);
        if (Platform.OS === 'web') {
            if (window.confirm(`Remove "${account.name}"? This cannot be undone.`)) doDelete();
        } else {
            Alert.alert(
                'Remove Account',
                `Remove "${account.name}"? This cannot be undone.`,
                [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: doDelete }],
            );
        }
    }, [removeAccount]);

    const handleAccountPress = (account: BankAccount) => {
        if (account.id === 'CASH_ACCOUNT') {
            router.push('/cash-account');
        } else {
            router.push(`/account/${account.id}`);
        }
    };

    const bankBadgeColor = (bankName: string) => {
        if (bankName === 'Commerzbank') return '#FFD700';
        if (bankName === 'N26') return '#36E0C6';
        return theme.primary + '40';
    };

    const panelProps: ConnectPanelProps = {
        theme,
        searchBanks,
        bankResults,
        bankSearchLoading,
        connectBank,
        processCode,
        onClose: () => setShowAddBank(false),
    };

    // ─── Desktop Layout ──────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 28, paddingBottom: 48, maxWidth: 1100, alignSelf: 'center' as any, width: '100%' as any }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                >
                    {/* Page header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                        <View>
                            <Text style={{ fontSize: 30, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>
                                Bank Accounts
                            </Text>
                            <Text style={{ fontSize: 13, color: theme.icon, marginTop: 2 }}>
                                {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onRefresh}
                            disabled={refreshing || loading}
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                backgroundColor: theme.primary + '18', paddingHorizontal: 14,
                                paddingVertical: 9, borderRadius: 12,
                                borderWidth: 1, borderColor: theme.primary + '30',
                            }}>
                            {refreshing || loading
                                ? <ActivityIndicator size="small" color={theme.primary} />
                                : <Ionicons name="sync" size={15} color={theme.primary} />}
                            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>
                                {refreshing ? 'Syncing…' : 'Sync All'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {error && (
                        <View style={{ backgroundColor: theme.danger + '18', borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="warning" size={18} color={theme.danger} />
                            <Text style={{ color: theme.danger, flex: 1, fontSize: 13 }}>{error}</Text>
                        </View>
                    )}

                    {/* Two-column layout */}
                    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>

                        {/* Left: Accounts list */}
                        <View style={{ flex: 3 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.icon, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                                Connected Accounts
                            </Text>

                            {loading && !refreshing && accounts.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                                    <ActivityIndicator size="large" color={theme.primary} />
                                </View>
                            ) : accounts.length === 0 ? (
                                <View style={{
                                    alignItems: 'center', paddingVertical: 52,
                                    backgroundColor: theme.cardBackground, borderRadius: 16,
                                    borderWidth: 1, borderColor: theme.border,
                                }}>
                                    <Text style={{ fontSize: 48, marginBottom: 14 }}>🏦</Text>
                                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>No accounts yet</Text>
                                    <Text style={{ color: theme.icon, fontSize: 14 }}>Add a bank account using the panel on the right →</Text>
                                </View>
                            ) : (
                                <View style={{ gap: 10 }}>
                                    {accounts.map((acc) => (
                                        <AccountCard
                                            key={acc.id}
                                            account={acc}
                                            onPress={handleAccountPress}
                                            onDelete={confirmDelete}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Right: Add Bank panel */}
                        <View style={{ flex: 2, minWidth: 300 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.icon, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                                Add Bank Account
                            </Text>
                            <View style={{
                                backgroundColor: theme.cardBackground, borderRadius: 20,
                                padding: 22, borderWidth: 1, borderColor: theme.border,
                                minHeight: 400,
                            }}>
                                <ConnectPanel {...panelProps} onClose={undefined} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // ─── Mobile Layout ───────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Mobile header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 60, paddingBottom: 14, paddingHorizontal: 20,
                backgroundColor: theme.cardBackground, borderBottomWidth: 1, borderBottomColor: theme.border,
            }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>Accounts</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={onRefresh} disabled={refreshing || loading}>
                        {refreshing || loading
                            ? <ActivityIndicator size="small" color={theme.primary} />
                            : <Ionicons name="sync" size={22} color={theme.primary} />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 18, paddingBottom: 140 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {error && (
                    <View style={{ backgroundColor: theme.danger + '18', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="warning" size={16} color={theme.danger} />
                        <Text style={{ color: theme.danger, flex: 1, fontSize: 13 }}>{error}</Text>
                    </View>
                )}

                {/* Add bank button */}
                <TouchableOpacity
                    onPress={() => setShowAddBank(true)}
                    style={{
                        backgroundColor: theme.primary, borderRadius: 14,
                        paddingVertical: 15, paddingHorizontal: 20,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 8, marginBottom: 24,
                        shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                    }}>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Add Bank Account</Text>
                </TouchableOpacity>

                {/* Accounts */}
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.icon, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                    Connected Accounts
                </Text>

                {loading && !refreshing && accounts.length === 0 ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                ) : accounts.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>🏦</Text>
                        <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>No accounts yet</Text>
                        <Text style={{ color: theme.icon, fontSize: 14, textAlign: 'center' }}>Tap "Add Bank Account" above{'\n'}to connect your first bank.</Text>
                    </View>
                ) : (
                    <View style={{ gap: 10 }}>
                        {accounts.map((acc) => (
                            <AccountCard
                                key={acc.id}
                                account={acc}
                                onPress={handleAccountPress}
                                onDelete={confirmDelete}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Mobile: Add Bank Modal (bottom sheet style) */}
            <Modal
                visible={showAddBank}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAddBank(false)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                    onPress={() => setShowAddBank(false)}
                >
                    <Pressable
                        style={{
                            backgroundColor: theme.background, borderTopLeftRadius: 24,
                            borderTopRightRadius: 24, padding: 24, maxHeight: '90%',
                            borderTopWidth: 1, borderColor: theme.border,
                        }}
                        onPress={() => {/* prevent close */ }} >
                        {/* Drag handle */}
                        <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                            <ConnectPanel {...panelProps} />
                        </KeyboardAvoidingView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
