import { Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createTransactionDetailModalStyles = (theme: typeof Colors.light) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredView: {
        width: '100%',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        backgroundColor: theme.cardBackground,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    closeButton: {
        padding: 5,
    },
    mainInfo: {
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    recipient: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        color: theme.text,
    },
    amount: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        opacity: 0.7,
        color: theme.icon,
    },
    separator: {
        height: 1,
        width: '100%',
        marginBottom: 20,
        backgroundColor: theme.border,
    },
    detailsContainer: {
        maxHeight: 200,
    },
    label: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 6,
        opacity: 0.7,
        color: theme.icon,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.text,
    },
    tinyId: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        opacity: 0.5,
        color: theme.icon,
    },
    spacer: {
        height: 20
    }
});
