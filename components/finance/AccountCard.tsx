import { BankAccount } from '@/hooks/useBankData';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { createAccountCardStyles } from '@/app/styles/components/AccountCard.styles';

interface AccountCardProps {
    account: BankAccount;
    onPress: (account: BankAccount) => void;
    onDelete?: (account: BankAccount) => void;
}

export function AccountCard({ account, onPress, onDelete }: AccountCardProps) {
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createAccountCardStyles(theme), [theme]);

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(account)}
            activeOpacity={0.75}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.balanceContainer}>
                        <Text style={styles.balance}>
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: account.currency }).format(account.balance)}
                        </Text>
                    </View>
                    {onDelete && (
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); onDelete(account); }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{
                                width: 30, height: 30, borderRadius: 8,
                                backgroundColor: theme.danger + '20',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="trash-outline" size={15} color={theme.danger} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
