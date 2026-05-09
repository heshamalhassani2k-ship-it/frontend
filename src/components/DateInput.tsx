import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { formatShortDate } from '../utils/format';
import GlassCard from './GlassCard';
import AppButton from './AppButton';

let DateTimePicker: any = null;
try {
  if (Platform.OS !== 'web') {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  }
} catch {}

interface DateInputProps {
  label: string;
  value: string; // ISO
  onChange: (iso: string) => void;
  required?: boolean;
  testID?: string;
}

export default function DateInput({ label, value, onChange, required, testID }: DateInputProps) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  // For web: text input fallback. For native: native picker.
  const date = value ? new Date(value) : new Date();

  const onAndroidChange = (event: any, selected?: Date) => {
    setShow(false);
    if (event?.type === 'dismissed') return;
    if (selected) onChange(selected.toISOString());
  };

  const onIosConfirm = (selected: Date) => {
    onChange(selected.toISOString());
    setShow(false);
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}{required ? <Text style={{ color: colors.accentDebt }}>  *</Text> : null}
      </Text>
      {Platform.OS === 'web' ? (
        <View style={[styles.box, { backgroundColor: colors.inputBg, borderColor: colors.glassBorder }]}>
          {/* @ts-ignore */}
          <TextInput
            testID={testID}
            value={value ? value.slice(0, 10) : ''}
            onChangeText={(t) => {
              const iso = new Date(t).toISOString();
              if (!isNaN(new Date(t).getTime())) onChange(iso);
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            // @ts-ignore web only
            type="date"
            style={[styles.input, { color: colors.textPrimary }]}
          />
        </View>
      ) : (
        <Pressable testID={testID} onPress={() => setShow(true)} style={[styles.box, { backgroundColor: colors.inputBg, borderColor: colors.glassBorder }]}>
          <Text style={[styles.txt, { color: value ? colors.textPrimary : colors.textMuted }]}>
            {value ? formatShortDate(value) : 'اختر التاريخ'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginEnd: 8 }} />
        </Pressable>
      )}

      {show && Platform.OS === 'android' && DateTimePicker ? (
        <DateTimePicker value={date} mode="date" onChange={onAndroidChange} />
      ) : null}
      {show && Platform.OS === 'ios' && DateTimePicker ? (
        <Modal visible transparent animationType="fade">
          <View style={styles.overlay}>
            <GlassCard style={{ width: '90%' }}>
              <View style={{ padding: 16, alignItems: 'center' }}>
                <DateTimePicker value={date} mode="date" display="spinner"
                  onChange={(_: any, d?: Date) => d && onChange(d.toISOString())} />
                <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 12 }}>
                  <AppButton title="تم" onPress={() => onIosConfirm(new Date(value || date))} />
                </View>
              </View>
            </GlassCard>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  box: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  txt: { fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'right' },
  input: { fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'right', outlineWidth: 0 as any, borderWidth: 0 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
});
