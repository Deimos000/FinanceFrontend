import { BankAccount } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { createAccountCardStyles } from '@/app/styles/components/AccountCard.styles';

interface AccountCardProps {
    account: BankAccount;
    onPress: (account: BankAccount) => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createAccountCardStyles(theme), [theme]);

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(account)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name="business-outline"
                            size={24}
                            color={theme.primary}
                        />
                    </View>
                    <View style={styles.accountInfo}>
                        <Text style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.iban}>{account.bankName} • {account.iban}</Text>
                    </View>
                </View>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balance}>
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: account.currency }).format(account.balance)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
