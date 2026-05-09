import { Ionicons } from '@expo/vector-icons';

export const QUICK_AMOUNTS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

export const CATEGORIES: { name: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { name: 'طعام', icon: 'fast-food', color: '#F59E0B' },
  { name: 'مواصلات', icon: 'car', color: '#0EA5E9' },
  { name: 'تسوق', icon: 'bag-handle', color: '#EC4899' },
  { name: 'صحة', icon: 'medkit', color: '#10B981' },
  { name: 'فواتير', icon: 'receipt', color: '#6366F1' },
  { name: 'ترفيه', icon: 'game-controller', color: '#A855F7' },
  { name: 'تعليم', icon: 'school', color: '#0284C7' },
  { name: 'سكن', icon: 'home', color: '#84CC16' },
  { name: 'رواتب', icon: 'wallet', color: '#059669' },
  { name: 'أخرى', icon: 'ellipsis-horizontal', color: '#64748B' },
];

export const PAYMENT_METHODS: { id: 'cash' | 'card' | 'transfer' | 'wallet' | 'other'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'cash', label: 'نقداً', icon: 'cash' },
  { id: 'card', label: 'بطاقة', icon: 'card' },
  { id: 'transfer', label: 'تحويل', icon: 'swap-horizontal' },
  { id: 'wallet', label: 'محفظة', icon: 'wallet' },
  { id: 'other', label: 'أخرى', icon: 'ellipsis-horizontal' },
];

export const RECORD_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'wallet', 'card', 'cash', 'home', 'cart', 'briefcase',
  'restaurant', 'car', 'airplane', 'gift', 'bookmark', 'star',
  'heart', 'medkit', 'school', 'business',
];

export const COLOR_PALETTE = [
  '#0284C7', '#059669', '#E11D48', '#D97706', '#7C3AED',
  '#DB2777', '#0D9488', '#F59E0B', '#6366F1', '#84CC16',
  '#EA580C', '#0EA5E9', '#A855F7', '#10B981',
];
