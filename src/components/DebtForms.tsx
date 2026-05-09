import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import GlassCard from './GlassCard';
import FormField from './FormField';
import AppButton from './AppButton';
import IconColorPicker from './IconColorPicker';
import DateInput from './DateInput';
import { DebtPerson, DebtFolder, DebtOperation, DebtOperationType } from '../types';
import { useToast } from './Toast';
import { QUICK_AMOUNTS } from '../utils/constants';

// PersonForm
export function PersonForm({ visible, initial, onCancel, onSubmit }: {
  visible: boolean; initial?: Partial<DebtPerson>;
  onCancel: () => void;
  onSubmit: (d: Omit<DebtPerson, 'id' | 'createdAt' | 'order'>) => Promise<void> | void;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [color, setColor] = useState('#0284C7');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setName(initial?.name || ''); setPhone(initial?.phone || '');
      setColor(initial?.color || '#0284C7'); setNotes(initial?.notes || '');
      setErrors({});
    }
  }, [visible, initial]);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'الاسم مطلوب';
    setErrors(e);
    if (Object.keys(e).length) { toast.error('يرجى تصحيح الحقول'); return; }
    await onSubmit({ name: name.trim(), phone: phone.trim() || undefined, color, notes: notes.trim() || undefined });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={[s.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <GlassCard style={s.sheet} testID="person-form">
            <View style={s.handle} />
            <View style={s.header}>
              <Text style={[s.title, { color: colors.textPrimary }]}>{initial?.id ? 'تعديل شخص' : 'شخص جديد'}</Text>
              <Pressable testID="close-person-form" onPress={onCancel}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormField label="اسم الشخص" required value={name} onChangeText={setName} error={errors.name} placeholder="مثال: أحمد محمد" testID="person-name-input" />
              <FormField label="رقم الهاتف" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="مثال: 05xxxxxxxx" testID="person-phone-input" />
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>اللون</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }} style={{ marginBottom: 14 }}>
                {['#0284C7','#059669','#E11D48','#D97706','#7C3AED','#DB2777','#0D9488','#6366F1','#84CC16','#EA580C'].map((c) => (
                  <Pressable key={c} testID={`person-color-${c}`} onPress={() => setColor(c)}
                    style={[s.colorDot, { backgroundColor: c, borderColor: color === c ? colors.textPrimary : 'transparent' }]} />
                ))}
              </ScrollView>
              <FormField label="ملاحظات" value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} placeholder="ملاحظات حول الشخص..." testID="person-notes-input" />
              <View style={{ flexDirection: 'row-reverse', gap: 12, marginTop: 8 }}>
                <AppButton title={initial?.id ? 'حفظ' : 'إضافة'} onPress={submit} icon="checkmark" full style={{ flex: 1 }} testID="person-submit-btn" />
                <AppButton title="إلغاء" onPress={onCancel} variant="ghost" style={{ flex: 1 }} testID="person-cancel-btn" />
              </View>
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// FolderForm
export function FolderForm({ visible, initial, personId, onCancel, onSubmit }: {
  visible: boolean; initial?: Partial<DebtFolder>; personId: string;
  onCancel: () => void;
  onSubmit: (d: Omit<DebtFolder, 'id' | 'createdAt' | 'order'>) => Promise<void> | void;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0284C7');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setName(initial?.name || ''); setDescription(initial?.description || '');
      setColor(initial?.color || '#0284C7'); setErrors({});
    }
  }, [visible, initial]);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'الاسم مطلوب';
    setErrors(e);
    if (Object.keys(e).length) { toast.error('يرجى تصحيح الحقول'); return; }
    await onSubmit({ personId, name: name.trim(), description: description.trim() || undefined, color });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={[s.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <GlassCard style={s.sheet} testID="folder-form">
            <View style={s.handle} />
            <View style={s.header}>
              <Text style={[s.title, { color: colors.textPrimary }]}>{initial?.id ? 'تعديل سجل' : 'سجل دين جديد'}</Text>
              <Pressable testID="close-folder-form" onPress={onCancel}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormField label="اسم السجل" required value={name} onChangeText={setName} error={errors.name} placeholder="مثال: قرض شخصي" testID="folder-name-input" />
              <FormField label="الوصف" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} testID="folder-desc-input" />
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>اللون</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }} style={{ marginBottom: 14 }}>
                {['#0284C7','#059669','#E11D48','#D97706','#7C3AED','#DB2777','#0D9488','#6366F1','#84CC16','#EA580C'].map((c) => (
                  <Pressable key={c} testID={`folder-color-${c}`} onPress={() => setColor(c)}
                    style={[s.colorDot, { backgroundColor: c, borderColor: color === c ? colors.textPrimary : 'transparent' }]} />
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row-reverse', gap: 12, marginTop: 8 }}>
                <AppButton title={initial?.id ? 'حفظ' : 'إضافة'} onPress={submit} icon="checkmark" full style={{ flex: 1 }} testID="folder-submit-btn" />
                <AppButton title="إلغاء" onPress={onCancel} variant="ghost" style={{ flex: 1 }} testID="folder-cancel-btn" />
              </View>
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// DebtOperationForm
export function DebtOperationForm({ visible, initial, personId, folderId, onCancel, onSubmit }: {
  visible: boolean; initial?: Partial<DebtOperation>; personId: string; folderId: string;
  onCancel: () => void;
  onSubmit: (d: Omit<DebtOperation, 'id' | 'createdAt'>) => Promise<void> | void;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [dueDate, setDueDate] = useState<string>('');
  const [type, setType] = useState<DebtOperationType>('lend');
  const [reminder, setReminder] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setAmount(initial?.amount ? String(initial.amount) : '');
      setDate(initial?.date || new Date().toISOString());
      setDueDate(initial?.dueDate || '');
      setType((initial?.type as DebtOperationType) || 'lend');
      setReminder(!!initial?.reminder);
      setDescription(initial?.description || '');
      setErrors({});
    }
  }, [visible, initial]);

  const submit = async () => {
    const e: Record<string, string> = {};
    const v = Number(amount);
    if (!amount || isNaN(v) || v <= 0) e.amount = 'مبلغ موجب مطلوب';
    if (!date) e.date = 'التاريخ مطلوب';
    setErrors(e);
    if (Object.keys(e).length) { toast.error('يرجى تصحيح الحقول'); return; }
    await onSubmit({
      folderId, personId, amount: Number(amount), date,
      dueDate: dueDate || undefined, type, reminder,
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={[s.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <GlassCard style={s.sheet} testID="debt-op-form">
            <View style={s.handle} />
            <View style={s.header}>
              <Text style={[s.title, { color: colors.textPrimary }]}>{initial?.id ? 'تعديل عملية' : 'عملية جديدة'}</Text>
              <Pressable testID="close-debt-op-form" onPress={onCancel}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>نوع العملية</Text>
              <View style={s.segment}>
                {[
                  { id: 'lend', label: 'إقراض', icon: 'arrow-up-circle' as const, color: colors.accentDebt },
                  { id: 'repay', label: 'سداد', icon: 'arrow-down-circle' as const, color: colors.accentIncome },
                ].map(opt => (
                  <Pressable key={opt.id} testID={`debt-op-type-${opt.id}`} onPress={() => setType(opt.id as DebtOperationType)}
                    style={[s.segItem, { backgroundColor: type === opt.id ? opt.color : 'transparent', borderColor: colors.glassBorder }]}>
                    <Ionicons name={opt.icon} size={18} color={type === opt.id ? '#fff' : opt.color} style={{ marginEnd: 6 }} />
                    <Text style={{ color: type === opt.id ? '#fff' : colors.textPrimary, fontWeight: '800' }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
              <FormField label="المبلغ" required keyboardType="numeric" value={amount} onChangeText={setAmount} error={errors.amount} placeholder="0" testID="debt-op-amount-input" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginBottom: 14 }}>
                {QUICK_AMOUNTS.map(v => (
                  <Pressable key={v} testID={`debt-quick-${v}`} onPress={() => setAmount(String(v))}
                    style={[s.chip, { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{v.toLocaleString('en-US')}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <DateInput label="التاريخ" value={date} onChange={setDate} required testID="debt-op-date" />
              <DateInput label="تاريخ الاستحقاق (اختياري)" value={dueDate} onChange={setDueDate} testID="debt-op-due" />
              <View style={[s.row, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>تذكير بالاستحقاق</Text>
                <Pressable testID="debt-reminder-toggle" onPress={() => setReminder(v => !v)}
                  style={[s.toggle, { backgroundColor: reminder ? colors.accentBrand : colors.divider }]}>
                  <View style={[s.toggleDot, { transform: [{ translateX: reminder ? -20 : 0 }] }]} />
                </Pressable>
              </View>
              <FormField label="البيان / التفاصيل" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} testID="debt-op-desc" />
              <View style={{ flexDirection: 'row-reverse', gap: 12, marginTop: 8 }}>
                <AppButton title={initial?.id ? 'حفظ' : 'إضافة'} onPress={submit} icon="checkmark" full style={{ flex: 1 }} testID="debt-op-submit-btn" />
                <AppButton title="إلغاء" onPress={onCancel} variant="ghost" style={{ flex: 1 }} testID="debt-op-cancel-btn" />
              </View>
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', borderRadius: 0, borderTopWidth: 1 },
  handle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#94A3B8', marginTop: 10, opacity: 0.5 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'right' },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  toggle: { width: 50, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center', alignItems: 'flex-end' },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  segment: { flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row-reverse', justifyContent: 'center' },
  chip: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
});
