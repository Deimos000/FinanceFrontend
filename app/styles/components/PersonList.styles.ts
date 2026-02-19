import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createPersonListStyles = (theme: typeof Colors.light) => StyleSheet.create({
    card: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: theme.primary,
    },
    iconText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        color: theme.text,
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    balanceLabel: {
        fontSize: 11,
        marginTop: 2,
        color: theme.icon,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
        color: theme.icon,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
        color: theme.danger
    }
});
