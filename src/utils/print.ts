import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { FinancialRecord, FinancialOperation, DebtPerson, DebtFolder, DebtOperation } from '../types';
import { formatCurrency, formatShortDate } from './format';

const baseStyles = `
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
    direction: rtl;
    text-align: right;
    color: #0f172a;
    margin: 0;
    padding: 0;
  }
  .header {
    display: flex; flex-direction: row-reverse; justify-content: space-between; align-items: center;
    padding-bottom: 12px; border-bottom: 3px solid #0284C7; margin-bottom: 18px;
  }
  .title { font-size: 22px; font-weight: 800; color: #0f172a; }
  .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
  .meta { font-size: 11px; color: #475569; }
  .stats {
    display: flex; flex-direction: row-reverse; gap: 10px; margin: 14px 0 18px 0;
  }
  .stat {
    flex: 1; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;
  }
  .stat .label { font-size: 10px; color: #64748b; font-weight: 700; }
  .stat .value { font-size: 16px; color: #0f172a; font-weight: 800; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; direction: rtl; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; vertical-align: middle; font-size: 12px; word-wrap: break-word; }
  th { background: #0f172a; color: #fff; font-weight: 700; font-size: 12px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .num { width: 36px; text-align: center; }
  .amount-pos { color: #059669; font-weight: 700; }
  .amount-neg { color: #e11d48; font-weight: 700; }
  .desc { color: #334155; }
`;

