// Currency / number / date formatting helpers (Arabic-friendly)

export function formatCurrency(amount: number, currency = 'ر.س'): string {
  const sign = amount < 0 ? '-' : '';
  const v = Math.abs(amount);
  const fixed = v.toLocaleString('en-US', { minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
  return `${sign}${fixed} ${currency}`;
}

export function formatNumber(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function formatTime(iso?: string, time?: string): string {
  if (time) return time;
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const ms = d.setHours(0,0,0,0) - now.setHours(0,0,0,0);
  return Math.round(ms / (1000*60*60*24));
}
