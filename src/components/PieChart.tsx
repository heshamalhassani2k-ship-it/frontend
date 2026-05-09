import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

interface Slice { value: number; color: string; label: string; }

export default function PieChart({ data, size = 180, hole = 60, style }: { data: Slice[]; size?: number; hole?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2;

  if (total === 0) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size}>
          <Circle cx={radius} cy={radius} r={radius - 4} fill="transparent" stroke={colors.divider} strokeWidth={4} />
        </Svg>
      </View>
    );
  }

  let acc = 0;
  const paths = data.map((d, i) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = radius + radius * Math.cos(start);
    const y1 = radius + radius * Math.sin(start);
    const x2 = radius + radius * Math.cos(end);
    const y2 = radius + radius * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    const path = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    return <Path key={i} d={path} fill={d.color} />;
  });

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <G>{paths}</G>
        {hole > 0 ? <Circle cx={radius} cy={radius} r={hole} fill={colors.glassSurfaceStrong} /> : null}
      </Svg>
    </View>
  );
}

export const styles = StyleSheet.create({});
