/**
 * Global Theme Provider
 * Manages light/dark mode toggle and RTL setup
 * Persists theme preference to AsyncStorage
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import { palette, ThemeMode, ThemeColors } from './colors';

const THEME_KEY = '@app:theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  // Initialize RTL on native platforms only (web handles RTL via CSS/dir attribute)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (!I18nManager.isRTL) {
        try {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(true);
        } catch (error) {
          // Silently fail if RTL forcing is not supported
          console.debug('RTL setup skipped:', error);
        }
      }
    }
  }, []);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
      } catch (error) {
        console.debug('Failed to load theme preference:', error);
      } finally {
        setReady(true);
      }
    };

    loadTheme();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch((error) => {
      console.debug('Failed to persist theme:', error);
    });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'light' ? palette.light : palette.dark,
      toggleMode,
      setMode,
      ready,
    }),
    [mode, toggleMode, setMode, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
