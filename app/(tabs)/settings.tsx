import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useData } from '../../src/store/DataProvider';
import { useToast } from '../../src/components/Toast';
import { useSecurity } from '../../src/store/SecurityProvider';
import GlassCard from '../../src/components/GlassCard';
import ScreenBg from '../../src/components/ScreenBg';
import AppButton from '../../src/components/AppButton';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import { backupService } from '../../src/store/storage';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { records, operations, persons, folders, debtOps, refresh } = useData();
  const toast = useToast();
  const security = useSecurity();
  const [storageSize, setStorageSize] = useState(0);
  const [importVisible, setImportVisible] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { backupService.storageSize().then(setStorageSize); }, [records, operations, persons, folders, debtOps]);

  const exportData = async () => {
    try {
      const json = await backupService.exportAll();
      const fileName = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
        toast.success('تم تصدير النسخة الاحتياطية');
        return;
      }
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const path = dir + fileName;
      await FileSystem.writeAsStringAsync(path, json);
      const ok = await Sharing.isAvailableAsync();
      if (ok) await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'تصدير النسخة الاحتياطية' });
      toast.success('تم التصدير بنجاح');
    } catch (e: any) {
      toast.error('فشل التصدير: ' + (e?.message || ''));
    }
  };

  const importData = async () => {
    if (!importJson.trim()) { toast.error('الصق محتوى النسخة'); return; }
    const res = await backupService.importAll(importJson.trim());
    if (res.success) { await refresh(); toast.success(res.message); setImportVisible(false); setImportJson(''); }
    else toast.error(res.message);
  };

  const sizeKb = (storageSize / 1024).toFixed(2);
  const totalRows = records.length + operations.length + persons.length + folders.length + debtOps.length;

  const exportSourceCode = async () => {
    const base = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    const url = `${base}/api/export-source`;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.open(url, '_blank');
        toast.success('جارٍ تحميل ملفات المشروع...');
        return;
      }
      // Native: download to cache then open share sheet
      toast.info('جارٍ التحميل...');
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const fileName = `finance-app-source-${new Date().toISOString().slice(0, 10)}.zip`;
      const target = dir + fileName;
      const res = await FileSystem.downloadAsync(url, target);
      if (res.status !== 200) throw new Error('فشل التحميل');
      const ok = await Sharing.isAvailableAsync();
      if (ok) {
        await Sharing.shareAsync(res.uri, { mimeType: 'application/zip', dialogTitle: 'حفظ ملفات المشروع', UTI: 'public.zip-archive' });
      } else {
        await Linking.openURL(url);
      }
      toast.success('تم تجهيز الملف');
    } catch (e: any) {
      toast.error('فشل التصدير: ' + (e?.message || ''));
    }
  };

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 110 }} testID="settings-scroll">
        <View style={styles.headerWrap}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>الإعدادات</Text>
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>إعدادات التطبيق</Text>
        </View>

        {/* Appearance */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <Section title="المظهر" icon="color-palette">
            <View style={styles.row}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={22} color={colors.accentBrand} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{mode === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}</Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>تبديل بين الوضعين</Text>
                </View>
              </View>
              <Pressable testID="theme-toggle" onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                style={[styles.toggle, { backgroundColor: mode === 'dark' ? colors.accentBrand : colors.divider }]}>
                <View style={[styles.toggleDot, { transform: [{ translateX: mode === 'dark' ? -20 : 0 }] }]} />
              </Pressable>
            </View>
          </Section>
        </Animated.View>

        {/* Security */}
        <Animated.View entering={FadeInDown.duration(400).delay(40).springify()}>
          <Section title="إعدادات الحماية" icon="shield-checkmark">
            <View style={styles.row}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                <Ionicons name="finger-print" size={22} color={colors.accentBrand} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>تفعيل البصمة</Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                    {security.hasHardware ? (security.isEnrolled ? 'الجهاز يدعم البصمة' : 'لم يتم تسجيل بصمة') : 'الجهاز لا يدعم البصمة'}
                  </Text>
                </View>
              </View>
              <Pressable testID="biometric-toggle"
                onPress={async () => {
                  const ok = await security.setEnabled(!security.enabled);
                  if (ok) toast.success(security.enabled ? 'تم تعطيل البصمة' : 'تم تفعيل البصمة');
                }}
                style={[styles.toggle, { backgroundColor: security.enabled ? colors.accentBrand : colors.divider }]}>
                <View style={[styles.toggleDot, { transform: [{ translateX: security.enabled ? -20 : 0 }] }]} />
              </Pressable>
            </View>
            {security.enabled && (
              <>
                <SubToggle
                  label="حماية حذف السجلات" testID="protect-delete-record"
                  value={security.protected.deleteRecord}
                  onChange={(v) => security.setProtected('deleteRecord', v)}
                />
                <SubToggle
                  label="حماية حذف الأشخاص" testID="protect-delete-person"
                  value={security.protected.deletePerson}
                  onChange={(v) => security.setProtected('deletePerson', v)}
                />
                <SubToggle
                  label="حماية تعديل سقف الميزانية" testID="protect-edit-cap"
                  value={security.protected.editCap}
                  onChange={(v) => security.setProtected('editCap', v)}
                />
              </>
            )}
          </Section>
        </Animated.View>

        {/* Storage */}
        <Animated.View entering={FadeInDown.duration(400).delay(60).springify()}>
          <Section title="إدارة التخزين" icon="server">
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>حجم البيانات</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]} testID="storage-size">{sizeKb} KB</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>عدد العناصر</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{totalRows}</Text>
            </View>
          </Section>
        </Animated.View>

        {/* Backup */}
        <Animated.View entering={FadeInDown.duration(400).delay(120).springify()}>
          <Section title="النسخ الاحتياطي" icon="cloud-download">
            <View style={{ gap: 10, padding: 14 }}>
              <AppButton title="تصدير النسخة الاحتياطية" icon="download" onPress={exportData} testID="export-backup-btn" />
              <AppButton title="استيراد النسخة" icon="cloud-upload" variant="secondary" onPress={() => setImportVisible(true)} testID="import-backup-btn" />
              <AppButton title="مسح جميع البيانات" icon="trash" variant="danger" onPress={() => setConfirmReset(true)} testID="clear-data-btn" />
            </View>
          </Section>
        </Animated.View>

        {/* Export Source Code */}
        <Animated.View entering={FadeInDown.duration(400).delay(150).springify()}>
          <Section title="تنزيل كود المشروع" icon="code-slash">
            <View style={{ padding: 14, gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'right', lineHeight: 20 }}>
                تنزيل جميع ملفات ومجلدات المشروع كملف مضغوط (zip) — يشمل الكود المصدري للواجهة والخادم.
              </Text>
              <AppButton title="تنزيل ملفات المشروع (.zip)" icon="archive" onPress={exportSourceCode} testID="export-source-btn" />
            </View>
          </Section>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.duration(400).delay(180).springify()}>
          <Section title="عن التطبيق" icon="information-circle">
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>الإصدار</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>1.0.0</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>اللغة</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>العربية (RTL)</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>التخزين</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>محلي</Text>
            </View>
          </Section>
        </Animated.View>
      </ScrollView>

      {/* Import modal */}
      <Modal visible={importVisible} animationType="slide" transparent onRequestClose={() => setImportVisible(false)}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <GlassCard style={styles.sheet} testID="import-modal">
              <View style={styles.handle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>استيراد النسخة</Text>
                <Pressable testID="close-import" onPress={() => setImportVisible(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.textSecondary, marginBottom: 10, textAlign: 'right' }}>الصق محتوى ملف JSON المُصدَّر:</Text>
                <TextInput
                  testID="import-json-input"
                  value={importJson}
                  onChangeText={setImportJson}
                  multiline
                  placeholder="{...}"
                  placeholderTextColor={colors.textMuted}
                  style={[{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.glassBorder },
                    styles.textarea]}
                />
                <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 14 }}>
                  <AppButton title="استيراد" icon="checkmark" onPress={importData} full style={{ flex: 1 }} testID="confirm-import-btn" />
                  <AppButton title="إلغاء" variant="ghost" onPress={() => setImportVisible(false)} style={{ flex: 1 }} />
                </View>
              </View>
            </GlassCard>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmReset}
        title="مسح جميع البيانات"
        message="سيتم حذف جميع السجلات والعمليات والديون نهائياً. لا يمكن التراجع. هل أنت متأكد؟"
        destructive
        confirmText="مسح الكل"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await backupService.clearAll();
          await refresh();
          toast.success('تم مسح جميع البيانات');
          setConfirmReset(false);
        }}
      />
    </ScreenBg>
  );
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginHorizontal: 18, marginBottom: 14 }}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.accentBrand} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      <GlassCard><View>{children}</View></GlassCard>
    </View>
  );
}

function SubToggle({ label, value, onChange, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowTitle, { color: colors.textPrimary, paddingStart: 30 }]}>↳ {label}</Text>
      <Pressable testID={testID} onPress={() => onChange(!value)}
        style={[styles.toggle, { backgroundColor: value ? colors.accentBrand : colors.divider }]}>
        <View style={[styles.toggleDot, { transform: [{ translateX: value ? -20 : 0 }] }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 14 },
  greeting: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  appTitle: { fontSize: 26, fontWeight: '900', marginTop: 4, textAlign: 'right' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textAlign: 'right' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  rowSub: { fontSize: 11, marginTop: 2, textAlign: 'right' },
  rowValue: { fontSize: 14, fontWeight: '700' },
  toggle: { width: 50, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center', alignItems: 'flex-end' },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  overlay: { flex: 1 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', borderTopWidth: 1 },
  handle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#94A3B8', marginTop: 10, opacity: 0.5 },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'right' },
  textarea: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 200, textAlignVertical: 'top', textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
});
