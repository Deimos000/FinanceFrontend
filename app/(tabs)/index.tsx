import { TransactionRow } from '@/components/finance/TransactionRow';
import { TransactionDetailModal } from '@/components/finance/TransactionDetailModal';
import { Card } from '@/components/ui/Card';
import { Account } from '@/utils/bankingMapper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBankData } from '@/hooks/useBankData';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function HomeScreen() {
  const { colors: theme } = useTheme();

  // Use the hook instead of manual loading
  const { accounts, loading, refreshAccounts } = useBankData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAccounts();
    setRefreshing(false);
  };
  // removed useFocusEffect manual loading logic

  const handleTxPress = (tx: any) => {
    setSelectedTx({
      id: tx.id,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency,
      recipient: tx.recipient || tx.accountName || 'Unknown',
      description: tx.description
    });
    setModalVisible(true);
  };

  // Process transactions into sections
  const getSections = () => {
    const allTransactions = accounts.flatMap(a =>
      (a.transactions || []).map(t => ({ ...t, accountName: a.name }))
    )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Debug removed
    // console.log('Dashboard: Total transactions found:', allTransactions.length);
    // console.log('Dashboard: Cash transactions in list:', allTransactions.filter(t => t.accountName === 'Cash Application'));

    const groups: { [key: string]: typeof allTransactions } = {};

    allTransactions.forEach(t => {
      const date = new Date(t.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let key = date.toLocaleDateString();

      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });

    return Object.keys(groups).map(date => ({
      title: date,
      data: groups[date]
    }));
  };

  const sections = getSections();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>


      {loading && accounts.length === 0 ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.id + index}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              {/* 1. Total Balance */}
              <View style={{ marginBottom: 30, marginTop: 10 }}>
                <Text style={{ color: theme.icon, fontSize: 16, marginBottom: 5 }}>Total Net Worth</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 38, fontWeight: '800', color: theme.text }}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                      accounts.reduce((sum, acc) => sum + acc.balance, 0)
                    )}
                  </Text>
                  <Ionicons name="person-circle" size={40} color={theme.primary} />
                </View>
              </View>

              {/* 2. Account Split (Horizontal Scroll) */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 12 }}>My Accounts</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 0 }}>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() => {
                        if (account.id === 'CASH_ACCOUNT') {
                          router.push('/cash-account');
                        } else {
                          router.push({
                            pathname: '/account/[id]',
                            params: { id: account.id }
                          });
                        }
                      }}
                      style={{
                        width: 200,
                        height: 120,
                        backgroundColor: theme.cardBackground,
                        borderRadius: 16,
                        padding: 15,
                        justifyContent: 'space-between',
                        marginRight: 10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                        borderColor: theme.border,
                        borderWidth: 1
                      }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.text, fontWeight: '600', opacity: 0.7, fontSize: 12 }}>{account.name}</Text>
                        <Ionicons name="card-outline" size={18} color={theme.primary} />
                      </View>

                      <View>
                        <Text style={{ color: theme.icon, fontSize: 10, marginBottom: 4 }}>{account.iban}</Text>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: account.currency }).format(account.balance)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {accounts.length === 0 && (
                    <View style={{ width: 200, height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: 16, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}>
                      <Text style={{ color: theme.icon }}>No accounts connected</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, { color: theme.icon }]}>{title}</Text>
          )}
          renderItem={({ item, index, section }) => (
            <Card style={{
              marginBottom: 2,
              borderRadius: 0,
              borderTopLeftRadius: index === 0 ? 12 : 4,
              borderTopRightRadius: index === 0 ? 12 : 4,
              borderBottomLeftRadius: index === section.data.length - 1 ? 12 : 4,
              borderBottomRightRadius: index === section.data.length - 1 ? 12 : 4,
            }}>
              <TransactionRow
                id={item.id}
                title={item.recipient || 'Unknown'}
                // subtitle={item.description || 'No description'} // HIDDEN from list
                amount={item.amount}
                currency={item.currency}
                date={new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                icon={'card-outline' as any}
                categoryColor={theme.primary}
                lastItem={true}
                onPress={() => handleTxPress(item)}
              />
            </Card>
          )}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.icon }}>No recent transactions found.</Text>
            </View>
          }
        />
      )}

      <TransactionDetailModal
        visible={modalVisible}
        transaction={selectedTx}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
});

