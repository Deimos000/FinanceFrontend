import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface LogoProps {
    size?: number;
    color1?: string;
    color2?: string;
    style?: ViewStyle;
}

export default function Logo({
    size = 40,
    color1 = '#ffffff',
    color2 = '#9333ea',
    style
}: LogoProps) {
    const ringSize = size * 0.625; // 50/80 ratio from login.tsx
    const ringBorderWidth = (3 / 50) * ringSize; // Maintain thickness ratio

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <View style={[
                styles.ring,
                {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    borderColor: color1,
                    borderWidth: ringBorderWidth,
                    left: size * 0.0625, // 5/80 ratio
                }
            ]} />
            <View style={[
                styles.ring,
                {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    borderColor: color2,
                    borderWidth: ringBorderWidth,
                    right: size * 0.0625, // 5/80 ratio
                }
            ]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring: {
        position: 'absolute',
        // Shadow remains consistent with the original design
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
    },
});
