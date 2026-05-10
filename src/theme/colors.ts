/**
 * Theme color palette for light and dark modes
 * All colors are carefully chosen for accessibility and visual hierarchy
 */

export type ThemeMode = 'light' | 'dark';

export const palette = {
  light: {
    background: '#F0F4F8',
    backgroundGradient: ['#E2E8F0', '#F8FAFC', '#E0E7FF'] as [string, string, string],
    glassSurface: 'rgba(255, 255, 255, 0.72)',
    glassSurfaceStrong: 'rgba(255, 255, 255, 0.92)',
    glassBorder: 'rgba(255, 255, 255, 0.7)',
    cardShadow: 'rgba(15, 23, 42, 0.08)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    accentBrand: '#0284C7',
    accentIncome: '#059669',
    accentDebt: '#E11D48',
    accentWarning: '#D97706',
    divider: 'rgba(15, 23, 42, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.85)',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    background: '#020617',
    backgroundGradient: ['#0F172A', '#020617', '#1E1B4B'] as [string, string, string],
    glassSurface: 'rgba(30, 41, 59, 0.72)',
    glassSurfaceStrong: 'rgba(30, 41, 59, 0.92)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    accentBrand: '#38BDF8',
    accentIncome: '#34D399',
    accentDebt: '#FB7185',
    accentWarning: '#FBBF24',
    divider: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(15, 23, 42, 0.65)',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
};

// Category colors for financial operations
export const categoryColors = [
  '#0284C7', '#059669', '#E11D48', '#D97706', '#7C3AED',
  '#DB2777', '#0D9488', '#F59E0B', '#6366F1', '#84CC16',
];

export type ThemeColors = typeof palette.light;
