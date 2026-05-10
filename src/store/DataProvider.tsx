/**
 * Global Data Provider
 * Manages all app data state (records, operations, persons, folders, debt operations)
 * Provides a refresh mechanism to sync with storage
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  recordsRepo,
  operationsRepo,
  personsRepo,
  foldersRepo,
  debtOpsRepo,
} from './storage';
import {
  FinancialRecord,
  FinancialOperation,
  DebtPerson,
  DebtFolder,
  DebtOperation,
} from '../types';

interface DataContextValue {
  // Financial data
  records: FinancialRecord[];
  operations: FinancialOperation[];
  // Debt data
  persons: DebtPerson[];
  folders: DebtFolder[];
  debtOps: DebtOperation[];
  // State
  ready: boolean;
  loading: boolean;
  // Methods
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [operations, setOperations] = useState<FinancialOperation[]>([]);
  const [persons, setPersons] = useState<DebtPerson[]>([]);
  const [folders, setFolders] = useState<DebtFolder[]>([]);
  const [debtOps, setDebtOps] = useState<DebtOperation[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refresh all data from storage
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [r, o, p, f, d] = await Promise.all([
        recordsRepo.list(),
        operationsRepo.list(),
        personsRepo.list(),
        foldersRepo.list(),
        debtOpsRepo.list(),
      ]);
      setRecords(r);
      setOperations(o);
      setPersons(p);
      setFolders(f);
      setDebtOps(d);
      setReady(true);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setReady(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<DataContextValue>(
    () => ({
      records,
      operations,
      persons,
      folders,
      debtOps,
      ready,
      loading,
      refresh,
    }),
    [records, operations, persons, folders, debtOps, ready, loading, refresh]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within DataProvider');
  }
  return ctx;
}
