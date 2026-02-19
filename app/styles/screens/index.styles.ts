import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createHomeStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        color: theme.text,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.icon,
        marginBottom: 4,
    },
    profileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    scrollContent: {
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: theme.text,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        minHeight: 100,
        justifyContent: 'space-between',
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden'
    },
    cardIcon: {
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    cardLabel: {
        fontSize: 12,
        color: theme.icon,
        marginTop: 4,
    },
    quickAction: {
        alignItems: 'center',
        width: 70,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
        borderWidth: 1,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        color: theme.text,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.icon,
        marginTop: 10
    },
    // New styles for grouped transactions
    dateHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.icon,
        marginTop: 20,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    transactionGroup: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
    }
});
