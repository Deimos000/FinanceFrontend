import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createAccountsStyles = (theme: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    errorContainer: {
        alignItems: 'center',
        marginBottom: 20,
        padding: 16,
        backgroundColor: 'rgba(255,59,48,0.1)',
        borderRadius: 12,
    },
    errorText: {
        fontSize: 14,
        marginBottom: 8,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionsContainer: {
        marginBottom: 24,
        gap: 12,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        opacity: 0.7,
        lineHeight: 24,
    },
    manualContainer: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    helperText: {
        fontSize: 14,
        marginBottom: 16,
        opacity: 0.7,
        lineHeight: 20,
    }
});
