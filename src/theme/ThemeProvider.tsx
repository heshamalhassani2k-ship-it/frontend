import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
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

  useEffect(() => {
    // Force RTL globally
    if (!I18nManager.isRTL) {
      try {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      } catch {}
    }
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setModeState(stored);
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  };

  const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    colors: mode === 'light' ? palette.light : palette.dark,
    toggleMode,
    setMode,
    ready,
  }), [mode, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
