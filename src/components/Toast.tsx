import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const { colors } = useTheme();

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setItems(prev => [...prev, { id, message, variant }]);
    if (Platform.OS !== 'web') {
      try {
        const map = {
          success: Haptics.NotificationFeedbackType.Success,
          error: Haptics.NotificationFeedbackType.Error,
          warning: Haptics.NotificationFeedbackType.Warning,
          info: Haptics.NotificationFeedbackType.Success,
        } as const;
        Haptics.notificationAsync(map[variant]);
      } catch {}
    }
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 2600);
  }, []);

  const ctx: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
    warning: (m) => show(m, 'warning'),
  };

  const variantColor = (v: ToastVariant) => v === 'success' ? colors.accentIncome
    : v === 'error' ? colors.accentDebt
    : v === 'warning' ? colors.accentWarning
    : colors.accentBrand;

  const variantIcon = (v: ToastVariant): keyof typeof Ionicons.glyphMap => v === 'success' ? 'checkmark-circle'
    : v === 'error' ? 'close-circle'
    : v === 'warning' ? 'warning'
    : 'information-circle';

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <View pointerEvents="none" style={styles.host}>
        {items.map((it) => (
          <ToastView
            key={it.id}
            color={variantColor(it.variant)}
            icon={variantIcon(it.variant)}
            message={it.message}
            bg={colors.glassSurfaceStrong}
            border={colors.glassBorder}
            text={colors.textPrimary}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ color, icon, message, bg, border, text }: { color: string; icon: keyof typeof Ionicons.glyphMap; message: string; bg: string; border: string; text: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, ty]);
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, borderColor: border, opacity, transform: [{ translateY: ty }] }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Ionicons name={icon} size={20} color={color} style={{ marginHorizontal: 8 }} />
      <Text style={[styles.msg, { color: text }]} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999, gap: 10, alignItems: 'stretch' },
  toast: {
    flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  dot: { width: 6, height: 30, borderRadius: 3 },
  msg: { flex: 1, fontSize: 14, fontWeight: '700', textAlign: 'right' },
});
