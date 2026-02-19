import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createTransactionRowStyles = (theme: typeof Colors.light) => StyleSheet.create({
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
        color: theme.text,
    },
    subtitle: {
        fontSize: 13,
        color: theme.icon,
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
        color: theme.icon,
    },
});
