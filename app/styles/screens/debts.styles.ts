import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createDebtsStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        // paddingTop: 60, // Managed by safe area in screen
        backgroundColor: theme.background,
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
        color: theme.text,
        letterSpacing: -0.5,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    oweCard: {
        backgroundColor: 'rgba(255, 69, 58, 0.1)', // theme.danger with opacity
        borderColor: 'rgba(255, 69, 58, 0.2)',
    },
    owedCard: {
        backgroundColor: 'rgba(50, 215, 75, 0.1)', // theme.secondary with opacity
        borderColor: 'rgba(50, 215, 75, 0.2)',
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.icon,
        marginBottom: 2,
    },
    summaryAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        backgroundColor: theme.cardBackground,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: theme.background,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.icon,
    },
    activeTabText: {
        color: theme.text,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20, // Add padding to constrain list width (approx 90% on mobile)
    }
});
