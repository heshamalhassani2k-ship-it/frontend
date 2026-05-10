/**
 * Tab Layout - Bottom tab navigation for main screens
 * Uses glassmorphism design with proper RTL support
 */

import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';

/**
 * Tab configuration - supports RTL automatically
 */
const TABS = [
  {
    name: 'index',
    icon: { active: 'pie-chart', inactive: 'pie-chart-outline' } as const,
    label: 'الرئيسية',
  },
  {
    name: 'records',
    icon: { active: 'wallet', inactive: 'wallet-outline' } as const,
    label: 'السجلات',
  },
  {
    name: 'debts',
    icon: { active: 'people', inactive: 'people-outline' } as const,
    label: 'الديون',
  },
  {
    name: 'settings',
    icon: { active: 'settings', inactive: 'settings-outline' } as const,
    label: 'الإعدادات',
  },
];

export default function TabLayout() {
  const { colors, mode } = useTheme();

  // Pre-compute icon configuration for better performance
  const tabConfig = useMemo(() => {
    const config: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap; label: string }> = {};
    TABS.forEach((tab) => {
      config[tab.name] = {
        active: tab.icon.active,
        inactive: tab.icon.inactive,
        label: tab.label,
      };
    });
    return config;
  }, []);

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tabInfo = tabConfig[route.name];
        const icon = tabInfo || tabConfig.index;

        return {
          headerShown: false,
          tabBarActiveTintColor: colors.accentBrand,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: Platform.OS === 'ios' ? 0 : 2,
          },
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              {/* Blur effect (skip on web) */}
              {Platform.OS !== 'web' && (
                <BlurView
                  intensity={70}
                  tint={mode === 'dark' ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
              )}
              {/* Glass surface background */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: colors.glassSurfaceStrong,
                    borderTopWidth: 1,
                    borderTopColor: colors.glassBorder,
                  },
                ]}
              />
            </View>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={size ?? 22}
              color={color}
            />
          ),
          tabBarLabel: icon.label,
        };
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'السجلات',
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'الديون',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الإعدادات',
        }}
      />
    </Tabs>
  );
}
