import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLOR_PALETTE, RECORD_ICONS } from '../utils/constants';

interface IconColorPickerProps {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  onChangeColor: (c: string) => void;
  onChangeIcon: (i: keyof typeof Ionicons.glyphMap) => void;
}

export default function IconColorPicker({ color, icon, onChangeColor, onChangeIcon }: IconColorPickerProps) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>اللون</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {COLOR_PALETTE.map((c) => (
          <Pressable key={c} testID={`color-${c}`} onPress={() => onChangeColor(c)}
            style={[styles.colorDot, { backgroundColor: c, borderColor: color === c ? colors.textPrimary : 'transparent' }]} />
        ))}
      </ScrollView>
      <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>الأيقونة</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {RECORD_ICONS.map((ic) => (
          <Pressable key={ic} testID={`icon-${ic}`} onPress={() => onChangeIcon(ic)}
            style={[styles.iconBtn, { borderColor: icon === ic ? color : colors.glassBorder, backgroundColor: icon === ic ? color + '22' : 'transparent' }]}>
            <Ionicons name={ic} size={22} color={icon === ic ? color : colors.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'right' },
  row: { gap: 10, paddingVertical: 4, paddingHorizontal: 2 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
