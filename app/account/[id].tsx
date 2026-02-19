import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, SectionList, ActivityIndicator } from 'react-native';
import { useBankData, BankAccount } from '@/hooks/useBankData';
import { TransactionDetailModal } from '@/components/finance/TransactionDetailModal';
import { TransactionRow } from '@/components/finance/TransactionRow';
import { Card } from '@/components/ui/Card';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { createAccountDetailsStyles } from '@/app/styles/screens/account-details.styles';

// Helper to group transactions by date
const groupTransactionsByDate = (transactions: any[]) => {
    const groups: { [key: string]: any[] } = {};
    transactions.forEach(t => {
        const dateStr = t.date || t.bookingDate;
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(t);
    });

    return Object.keys(groups)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map(dateStr => {
            const date = new Date(dateStr);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let title = dateStr;
            if (date.toDateString() === today.toDateString()) {
                title = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                title = 'Yesterday';
            } else {
                title = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            return { title, data: groups[dateStr] };
        });
};

export default function AccountDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createAccountDetailsStyles(theme), [theme]);

    const { accounts, loading } = useBankData();
    const [account, setAccount] = useState<BankAccount | undefined>(undefined);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleTxPress = (tx: any) => {
        setSelectedTx({
            id: tx.id,
            date: tx.date || tx.bookingDate,
            amount: tx.amount,
            currency: tx.currency,
            recipient: tx.recipient || tx.creditorName || 'Unknown',
            description: tx.description || tx.remittanceInformation
        });
        setModalVisible(true);
    };

    useEffect(() => {
        const found = accounts.find(a => a.id === id);
        setAccount(found);
    }, [id, accounts]);

    if (loading && !account) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!account) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>Account not found.</Text>
            </View>
        );
    }

    const sections = groupTransactionsByDate(account.transactions || []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{
                title: account.name,
                headerStyle: { backgroundColor: theme.cardBackground },
                headerTintColor: theme.text,
                headerShadowVisible: false,
            }} />

            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                <Text style={[styles.balanceLabel, { color: theme.icon }]}>Current Balance</Text>
                <Text style={[styles.balanceAmount, { color: theme.text }]}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: account.currency }).format(account.balance)}
                </Text>
                <Text style={[styles.iban, { color: theme.icon }]}>{account.iban}</Text>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={[styles.sectionHeader, { color: theme.icon }]}>{title}</Text>
                )}
                renderItem={({ item, index, section }) => (
                    <Card style={[styles.transactionCard, {
                        borderTopLeftRadius: index === 0 ? 12 : 4,
                        borderTopRightRadius: index === 0 ? 12 : 4,
                        borderBottomLeftRadius: index === section.data.length - 1 ? 12 : 4,
                        borderBottomRightRadius: index === section.data.length - 1 ? 12 : 4,
                        backgroundColor: theme.cardBackground
                    }]}>
                        <TransactionRow
                            id={item.id}
                            title={item.recipient || 'Unknown'}
                            amount={item.amount}
                            currency={item.currency}
                            date={new Date(item.date || item.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            icon={'card-outline'}
                            categoryColor={theme.primary}
                            lastItem={true}
                            onPress={() => handleTxPress(item)}
                        />
                    </Card>
                )}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>No transactions found.</Text>
                    </View>
                }
            />

            <TransactionDetailModal
                visible={modalVisible}
                transaction={selectedTx}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}
