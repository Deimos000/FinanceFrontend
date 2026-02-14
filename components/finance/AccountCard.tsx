import { BankAccount } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface AccountCardProps {
    account: BankAccount;
    onPress: (account: BankAccount) => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
    const { colors: theme } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => onPress(account)}
        >
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                        <Ionicons
                            name="business-outline"
                            size={24}
                            color={theme.primary}
                        />
                    </View>
                    <View>
                        <Text style={[styles.accountName, { color: theme.text }]}>{account.name}</Text>
                        <Text style={[styles.iban, { color: theme.icon }]}>{account.bankName} • {account.iban}</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.balance, { color: theme.text }]}>
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: account.currency }).format(account.balance)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
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
});
