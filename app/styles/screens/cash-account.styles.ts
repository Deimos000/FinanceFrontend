import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createCashAccountStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    balanceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balance: {
        fontSize: 36,
        fontWeight: '800',
    },
    editButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        marginBottom: 30,
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
    },
    list: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    txCard: {
        marginBottom: 0,
        borderRadius: 0,
        elevation: 0,
        backgroundColor: 'transparent'
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
    }
});
