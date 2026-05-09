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
import { PersonForm } from '../../src/components/DebtForms';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import AppButton from '../../src/components/AppButton';
import ReorderModal from '../../src/components/ReorderModal';
import { personsRepo } from '../../src/store/storage';
import { formatCurrency } from '../../src/utils/format';
import { buildPersonStatementHTML, shareHTMLAsPDF, printHTML } from '../../src/utils/print';
import { shareViaWhatsApp } from '../../src/utils/whatsapp';
import { DebtPerson } from '../../src/types';

export default function DebtsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { persons, folders, debtOps, refresh } = useData();
  const toast = useToast();
  const security = useSecurity();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DebtPerson | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DebtPerson | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const totalOwed = useMemo(() => {
    let v = 0; debtOps.forEach(o => { v += o.type === 'lend' ? o.amount : -o.amount; });
    return v;
  }, [debtOps]);

  const personStats = useMemo(() => {
    const map: Record<string, { lent: number; repaid: number; balance: number }> = {};
    persons.forEach(p => { map[p.id] = { lent: 0, repaid: 0, balance: 0 }; });
    debtOps.forEach(o => { if (!map[o.personId]) return; if (o.type === 'lend') map[o.personId].lent += o.amount; else map[o.personId].repaid += o.amount; });
    Object.keys(map).forEach(k => map[k].balance = map[k].lent - map[k].repaid);
    return map;
  }, [persons, debtOps]);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };
  const exitSelect = () => { setSelectMode(false); setSelectedIds([]); };
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const onShareStatement = async (p: DebtPerson) => {
    const fs = folders.filter(f => f.personId === p.id);
    const ops = debtOps.filter(o => o.personId === p.id);
    try { await shareHTMLAsPDF(buildPersonStatementHTML(p, fs, ops), `${p.name}.pdf`); } catch { toast.error('فشلت المشاركة'); }
  };

  const onWhatsApp = async (p: DebtPerson) => {
    const fs = folders.filter(f => f.personId === p.id);
    const ops = debtOps.filter(o => o.personId === p.id);
    try {
      await shareViaWhatsApp(buildPersonStatementHTML(p, fs, ops), `${p.name}.pdf`, p.phone, `كشف حساب: ${p.name}`);
    } catch { toast.error('فشلت المشاركة'); }
  };

  const askDelete = async (p: DebtPerson) => {
    const ok = await security.authenticate('deletePerson', 'تحقق بالبصمة لحذف الشخص');
    if (!ok) { toast.error('فشل التحقق'); return; }
    setConfirmDelete(p);
  };

  const askBulkDelete = async () => {
    const ok = await security.authenticate('deletePerson', 'تحقق بالبصمة لحذف عدة أشخاص');
    if (!ok) { toast.error('فشل التحقق'); return; }
    setConfirmBulkDelete(true);
  };
  const performBulkDelete = async () => {
    await personsRepo.removeMany(selectedIds);
    await refresh();
    toast.success(`تم حذف ${selectedIds.length} شخص`);
    exitSelect();
    setConfirmBulkDelete(false);
  };

  const bulkPrint = async () => {
    for (const id of selectedIds) {
      const p = persons.find(x => x.id === id); if (!p) continue;
      const fs = folders.filter(f => f.personId === p.id);
      const ops = debtOps.filter(o => o.personId === p.id);
      try { await printHTML(buildPersonStatementHTML(p, fs, ops)); } catch {}
    }
    toast.success(`تمت طباعة ${selectedIds.length} كشف`);
    exitSelect();
  };

  const reorderItems = persons.map(p => ({ id: p.id, label: p.name, sublabel: p.phone || '—', color: p.color, icon: 'person' as const }));

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBrand} />}
        testID="debts-scroll"
      >
        <View style={styles.headerWrap}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>إدارة الديون</Text>
              <Text style={[styles.appTitle, { color: colors.textPrimary }]}>{persons.length} شخص</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
              {persons.length > 1 && (
                <Pressable testID="reorder-persons-btn" onPress={() => setShowReorder(true)}
                  style={[styles.iconFab, { backgroundColor: colors.glassSurfaceStrong, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                  <Ionicons name="reorder-three" size={22} color={colors.textPrimary} />
                </Pressable>
              )}
              {persons.length > 0 && (
                <Pressable testID="select-mode-persons" onPress={() => selectMode ? exitSelect() : setSelectMode(true)}
                  style={[styles.iconFab, { backgroundColor: selectMode ? colors.accentDebt : colors.glassSurfaceStrong, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                  <Ionicons name={selectMode ? 'close' : 'checkbox-outline'} size={22} color={selectMode ? '#fff' : colors.textPrimary} />
                </Pressable>
              )}
              <Pressable testID="add-person-fab" onPress={() => { setEditing(null); setShowForm(true); }}
                style={[styles.fab, { backgroundColor: colors.accentDebt }]}>
                <Ionicons name="person-add" size={22} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard style={{ marginHorizontal: 18, marginBottom: 14 }} testID="debts-summary">
            <View style={{ padding: 18 }}>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>إجمالي المستحق لك</Text>
              <Text style={[styles.statVal, { color: totalOwed >= 0 ? colors.accentDebt : colors.accentIncome, fontSize: 28 }]} testID="total-owed">{formatCurrency(totalOwed)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'right' }}>
                {debtOps.length} عملية • {folders.length} سجل فرعي
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {persons.length === 0 ? (
          <View style={{ marginHorizontal: 18, marginTop: 30 }}>
            <GlassCard><View style={{ padding: 30, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16, marginTop: 12 }}>لا يوجد أشخاص</Text>
              <Text style={{ color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>أضف شخصاً لتتبع ديونك</Text>
              <AppButton title="إضافة شخص" icon="person-add" onPress={() => setShowForm(true)} style={{ marginTop: 16 }} testID="empty-add-person" />
            </View></GlassCard>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 12 }}>
            {persons.map((p, idx) => {
              const stat = personStats[p.id] || { lent: 0, repaid: 0, balance: 0 };
              const initial = p.name.trim().charAt(0).toUpperCase();
              const personFolders = folders.filter(f => f.personId === p.id);
              const isSelected = selectedIds.includes(p.id);
              return (
                <Animated.View key={p.id} entering={FadeInDown.duration(350).delay(idx * 40).springify()}>
                  <Pressable
                    testID={`person-card-${p.id}`}
                    onPress={() => selectMode ? toggleSelect(p.id) : router.push(`/debt/${p.id}` as any)}
                    onLongPress={() => { if (!selectMode) { setSelectMode(true); toggleSelect(p.id); } }}
                    delayLongPress={250}
                    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}
                  >
                    <GlassCard style={isSelected ? { borderColor: colors.accentDebt, borderWidth: 2 } : undefined}>
                      <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                          {selectMode && (
                            <View testID={`select-person-${p.id}`} style={[styles.checkbox, { borderColor: isSelected ? colors.accentDebt : colors.glassBorder, backgroundColor: isSelected ? colors.accentDebt : 'transparent' }]}>
                              {isSelected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                            </View>
                          )}
                          <View style={[styles.avatar, { backgroundColor: p.color }]}>
                            <Text style={styles.avatarText}>{initial}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16, textAlign: 'right' }} numberOfLines={1}>{p.name}</Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>
                              {p.phone || '—'} • {personFolders.length} سجل
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-start' }}>
                            <Text style={{ color: stat.balance >= 0 ? colors.accentDebt : colors.accentIncome, fontWeight: '900', fontSize: 17 }} testID={`person-balance-${p.id}`}>
                              {formatCurrency(stat.balance)}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                              {stat.balance >= 0 ? 'مستحق' : 'مدفوع زائد'}
                            </Text>
                          </View>
                        </View>
                        {!selectMode && (
                          <View style={[styles.actions, { borderTopColor: colors.divider }]}>
                            <ActionBtn icon="create-outline" label="تعديل" color={colors.textSecondary} onPress={() => { setEditing(p); setShowForm(true); }} testID={`edit-person-${p.id}`} />
                            <ActionBtn icon="share-social" label="كشف PDF" color={colors.accentBrand} onPress={() => onShareStatement(p)} testID={`share-person-${p.id}`} />
                            <ActionBtn icon="logo-whatsapp" label="واتساب" color={colors.accentIncome} onPress={() => onWhatsApp(p)} testID={`whatsapp-person-${p.id}`} />
                            <ActionBtn icon="trash-outline" label="حذف" color={colors.accentDebt} onPress={() => askDelete(p)} testID={`delete-person-${p.id}`} />
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

      {selectMode && selectedIds.length > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.glassSurfaceStrong, borderColor: colors.glassBorder, bottom: insets.bottom + 80 }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', flex: 1, textAlign: 'right' }}>تم اختيار {selectedIds.length}</Text>
          <Pressable testID="bulk-print-persons" onPress={bulkPrint} style={[styles.bulkBtn, { backgroundColor: colors.accentBrand + '22' }]}>
            <Ionicons name="print" size={18} color={colors.accentBrand} />
            <Text style={{ color: colors.accentBrand, fontWeight: '800', fontSize: 12, marginEnd: 4 }}>طباعة</Text>
          </Pressable>
          <Pressable testID="bulk-delete-persons" onPress={askBulkDelete} style={[styles.bulkBtn, { backgroundColor: colors.accentDebt + '22' }]}>
            <Ionicons name="trash" size={18} color={colors.accentDebt} />
            <Text style={{ color: colors.accentDebt, fontWeight: '800', fontSize: 12, marginEnd: 4 }}>حذف</Text>
          </Pressable>
        </View>
      )}

      <PersonForm
        visible={showForm}
        initial={editing || undefined}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        onSubmit={async (d) => {
          if (editing) { await personsRepo.update(editing.id, d); toast.success('تم حفظ التعديلات'); }
          else { await personsRepo.create(d); toast.success('تم إضافة الشخص'); }
          await refresh(); setShowForm(false); setEditing(null);
        }}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="حذف الشخص"
        message={confirmDelete ? `سيتم حذف "${confirmDelete.name}" وكل سجلاته وعملياته. سيتم تحديث الرصيد فوراً.` : ''}
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => { if (confirmDelete) { await personsRepo.remove(confirmDelete.id); await refresh(); toast.success('تم الحذف'); } setConfirmDelete(null); }}
      />

      <ConfirmDialog
        visible={confirmBulkDelete}
        title="حذف جماعي"
        message={`سيتم حذف ${selectedIds.length} شخص وكل سجلاتهم وعملياتهم نهائياً.`}
        destructive
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={performBulkDelete}
      />

      <ReorderModal
        visible={showReorder}
        title="إعادة ترتيب الأشخاص"
        items={reorderItems}
        onCancel={() => setShowReorder(false)}
        onSave={async (orderedIds) => { await personsRepo.reorder(orderedIds); await refresh(); toast.success('تم حفظ الترتيب'); setShowReorder(false); }}
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
  statLbl: { fontSize: 11, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
  statVal: { fontSize: 22, fontWeight: '900', marginTop: 6, textAlign: 'right' },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  actions: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bulkBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 },
  bulkBtn: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
});
