import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import GlassCard from './GlassCard';
import FormField from './FormField';
import AppButton from './AppButton';
import DateInput from './DateInput';
import { FinancialOperation, PaymentMethod } from '../types';
import { useToast } from './Toast';
import { CATEGORIES, PAYMENT_METHODS, QUICK_AMOUNTS } from '../utils/constants';

interface OperationFormProps {
  visible: boolean;
  initial?: Partial<FinancialOperation>;
  recordId: string;
  onCancel: () => void;
  onSubmit: (data: Omit<FinancialOperation, 'id' | 'createdAt'>) => Promise<void> | void;
}

export default function OperationForm({ visible, initial, recordId, onCancel, onSubmit }: OperationFormProps) {
  const { colors } = useTheme();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [time, setTime] = useState('');
  const [hasInvoice, setHasInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [category, setCategory] = useState('أخرى');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setAmount(initial?.amount ? String(initial.amount) : '');
      setDate(initial?.date || new Date().toISOString());
      setTime(initial?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setHasInvoice(!!initial?.hasInvoice);
      setInvoiceNumber(initial?.invoiceNumber || '');
      setCategory(initial?.category || 'أخرى');
      setPaymentMethod((initial?.paymentMethod as PaymentMethod) || 'cash');
      setTags((initial?.tags || []).join(', '));
      setDescription(initial?.description || '');
      setErrors({});
    }
  }, [visible, initial]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const v = Number(amount);
    if (!amount || isNaN(v) || v <= 0) e.amount = 'مبلغ موجب مطلوب';
    if (!date) e.date = 'التاريخ مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error('يرجى تصحيح الحقول');
      return;
    }
    await onSubmit({
      recordId,
      amount: Number(amount),
      date,
      time: time || undefined,
      hasInvoice,
      invoiceNumber: hasInvoice ? invoiceNumber.trim() || undefined : undefined,
      category,
      paymentMethod,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <GlassCard style={styles.sheet} testID="operation-form">
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{initial?.id ? 'تعديل عملية' : 'عملية مالية جديدة'}</Text>
              <Pressable testID="close-op-form" onPress={onCancel}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <FormField label="المبلغ" required keyboardType="numeric" value={amount} onChangeText={setAmount} error={errors.amount} placeholder="0" testID="op-amount-input" />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>إدخال سريع</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginBottom: 14 }}>
                {QUICK_AMOUNTS.map(v => (
                  <Pressable key={v} testID={`quick-amount-${v}`} onPress={() => setAmount(String(v))}
                    style={[styles.chip, { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{v.toLocaleString('en-US')}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <DateInput label="التاريخ" value={date} onChange={setDate} required testID="op-date-input" />
              <FormField label="الوقت" value={time} onChangeText={setTime} placeholder="HH:mm" testID="op-time-input" />

              <View style={[styles.row, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>بفاتورة</Text>
                <Pressable
                  testID="op-invoice-toggle"
                  onPress={() => setHasInvoice(v => !v)}
                  style={[styles.toggle, { backgroundColor: hasInvoice ? colors.accentBrand : colors.divider }]}
                >
                  <View style={[styles.toggleDot, { transform: [{ translateX: hasInvoice ? -20 : 0 }] }]} />
                </Pressable>
              </View>
              {hasInvoice && (
                <FormField label="رقم الفاتورة" value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="مثال: INV-001" testID="op-invoice-num" />
              )}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 6 }]}>التصنيف</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginBottom: 14 }}>
                {CATEGORIES.map(c => (
                  <Pressable key={c.name} testID={`cat-${c.name}`} onPress={() => setCategory(c.name)}
                    style={[styles.chip, { borderColor: category === c.name ? c.color : colors.glassBorder, backgroundColor: category === c.name ? c.color + '22' : colors.glassSurface }]}>
                    <Ionicons name={c.icon} size={16} color={c.color} style={{ marginEnd: 6 }} />
                    <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>طريقة الدفع</Text>
              <View style={styles.payRow}>
                {PAYMENT_METHODS.map(p => (
                  <Pressable key={p.id} testID={`pay-${p.id}`} onPress={() => setPaymentMethod(p.id)}
                    style={[styles.payItem, { borderColor: paymentMethod === p.id ? colors.accentBrand : colors.glassBorder, backgroundColor: paymentMethod === p.id ? colors.accentBrand + '22' : colors.glassSurface }]}>
                    <Ionicons name={p.icon} size={18} color={paymentMethod === p.id ? colors.accentBrand : colors.textSecondary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>{p.label}</Text>
                  </Pressable>
                ))}
              </View>
              <FormField label="الوسوم (مفصولة بفاصلة)" value={tags} onChangeText={setTags} placeholder="عمل، شخصي، عاجل" testID="op-tags-input" />
              <FormField label="البيان / التفاصيل" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} placeholder="وصف العملية..." testID="op-desc-input" />
              <View style={{ flexDirection: 'row-reverse', gap: 12, marginTop: 8 }}>
                <AppButton title={initial?.id ? 'حفظ' : 'إضافة'} onPress={submit} icon="checkmark" full style={{ flex: 1 }} testID="op-submit-btn" />
                <AppButton title="إلغاء" onPress={onCancel} variant="ghost" style={{ flex: 1 }} testID="op-cancel-btn" />
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
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  toggle: { width: 50, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center', alignItems: 'flex-end' },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  chip: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  payRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  payItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderRadius: 12 },
});
