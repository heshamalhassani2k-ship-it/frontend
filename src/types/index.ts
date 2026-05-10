/**
 * Core type definitions for the Finance & Debt Management Application
 */

/**
 * Record Types
 */
export type RecordType = 'capped' | 'cumulative';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'wallet' | 'other';

/**
 * Financial Record - Main category for tracking expenses/income
 */
export interface FinancialRecord {
  id: string;
  name: string;
  type: RecordType; // 'capped' = limited budget, 'cumulative' = unlimited tracking
  capAmount?: number; // Only set when type === 'capped'
  color: string; // Hex color code
  icon: string; // Ionicons name
  description?: string;
  archived?: boolean;
  createdAt: string; // ISO 8601 timestamp
  order: number; // Display order
}

/**
 * Financial Operation - Individual transaction within a record
 */
export interface FinancialOperation {
  id: string;
  recordId: string; // Foreign key to FinancialRecord
  amount: number; // Always positive; semantics determined by context
  date: string; // ISO date (YYYY-MM-DD)
  time?: string; // HH:mm format
  hasInvoice: boolean;
  invoiceNumber?: string;
  category: string; // User-defined category
  paymentMethod: PaymentMethod;
  tags: string[]; // User tags for filtering
  description?: string;
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Debt Management - Person who owes or is owed money
 */
export interface DebtPerson {
  id: string;
  name: string;
  phone?: string;
  color: string; // Hex color code
  notes?: string;
  createdAt: string; // ISO 8601 timestamp
  order: number; // Display order
}

/**
 * Debt Folder - Subcategory of debt for a specific person
 * Example: person='Ahmed', folders=['Car Loan', 'Personal Loan']
 */
export interface DebtFolder {
  id: string;
  personId: string; // Foreign key to DebtPerson
  name: string;
  description?: string;
  color: string; // Hex color code
  createdAt: string; // ISO 8601 timestamp
  order: number; // Display order within person's folders
}

/**
 * Debt Operation Type
 */
export type DebtOperationType = 'lend' | 'repay'; // 'lend' = إقراض, 'repay' = سداد

/**
 * Debt Operation - Individual loan/repayment transaction
 */
export interface DebtOperation {
  id: string;
  folderId: string; // Foreign key to DebtFolder
  personId: string; // Foreign key to DebtPerson (denormalized for easier queries)
  amount: number; // Always positive
  date: string; // ISO date (YYYY-MM-DD)
  dueDate?: string; // ISO date (YYYY-MM-DD) - for reminders
  type: DebtOperationType; // 'lend' or 'repay'
  reminder?: boolean; // Whether to remind about due date
  description?: string;
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Activity Types for logging
 */
export type ActivityType = 'fin_op' | 'debt_op' | 'fin_record' | 'debt_person' | 'debt_folder';

/**
 * Activity Log Entry
 */
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  amount?: number;
  date: string; // ISO 8601 timestamp
  meta?: Record<string, any>; // Flexible metadata
}
