import { Dimensions, Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const createAddDebtModalStyles = (theme: typeof Colors.light) => StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.55,
        paddingBottom: 34,
        backgroundColor: theme.cardBackground,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.icon,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    headerBtn: {
        width: 36,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: theme.text,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16
    },
    row: {
        flexDirection: 'row',
        gap: 8
    },
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 15,
        borderWidth: 0,
        backgroundColor: theme.background,
        color: theme.text,
    },
    addBtn: {
        paddingHorizontal: 18,
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: theme.primary,
    },
    addBtnDisabled: {
        backgroundColor: theme.border
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    label: {
        fontSize: 13,
        marginBottom: 10,
        marginTop: 14,
        color: theme.icon,
    },
    peopleScroll: {
        maxHeight: 180
    },
    personItem: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: theme.background,
    },
    personName: {
        fontSize: 15,
        color: theme.text,
    },
    typeToggle: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        backgroundColor: theme.background,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10
    },
    typeOptionActive: {
        backgroundColor: theme.primary,
    },
    typeText: {
        fontWeight: '600',
        fontSize: 14,
        color: theme.icon,
    },
    typeTextActive: {
        color: '#fff',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 12,
        backgroundColor: theme.background,
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: '600',
        paddingVertical: 14,
        borderWidth: 0,
        color: theme.text,
    },
    currency: {
        fontSize: 22,
        fontWeight: '500',
        color: theme.icon,
    },
    submitBtn: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: theme.primary,
    },
    submitBtnDisabled: {
        backgroundColor: theme.border
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
