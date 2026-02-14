
import { TransactionRow } from '@/components/finance/TransactionRow';
import { TransactionDetailModal } from '@/components/finance/TransactionDetailModal';
import { Card } from '@/components/ui/Card';
import { Account } from '@/utils/bankingMapper';
import { fetchCashAccount } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CashTransactionModal } from '@/components/finance/CashTransactionModal';
import { EditBalanceModal } from '@/components/finance/EditBalanceModal';
import { useTheme } from '@/context/ThemeContext';

export default function CashAccountScreen() {
    const { colors: theme } = useTheme();
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [txModalVisible, setTxModalVisible] = useState(false);

    const [balanceModalVisible, setBalanceModalVisible] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    const handleTxPress = (tx: any) => {
        setSelectedTx({
            id: tx.transactionId || tx.id,
            date: tx.bookingDate || tx.booking_date,
            amount: tx.amount,
            currency: tx.currency,
            recipient: tx.displayName || tx.name || 'Transaction',
            description: tx.remittanceInformation || tx.description || 'Manual Entry'
        });
        setDetailModalVisible(true);
    };

    const loadAccount = async () => {
        setLoading(true);
        try {
            const acc = await fetchCashAccount();
            if (acc) {
                // Map to the Account shape the UI expects
                const mapped: any = {
                    ...acc,
                    account_id: acc.account_id,
                    balances: { current: acc.balance, iso_currency_code: acc.currency || 'EUR' },
                    type: 'cash',
                    transactions: (acc.transactions || []).map((t: any) => ({
                        transactionId: t.id,
                        bookingDate: t.booking_date,
                        amount: t.amount,
                        currency: t.currency || 'EUR',
                        displayName: t.name || 'Cash Transaction',
                        remittanceInformation: t.description || 'Manual Entry',
                    })),
                };
                setAccount(mapped);
            } else {
                setAccount(null);
            }
        } catch {
            setAccount(null);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadAccount();
        }, [])
    );

    const handleTransactionAdded = () => {
        loadAccount();
        setTxModalVisible(false);
    };

    const handleBalanceUpdated = () => {
        loadAccount();
        setBalanceModalVisible(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!account) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>Cash Account not found.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Cash Wallet',
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
                headerShadowVisible: false
            }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Balance Card */}
                <View style={[styles.balanceCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <View>
                        <Text style={[styles.label, { color: theme.icon }]}>Current Cash</Text>
                        <Text style={[styles.balance, { color: theme.text }]}>
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(account.balances.current)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setBalanceModalVisible(true)} style={[styles.editButton, { backgroundColor: theme.background }]}>
                        <Ionicons name="pencil" size={20} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                        onPress={() => setTxModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Add Transaction</Text>
                    </TouchableOpacity>
                </View>

                {/* Transactions List */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>

                <View style={styles.list}>
                    {account.transactions.length === 0 ? (
                        <Text style={{ color: theme.icon, textAlign: 'center', marginTop: 20 }}>No transactions yet.</Text>
                    ) : (
                        account.transactions.map((t, index) => (
                            <Card key={t.transactionId} style={[styles.txCard, {
                                borderBottomWidth: index !== account.transactions.length - 1 ? 1 : 0,
                                borderBottomColor: theme.border
                            }]}>
                                <TransactionRow
                                    id={t.transactionId}
                                    title={t.displayName || 'Transaction'}
                                    subtitle={t.remittanceInformation || 'Manual Entry'}
                                    amount={t.amount}
                                    currency={t.currency}
                                    date={new Date(t.bookingDate).toLocaleDateString()}
                                    icon={'cash-outline' as any}
                                    categoryColor={theme.primary}

                                    lastItem={true}
                                    onPress={() => handleTxPress(t)}
                                />
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>

            <CashTransactionModal
                visible={txModalVisible}
                onClose={() => setTxModalVisible(false)}
                onSave={handleTransactionAdded}
            />

            <EditBalanceModal
                visible={balanceModalVisible}
                onClose={() => setBalanceModalVisible(false)}
                onSave={handleBalanceUpdated}
                currentBalance={account.balances.current}
            />

            <TransactionDetailModal
                visible={detailModalVisible}
                transaction={selectedTx}
                onClose={() => setDetailModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    balanceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balance: {
        fontSize: 36,
        fontWeight: '800',
    },
    editButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        marginBottom: 30,
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
    },
    list: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    txCard: {
        marginBottom: 0,
        borderRadius: 0,
        elevation: 0,
        backgroundColor: 'transparent'
    }
});
