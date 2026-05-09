import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useData } from '../../src/store/DataProvider';
import { useToast } from '../../src/components/Toast';
import GlassCard from '../../src/components/GlassCard';
import ScreenBg from '../../src/components/ScreenBg';
import OperationForm from '../../src/components/OperationForm';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import AppButton from '../../src/components/AppButton';
import { operationsRepo } from '../../src/store/storage';
import { formatCurrency, formatShortDate } from '../../src/utils/format';
import { buildFinancialRecordHTML, printHTML, shareHTMLAsPDF } from '../../src/utils/print';
import { CATEGORIES, PAYMENT_METHODS } from '../../src/utils/constants';
import { FinancialOperation } from '../../src/types';

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { records, operations, refresh } = useData();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinancialOperation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FinancialOperation | null>(null);

  const record = records.find(r => r.id === id);
  const ops = useMemo(
    () => operations.filter(o => o.recordId === id).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [operations, id]
  );

  if (!record) {
    return (
      <ScreenBg>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Ionicons name="alert-circle" size={48} color={colors.accentDebt} />
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 12 }}>السجل غير موجود</Text>
          <AppButton title="عودة" icon="arrow-back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </ScreenBg>
    );
  }

  const total = ops.reduce((s, o) => s + o.amount, 0);
  const remaining = record.type === 'capped' ? (record.capAmount || 0) - total : 0;

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const onPrint = async () => {
    try { await printHTML(buildFinancialRecordHTML(record, ops)); }
    catch { toast.error('فشل الطباعة'); }
  };
  const onShare = async () => {
    try { await shareHTMLAsPDF(buildFinancialRecordHTML(record, ops), `${record.name}.pdf`); }
    catch { toast.error('فشلت المشاركة'); }
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBrand} />}
        testID="record-detail-scroll"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{record.name}</Text>
          <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
            <Pressable testID="header-print" onPress={onPrint} style={styles.iconBtn}>
              <Ionicons name="print" size={20} color={colors.accentBrand} />
            </Pressable>
            <Pressable testID="header-share" onPress={onShare} style={styles.iconBtn}>
              <Ionicons name="share-social" size={20} color={colors.accentIncome} />
            </Pressable>
          </View>
        </View>

        {/* Stats card */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard style={{ marginHorizontal: 18, marginBottom: 14 }} testID="record-stats-card">
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                <View style={[styles.recIcon, { backgroundColor: record.color + '22' }]}>
                  <Ionicons name={record.icon as any || 'wallet'} size={22} color={record.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{record.type === 'capped' ? 'بسقف' : 'تراكمي'}</Text>
                  {record.description ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: 'right' }}>{record.description}</Text> : null}
                </View>
              </View>
              <View style={[styles.statsGrid, { borderTopColor: colors.divider }]}>
                {record.type === 'capped' ? (
                  <>
                    <Stat label="السقف" value={formatCurrency(record.capAmount || 0)} color={colors.textPrimary} />
                    <Stat label="المنصرف" value={formatCurrency(total)} color={colors.accentDebt} />
                    <Stat label="المتبقي" value={formatCurrency(remaining)} color={remaining < 0 ? colors.accentDebt : colors.accentIncome} />
                  </>
                ) : (
                  <>
                    <Stat label="الإجمالي" value={formatCurrency(total)} color={colors.textPrimary} />
                    <Stat label="عدد العمليات" value={String(ops.length)} color={colors.accentBrand} />
                  </>
                )}
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Add op button */}
        <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
          <AppButton title="إضافة عملية مالية" icon="add" onPress={() => { setEditing(null); setShowForm(true); }} testID="add-op-btn" />
        </View>

        {/* Operations list */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>العمليات ({ops.length})</Text>
        {ops.length === 0 ? (
          <View style={{ marginHorizontal: 18 }}>
            <GlassCard><View style={{ padding: 24, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>لا توجد عمليات</Text>
            </View></GlassCard>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 10 }}>
            {ops.map((op, idx) => {
              const cat = CATEGORIES.find(c => c.name === op.category);
              const pm = PAYMENT_METHODS.find(p => p.id === op.paymentMethod);
              return (
                <Animated.View key={op.id} entering={FadeInDown.duration(300).delay(idx * 30)}>
                  <GlassCard variant="light" testID={`op-card-${op.id}`}>
                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.opIcon, { backgroundColor: (cat?.color || colors.accentBrand) + '22' }]}>
                          <Ionicons name={(cat?.icon || 'wallet-outline') as any} size={20} color={cat?.color || colors.accentBrand} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right' }} numberOfLines={1}>
                            {op.description || op.category}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>
                            {formatShortDate(op.date)}{op.time ? ` • ${op.time}` : ''} • {pm?.label || ''}
                            {op.hasInvoice && op.invoiceNumber ? ` • ف:${op.invoiceNumber}` : ''}
                          </Text>
                          {op.tags && op.tags.length > 0 ? (
                            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                              {op.tags.slice(0, 3).map((t, i) => (
                                <View key={i} style={[styles.tag, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
                                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>#{t}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                        <Text style={{ color: colors.accentDebt, fontWeight: '900', fontSize: 16 }}>
                          {formatCurrency(op.amount)}
                        </Text>
                      </View>
                      <View style={[styles.opActions, { borderTopColor: colors.divider }]}>
                        <Pressable testID={`edit-op-${op.id}`} onPress={() => { setEditing(op); setShowForm(true); }} style={styles.opActBtn}>
                          <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>تعديل</Text>
                        </Pressable>
                        <Pressable testID={`delete-op-${op.id}`} onPress={() => setConfirmDelete(op)} style={styles.opActBtn}>
                          <Ionicons name="trash-outline" size={18} color={colors.accentDebt} />
                          <Text style={{ color: colors.accentDebt, fontSize: 11, fontWeight: '700' }}>حذف</Text>
                        </Pressable>
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <OperationForm
        visible={showForm}
        recordId={record.id}
        initial={editing || undefined}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        onSubmit={async (d) => {
          if (editing) { await operationsRepo.update(editing.id, d); toast.success('تم التعديل'); }
          else { await operationsRepo.create(d); toast.success('تمت الإضافة'); }
          await refresh(); setShowForm(false); setEditing(null);
        }}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="حذف العملية"
        message={confirmDelete ? `سيتم حذف عملية بقيمة ${formatCurrency(confirmDelete.amount)} وتحديث الرصيد فوراً.` : ''}
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) { await operationsRepo.remove(confirmDelete.id); await refresh(); toast.success('تم الحذف'); }
          setConfirmDelete(null);
        }}
      />
    </ScreenBg>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color, fontSize: 16, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'right', marginHorizontal: 12 },
  metaLabel: { fontSize: 11, fontWeight: '800', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  recIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginHorizontal: 22, marginBottom: 10, textAlign: 'right' },
  opIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  opActions: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 18, marginTop: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  opActBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
});
