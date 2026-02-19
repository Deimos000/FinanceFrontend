import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMemo } from 'react';
import { createCardStyles } from '@/app/styles/components/Card.styles';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ style, variant = 'elevated', ...otherProps }: CardProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createCardStyles(colors), [colors]);

    const getVariantStyle = () => {
        switch (variant) {
            case 'outlined':
                return styles.outlined;
            case 'flat':
                return styles.flat;
            case 'elevated':
            default:
                return styles.elevated;
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
