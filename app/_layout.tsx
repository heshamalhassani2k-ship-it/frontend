/**
 * Root Layout - Global app structure and providers
 * Sets up all context providers, RTL, and navigation
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { ToastProvider } from '../src/components/Toast';
import { DataProvider } from '../src/store/DataProvider';
import { SecurityProvider } from '../src/store/SecurityProvider';

/**
 * Setup RTL for the entire app (native only)
 * Web handles RTL through CSS/html dir attribute
 */
if (Platform.OS !== 'web') {
  if (!I18nManager.isRTL) {
    try {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    } catch (error) {
      console.debug('RTL setup failed:', error);
    }
  }
}

/**
 * Status bar component that syncs with current theme
 */
function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

/**
 * Root layout component
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DataProvider>
            <SecurityProvider>
              <ToastProvider>
                <ThemedStatusBar />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    animationEnabled: true,
                  }}
                >
                  {/* Tab navigation */}
                  <Stack.Screen name="(tabs)" />

                  {/* Financial record detail */}
                  <Stack.Screen
                    name="record/[id]"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />

                  {/* Debt person detail */}
                  <Stack.Screen
                    name="debt/[personId]/index"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />

                  {/* Debt folder detail */}
                  <Stack.Screen
                    name="debt/[personId]/[folderId]"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                </Stack>
              </ToastProvider>
            </SecurityProvider>
          </DataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
