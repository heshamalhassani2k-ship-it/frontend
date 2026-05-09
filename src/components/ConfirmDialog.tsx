import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import GlassCard from './GlassCard';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  destructive?: boolean;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  visible, title, message, destructive, confirmText = 'تأكيد', cancelText = 'إلغاء',
  onCancel, onConfirm,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <GlassCard style={{ width: '88%', maxWidth: 420 }} testID="confirm-dialog">
          <View style={{ padding: 22 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {message ? <Text style={[styles.msg, { color: colors.textSecondary }]}>{message}</Text> : null}
            <View style={styles.actions}>
              <Pressable testID="confirm-cancel-btn" onPress={onCancel} style={[styles.btn, { borderColor: colors.divider, borderWidth: 1 }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{cancelText}</Text>
              </Pressable>
              <Pressable testID="confirm-ok-btn" onPress={onConfirm} style={[styles.btn, { backgroundColor: destructive ? colors.accentDebt : colors.accentBrand }]}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{confirmText}</Text>
              </Pressable>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'right' },
  msg: { fontSize: 14, marginTop: 10, lineHeight: 22, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', gap: 12, marginTop: 22 },
  btn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
});
