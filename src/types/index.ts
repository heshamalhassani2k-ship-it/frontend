// Domain types for the Finance & Debt app

export type RecordType = 'capped' | 'cumulative';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'wallet' | 'other';

export interface FinancialRecord {
  id: string;
  name: string;
  type: RecordType;
  capAmount?: number; // only when type === capped
  color: string;
  icon: string; // Ionicons name
  description?: string;
  archived?: boolean;
  createdAt: string;
  order: number;
}

export interface FinancialOperation {
  id: string;
  recordId: string;
  amount: number; // positive = expense; we treat as decreasing for capped, accumulating for cumulative
  date: string; // ISO date
  time?: string; // HH:mm
  hasInvoice: boolean;
  invoiceNumber?: string;
  category: string;
  paymentMethod: PaymentMethod;
  tags: string[];
  description?: string;
  createdAt: string;
}

export interface DebtPerson {
  id: string;
  name: string;
  phone?: string;
  color: string;
  notes?: string;
  createdAt: string;
  order: number;
}

export interface DebtFolder {
  id: string;
  personId: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  order: number;
}

export type DebtOperationType = 'lend' | 'repay'; // إقراض / سداد

export interface DebtOperation {
  id: string;
  folderId: string;
  personId: string;
  amount: number;
  date: string; // ISO
  dueDate?: string; // ISO
  type: DebtOperationType;
  reminder?: boolean;
  description?: string;
  createdAt: string;
}

export type ActivityType = 'fin_op' | 'debt_op' | 'fin_record' | 'debt_person' | 'debt_folder';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  amount?: number;
  date: string;
  meta?: Record<string, any>;
}
