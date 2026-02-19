import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createFinanceStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    },
    dateBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    dateBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    chartCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 24,
        width: '100%',
        textAlign: 'left',
        color: theme.text,
    },
    chartCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.text,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.icon,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: theme.text,
    }
});
