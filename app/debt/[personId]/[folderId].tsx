import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useData } from '../../../src/store/DataProvider';
import { useToast } from '../../../src/components/Toast';
import GlassCard from '../../../src/components/GlassCard';
import ScreenBg from '../../../src/components/ScreenBg';
import { DebtOperationForm } from '../../../src/components/DebtForms';
import ConfirmDialog from '../../../src/components/ConfirmDialog';
import AppButton from '../../../src/components/AppButton';
import { debtOpsRepo } from '../../../src/store/storage';
import { formatCurrency, formatShortDate } from '../../../src/utils/format';
import { buildDebtFolderHTML, printHTML, shareHTMLAsPDF } from '../../../src/utils/print';
import { DebtOperation } from '../../../src/types';

export default function DebtFolderOperationsScreen() {
  const { personId, folderId } = useLocalSearchParams<{ personId: string; folderId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { persons, folders, debtOps, refresh } = useData();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DebtOperation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DebtOperation | null>(null);

  const person = persons.find(p => p.id === personId);
  const folder = folders.find(f => f.id === folderId);
  const ops = useMemo(
    () => debtOps.filter(o => o.folderId === folderId).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [debtOps, folderId]
  );

  if (!person || !folder) {
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

  const lent = ops.filter(o => o.type === 'lend').reduce((s, o) => s + o.amount, 0);
  const repaid = ops.filter(o => o.type === 'repay').reduce((s, o) => s + o.amount, 0);
  const balance = lent - repaid;

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const onPrint = async () => {
    try { await printHTML(buildDebtFolderHTML(person, folder, ops)); }
    catch { toast.error('فشل الطباعة'); }
  };
  const onShare = async () => {
    try { await shareHTMLAsPDF(buildDebtFolderHTML(person, folder, ops), `${folder.name}.pdf`); }
    catch { toast.error('فشلت المشاركة'); }
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBrand} />}
        testID="folder-detail-scroll"
      >
        <View style={styles.header}>
          <Pressable testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{folder.name}</Text>
          <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
            <Pressable testID="header-print" onPress={onPrint} style={styles.iconBtn}>
              <Ionicons name="print" size={20} color={colors.accentBrand} />
            </Pressable>
            <Pressable testID="header-share" onPress={onShare} style={styles.iconBtn}>
              <Ionicons name="share-social" size={20} color={colors.accentIncome} />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard style={{ marginHorizontal: 18, marginBottom: 14 }} testID="folder-stats">
            <View style={{ padding: 18 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'right' }}>{person.name}</Text>
              {folder.description ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, textAlign: 'right' }}>{folder.description}</Text> : null}
              <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
                <Stat label="الإقراض" value={formatCurrency(lent)} color={colors.accentDebt} />
                <Stat label="السداد" value={formatCurrency(repaid)} color={colors.accentIncome} />
                <Stat label="الرصيد" value={formatCurrency(balance)} color={balance >= 0 ? colors.accentDebt : colors.accentIncome} />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
          <AppButton title="إضافة عملية دين" icon="add" onPress={() => { setEditing(null); setShowForm(true); }} testID="add-debt-op-btn" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>العمليات ({ops.length})</Text>
        {ops.length === 0 ? (
          <View style={{ marginHorizontal: 18 }}>
            <GlassCard><View style={{ padding: 24, alignItems: 'center' }}>
              <Ionicons name="cash-outline" size={36} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>لا توجد عمليات</Text>
            </View></GlassCard>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 10 }}>
            {ops.map((op, idx) => {
              const isLend = op.type === 'lend';
              return (
                <Animated.View key={op.id} entering={FadeInDown.duration(300).delay(idx * 30)}>
                  <GlassCard variant="light" testID={`debt-op-card-${op.id}`}>
                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.opIcon, { backgroundColor: (isLend ? colors.accentDebt : colors.accentIncome) + '22' }]}>
                          <Ionicons name={isLend ? 'arrow-up-circle' : 'arrow-down-circle'} size={22} color={isLend ? colors.accentDebt : colors.accentIncome} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '800', textAlign: 'right' }} numberOfLines={1}>
                            {isLend ? 'إقراض' : 'سداد'}{op.description ? ' • ' + op.description : ''}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>
                            {formatShortDate(op.date)}{op.dueDate ? ` • استحقاق: ${formatShortDate(op.dueDate)}` : ''}{op.reminder ? ' • تذكير' : ''}
                          </Text>
                        </View>
                        <Text style={{ color: isLend ? colors.accentDebt : colors.accentIncome, fontWeight: '900', fontSize: 16 }}>
                          {formatCurrency(op.amount)}
                        </Text>
                      </View>
                      <View style={[styles.opActions, { borderTopColor: colors.divider }]}>
                        <Pressable testID={`edit-debt-op-${op.id}`} onPress={() => { setEditing(op); setShowForm(true); }} style={styles.opActBtn}>
                          <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>تعديل</Text>
                        </Pressable>
                        <Pressable testID={`delete-debt-op-${op.id}`} onPress={() => setConfirmDelete(op)} style={styles.opActBtn}>
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

      <DebtOperationForm
        visible={showForm}
        personId={person.id}
        folderId={folder.id}
        initial={editing || undefined}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        onSubmit={async (d) => {
          if (editing) { await debtOpsRepo.update(editing.id, d); toast.success('تم التعديل'); }
          else { await debtOpsRepo.create(d); toast.success('تمت الإضافة'); }
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
          if (confirmDelete) { await debtOpsRepo.remove(confirmDelete.id); await refresh(); toast.success('تم الحذف'); }
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
      <Text style={{ color, fontSize: 14, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'right', marginHorizontal: 12 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginHorizontal: 22, marginBottom: 10, textAlign: 'right' },
  opIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  opActions: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 18, marginTop: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  opActBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
});
