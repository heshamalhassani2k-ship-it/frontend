import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useTheme } from '../theme/ThemeProvider';
import GlassCard from './GlassCard';
import AppButton from './AppButton';

interface ReorderItem { id: string; label: string; sublabel?: string; color?: string; icon?: keyof typeof Ionicons.glyphMap }

interface ReorderModalProps {
  visible: boolean;
  title: string;
  items: ReorderItem[];
  onCancel: () => void;
  onSave: (orderedIds: string[]) => Promise<void> | void;
}

export default function ReorderModal({ visible, title, items, onCancel, onSave }: ReorderModalProps) {
  const { colors } = useTheme();
  const [data, setData] = useState<ReorderItem[]>(items);

  React.useEffect(() => { if (visible) setData(items); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [visible]);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ReorderItem>) => (
    <ScaleDecorator>
      <Pressable
        testID={`reorder-item-${item.id}`}
        onLongPress={drag}
        delayLongPress={120}
        disabled={isActive}
        style={[styles.row, { backgroundColor: isActive ? colors.glassSurfaceStrong : colors.glassSurface, borderColor: colors.glassBorder, opacity: isActive ? 0.95 : 1 }]}
      >
        <Ionicons name="reorder-three" size={22} color={colors.textMuted} />
        {item.icon ? (
          <View style={[styles.iconBox, { backgroundColor: (item.color || colors.accentBrand) + '22' }]}>
            <Ionicons name={item.icon} size={18} color={item.color || colors.accentBrand} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right' }} numberOfLines={1}>{item.label}</Text>
          {item.sublabel ? <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>{item.sublabel}</Text> : null}
        </View>
      </Pressable>
    </ScaleDecorator>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <GlassCard style={styles.sheet} testID="reorder-modal">
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Pressable testID="close-reorder" onPress={onCancel}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12, paddingHorizontal: 20, marginBottom: 8, textAlign: 'right' }}>
            اضغط مطولاً واسحب البطاقة للأعلى أو الأسفل لإعادة ترتيبها.
          </Text>
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {Platform.OS === 'web' ? (
              // Fallback: simple up/down arrows for web (DraggableFlatList relies on RN gesture handler which is finicky on web)
              <WebReorder data={data} setData={setData} renderItem={({ item }) => renderItem({ item, drag: () => {}, isActive: false } as any)} />
            ) : (
              <DraggableFlatList
                data={data}
                onDragEnd={({ data: next }) => setData(next)}
                keyExtractor={(it) => it.id}
                renderItem={renderItem}
                contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
              />
            )}
          </View>
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <AppButton title="إلغاء" variant="ghost" onPress={onCancel} style={{ flex: 1 }} testID="reorder-cancel" />
            <AppButton title="حفظ الترتيب" icon="checkmark" onPress={async () => { await onSave(data.map(d => d.id)); }} style={{ flex: 1 }} testID="reorder-save" />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

function WebReorder({ data, setData, renderItem }: { data: ReorderItem[]; setData: (d: ReorderItem[]) => void; renderItem: any }) {
  const { colors } = useTheme();
  const move = (idx: number, delta: number) => {
    const next = [...data];
    const ni = idx + delta;
    if (ni < 0 || ni >= next.length) return;
    const [item] = next.splice(idx, 1);
    next.splice(ni, 0, item);
    setData(next);
  };
  return (
    <View style={{ gap: 8, paddingBottom: 16 }}>
      {data.map((item, idx) => (
        <View key={item.id} style={[styles.row, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
          <View style={{ flex: 1, marginEnd: 8 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right' }} numberOfLines={1}>{item.label}</Text>
            {item.sublabel ? <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>{item.sublabel}</Text> : null}
          </View>
          <Pressable testID={`reorder-up-${item.id}`} onPressIn={() => move(idx, -1)} style={styles.arrowBtn} disabled={idx === 0}>
            <Ionicons name="chevron-up" size={20} color={idx === 0 ? colors.textMuted : colors.textPrimary} />
          </Pressable>
          <Pressable testID={`reorder-down-${item.id}`} onPressIn={() => move(idx, 1)} style={styles.arrowBtn} disabled={idx === data.length - 1}>
            <Ionicons name="chevron-down" size={20} color={idx === data.length - 1 ? colors.textMuted : colors.textPrimary} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '85%', borderTopWidth: 1 },
  handle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#94A3B8', marginTop: 10, opacity: 0.5 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'right' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  arrowBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row-reverse', gap: 12, padding: 16, borderTopWidth: 1 },
});
