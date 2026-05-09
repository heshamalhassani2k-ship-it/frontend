import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { ToastProvider } from '../src/components/Toast';
import { DataProvider } from '../src/store/DataProvider';
import { SecurityProvider } from '../src/store/SecurityProvider';

if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch {}
}

function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DataProvider>
            <SecurityProvider>
              <ToastProvider>
                <ThemedStatusBar />
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="record/[id]" />
                  <Stack.Screen name="debt/[personId]/index" />
                  <Stack.Screen name="debt/[personId]/[folderId]" />
                </Stack>
              </ToastProvider>
            </SecurityProvider>
          </DataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
