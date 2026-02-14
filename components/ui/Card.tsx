import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ style, variant = 'elevated', ...otherProps }: CardProps) {
    const { colors } = useTheme();

    const getVariantStyle = () => {
        switch (variant) {
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.border,
                };
            case 'flat':
                return {
                    backgroundColor: colors.cardBackground,
                };
            case 'elevated':
            default:
                return {
                    backgroundColor: colors.cardBackground,
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
                };
        }
    };

    return (
        <View
            style={[
                styles.card,
                getVariantStyle(),
                style,
            ]}
            {...otherProps}
        />
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
});
