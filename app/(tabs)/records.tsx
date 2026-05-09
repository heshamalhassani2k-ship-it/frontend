import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useData } from '../../src/store/DataProvider';
import { useToast } from '../../src/components/Toast';
import { useSecurity } from '../../src/store/SecurityProvider';
import GlassCard from '../../src/components/GlassCard';
import ScreenBg from '../../src/components/ScreenBg';
import RecordForm from '../../src/components/RecordForm';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import AppButton from '../../src/components/AppButton';
import ReorderModal from '../../src/components/ReorderModal';
import { recordsRepo } from '../../src/store/storage';
import { formatCurrency } from '../../src/utils/format';
import { buildFinancialRecordHTML, printHTML, shareHTMLAsPDF } from '../../src/utils/print';
import { FinancialRecord } from '../../src/types';

export default function RecordsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { records, operations, refresh } = useData();
  const toast = useToast();
  const security = useSecurity();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinancialRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FinancialRecord | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visibleRecords = useMemo(() => records.filter(r => showArchived ? r.archived : !r.archived), [records, showArchived]);
  const totalSpent = useMemo(() => operations.reduce((s, o) => s + o.amount, 0), [operations]);
  const totalCap = useMemo(() => records.filter(r => r.type === 'capped').reduce((s, r) => s + (r.capAmount || 0), 0), [records]);
  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const exitSelect = () => { setSelectMode(false); setSelectedIds([]); };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const onPrint = async (record: FinancialRecord) => {
    const ops = operations.filter(o => o.recordId === record.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    try { await printHTML(buildFinancialRecordHTML(record, ops)); } catch { toast.error('فشل الطباعة'); }
  };
  const onShare = async (record: FinancialRecord) => {
    const ops = operations.filter(o => o.recordId === record.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    try { await shareHTMLAsPDF(buildFinancialRecordHTML(record, ops), `${record.name}.pdf`); } catch { toast.error('فشلت المشاركة'); }
  };

  const bulkPrint = async () => {
    for (const id of selectedIds) {
      const r = records.find(x => x.id === id); if (!r) continue;
      const ops = operations.filter(o => o.recordId === r.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      try { await printHTML(buildFinancialRecordHTML(r, ops)); } catch {}
    }
    toast.success(`تمت طباعة ${selectedIds.length} سجل`);
    exitSelect();
  };

  const askBulkDelete = async () => {
    const ok = await security.authenticate('deleteRecord', 'تحقق بالبصمة لحذف عدة سجلات');
    if (!ok) { toast.error('فشل التحقق'); return; }
    setConfirmBulkDelete(true);
  };

  const performBulkDelete = async () => {
    await recordsRepo.removeMany(selectedIds);
    await refresh();
    toast.success(`تم حذف ${selectedIds.length} سجل`);
    exitSelect();
    setConfirmBulkDelete(false);
  };

  const askDelete = async (r: FinancialRecord) => {
    const ok = await security.authenticate('deleteRecord', 'تحقق بالبصمة لحذف السجل');
    if (!ok) { toast.error('فشل التحقق'); return; }
    setConfirmDelete(r);
  };

  const askEdit = async (r: FinancialRecord) => {
    if (r.capAmount !== undefined) {
      const ok = await security.authenticate('editCap', 'تحقق بالبصمة لتعديل سقف الميزانية');
      if (!ok) { toast.error('فشل التحقق'); return; }
    }
    setEditing(r); setShowForm(true);
  };

  const reorderItems = visibleRecords.map(r => ({ id: r.id, label: r.name, sublabel: r.type === 'capped' ? `بسقف • ${formatCurrency(r.capAmount || 0)}` : 'تراكمي', color: r.color, icon: (r.icon as any) || 'wallet' }));

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBrand} />}
        testID="records-scroll"
      >
        <View style={styles.headerWrap}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>السجلات المالية</Text>
              <Text style={[styles.appTitle, { color: colors.textPrimary }]}>{visibleRecords.length} سجل</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
              {visibleRecords.length > 1 && (
                <Pressable testID="reorder-records-btn" onPress={() => setShowReorder(true)}
                  style={[styles.iconFab, { backgroundColor: colors.glassSurfaceStrong, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                  <Ionicons name="reorder-three" size={22} color={colors.textPrimary} />
                </Pressable>
              )}
              {visibleRecords.length > 0 && (
                <Pressable testID="select-mode-records" onPress={() => selectMode ? exitSelect() : setSelectMode(true)}
                  style={[styles.iconFab, { backgroundColor: selectMode ? colors.accentBrand : colors.glassSurfaceStrong, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                  <Ionicons name={selectMode ? 'close' : 'checkbox-outline'} size={22} color={selectMode ? '#fff' : colors.textPrimary} />
                </Pressable>
              )}
              <Pressable testID="add-record-fab" onPress={() => { setEditing(null); setShowForm(true); }}
                style={[styles.fab, { backgroundColor: colors.accentBrand }]}>
                <Ionicons name="add" size={26} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard style={{ marginHorizontal: 18, marginBottom: 14 }} testID="records-summary">
            <View style={{ padding: 18, flexDirection: 'row-reverse', gap: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>إجمالي السقف</Text>
                <Text style={[styles.statVal, { color: colors.textPrimary }]}>{formatCurrency(totalCap)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statLbl, { color: colors.textMuted }]}>إجمالي المنصرف</Text>
                <Text style={[styles.statVal, { color: colors.accentDebt }]}>{formatCurrency(totalSpent)}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <View style={[styles.archiveToggle]}>
          <Pressable testID="toggle-archived" onPress={() => setShowArchived(v => !v)}
            style={[styles.toggleBtn, { borderColor: colors.glassBorder, backgroundColor: showArchived ? colors.accentBrand : 'transparent' }]}>
            <Ionicons name={showArchived ? 'archive' : 'archive-outline'} size={16} color={showArchived ? '#fff' : colors.textSecondary} style={{ marginEnd: 6 }} />
            <Text style={{ color: showArchived ? '#fff' : colors.textPrimary, fontWeight: '700' }}>
              {showArchived ? 'عرض النشطة' : 'عرض المؤرشفة'}
            </Text>
          </Pressable>
        </View>

        {visibleRecords.length === 0 ? (
          <View style={{ marginHorizontal: 18, marginTop: 30 }}>
            <GlassCard><View style={{ padding: 30, alignItems: 'center' }}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16, marginTop: 12 }}>لا توجد سجلات</Text>
              <Text style={{ color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>أنشئ أول سجل مالي لتتبع مصاريفك</Text>
              <AppButton title="إنشاء سجل" icon="add" onPress={() => setShowForm(true)} style={{ marginTop: 16 }} testID="empty-add-record" />
            </View></GlassCard>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 12 }}>
            {visibleRecords.map((r, idx) => {
              const ops = operations.filter(o => o.recordId === r.id);
              const total = ops.reduce((s, o) => s + o.amount, 0);
              const remaining = r.type === 'capped' ? (r.capAmount || 0) - total : 0;
              const ratio = r.type === 'capped' && r.capAmount ? Math.min(1, total / r.capAmount) : 0;
              const isSelected = selectedIds.includes(r.id);
              return (
                <Animated.View key={r.id} entering={FadeInDown.duration(350).delay(idx * 40).springify()}>
                  <Pressable
                    testID={`record-card-${r.id}`}
                    onPress={() => selectMode ? toggleSelect(r.id) : router.push(`/record/${r.id}` as any)}
                    onLongPress={() => { if (!selectMode) { setSelectMode(true); toggleSelect(r.id); } }}
                    delayLongPress={250}
                    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}
                  >
                    <GlassCard style={isSelected ? { borderColor: colors.accentBrand, borderWidth: 2 } : undefined}>
                      <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                          {selectMode && (
                            <View testID={`select-record-${r.id}`} style={[styles.checkbox, { borderColor: isSelected ? colors.accentBrand : colors.glassBorder, backgroundColor: isSelected ? colors.accentBrand : 'transparent' }]}>
                              {isSelected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                            </View>
                          )}
                          <View style={[styles.recIcon, { backgroundColor: r.color + '22' }]}>
                            <Ionicons name={(r.icon as any) || 'wallet'} size={22} color={r.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16, textAlign: 'right' }} numberOfLines={1}>{r.name}</Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, textAlign: 'right' }}>
                              {r.type === 'capped' ? 'بسقف' : 'تراكمي'} • {ops.length} عملية
                            </Text>
                          </View>
                          <Text style={{ color: r.type === 'capped' ? (remaining < 0 ? colors.accentDebt : colors.accentIncome) : colors.textPrimary, fontWeight: '900', fontSize: 17 }}>
                            {r.type === 'capped' ? formatCurrency(remaining) : formatCurrency(total)}
                          </Text>
                        </View>
                        {r.type === 'capped' && r.capAmount ? (
                          <View style={[styles.progress, { backgroundColor: colors.divider }]}>
                            <View style={[styles.progressFill, { width: `${ratio * 100}%`, backgroundColor: ratio > 0.9 ? colors.accentDebt : ratio > 0.7 ? colors.accentWarning : colors.accentIncome }]} />
                          </View>
                        ) : null}
                        {!selectMode && (
                          <View style={[styles.actions, { borderTopColor: colors.divider }]}>
                            <ActionBtn icon="create-outline" label="تعديل" color={colors.textSecondary} onPress={() => askEdit(r)} testID={`edit-rec-${r.id}`} />
                            <ActionBtn icon="print" label="طباعة" color={colors.accentBrand} onPress={() => onPrint(r)} testID={`print-rec-${r.id}`} />
                            <ActionBtn icon="share-social" label="مشاركة" color={colors.accentIncome} onPress={() => onShare(r)} testID={`share-rec-${r.id}`} />
                            <ActionBtn
                              icon={r.archived ? 'archive' : 'archive-outline'}
                              label={r.archived ? 'إلغاء أرشفة' : 'أرشفة'}
                              color={colors.accentWarning}
                              onPress={async () => { await recordsRepo.update(r.id, { archived: !r.archived }); await refresh(); toast.info(r.archived ? 'تم إلغاء الأرشفة' : 'تمت الأرشفة'); }}
                              testID={`archive-rec-${r.id}`}
                            />
                            <ActionBtn icon="trash-outline" label="حذف" color={colors.accentDebt} onPress={() => askDelete(r)} testID={`delete-rec-${r.id}`} />
                          </View>
                        )}
                      </View>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bulk action bar */}
      {selectMode && selectedIds.length > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.glassSurfaceStrong, borderColor: colors.glassBorder, bottom: insets.bottom + 80 }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', flex: 1, textAlign: 'right' }}>تم اختيار {selectedIds.length}</Text>
          <Pressable testID="bulk-print-records" onPress={bulkPrint} style={[styles.bulkBtn, { backgroundColor: colors.accentBrand + '22' }]}>
            <Ionicons name="print" size={18} color={colors.accentBrand} />
            <Text style={{ color: colors.accentBrand, fontWeight: '800', fontSize: 12, marginEnd: 4 }}>طباعة</Text>
          </Pressable>
          <Pressable testID="bulk-delete-records" onPress={askBulkDelete} style={[styles.bulkBtn, { backgroundColor: colors.accentDebt + '22' }]}>
            <Ionicons name="trash" size={18} color={colors.accentDebt} />
            <Text style={{ color: colors.accentDebt, fontWeight: '800', fontSize: 12, marginEnd: 4 }}>حذف</Text>
          </Pressable>
        </View>
      )}

      <RecordForm
        visible={showForm}
        initial={editing || undefined}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        onSubmit={async (d) => {
          if (editing) { await recordsRepo.update(editing.id, d); toast.success('تم حفظ التعديلات'); }
          else { await recordsRepo.create(d); toast.success('تم إضافة السجل'); }
          await refresh(); setShowForm(false); setEditing(null);
        }}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="حذف السجل"
        message={confirmDelete ? `سيتم حذف "${confirmDelete.name}" وكل عملياته. سيتم تحديث الرصيد فوراً. لا يمكن التراجع.` : ''}
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => { if (confirmDelete) { await recordsRepo.remove(confirmDelete.id); await refresh(); toast.success('تم الحذف'); } setConfirmDelete(null); }}
      />

      <ConfirmDialog
        visible={confirmBulkDelete}
        title="حذف جماعي"
        message={`سيتم حذف ${selectedIds.length} سجل وكل عملياتها نهائياً.`}
        destructive
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={performBulkDelete}
      />

      <ReorderModal
        visible={showReorder}
        title="إعادة ترتيب السجلات"
        items={reorderItems}
        onCancel={() => setShowReorder(false)}
        onSave={async (orderedIds) => { await recordsRepo.reorder(orderedIds); await refresh(); toast.success('تم حفظ الترتيب'); setShowReorder(false); }}
      />
    </ScreenBg>
  );
}

function ActionBtn({ icon, label, color, onPress, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 14 },
  greeting: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  appTitle: { fontSize: 26, fontWeight: '900', marginTop: 4, textAlign: 'right' },
  fab: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6 },
  iconFab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statLbl: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  statVal: { fontSize: 18, fontWeight: '800', marginTop: 4, textAlign: 'right' },
  divider: { width: 1 },
  archiveToggle: { paddingHorizontal: 18, marginBottom: 12, alignItems: 'flex-start' },
  toggleBtn: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  recIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progress: { height: 6, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bulkBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 },
  bulkBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
});
