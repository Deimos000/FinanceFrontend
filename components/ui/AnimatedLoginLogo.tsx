import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface AnimatedLoginLogoProps {
    readonly size?: number;
    readonly color1?: string;
    readonly color2?: string;
    readonly style?: ViewStyle;
}

const CURRENCIES = ['$', '€', '£', '¥', '₿', '₹'];

export default function AnimatedLoginLogo({
    size = 140,
    color1 = '#ffffff',
    color2 = '#a855f7',
    style
}: AnimatedLoginLogoProps) {
    const ringSize = size * 0.65;
    const ringBorderWidth = (4 / 140) * size;
    const innerIconSize = size * 0.12;

    const [currencyIndex, setCurrencyIndex] = useState(0);
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease)
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease)
                })
            ]).start();

            // Change symbol halfway through the animation (when invisible)
            setTimeout(() => {
                setCurrencyIndex((prev) => (prev + 1) % CURRENCIES.length);
            }, 400);

        }, 3500); // change every 3.5 seconds

        return () => clearInterval(interval);
    }, [opacity]);

    return (
        <View style={[styles.container, { width: size, height: size * 0.75 }, style]}>
            {/* Left Ring */}
            <View style={[
                styles.ring,
                {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    borderColor: color1,
                    borderWidth: ringBorderWidth,
                    left: size * 0.05,
                    shadowColor: color1,
                }
            ]} />

            {/* Right Ring */}
            <View style={[
                styles.ring,
                {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    borderColor: color2,
                    borderWidth: ringBorderWidth,
                    right: size * 0.05,
                    shadowColor: color2,
                }
            ]} />

            {/* Background Icons - Inside Left Ring */}
            <View style={[styles.iconContainer, { left: size * 0.18, top: size * 0.16 }]}>
                <Ionicons name="trending-up" size={innerIconSize} color="rgba(255,255,255,0.4)" />
            </View>
            <View style={[styles.iconContainer, { left: size * 0.18, bottom: size * 0.16 }]}>
                <Ionicons name="bar-chart-outline" size={innerIconSize} color="rgba(255,255,255,0.4)" />
            </View>

            {/* Background Icons - Inside Right Ring */}
            <View style={[styles.iconContainer, { right: size * 0.18, top: size * 0.16 }]}>
                <FontAwesome5 name="coins" size={innerIconSize * 0.85} color="rgba(168,85,247,0.5)" />
            </View>
            <View style={[styles.iconContainer, { right: size * 0.18, bottom: size * 0.16 }]}>
                <FontAwesome5 name="piggy-bank" size={innerIconSize * 0.85} color="rgba(168,85,247,0.5)" />
            </View>

            {/* Center Animated Text */}
            <Animated.Text style={[
                styles.centerSymbol,
                {
                    fontSize: size * 0.40,
                    opacity: opacity,
                    textShadowColor: '#4ade80',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 15,
                    color: '#67e8f9' // cyan-300
                }
            ]}>
                {CURRENCIES[currencyIndex]}
            </Animated.Text>
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
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 5,
    },
    iconContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerSymbol: {
        fontWeight: 'bold',
        position: 'absolute',
        textAlign: 'center',
        zIndex: 10,
    }
});
