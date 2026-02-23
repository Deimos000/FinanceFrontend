import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createSettingsStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
    },
    // Mobile Content
    content: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 150,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
        fontSize: 12,
    },

    // Mobile Accordion
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    accordionHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    accordionTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    accordionContent: {
        marginBottom: 16,
        overflow: 'hidden',
    },

    // Cards
    card: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: 16,
        borderWidth: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    settingLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 50,
    },

    // API Input
    apiInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    input: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        borderWidth: 1,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },

    // Desktop Layout
    desktopContainer: {
        flex: 1,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    desktopMainCard: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        maxWidth: 1200,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    desktopSidebarArea: {
        width: 280,
        padding: 40,
        borderRightWidth: 1,
    },
    desktopSidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    desktopSidebarItemText: {
        fontSize: 15,
        fontWeight: '600',
    },
    desktopContentArea: {
        padding: 40,
        paddingHorizontal: 64,
    },
    desktopContentHeader: {
        fontSize: 32, // Match styles.title
        fontWeight: '800', // Match styles.title
        letterSpacing: -0.5,
        marginBottom: 40,
    }
});
