import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from './ui/Logo';

interface NavItem {
    name: string;
    route: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconFocused: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
    { name: 'Home', route: '/', icon: 'home-outline', iconFocused: 'home' },
    { name: 'Debts', route: '/debts', icon: 'people-outline', iconFocused: 'people' },
    { name: 'Stocks', route: '/stocks', icon: 'trending-up-outline', iconFocused: 'trending-up' },
    { name: 'Statistics', route: '/statistics', icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
    { name: 'Accounts', route: '/accounts', icon: 'wallet-outline', iconFocused: 'wallet' },
    { name: 'Settings', route: '/settings', icon: 'person-outline', iconFocused: 'person' },
];

export default function DesktopSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { colors: theme } = useTheme();

    const isActive = (route: string) => {
        if (route === '/') return pathname === '/' || pathname === '/index';
        return pathname.startsWith(route);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBackground, borderRightColor: theme.border }]}>
            {/* Logo / Brand */}
            <View style={styles.brand}>
                <Logo
                    size={32}
                    style={styles.logoCircle}
                />
                <Text style={[styles.brandText, { color: theme.text }]}>Finance</Text>
            </View>

            {/* Navigation */}
            <View style={styles.nav}>
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.route);
                    return (

                        <TouchableOpacity
                            key={item.route}
                            style={[
                                styles.navItem,
                                active && [styles.navItemActive, { shadowColor: theme.primaryLight }],
                            ]}
                            onPress={() => router.navigate(item.route as any)}
                            activeOpacity={0.7}
                        >
                            {active && (
                                <LinearGradient
                                    colors={[theme.primaryLight, theme.primary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                                />
                            )}
                            <Ionicons
                                name={active ? item.iconFocused : item.icon}
                                size={20}
                                color={active ? '#FFFFFF' : theme.icon}
                            />
                            <Text
                                style={[
                                    styles.navLabel,
                                    { color: active ? '#FFFFFF' : theme.icon },
                                    active && styles.navLabelActive,
                                ]}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );

                })}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={[styles.footerDivider, { backgroundColor: theme.border }]} />
                <Text style={[styles.footerVersion, { color: theme.icon }]}>v1.0.2</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 240,
        height: '100%' as any,
        borderRightWidth: 1,
        paddingTop: 20,
        paddingBottom: 20,
        justifyContent: 'flex-start',
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginBottom: 24,
    },
    logoCircle: {
        marginRight: 12,
    },
    brandText: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    nav: {
        flex: 1,
        paddingHorizontal: 12,
        gap: 4,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        position: 'relative',
    },
    navItemActive: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        borderRadius: 2,
        backgroundColor: '#FFFFFF', // This remains white as it is on a primary color gradient
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 5,
    },
    navLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 14,
    },
    navLabelActive: {
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    footerDivider: {
        height: 1,
        marginBottom: 16,
    },
    footerVersion: {
        fontSize: 11,
        textAlign: 'center',
    },
});
