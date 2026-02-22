import { Colors } from '@/constants/Colors';
import { Account } from '@/utils/bankingMapper';
import { fetchAccounts, bankingRefresh } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TabScreenWrapper from '@/components/ui/TabScreenWrapper';
import { useTheme } from '@/context/ThemeContext';

export default function FinanceScreen() {
    const { colors: theme } = useTheme();
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const data = await fetchAccounts();
            const accs = (data.accounts || []).map((acc: any) => ({
                ...acc,
                account_id: acc.account_id || acc.id,
                balances: {
                    current: acc.balance,
                    iso_currency_code: acc.currency || 'EUR',
                },
                type: acc.type || 'depository',
            }));


            setAccounts(accs);
        } catch (e) {
            console.error('Failed to load accounts', e);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadAccounts();
        }, [])
    );



    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            console.log('[FinanceScreen] Starting sync with accounts:', accounts.map(a => ({ id: a.account_id, name: a.name })));
            const result: any = await bankingRefresh(accounts);
            console.log('[FinanceScreen] Sync result:', result);
            if (result.stats) {
                console.log('[FinanceScreen] Sync Stats:', JSON.stringify(result.stats, null, 2));
            }
            if (result.stats?.new_tx > 0) {
                alert(`Synced! Added ${result.stats.new_tx} new transactions.`);
            } else if (result.stats?.errors?.length > 0) {
                alert(`Sync completed with errors: ${result.stats.errors.join(', ')}`);
            } else {
                console.log('[FinanceScreen] No new transactions found.');
            }
            await loadAccounts();
        } catch (e) {
            console.error('Failed to refresh', e);
            alert('Failed to sync. Check console for details.');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAccountPress = (account: Account) => {
        if (account.account_id?.startsWith('CASH_')) {
            router.push('/cash-account');
        } else {
            // Future: Navigate to generic account details
        }
    };



    return (
        <TabScreenWrapper>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: theme.icon, fontSize: 12 }}>
                            {isRefreshing ? 'Syncing...' : 'Sync Data'}
                        </Text>
                        <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} style={{ backgroundColor: theme.cardBackground, padding: 8, borderRadius: 20 }}>
                            {isRefreshing ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <Ionicons name="refresh" size={24} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <>
                            {accounts.map((acc) => (
                                <TouchableOpacity
                                    key={acc.account_id}
                                    style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                                    onPress={() => handleAccountPress(acc)}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                                                <Ionicons
                                                    name={acc.type === 'cash' ? "cash-outline" : "business-outline"}
                                                    size={24}
                                                    color={theme.primary}
                                                />
                                            </View>
                                            <View>
                                                <Text style={[styles.accountName, { color: theme.text }]}>{acc.name}</Text>
                                                <Text style={[styles.iban, { color: theme.icon }]}>{acc.iban !== 'N/A' ? acc.iban : 'Manual Account'}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.balance, { color: theme.text }]}>
                                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: acc.balances.iso_currency_code }).format(acc.balances.current)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}



                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: theme.primary, borderColor: theme.primary, marginTop: 20 }]}
                                onPress={handleRefresh}
                                disabled={isRefreshing}
                            >
                                {isRefreshing ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="sync" size={24} color="#FFFFFF" />
                                )}
                                <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>
                                    {isRefreshing ? 'Syncing Data...' : 'Sync All Accounts'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </View>
        </TabScreenWrapper>
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
        paddingBottom: 120, // Ensure content clears tab bar
        gap: 15,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountName: {
        fontSize: 16,
        fontWeight: '600',
    },
    iban: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.7,
    },
    balance: {
        fontSize: 18,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
        marginTop: 10,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    }
});
