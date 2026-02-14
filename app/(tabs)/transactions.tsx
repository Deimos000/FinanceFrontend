import { Colors } from '@/constants/Colors';
import { Account } from '@/utils/bankingMapper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function TransactionsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [accounts, setAccounts] = useState<Account[]>([]);

    const loadAccounts = async () => {
        try {
            let accsStr: string | null = null;
            if (Platform.OS === 'web') {
                accsStr = localStorage.getItem('accounts');
            } else {
                accsStr = await SecureStore.getItemAsync('accounts');
            }
            if (accsStr) {
                setAccounts(JSON.parse(accsStr));
            }
        } catch (e) {
            console.error('Failed to load accounts on Transactions Screen', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadAccounts();
        }, [])
    );

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balances.current, 0);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.icon }]}>Total Net Worth</Text>
                        <Text style={[styles.username, { color: theme.text }]}>
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalBalance)}
                        </Text>
                    </View>
                    <View style={styles.profileButton}>
                        <Ionicons name="person-circle-outline" size={32} color={theme.primary} />
                    </View>
                </View>

                {/* Account Split */}
                <View style={{ marginBottom: 30 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 0 }]}>My Accounts</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 0 }} style={{ marginTop: 10 }}>
                        {accounts.map((account) => (
                            <View key={account.account_id} style={{
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
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: account.balances.iso_currency_code }).format(account.balances.current)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {accounts.length === 0 && (
                            <View style={{ width: 200, height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: 16, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}>
                                <Text style={{ color: theme.icon }}>No accounts connected</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Global Transactions */}
                <View>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 10 }]}>Recent Activity</Text>
                    <View style={{ padding: 20, alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: 10 }}>
                        <Text style={{ color: theme.text }}>Transactions list component was reset.</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
    },
    username: {
        fontSize: 32,
        fontWeight: '800',
    },
    profileButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
});
