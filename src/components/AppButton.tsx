import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  full?: boolean;
}

export default function AppButton({ title, onPress, variant = 'primary', icon, loading, disabled, style, testID, full }: AppButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  const bg = isPrimary ? colors.accentBrand
    : isDanger ? colors.accentDebt
    : isGhost ? 'transparent'
    : colors.glassSurfaceStrong;
  const txt = isPrimary || isDanger ? '#fff' : colors.textPrimary;
  const border = isGhost ? colors.glassBorder : 'transparent';

  return (
    <Pressable
      testID={testID}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: isGhost ? 1 : 0, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        full ? { alignSelf: 'stretch' } : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={txt} /> : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={txt} style={{ marginHorizontal: 6 }} /> : null}
          <Text style={[styles.txt, { color: txt }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  txt: { fontSize: 15, fontWeight: '800' },
});
