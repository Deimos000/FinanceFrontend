import { TransactionRow } from '@/components/finance/TransactionRow';
import { Colors } from '@/constants/Colors';
import { useBankData, Transaction } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { createHomeStyles } from '@/app/styles/screens/index.styles';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import TabScreenWrapper from '@/components/ui/TabScreenWrapper';

// Helper to group transactions by date
const groupTransactionsByDate = (transactions: Transaction[]) => {
  const groups: { [key: string]: Transaction[] } = {};
  transactions.forEach(t => {
    const dateStr = t.date; // ISO string 2023-01-01
    // We'll use the date part only for grouping key
    const dateKey = new Date(dateStr).toDateString();

    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: theme } = useTheme();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);
  const isDesktop = useIsDesktop();

  const { accounts, loading, refreshAccounts } = useBankData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAccounts();
    setRefreshing(false);
  }, [refreshAccounts]);

  // Calculate Net Worth
  const bankTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const netWorth = bankTotal;

  // Get Cash Account specifics
  const cashAccount = accounts.find(a => a.id.startsWith('CASH_'));
  const cashBalance = cashAccount?.balance || 0;

  // Recent Activity (Merge Bank + Cash, Sort by Date)
  // We take more transactions now since it is the main list
  const allTransactions: Transaction[] = accounts
    .flatMap(acc => acc.transactions)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50); // Show last 50 transactions on dashboard

  const groupedTransactions = groupTransactionsByDate(allTransactions);

  // ─── Desktop Layout ───
  if (isDesktop) {
    return (
      <TabScreenWrapper>
        <View style={[styles.container, { paddingTop: 20 }]}>
          <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 40, maxWidth: 1200, alignSelf: 'center' as const, width: '100%' as any }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <View>
                <Text style={styles.subtitle}>Welcome back,</Text>
                <Text style={[styles.title, { fontSize: 36 }]}>Denis</Text>
              </View>
              <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/settings')}>
                <Ionicons name="person" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Summary Cards Row */}
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 32 }}>
              <View style={[styles.summaryCard, { flex: 1 }]}>
                <Ionicons name="wallet" size={28} color={theme.primary} style={styles.cardIcon} />
                <View>
                  <Text style={[styles.cardValue, { fontSize: 24 }]}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(netWorth)}
                  </Text>
                  <Text style={styles.cardLabel}>Total Net Worth</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.summaryCard, { flex: 1 }]}
                onPress={() => router.push('/cash-account')}
              >
                <Ionicons name="cash" size={28} color={theme.secondary} style={styles.cardIcon} />
                <View>
                  <Text style={[styles.cardValue, { fontSize: 24 }]}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cashBalance)}
                  </Text>
                  <Text style={styles.cardLabel}>Cash on Hand</Text>
                </View>
              </TouchableOpacity>

              {/* Quick Actions as a card */}
              <View style={[styles.summaryCard, { flex: 1 }]}>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Quick Actions</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/finance')}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="pie-chart" size={24} color={theme.primary} />
                    </View>
                    <Text style={styles.actionLabel}>Budget</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/cash-account')}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="add-circle" size={24} color={theme.secondary} />
                    </View>
                    <Text style={styles.actionLabel}>Add Cash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/debts')}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="people" size={24} color="#FF9500" />
                    </View>
                    <Text style={styles.actionLabel}>Debts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/stocks')}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="trending-up" size={24} color="#FF3B30" />
                    </View>
                    <Text style={styles.actionLabel}>Invest</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.sectionTitle, { fontSize: 22 }]}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>See All</Text>
                </TouchableOpacity>
              </View>

              {groupedTransactions.map((group) => (
                <View key={group.title}>
                  <Text style={styles.dateHeader}>{group.title}</Text>
                  <View style={styles.transactionGroup}>
                    {group.data.map((t, i) => (
                      <TransactionRow
                        key={t.id}
                        id={t.id}
                        title={t.recipient || t.booking_text || 'Unknown'}
                        amount={t.amount}
                        date={new Date(t.date).toLocaleDateString()}
                        categoryColor={theme.primary}
                        lastItem={i === group.data.length - 1}
                        onPress={() => { }}
                      />
                    ))}
                  </View>
                </View>
              ))}

              {groupedTransactions.length === 0 && !loading && (
                <Text style={styles.emptyText}>No recent transactions.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </TabScreenWrapper>
    );
  }

  // ─── Mobile Layout (unchanged) ───
  return (
    <TabScreenWrapper>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle={theme.text === '#FFFFFF' ? "light-content" : "dark-content"} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Welcome back,</Text>
            <Text style={styles.title}>Denis</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="person" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >

          {/* Net Worth & Cash Summary */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.summaryCard}>
                <Ionicons name="wallet" size={24} color={theme.primary} style={styles.cardIcon} />
                <View>
                  <Text style={styles.cardValue}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(netWorth)}
                  </Text>
                  <Text style={styles.cardLabel}>Total Net Worth</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.summaryCard}
                onPress={() => router.push('/cash-account')}
              >
                <Ionicons name="cash" size={24} color={theme.secondary} style={styles.cardIcon} />
                <View>
                  <Text style={styles.cardValue}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cashBalance)}
                  </Text>
                  <Text style={styles.cardLabel}>Cash on Hand</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/finance')}>
                <View style={styles.actionIcon}>
                  <Ionicons name="pie-chart" size={24} color={theme.primary} />
                </View>
                <Text style={styles.actionLabel}>Budget</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/cash-account')}>
                <View style={styles.actionIcon}>
                  <Ionicons name="add-circle" size={24} color={theme.secondary} />
                </View>
                <Text style={styles.actionLabel}>Add Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/debts')}>
                <View style={styles.actionIcon}>
                  <Ionicons name="people" size={24} color="#FF9500" />
                </View>
                <Text style={styles.actionLabel}>Debts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/stocks')}>
                <View style={styles.actionIcon}>
                  <Ionicons name="trending-up" size={24} color="#FF3B30" />
                </View>
                <Text style={styles.actionLabel}>Invest</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>See All</Text>
              </TouchableOpacity>
            </View>

            {groupedTransactions.map((group) => (
              <View key={group.title}>
                <Text style={styles.dateHeader}>{group.title}</Text>
                <View style={styles.transactionGroup}>
                  {group.data.map((t, i) => (
                    <TransactionRow
                      key={t.id}
                      id={t.id}
                      title={t.recipient || t.booking_text || 'Unknown'}
                      amount={t.amount}
                      date={new Date(t.date).toLocaleDateString()}
                      categoryColor={theme.primary}
                      lastItem={i === group.data.length - 1}
                      onPress={() => { }}
                    />
                  ))}
                </View>
              </View>
            ))}

            {groupedTransactions.length === 0 && !loading && (
              <Text style={styles.emptyText}>No recent transactions.</Text>
            )}
          </View>

        </ScrollView>
      </View>
    </TabScreenWrapper >
  );
}
