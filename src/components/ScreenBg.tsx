import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

interface ScreenBgProps { children: React.ReactNode; style?: ViewStyle; }

export default function ScreenBg({ children, style }: ScreenBgProps) {
  const { colors, mode } = useTheme();
  const grad = colors.backgroundGradient;
  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={grad[0]} stopOpacity="1" />
            <Stop offset="0.5" stopColor={grad[1]} stopOpacity="1" />
            <Stop offset="1" stopColor={grad[2]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>
      {/* soft glow blobs */}
      <View pointerEvents="none" style={[styles.blob, { backgroundColor: colors.accentBrand, opacity: mode === 'dark' ? 0.18 : 0.22, top: -120, right: -80 }]} />
      <View pointerEvents="none" style={[styles.blob, { backgroundColor: mode === 'dark' ? '#7C3AED' : '#A78BFA', opacity: mode === 'dark' ? 0.22 : 0.16, bottom: -130, left: -100 }]} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 200 },
});
