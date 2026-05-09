import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  recordsRepo, operationsRepo, personsRepo, foldersRepo, debtOpsRepo,
} from '../store/storage';
import {
  FinancialRecord, FinancialOperation, DebtPerson, DebtFolder, DebtOperation,
} from '../types';

interface DataContextValue {
  records: FinancialRecord[];
  operations: FinancialOperation[];
  persons: DebtPerson[];
  folders: DebtFolder[];
  debtOps: DebtOperation[];
  ready: boolean;
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

  const refresh = useCallback(async () => {
    const [r, o, p, f, d] = await Promise.all([
      recordsRepo.list(),
      operationsRepo.list(),
      personsRepo.list(),
      foldersRepo.list(),
      debtOpsRepo.list(),
    ]);
    setRecords(r); setOperations(o); setPersons(p); setFolders(f); setDebtOps(d);
    setReady(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({ records, operations, persons, folders, debtOps, ready, refresh }), [records, operations, persons, folders, debtOps, ready, refresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
