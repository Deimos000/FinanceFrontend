import { TransactionRow } from '@/components/finance/TransactionRow';
import { useBankData, Transaction } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { createTransactionsStyles } from '@/app/styles/screens/transactions.styles';

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createTransactionsStyles(theme), [theme]);

    const { accounts, loading, refreshAccounts } = useBankData();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshAccounts();
        setRefreshing(false);
    };

    // Filter transactions
    const allTransactions: Transaction[] = accounts
        .flatMap(acc => acc.transactions)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const displayedTransactions = selectedAccount
        ? allTransactions.filter(t => accounts.find(a => a.id === selectedAccount)?.transactions.some(at => at.id === t.id))
        : allTransactions;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

            <View style={[styles.header, { paddingHorizontal: 20 }]}>
                <Text style={styles.title}>Transactions</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
                        <Ionicons name="refresh" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="filter" size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* Account Filter (Horizontal Scroll) */}
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountScrollContent}>
                        <TouchableOpacity
                            style={[
                                styles.accountCard,
                                !selectedAccount && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                            ]}
                            onPress={() => setSelectedAccount(null)}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.accountName}>All Accounts</Text>
                                <Ionicons name="layers" size={18} color={!selectedAccount ? theme.primary : theme.icon} />
                            </View>
                            <Text style={styles.accountBalance}>
                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                                    accounts.reduce((sum, a) => sum + a.balance, 0)
                                )}
                            </Text>
                        </TouchableOpacity>

                        {accounts.map((account) => (
                            <TouchableOpacity
                                key={account.id}
                                style={[
                                    styles.accountCard,
                                    selectedAccount === account.id && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                                ]}
                                onPress={() => setSelectedAccount(account.id === selectedAccount ? null : account.id)}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.accountName} numberOfLines={1}>{account.name}</Text>
                                    <Ionicons name="card-outline" size={18} color={selectedAccount === account.id ? theme.primary : theme.icon} />
                                </View>
                                <View>
                                    <Text style={styles.accountIban} numberOfLines={1}>{account.iban}</Text>
                                    <Text style={styles.accountBalance}>
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: account.currency }).format(account.balance)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Transactions List */}
                <View style={styles.transactionsList}>
                    <Text style={styles.sectionTitle}>
                        {selectedAccount ? 'Account Activity' : 'Recent Activity'}
                    </Text>

                    {displayedTransactions.length === 0 && !loading && (
                        <Text style={styles.noTransactionsText}>No transactions found.</Text>
                    )}

                    {displayedTransactions.map((t, i) => (
                        <TransactionRow
                            key={t.id}
                            id={t.id}
                            title={t.recipient || t.booking_text || 'Unknown'}
                            amount={t.amount}
                            date={new Date(t.date).toLocaleDateString()}
                            categoryColor={theme.primary}
                            lastItem={i === displayedTransactions.length - 1}
                            onPress={() => { }}
                        />
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}
