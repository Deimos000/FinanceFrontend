import { Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const createCardStyles = (theme: typeof Colors.light) => StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    elevated: {
        backgroundColor: theme.cardBackground,
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
            }
        })
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.border,
    },
    flat: {
        backgroundColor: theme.cardBackground,
    }
});
