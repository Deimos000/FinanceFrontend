import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createSettingsStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 12,
        textTransform: 'uppercase',
        opacity: 0.7,
        letterSpacing: 0.5,
    },
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
        marginLeft: 50, // Indent divider to align with text
    },
    versionText: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
        fontSize: 12,
    }
});
