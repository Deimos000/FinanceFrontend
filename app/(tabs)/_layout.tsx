import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import DesktopSidebar from '@/components/DesktopSidebar';

export default function TabLayout() {
  const { colors, theme } = useTheme();
  const isDesktop = useIsDesktop();

  const tabs = (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarShowLabel: !isDesktop,
        tabBarStyle: isDesktop
          ? { display: 'none' as const }
          : {
            backgroundColor: '#4B0082',
            borderTopWidth: 0,
            elevation: 0,
            height: Platform.OS === 'ios' ? 105 : 85,
            paddingBottom: Platform.OS === 'ios' ? 35 : 20,
            paddingTop: 15,
            position: 'absolute' as const,
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            ...(Platform.OS !== 'web' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
            }),
          },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={90}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', backgroundColor: '#4B0082' }]}
              tint="dark"
            />
          ) : null
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={focused ? '#4B0082' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Debts',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={focused ? '#4B0082' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stocks"
        options={{
          title: 'Stocks',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={24} color={focused ? '#4B0082' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={focused ? '#4B0082' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={focused ? '#4B0082' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={focused ? '#4B0082' : color} />
            </View>
          ),
        }}
      />
      {/* Hide these from the tab bar */}
      <Tabs.Screen
        name="finance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <DesktopSidebar />
        <View style={styles.desktopContent}>{tabs}</View>
      </View>
    );
  }

  return tabs;
}

const styles = StyleSheet.create({
  desktopRoot: {
    flexDirection: 'row',
    flex: 1,
    height: '100%' as any,
  },
  desktopContent: {
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  iconContainerFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

