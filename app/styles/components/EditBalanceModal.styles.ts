import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createEditBalanceModalStyles = (theme: typeof Colors.light) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: theme.cardBackground,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    description: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
        color: theme.icon,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.text,
    },
    input: {
        fontSize: 18,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        color: theme.text,
        backgroundColor: theme.background,
        borderColor: theme.border,
    },
    saveButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: theme.primary,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});
