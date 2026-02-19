import { AccountCard } from '@/components/finance/AccountCard';
import { useBankData, BankAccount } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, RefreshControl, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { createAccountsStyles } from '@/app/styles/screens/accounts.styles';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export default function AccountsScreen() {
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createAccountsStyles(theme), [theme]);
    const router = useRouter();
    const { accounts, loading, error, refreshAccounts, connectBank, processCode } = useBankData();
    const isDesktop = useIsDesktop();
    const [refreshing, setRefreshing] = React.useState(false);
    const [manualCode, setManualCode] = React.useState('');

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refreshAccounts();
        setRefreshing(false);
    }, [refreshAccounts]);

    const handleManualSubmit = () => {
        const input = manualCode.trim();
        if (!input) return;

        console.log('[Accounts] Manual submit:', input);

        let codeToProcess = input;

        // Try parsing as URL
        if (input.includes('?') || input.includes('code=')) {
            try {
                // Handle partial URLs or full URLs
                const urlString = input.startsWith('http') ? input : `http://dummy.com/${input}`;
                const url = new URL(urlString);
                const code = url.searchParams.get('code');
                if (code) {
                    codeToProcess = code;
                }
            } catch (e) {
                // Fallback to regex if URL parsing fails
                console.log('[Accounts] URL parsing failed, trying regex');
                const match = input.match(/code=([^&]*)/);
                if (match && match[1]) {
                    codeToProcess = match[1];
                }
            }
        }

        console.log('[Accounts] Processing code:', codeToProcess);
        processCode(codeToProcess);
        setManualCode('');
    };

    const handleAccountPress = (account: BankAccount) => {
        if (account.id === 'CASH_ACCOUNT') {
            router.push('/cash-account');
        } else {
            router.push(`/account/${account.id}`);
        }
    };

    // ─── Desktop Layout ───
    if (isDesktop) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 40, maxWidth: 900, alignSelf: 'center' as any, width: '100%' as any }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.text }}>Bank Accounts</Text>
                        <TouchableOpacity onPress={onRefresh} disabled={refreshing || loading} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '20', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
                            {refreshing || loading ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="sync" size={16} color={theme.primary} style={{ marginRight: 6 }} />}
                            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>{refreshing ? 'Syncing...' : 'Sync All'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Connection Actions Row */}
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#FFD700', flex: 1 }]} onPress={() => connectBank('Commerzbank')}>
                            <Text style={[styles.buttonText, { color: '#000' }]}>Connect Commerzbank</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#36E0C6', flex: 1 }]} onPress={() => connectBank('N26')}>
                            <Text style={styles.buttonText}>Connect N26</Text>
                        </TouchableOpacity>
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                            <TouchableOpacity onPress={onRefresh}>
                                <Text style={[styles.retryText, { color: theme.primary }]}>Tap to Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Manual + Accounts side by side */}
                    <View style={{ flexDirection: 'row', gap: 24 }}>
                        <View style={[styles.manualContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border, flex: 1 }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Manual Connection</Text>
                            <Text style={[styles.helperText, { color: theme.text }]}>Paste the full redirect URL here:</Text>
                            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="https://localhost/?code=..." placeholderTextColor={theme.icon} value={manualCode} onChangeText={setManualCode} autoCapitalize="none" autoCorrect={false} />
                            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleManualSubmit}>
                                <Text style={styles.buttonText}>Connect with URL</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 2 }}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Your Accounts</Text>
                            {loading && !refreshing && accounts.length === 0 ? (
                                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                            ) : accounts.length === 0 ? (
                                <Text style={[styles.emptyText, { color: theme.text }]}>No accounts connected yet.</Text>
                            ) : (
                                <View style={{ gap: 12 }}>
                                    {accounts.map((acc) => (
                                        <AccountCard key={acc.id} account={acc} onPress={handleAccountPress} />
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // ─── Mobile Layout (unchanged) ───
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={onRefresh} disabled={refreshing || loading}>
                    {refreshing || loading ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <Ionicons name="refresh" size={24} color={theme.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* Connection Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#FFD700' }]} onPress={() => connectBank('Commerzbank')}>
                        <Text style={[styles.buttonText, { color: '#000' }]}>Connect Commerzbank</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#36E0C6' }]} onPress={() => connectBank('N26')}>
                        <Text style={styles.buttonText}>Connect N26</Text>
                    </TouchableOpacity>
                </View>

                {/* Sync All Button */}
                <View style={{ marginBottom: 24 }}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={onRefresh}
                        disabled={refreshing || loading}
                    >
                        {refreshing || loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        ) : (
                            <Ionicons name="sync" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.buttonText}>
                            {refreshing || loading ? 'Syncing...' : 'Sync All Accounts'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                        <TouchableOpacity onPress={onRefresh}>
                            <Text style={[styles.retryText, { color: theme.primary }]}>Tap to Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Manual Code Entry */}
                <View style={[styles.manualContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Manual Connection</Text>
                    <Text style={[styles.helperText, { color: theme.text }]}>If the bank app doesn't redirect automatically, paste the full URL here:</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder="https://localhost/?code=..."
                        placeholderTextColor={theme.icon}
                        value={manualCode}
                        onChangeText={setManualCode}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleManualSubmit}>
                        <Text style={styles.buttonText}>Connect with URL</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Your Accounts</Text>

                {loading && !refreshing && accounts.length === 0 ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {accounts.length === 0 && (
                            <Text style={[styles.emptyText, { color: theme.text }]}>No accounts connected yet.{'\n'}Connect a bank above to get started.</Text>
                        )}

                        {accounts.map((acc) => (
                            <AccountCard
                                key={acc.id}
                                account={acc}
                                onPress={handleAccountPress}
                            />
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