function escape(s?: string): string {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function buildFinancialRecordHTML(record: FinancialRecord, ops: FinancialOperation[]): string {
  const total = ops.reduce((s, o) => s + (o.amount || 0), 0);
  const remaining = record.type === 'capped' ? (record.capAmount || 0) - total : 0;
  const opCount = ops.length;
  const today = new Date();

  const statsHtml = record.type === 'capped'
    ? `
      <div class="stat"><div class="label">سقف الميزانية</div><div class="value">${escape(formatCurrency(record.capAmount || 0))}</div></div>
      <div class="stat"><div class="label">إجمالي المنصرف</div><div class="value">${escape(formatCurrency(total))}</div></div>
      <div class="stat"><div class="label">المتبقي</div><div class="value">${escape(formatCurrency(remaining))}</div></div>
      <div class="stat"><div class="label">عدد العمليات</div><div class="value">${opCount}</div></div>
    `
    : `
      <div class="stat"><div class="label">الإجمالي التراكمي</div><div class="value">${escape(formatCurrency(total))}</div></div>
      <div class="stat"><div class="label">عدد العمليات</div><div class="value">${opCount}</div></div>
    `;

  const hasInvoice = ops.some(o => o.hasInvoice);
  const headers = ['م', 'المبلغ', 'التاريخ', ...(hasInvoice ? ['رقم الفاتورة'] : []), 'البيان', 'التصنيف'];

  const rows = ops.map((op, idx) => `
    <tr>
      <td class="num">${idx + 1}</td>
      <td class="amount-neg">${escape(formatCurrency(op.amount))}</td>
      <td>${escape(formatShortDate(op.date))}</td>
      ${hasInvoice ? `<td>${escape(op.invoiceNumber || '-')}</td>` : ''}
      <td class="desc">${escape(op.description || '-')}</td>
      <td>${escape(op.category || '-')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${escape(record.name)}</title><style>${baseStyles}</style></head>
  <body>
    <div class="header">
      <div>
        <div class="title">${escape(record.name)}</div>
        <div class="subtitle">${escape(record.description || '')}</div>
      </div>
      <div class="meta">
        <div>تاريخ الطباعة: ${formatShortDate(today.toISOString())}</div>
        <div>نوع السجل: ${record.type === 'capped' ? 'بسقف' : 'تراكمي'}</div>
      </div>
    </div>
    <div class="stats">${statsHtml}</div>
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${headers.length}" style="text-align:center;color:#64748b;padding:20px;">لا توجد عمليات</td></tr>`}</tbody>
    </table>
  </body></html>`;
}

export function buildDebtFolderHTML(person: DebtPerson, folder: DebtFolder, ops: DebtOperation[]): string {
  const lent = ops.filter(o => o.type === 'lend').reduce((s, o) => s + o.amount, 0);
  const repaid = ops.filter(o => o.type === 'repay').reduce((s, o) => s + o.amount, 0);
  const balance = lent - repaid;
  const today = new Date();

  const rows = ops.map((op, idx) => `
    <tr>
      <td class="num">${idx + 1}</td>
      <td class="${op.type === 'lend' ? 'amount-neg' : 'amount-pos'}">${escape(formatCurrency(op.amount))}</td>
      <td>${escape(formatShortDate(op.date))}</td>
      <td>${op.type === 'lend' ? 'إقراض' : 'سداد'}</td>
      <td class="desc">${escape(op.description || '-')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${escape(folder.name)}</title><style>${baseStyles}</style></head>
  <body>
    <div class="header">
      <div>
        <div class="title">${escape(folder.name)}</div>
        <div class="subtitle">الشخص: ${escape(person.name)}${person.phone ? ' • ' + escape(person.phone) : ''}</div>
        <div class="subtitle">${escape(folder.description || '')}</div>
      </div>
      <div class="meta">
        <div>تاريخ الطباعة: ${formatShortDate(today.toISOString())}</div>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="label">إجمالي الإقراض</div><div class="value">${escape(formatCurrency(lent))}</div></div>
      <div class="stat"><div class="label">إجمالي السداد</div><div class="value">${escape(formatCurrency(repaid))}</div></div>
      <div class="stat"><div class="label">الرصيد المستحق</div><div class="value">${escape(formatCurrency(balance))}</div></div>
      <div class="stat"><div class="label">عدد العمليات</div><div class="value">${ops.length}</div></div>
    </div>
    <table>
      <thead><tr><th>م</th><th>المبلغ</th><th>التاريخ</th><th>نوع العملية</th><th>البيان</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">لا توجد عمليات</td></tr>`}</tbody>
    </table>
  </body></html>`;
}

export function buildPersonStatementHTML(person: DebtPerson, folders: DebtFolder[], ops: DebtOperation[]): string {
  const lent = ops.filter(o => o.type === 'lend').reduce((s, o) => s + o.amount, 0);
  const repaid = ops.filter(o => o.type === 'repay').reduce((s, o) => s + o.amount, 0);
  const balance = lent - repaid;
  const today = new Date();

  const sections = folders.map(f => {
    const fOps = ops.filter(o => o.folderId === f.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const fLent = fOps.filter(o => o.type === 'lend').reduce((s, o) => s + o.amount, 0);
    const fRepaid = fOps.filter(o => o.type === 'repay').reduce((s, o) => s + o.amount, 0);
    const rows = fOps.map((op, idx) => `
      <tr>
        <td class="num">${idx + 1}</td>
        <td class="${op.type === 'lend' ? 'amount-neg' : 'amount-pos'}">${escape(formatCurrency(op.amount))}</td>
        <td>${escape(formatShortDate(op.date))}</td>
        <td>${op.type === 'lend' ? 'إقراض' : 'سداد'}</td>
        <td class="desc">${escape(op.description || '-')}</td>
      </tr>`).join('');
    return `
      <h3 style="margin:18px 0 6px 0; color:#0284C7;">${escape(f.name)} — رصيد: ${escape(formatCurrency(fLent - fRepaid))}</h3>
      <table>
        <thead><tr><th>م</th><th>المبلغ</th><th>التاريخ</th><th>نوع العملية</th><th>البيان</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:14px;">لا توجد عمليات</td></tr>`}</tbody>
      </table>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>كشف حساب ${escape(person.name)}</title><style>${baseStyles}</style></head>
  <body>
    <div class="header">
      <div>
        <div class="title">كشف حساب: ${escape(person.name)}</div>
        <div class="subtitle">${person.phone ? escape(person.phone) : ''}${person.notes ? ' • ' + escape(person.notes) : ''}</div>
      </div>
      <div class="meta"><div>تاريخ الطباعة: ${formatShortDate(today.toISOString())}</div></div>
    </div>
    <div class="stats">
      <div class="stat"><div class="label">إجمالي الإقراض</div><div class="value">${escape(formatCurrency(lent))}</div></div>
      <div class="stat"><div class="label">إجمالي السداد</div><div class="value">${escape(formatCurrency(repaid))}</div></div>
      <div class="stat"><div class="label">الرصيد المستحق</div><div class="value">${escape(formatCurrency(balance))}</div></div>
    </div>
    ${sections || '<p style="color:#64748b;text-align:center;">لا توجد سجلات.</p>'}
  </body></html>`;
}

export async function printHTML(html: string): Promise<void> {
  await Print.printAsync({ html });
}

export async function shareHTMLAsPDF(html: string, fileName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (Platform.OS === 'web') {
    // Web: open in new tab
    if (typeof window !== 'undefined') {
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
    }
    return;
  }
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' });
  }
}
