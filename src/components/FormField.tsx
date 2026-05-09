import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export default function FormField({ label, error, containerStyle, required, style, ...rest }: FormFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}{required ? <Text style={{ color: colors.accentDebt }}>  *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.accentDebt : colors.glassBorder,
            color: colors.textPrimary,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.err, { color: colors.accentDebt }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '600', textAlign: 'right',
  },
  err: { fontSize: 12, marginTop: 4, fontWeight: '700', textAlign: 'right' },
});
