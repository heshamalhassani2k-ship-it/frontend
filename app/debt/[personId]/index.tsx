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
import { FolderForm } from '../../../src/components/DebtForms';
import ConfirmDialog from '../../../src/components/ConfirmDialog';
import AppButton from '../../../src/components/AppButton';
import { foldersRepo } from '../../../src/store/storage';
import { formatCurrency } from '../../../src/utils/format';
import { buildPersonStatementHTML, buildDebtFolderHTML, shareHTMLAsPDF, printHTML } from '../../../src/utils/print';
import { shareViaWhatsApp } from '../../../src/utils/whatsapp';
import { DebtFolder } from '../../../src/types';

export default function DebtPersonScreen() {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { persons, folders, debtOps, refresh } = useData();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DebtFolder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DebtFolder | null>(null);

  const person = persons.find(p => p.id === personId);
  const personFolders = useMemo(() => folders.filter(f => f.personId === personId), [folders, personId]);
  const personOps = useMemo(() => debtOps.filter(o => o.personId === personId), [debtOps, personId]);

  if (!person) {
    return (
      <ScreenBg>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Ionicons name="alert-circle" size={48} color={colors.accentDebt} />
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 12 }}>الشخص غير موجود</Text>
          <AppButton title="عودة" icon="arrow-back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </ScreenBg>
    );
  }

  const lent = personOps.filter(o => o.type === 'lend').reduce((s, o) => s + o.amount, 0);
  const repaid = personOps.filter(o => o.type === 'repay').reduce((s, o) => s + o.amount, 0);
  const balance = lent - repaid;

  const folderStats = (folderId: string) => {
    const ops = personOps.filter(o => o.folderId === folderId);
    const l = ops.filter(o => o.type === 'lend').reduce((s, o) => s + o.amount, 0);
    const r = ops.filter(o => o.type === 'repay').reduce((s, o) => s + o.amount, 0);
    return { balance: l - r, count: ops.length };
  };

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const onShareStatement = async () => {
    try { await shareHTMLAsPDF(buildPersonStatementHTML(person, personFolders, personOps), `${person.name}.pdf`); }
    catch { toast.error('فشلت المشاركة'); }
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBrand} />}
        testID="person-detail-scroll"
      >
        <View style={styles.header}>
          <Pressable testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{person.name}</Text>
          <Pressable testID="share-statement" onPress={onShareStatement} style={styles.iconBtn}>
            <Ionicons name="share-social" size={20} color={colors.accentBrand} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard style={{ marginHorizontal: 18, marginBottom: 14 }} testID="person-stats">
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                <View style={[styles.avatar, { backgroundColor: person.color }]}>
                  <Text style={styles.avatarTxt}>{person.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {person.phone ? <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'right' }}>{person.phone}</Text> : null}
                  {person.notes ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, textAlign: 'right' }} numberOfLines={2}>{person.notes}</Text> : null}
                </View>
              </View>
              <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
                <Stat label="الإقراض" value={formatCurrency(lent)} color={colors.accentDebt} />
                <Stat label="السداد" value={formatCurrency(repaid)} color={colors.accentIncome} />
                <Stat label="الرصيد" value={formatCurrency(balance)} color={balance >= 0 ? colors.accentDebt : colors.accentIncome} />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
          <AppButton title="إضافة سجل دين فرعي" icon="folder-open" onPress={() => { setEditing(null); setShowForm(true); }} testID="add-folder-btn" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>السجلات الفرعية ({personFolders.length})</Text>
        {personFolders.length === 0 ? (
          <View style={{ marginHorizontal: 18 }}>
            <GlassCard><View style={{ padding: 24, alignItems: 'center' }}>
              <Ionicons name="folder-outline" size={36} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>لا توجد سجلات</Text>
            </View></GlassCard>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 10 }}>
            {personFolders.map((f, idx) => {
              const st = folderStats(f.id);
              return (
                <Animated.View key={f.id} entering={FadeInDown.duration(300).delay(idx * 30)}>
                  <Pressable testID={`folder-card-${f.id}`} onPress={() => router.push(`/debt/${person.id}/${f.id}` as any)}>
                    <GlassCard variant="light">
                      <View style={{ padding: 14 }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                          <View style={[styles.folderIcon, { backgroundColor: f.color + '22' }]}>
                            <Ionicons name="folder" size={22} color={f.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15, textAlign: 'right' }} numberOfLines={1}>{f.name}</Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>{f.description || '—'} • {st.count} عملية</Text>
                          </View>
                          <Text style={{ color: st.balance >= 0 ? colors.accentDebt : colors.accentIncome, fontWeight: '900', fontSize: 16 }}>
                            {formatCurrency(st.balance)}
                          </Text>
                        </View>
                        <View style={[styles.actions, { borderTopColor: colors.divider }]}>
                          <Pressable testID={`edit-folder-${f.id}`} onPress={() => { setEditing(f); setShowForm(true); }} style={styles.actBtn}>
                            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>تعديل</Text>
                          </Pressable>
                          <Pressable testID={`print-folder-${f.id}`} onPress={async () => { try { await printHTML(buildDebtFolderHTML(person, f, personOps.filter(x => x.folderId === f.id))); } catch { toast.error('فشل الطباعة'); } }} style={styles.actBtn}>
                            <Ionicons name="print" size={18} color={colors.accentBrand} />
                            <Text style={{ color: colors.accentBrand, fontSize: 11, fontWeight: '700' }}>طباعة</Text>
                          </Pressable>
                          <Pressable testID={`share-folder-${f.id}`} onPress={async () => { try { await shareHTMLAsPDF(buildDebtFolderHTML(person, f, personOps.filter(x => x.folderId === f.id)), `${f.name}.pdf`); } catch { toast.error('فشلت المشاركة'); } }} style={styles.actBtn}>
                            <Ionicons name="share-social" size={18} color={colors.accentIncome} />
                            <Text style={{ color: colors.accentIncome, fontSize: 11, fontWeight: '700' }}>PDF</Text>
                          </Pressable>
                          <Pressable testID={`whatsapp-folder-${f.id}`} onPress={async () => { try { await shareViaWhatsApp(buildDebtFolderHTML(person, f, personOps.filter(x => x.folderId === f.id)), `${f.name}.pdf`, person.phone, `سجل: ${f.name}`); } catch { toast.error('فشلت المشاركة'); } }} style={styles.actBtn}>
                            <Ionicons name="logo-whatsapp" size={18} color={colors.accentIncome} />
                            <Text style={{ color: colors.accentIncome, fontSize: 11, fontWeight: '700' }}>واتساب</Text>
                          </Pressable>
                          <Pressable testID={`delete-folder-${f.id}`} onPress={() => setConfirmDelete(f)} style={styles.actBtn}>
                            <Ionicons name="trash-outline" size={18} color={colors.accentDebt} />
                            <Text style={{ color: colors.accentDebt, fontSize: 11, fontWeight: '700' }}>حذف</Text>
                          </Pressable>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <FolderForm
        visible={showForm}
        personId={person.id}
        initial={editing || undefined}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        onSubmit={async (d) => {
          if (editing) { await foldersRepo.update(editing.id, d); toast.success('تم التعديل'); }
          else { await foldersRepo.create(d); toast.success('تمت الإضافة'); }
          await refresh(); setShowForm(false); setEditing(null);
        }}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="حذف السجل"
        message={confirmDelete ? `سيتم حذف "${confirmDelete.name}" وكل عملياته.` : ''}
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) { await foldersRepo.remove(confirmDelete.id); await refresh(); toast.success('تم الحذف'); }
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
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginHorizontal: 22, marginBottom: 10, textAlign: 'right' },
  folderIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap', gap: 8 },
  actBtn: { alignItems: 'center', paddingVertical: 4 },
});
