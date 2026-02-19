import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createAccountDetailsStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    balanceLabel: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    iban: {
        fontSize: 14,
        opacity: 0.5,
        fontFamily: 'Monospace', // Optional, if font available
        letterSpacing: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        paddingVertical: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        opacity: 0.8,
        marginTop: 8,
    },
    transactionCard: {
        marginBottom: 2,
        padding: 0,
        borderRadius: 0,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        opacity: 0.6,
    }
});
