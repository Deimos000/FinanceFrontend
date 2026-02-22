import { Colors } from '@/constants/Colors';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { useTheme } from '@/context/ThemeContext';

interface BalanceCardProps {
    balance: number;
    currency?: string;
    percentageChange?: number;
}

export function BalanceCard({ balance, currency = '$', percentageChange }: BalanceCardProps) {
    const { colors: theme } = useTheme();

    const isPositive = (percentageChange || 0) >= 0;

    return (
        <Card style={styles.container}>
            <View>
                <Text style={[styles.label, { color: theme.icon }]}>Total Balance</Text>
                <Text style={[styles.amount, { color: theme.text }]}>
                    {currency}{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
            </View>

            {percentageChange !== undefined && (
                <View style={[styles.badge, { backgroundColor: isPositive ? theme.secondary + '20' : theme.danger + '20' }]}>
                    <Text style={[styles.change, { color: isPositive ? theme.secondary : theme.danger }]}>
                        {isPositive ? '+' : ''}{percentageChange}%
                    </Text>
                </View>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        opacity: 0.8,
    },
    amount: {
        fontSize: 32,
        fontWeight: '700',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    change: {
        fontWeight: '600',
        fontSize: 14,
    },
});
