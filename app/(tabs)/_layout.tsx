import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { active: 'pie-chart', inactive: 'pie-chart-outline', label: 'الرئيسية' },
  records: { active: 'wallet', inactive: 'wallet-outline', label: 'السجلات' },
  debts: { active: 'people', inactive: 'people-outline', label: 'الديون' },
  settings: { active: 'settings', inactive: 'settings-outline', label: 'الإعدادات' },
};

export default function TabLayout() {
  const { colors, mode } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const def = ICONS[route.name] || ICONS.index;
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
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              {Platform.OS !== 'web' ? (
                <BlurView intensity={70} tint={mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              ) : null}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSurfaceStrong, borderTopWidth: 1, borderTopColor: colors.glassBorder }]} />
            </View>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? def.active : def.inactive} size={size ?? 22} color={color} />
          ),
          tabBarLabel: def.label,
        };
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="debts" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
