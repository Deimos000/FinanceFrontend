import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useColorScheme, View, TouchableOpacity } from 'react-native';

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
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

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
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                        <Text style={[styles.subtitle, { color: theme.icon }]} numberOfLines={1}>{subtitle}</Text>
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
                <Text style={[styles.date, { color: theme.icon }]}>{date}</Text>
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

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
    },
    right: {
        alignItems: 'flex-end',
        minWidth: 100,
        flexShrink: 0,
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
    },
});
