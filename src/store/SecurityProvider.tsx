import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const SETTINGS_KEY = '@security:settings';

export type ProtectedAction = 'deleteRecord' | 'deletePerson' | 'editCap';

interface SecuritySettings {
  enabled: boolean;
  protected: Record<ProtectedAction, boolean>;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  enabled: false,
  protected: { deleteRecord: true, deletePerson: true, editCap: true },
};

interface SecurityContextValue extends SecuritySettings {
  ready: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  setEnabled: (v: boolean) => Promise<boolean>;
  setProtected: (action: ProtectedAction, v: boolean) => Promise<void>;
  authenticate: (action: ProtectedAction, reason?: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          const hw = await LocalAuthentication.hasHardwareAsync();
          const en = await LocalAuthentication.isEnrolledAsync();
          setHasHardware(hw); setIsEnrolled(en);
        }
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({
            enabled: !!parsed.enabled,
            protected: { ...DEFAULT_SETTINGS.protected, ...(parsed.protected || {}) },
          });
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const persist = useCallback(async (s: SecuritySettings) => {
    setSettings(s);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }, []);

  const authenticate = useCallback(async (action: ProtectedAction, reason?: string): Promise<boolean> => {
    // If feature disabled or not protected for action, allow
    if (!settings.enabled || !settings.protected[action]) return true;
    if (Platform.OS === 'web') {
      // No biometric on web; rely on confirm dialog only
      return true;
    }
    if (!hasHardware || !isEnrolled) {
      Alert.alert('البصمة غير متاحة', 'لم يتم تسجيل بصمة على الجهاز. يرجى تفعيلها من إعدادات النظام أو تعطيل الحماية بالبصمة.');
      return false;
    }
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'يرجى التحقق بالبصمة لإتمام هذا الإجراء',
        fallbackLabel: 'استخدم رمز PIN',
        cancelLabel: 'إلغاء',
        disableDeviceFallback: false,
      });
      return !!res.success;
    } catch {
      return false;
    }
  }, [settings, hasHardware, isEnrolled]);

  const setEnabled = useCallback(async (v: boolean): Promise<boolean> => {
    if (v) {
      if (Platform.OS === 'web') {
        Alert.alert('غير مدعوم', 'البصمة غير متاحة على الويب. ستتم حماية بسيطة على الجهاز فقط.');
      } else if (!hasHardware) {
        Alert.alert('غير مدعوم', 'هذا الجهاز لا يدعم البصمة.');
        return false;
      } else if (!isEnrolled) {
        Alert.alert('لم يتم تسجيل بصمة', 'يرجى تسجيل بصمتك من إعدادات النظام أولاً.');
        return false;
      } else {
        // Verify before enabling
        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: 'تحقق بالبصمة لتفعيل الحماية',
          cancelLabel: 'إلغاء',
        });
        if (!res.success) return false;
      }
    }
    await persist({ ...settings, enabled: v });
    return true;
  }, [settings, hasHardware, isEnrolled, persist]);

  const setProtected = useCallback(async (action: ProtectedAction, v: boolean) => {
    await persist({ ...settings, protected: { ...settings.protected, [action]: v } });
  }, [settings, persist]);

  const value = useMemo<SecurityContextValue>(() => ({
    ...settings, ready, hasHardware, isEnrolled,
    setEnabled, setProtected, authenticate,
  }), [settings, ready, hasHardware, isEnrolled, setEnabled, setProtected, authenticate]);

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
}
