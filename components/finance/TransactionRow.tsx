import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { createTransactionRowStyles } from '@/app/styles/components/TransactionRow.styles';

interface TransactionRowProps {
    id: string;
    title: string;
    subtitle?: string;
    amount: number;
    date: string;
    icon?: keyof typeof Ionicons.glyphMap;
    categoryColor?: string;
    currency?: string;
    lastItem?: boolean;
    onPress?: () => void;
}

// Transaction Element

export function TransactionRow({ title, subtitle, amount, date, icon, categoryColor, currency = '$', lastItem, onPress }: TransactionRowProps) {
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createTransactionRowStyles(theme), [theme]);

    const isExpense = amount < 0;

    const content = (
        <View style={[
            styles.container,
            !lastItem && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }
        ]}>
            <View style={styles.left}>
                <View style={[styles.iconContainer, { backgroundColor: categoryColor || theme.border }]}>
                    <Ionicons name={icon || 'wallet-outline'} size={24} color="#FFF" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.right}>
                <Text style={[
                    styles.amount,
                    { color: isExpense ? theme.text : theme.secondary }
                ]}>
                    {isExpense ? '' : '+ '}{currency}{Math.abs(amount).toFixed(2)}
                </Text>
                <Text style={styles.date}>{date}</Text>
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}
