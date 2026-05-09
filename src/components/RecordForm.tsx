import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import GlassCard from './GlassCard';
import FormField from './FormField';
import AppButton from './AppButton';
import IconColorPicker from './IconColorPicker';
import { FinancialRecord, RecordType } from '../types';
import { useToast } from './Toast';

interface RecordFormProps {
  visible: boolean;
  initial?: Partial<FinancialRecord>;
  onCancel: () => void;
  onSubmit: (data: Omit<FinancialRecord, 'id' | 'createdAt' | 'order'>) => Promise<void> | void;
}

export default function RecordForm({ visible, initial, onCancel, onSubmit }: RecordFormProps) {
  const { colors } = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<RecordType>('cumulative');
  const [capAmount, setCapAmount] = useState('');
  const [color, setColor] = useState('#0284C7');
  const [icon, setIcon] = useState<keyof typeof Ionicons.glyphMap>('wallet');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setName(initial?.name || '');
      setType((initial?.type as RecordType) || 'cumulative');
      setCapAmount(initial?.capAmount ? String(initial.capAmount) : '');
      setColor(initial?.color || '#0284C7');
      setIcon((initial?.icon as keyof typeof Ionicons.glyphMap) || 'wallet');
      setDescription(initial?.description || '');
      setErrors({});
    }
  }, [visible, initial]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'الاسم مطلوب';
    if (type === 'capped') {
      const v = Number(capAmount);
      if (!capAmount || isNaN(v) || v <= 0) e.capAmount = 'سقف صحيح موجب مطلوب';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error('يرجى تصحيح الحقول');
      return;
    }
    await onSubmit({
      name: name.trim(),
      type,
      capAmount: type === 'capped' ? Number(capAmount) : undefined,
      color,
      icon: String(icon),
      description: description.trim() || undefined,
      archived: initial?.archived || false,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <GlassCard style={styles.sheet} testID="record-form">
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{initial?.id ? 'تعديل سجل' : 'سجل مالي جديد'}</Text>
              <Pressable testID="close-record-form" onPress={onCancel}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormField label="اسم السجل" required value={name} onChangeText={setName} error={errors.name} placeholder="مثال: مصاريف شهر مارس" testID="record-name-input" />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>نوع السجل</Text>
              <View style={styles.segment}>
                {[
                  { id: 'cumulative', label: 'تراكمي' },
                  { id: 'capped', label: 'بسقف' },
                ].map((opt) => (
                  <Pressable
                    key={opt.id}
                    testID={`record-type-${opt.id}`}
                    onPress={() => setType(opt.id as RecordType)}
                    style={[styles.segItem, { backgroundColor: type === opt.id ? colors.accentBrand : 'transparent', borderColor: colors.glassBorder }]}
                  >
                    <Text style={{ color: type === opt.id ? '#fff' : colors.textPrimary, fontWeight: '800' }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
              {type === 'capped' && (
                <FormField label="سقف المبلغ" required keyboardType="numeric" value={capAmount} onChangeText={setCapAmount} error={errors.capAmount} placeholder="مثال: 5000" testID="record-cap-input" />
              )}
              <View style={{ marginVertical: 6 }}>
                <IconColorPicker color={color} icon={icon} onChangeColor={setColor} onChangeIcon={setIcon} />
              </View>
              <FormField label="الوصف" value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="ملاحظات إضافية..." testID="record-desc-input" style={{ minHeight: 80, textAlignVertical: 'top' }} />
              <View style={{ flexDirection: 'row-reverse', gap: 12, marginTop: 8 }}>
                <AppButton title={initial?.id ? 'حفظ التعديلات' : 'إضافة'} onPress={submit} icon="checkmark" full style={{ flex: 1 }} testID="record-submit-btn" />
                <AppButton title="إلغاء" onPress={onCancel} variant="ghost" style={{ flex: 1 }} testID="record-cancel-btn" />
              </View>
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', borderRadius: 0, borderTopWidth: 1 },
  handle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#94A3B8', marginTop: 10, opacity: 0.5 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'right' },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  segment: { flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1 },
});
