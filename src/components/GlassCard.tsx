import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeProvider';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  variant?: 'heavy' | 'light';
  testID?: string;
}

export default function GlassCard({ children, style, intensity, variant = 'heavy', testID }: GlassCardProps) {
  const { colors, mode } = useTheme();
  const radius = variant === 'heavy' ? 24 : 16;
  const intensityValue = intensity ?? (variant === 'heavy' ? 60 : 35);

  return (
    <View
      testID={testID}
      style={[
        styles.shadowWrap,
        { shadowColor: colors.cardShadow, borderRadius: radius },
        style,
      ]}
    >
      <View
        style={[
          styles.clip,
          {
            borderRadius: radius,
            borderColor: colors.glassBorder,
            backgroundColor: Platform.OS === 'web' ? colors.glassSurface : 'transparent',
          },
        ]}
      >
        {Platform.OS !== 'web' ? (
          <BlurView
            intensity={intensityValue}
            tint={mode === 'dark' ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.glassSurface, borderRadius: radius },
          ]}
        />
        <View style={{ borderRadius: radius }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  clip: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
