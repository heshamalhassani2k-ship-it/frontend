import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useData } from '../../src/store/DataProvider';
import { useToast } from '../../src/components/Toast';
import GlassCard from '../../src/components/GlassCard';
import ScreenBg from '../../src/components/ScreenBg';
import PieChart from '../../src/components/PieChart';
import RecordForm from '../../src/components/RecordForm';
import OperationForm from '../../src/components/OperationForm';
import { PersonForm, FolderForm, DebtOperationForm } from '../../src/components/DebtForms';
import { recordsRepo, operationsRepo, personsRepo, foldersRepo, debtOpsRepo } from '../../src/store/storage';
import { formatCurrency, formatShortDate, daysUntil } from '../../src/utils/format';
import { CATEGORIES, categoryColors as _cc } from '../../src/utils/constants';
import { categoryColors } from '../../src/theme/colors';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { records, operations, persons, folders, debtOps, refresh } = useData();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showOpForm, setShowOpForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showDebtOpForm, setShowDebtOpForm] = useState(false);

  const stats = useMemo(() => {
    let liquidity = 0;
    records.forEach(r => {
      const ops = operations.filter(o => o.recordId === r.id);
      const total = ops.reduce((s, o) => s + (o.amount || 0), 0);
      if (r.type === 'capped') liquidity += (r.capAmount || 0) - total;
      else liquidity -= total;
    });
    const totalDebt = debtOps.reduce((s, o) => s + (o.type === 'lend' ? o.amount : -o.amount), 0);
    return { liquidity, totalDebt, net: liquidity + totalDebt };
  }, [records, operations, debtOps]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    operations.forEach(op => {
      map[op.category || 'أخرى'] = (map[op.category || 'أخرى'] || 0) + Math.abs(op.amount);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries.map(([label, value], i) => {
      const cat = CATEGORIES.find(c => c.name === label);
      return { label, value, color: cat?.color || categoryColors[i % categoryColors.length] };
    });
  }, [operations]);

  const recentActivities = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; date: string; amount: number; type: 'fin' | 'debt'; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [];
    operations.forEach(op => {
      const rec = records.find(r => r.id === op.recordId);
      const cat = CATEGORIES.find(c => c.name === op.category);
      items.push({
        id: 'op_' + op.id,
        title: op.description || op.category || 'عملية مالية',
        subtitle: rec?.name || 'سجل مالي',
        date: op.date,
        amount: -op.amount,
        type: 'fin',
        icon: cat?.icon || 'wallet-outline',
        color: cat?.color || colors.accentBrand,
      });
    });
    debtOps.forEach(op => {
      const person = persons.find(p => p.id === op.personId);
      items.push({
        id: 'dop_' + op.id,
        title: op.description || (op.type === 'lend' ? 'إقراض' : 'سداد'),
        subtitle: person?.name || 'شخص',
        date: op.date,
        amount: op.type === 'lend' ? -op.amount : op.amount,
        type: 'debt',
        icon: op.type === 'lend' ? 'arrow-up-circle' : 'arrow-down-circle',
        color: op.type === 'lend' ? colors.accentDebt : colors.accentIncome,
      });
    });
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [operations, records, debtOps, persons, colors]);

  const dueReminders = useMemo(() => {
    return debtOps
      .filter(o => o.type === 'lend' && o.dueDate)
      .map(o => ({ ...o, days: daysUntil(o.dueDate) ?? 0, person: persons.find(p => p.id === o.personId) }))
      .filter(o => o.days <= 14)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [debtOps, persons]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const noRecord = records.length === 0;
  const firstRecordId = records[0]?.id;
  const noPerson = persons.length === 0;
  const firstPersonId = persons[0]?.id;
  const firstFolder = folders.find(f => f.personId === firstPersonId);

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBrand} />}
        testID="dashboard-scroll"
      >
        <View style={styles.headerWrap}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>أهلاً بك</Text>
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>لوحة التحكم الذكية</Text>
        </View>

        {/* Hero card */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard style={{ marginHorizontal: 18, marginBottom: 16 }} testID="dashboard-hero-card">
            <View style={{ padding: 22 }}>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>صافي المركز المالي</Text>
              <Text style={[styles.heroValue, { color: stats.net >= 0 ? colors.accentIncome : colors.accentDebt }]} testID="net-balance">
                {formatCurrency(stats.net)}
              </Text>
              <View style={styles.heroSplit}>
                <View style={styles.heroSplitItem}>
                  <Text style={[styles.heroSubLabel, { color: colors.textMuted }]}>السيولة</Text>
                  <Text style={[styles.heroSubValue, { color: colors.textPrimary }]} testID="liquidity-value">{formatCurrency(stats.liquidity)}</Text>
                </View>
                <View style={[styles.heroSplitDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.heroSplitItem}>
                  <Text style={[styles.heroSubLabel, { color: colors.textMuted }]}>الديون المستحقة</Text>
                  <Text style={[styles.heroSubValue, { color: colors.accentDebt }]} testID="debt-value">{formatCurrency(stats.totalDebt)}</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(50).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>إجراءات سريعة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            <QuickAction icon="add-circle" label="سجل مالي" color={colors.accentBrand} onPress={() => setShowRecordForm(true)} testID="qa-add-record" />
            <QuickAction icon="receipt" label="عملية مالية" color={colors.accentIncome} onPress={() => {
              if (noRecord) { toast.warning('أنشئ سجلاً مالياً أولاً'); setShowRecordForm(true); return; }
              setShowOpForm(true);
            }} testID="qa-add-op" />
            <QuickAction icon="person-add" label="شخص دين" color={colors.accentDebt} onPress={() => setShowPersonForm(true)} testID="qa-add-person" />
            <QuickAction icon="cash" label="عملية دين" color={colors.accentWarning} onPress={() => {
              if (noPerson) { toast.warning('أضف شخصاً أولاً'); setShowPersonForm(true); return; }
              if (!firstFolder) { toast.warning('أنشئ سجلاً فرعياً أولاً'); setShowFolderForm(true); return; }
              setShowDebtOpForm(true);
            }} testID="qa-add-debt-op" />
            <QuickAction icon="document-text" label="التقارير" color="#7C3AED" onPress={() => router.push('/(tabs)/records' as any)} testID="qa-reports" />
          </ScrollView>
        </Animated.View>

        {/* Pie + activity */}
        <Animated.View entering={FadeInDown.duration(400).delay(100).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>توزيع المصروفات</Text>
          <GlassCard style={{ marginHorizontal: 18, marginBottom: 16 }} testID="dashboard-pie-card">
            <View style={{ padding: 18, flexDirection: 'row-reverse', alignItems: 'center', gap: 16 }}>
              <PieChart data={categoryData} size={150} hole={45} />
              <View style={{ flex: 1, gap: 8 }}>
                {categoryData.length === 0 ? (
                  <Text style={{ color: colors.textMuted, textAlign: 'right' }}>لا توجد مصروفات بعد</Text>
                ) : categoryData.slice(0, 5).map((c, i) => (
                  <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.color }} />
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', flex: 1, textAlign: 'right' }} numberOfLines={1}>{c.label}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatCurrency(c.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Due reminders */}
        {dueReminders.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(150).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>تنبيهات الاستحقاق</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 12 }}>
              {dueReminders.map((r) => (
                <GlassCard key={r.id} style={{ width: 220 }} testID={`due-card-${r.id}`}>
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="alarm" size={18} color={colors.accentWarning} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '800', flex: 1, textAlign: 'right' }} numberOfLines={1}>{r.person?.name}</Text>
                    </View>
                    <Text style={{ color: colors.accentDebt, fontWeight: '900', fontSize: 18, marginTop: 6, textAlign: 'right' }}>{formatCurrency(r.amount)}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'right' }}>
                      {r.days < 0 ? `متأخر ${Math.abs(r.days)} يوم` : r.days === 0 ? 'اليوم' : `بعد ${r.days} يوم • ${formatShortDate(r.dueDate)}`}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Recent activities */}
        <Animated.View entering={FadeInDown.duration(400).delay(200).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>النشاطات الأخيرة</Text>
          <View style={{ paddingHorizontal: 18, gap: 8 }}>
            {recentActivities.length === 0 ? (
              <GlassCard><View style={{ padding: 24, alignItems: 'center' }}>
                <Ionicons name="time-outline" size={32} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>لا توجد نشاطات بعد</Text>
              </View></GlassCard>
            ) : recentActivities.map((a) => (
              <GlassCard key={a.id} variant="light" testID={`activity-${a.id}`}>
                <View style={{ padding: 14, flexDirection: 'row-reverse', alignItems: 'center' }}>
                  <View style={[styles.activityIcon, { backgroundColor: a.color + '22' }]}>
                    <Ionicons name={a.icon} size={20} color={a.color} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right' }} numberOfLines={1}>{a.title}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>{a.subtitle} • {formatShortDate(a.date)}</Text>
                  </View>
                  <Text style={{ color: a.amount >= 0 ? colors.accentIncome : colors.accentDebt, fontWeight: '800' }}>
                    {formatCurrency(a.amount)}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <RecordForm
        visible={showRecordForm}
        onCancel={() => setShowRecordForm(false)}
        onSubmit={async (d) => { await recordsRepo.create(d); await refresh(); setShowRecordForm(false); toast.success('تم إضافة السجل'); }}
      />
      {firstRecordId && (
        <OperationForm
          visible={showOpForm}
          recordId={firstRecordId}
          onCancel={() => setShowOpForm(false)}
          onSubmit={async (d) => { await operationsRepo.create(d); await refresh(); setShowOpForm(false); toast.success('تمت إضافة العملية'); }}
        />
      )}
      <PersonForm
        visible={showPersonForm}
        onCancel={() => setShowPersonForm(false)}
        onSubmit={async (d) => { await personsRepo.create(d); await refresh(); setShowPersonForm(false); toast.success('تم إضافة الشخص'); }}
      />
      {firstPersonId && (
        <FolderForm
          visible={showFolderForm}
          personId={firstPersonId}
          onCancel={() => setShowFolderForm(false)}
          onSubmit={async (d) => { await foldersRepo.create(d); await refresh(); setShowFolderForm(false); toast.success('تم إضافة السجل'); }}
        />
      )}
      {firstFolder && firstPersonId && (
        <DebtOperationForm
          visible={showDebtOpForm}
          personId={firstPersonId}
          folderId={firstFolder.id}
          onCancel={() => setShowDebtOpForm(false)}
          onSubmit={async (d) => { await debtOpsRepo.create(d); await refresh(); setShowDebtOpForm(false); toast.success('تمت إضافة العملية'); }}
        />
      )}
    </ScreenBg>
  );
}

function QuickAction({ icon, label, color, onPress, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
      <GlassCard variant="light" style={{ width: 90, marginRight: 6 }}>
        <View style={{ alignItems: 'center', padding: 12 }}>
          <View style={[styles.qaIcon, { backgroundColor: color + '22' }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' }}>{label}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 14 },
  greeting: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  appTitle: { fontSize: 26, fontWeight: '900', marginTop: 4, textAlign: 'right' },
  heroLabel: { fontSize: 12, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1.5 },
  heroValue: { fontSize: 38, fontWeight: '900', marginTop: 6, textAlign: 'right' },
  heroSplit: { flexDirection: 'row-reverse', marginTop: 18, alignItems: 'stretch' },
  heroSplitItem: { flex: 1, paddingHorizontal: 4 },
  heroSplitDivider: { width: 1, marginHorizontal: 8 },
  heroSubLabel: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  heroSubValue: { fontSize: 16, fontWeight: '800', marginTop: 4, textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginHorizontal: 22, marginTop: 12, marginBottom: 12, textAlign: 'right' },
  quickRow: { paddingHorizontal: 18, gap: 6, paddingVertical: 4 },
  qaIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activityIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
