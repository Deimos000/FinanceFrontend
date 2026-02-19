import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createAccountCardStyles = (theme: typeof Colors.light) => StyleSheet.create({
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
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    accountInfo: {
        justifyContent: 'center'
    },
    accountName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    iban: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.7,
        color: theme.icon,
    },
    balanceContainer: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
});
