import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createTransactionsStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        color: theme.text,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        color: theme.text,
    },
    accountScroll: {
        marginTop: 10,
    },
    accountScrollContent: {
        gap: 12,
        paddingRight: 20,
    },
    accountCard: {
        width: 160,
        height: 100,
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: theme.border,
    },
    accountName: {
        color: theme.text,
        fontWeight: '600',
        fontSize: 13,
        opacity: 0.8,
    },
    accountIban: {
        color: theme.icon,
        fontSize: 10,
        marginBottom: 4,
    },
    accountBalance: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    emptyAccountCard: {
        width: 160,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        borderStyle: 'dashed',
    },
    emptyText: {
        color: theme.icon,
        fontSize: 12,
    },
    transactionsList: {
        marginTop: 24,
    },
    noTransactionsText: {
        textAlign: 'center',
        color: theme.icon,
        marginTop: 40,
        fontSize: 16,
    }
});
