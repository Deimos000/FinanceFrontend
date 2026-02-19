import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export const createStatisticsStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: 20
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: theme.background,
        // Shadow for emphasis
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
    scrollContent: {
        paddingBottom: 40,
    },
    chartCard: {
        marginBottom: 24,
        padding: 20,
        borderRadius: 24,
        backgroundColor: theme.cardBackground,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    periodToggle: {
        flexDirection: 'row',
        gap: 8,
    },
    periodBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: theme.background,
    },
    periodBtnActive: {
        backgroundColor: theme.primary,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text,
    },
    periodTextActive: {
        color: '#fff',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
        color: theme.icon,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
    },
    insightCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
    },
    insightIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: theme.background,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: theme.text,
    },
    insightDesc: {
        fontSize: 13,
        lineHeight: 18,
        color: theme.icon,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.icon,
        marginTop: 20
    }
});
