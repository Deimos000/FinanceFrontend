import { AccountCard } from '@/components/finance/AccountCard';
import { useBankData, BankAccount } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function AccountsScreen() {
    const { colors: theme } = useTheme();
    const router = useRouter();
    const { accounts, loading, error, refreshAccounts, connectBank, processCode } = useBankData();
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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <TouchableOpacity onPress={onRefresh} disabled={refreshing || loading}>
                        {refreshing || loading ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <Ionicons name="refresh" size={24} color={theme.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: 'red' }]}>{error}</Text>
                        <TouchableOpacity onPress={onRefresh}>
                            <Text style={[styles.retryText, { color: theme.primary }]}>Tap to Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading && !refreshing && accounts.length === 0 ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {/* Connection Actions */}
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => connectBank('Commerzbank')}>
                                <Text style={styles.buttonText}>Connect Commerzbank</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]} onPress={() => connectBank('N26')}>
                                <Text style={styles.buttonText}>Connect N26</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Manual Code Entry */}
                        <View style={[styles.manualContainer, { backgroundColor: theme.cardBackground }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Manual Connection</Text>
                            <Text style={{ color: theme.text, marginBottom: 10 }}>If the app doesn't open automatically, paste the full localhost URL here:</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="https://localhost/?code=..."
                                placeholderTextColor={theme.icon}
                                value={manualCode}
                                onChangeText={setManualCode}
                            />
                            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]} onPress={handleManualSubmit}>
                                <Text style={styles.buttonText}>Connect with URL</Text>
                            </TouchableOpacity>
                        </View>


                        {accounts.length === 0 && (
                            <Text style={[styles.emptyText, { color: theme.text }]}>No accounts connected yet.</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    errorContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    errorText: {
        fontSize: 16,
        marginBottom: 10,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '600',
    },
    actionsContainer: {
        marginBottom: 20,
    },
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        opacity: 0.7
    },
    manualContainer: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    }
});
