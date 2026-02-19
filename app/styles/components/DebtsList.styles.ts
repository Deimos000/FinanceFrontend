import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createDebtsListStyles = (theme: typeof Colors.light) => StyleSheet.create({
    card: {
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        backgroundColor: theme.cardBackground,
    },
    cardHeader: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    desc: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
    subtext: {
        fontSize: 12,
        marginTop: 2,
        color: theme.icon,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    amount: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    expandedContent: {
        padding: 12,
        borderTopWidth: 1,
        backgroundColor: theme.background,
        borderTopColor: theme.border,
    },
    originalAmount: {
        fontSize: 12,
        marginBottom: 10,
        color: theme.icon,
    },
    subList: {
        marginBottom: 12
    },
    subRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    subNote: {
        fontSize: 13,
        color: theme.icon,
    },
    subAmount: {
        fontSize: 13,
        color: theme.secondary,
    },
    addContainer: {
        flexDirection: 'row',
        gap: 8
    },
    input: {
        flex: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 36,
        backgroundColor: theme.cardBackground,
        color: theme.text,
        borderColor: theme.border,
        borderWidth: 1,
        fontSize: 14
    },
    addBtn: {
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderRadius: 8,
        height: 36,
        backgroundColor: theme.primary,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
        color: theme.icon,
    }
});
