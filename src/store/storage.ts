/**
 * Local storage repository layer
 * Handles all AsyncStorage operations with CRUD methods for each entity
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FinancialRecord,
  FinancialOperation,
  DebtPerson,
  DebtFolder,
  DebtOperation,
} from '../types';

// Storage keys
const KEYS = {
  records: '@finance:records',
  operations: '@finance:operations',
  persons: '@debt:persons',
  folders: '@debt:folders',
  debtOps: '@debt:operations',
};

/**
 * Generic read function
 */
async function read<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.debug(`Failed to read from storage [${key}]:`, error);
    return [];
  }
}

/**
 * Generic write function
 */
async function write<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Failed to write to storage [${key}]:`, error);
    throw error;
  }
}

/**
 * Generate unique ID (timestamp + random)
 */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * ============== FINANCIAL RECORDS ==============
 */
export const recordsRepo = {
  async list(): Promise<FinancialRecord[]> {
    const items = await read<FinancialRecord>(KEYS.records);
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  async create(
    input: Omit<FinancialRecord, 'id' | 'createdAt' | 'order'>
  ): Promise<FinancialRecord> {
    const items = await read<FinancialRecord>(KEYS.records);
    const rec: FinancialRecord = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
      order: items.length,
    };
    await write(KEYS.records, [...items, rec]);
    return rec;
  },

  async update(
    id: string,
    patch: Partial<Omit<FinancialRecord, 'id' | 'createdAt'>>
  ): Promise<void> {
    const items = await read<FinancialRecord>(KEYS.records);
    await write(
      KEYS.records,
      items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  },

  async remove(id: string): Promise<void> {
    const items = await read<FinancialRecord>(KEYS.records);
    await write(
      KEYS.records,
      items.filter((i) => i.id !== id)
    );
    // Cascade delete operations
    const ops = await read<FinancialOperation>(KEYS.operations);
    await write(
      KEYS.operations,
      ops.filter((op) => op.recordId !== id)
    );
  },

  async get(id: string): Promise<FinancialRecord | undefined> {
    const items = await read<FinancialRecord>(KEYS.records);
    return items.find((i) => i.id === id);
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const items = await read<FinancialRecord>(KEYS.records);
    const map = new Map(items.map((i) => [i.id, i]));
    const next: FinancialRecord[] = [];
    orderedIds.forEach((id, idx) => {
      const it = map.get(id);
      if (it) next.push({ ...it, order: idx });
    });
    items.forEach((it) => {
      if (!orderedIds.includes(it.id)) next.push(it);
    });
    await write(KEYS.records, next);
  },

  async removeMany(ids: string[]): Promise<void> {
    const items = await read<FinancialRecord>(KEYS.records);
    await write(
      KEYS.records,
      items.filter((i) => !ids.includes(i.id))
    );
    const ops = await read<FinancialOperation>(KEYS.operations);
    await write(
      KEYS.operations,
      ops.filter((op) => !ids.includes(op.recordId))
    );
  },
};

/**
 * ============== FINANCIAL OPERATIONS ==============
 */
export const operationsRepo = {
  async list(): Promise<FinancialOperation[]> {
    return read<FinancialOperation>(KEYS.operations);
  },

  async listByRecord(recordId: string): Promise<FinancialOperation[]> {
    const ops = await read<FinancialOperation>(KEYS.operations);
    return ops
      .filter((o) => o.recordId === recordId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  async create(
    input: Omit<FinancialOperation, 'id' | 'createdAt'>
  ): Promise<FinancialOperation> {
    const items = await read<FinancialOperation>(KEYS.operations);
    const op: FinancialOperation = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    await write(KEYS.operations, [...items, op]);
    return op;
  },

  async update(
    id: string,
    patch: Partial<Omit<FinancialOperation, 'id' | 'createdAt'>>
  ): Promise<void> {
    const items = await read<FinancialOperation>(KEYS.operations);
    await write(
      KEYS.operations,
      items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  },

  async remove(id: string): Promise<void> {
    const items = await read<FinancialOperation>(KEYS.operations);
    await write(
      KEYS.operations,
      items.filter((i) => i.id !== id)
    );
  },
};

/**
 * ============== DEBT PERSONS ==============
 */
export const personsRepo = {
  async list(): Promise<DebtPerson[]> {
    const items = await read<DebtPerson>(KEYS.persons);
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  async create(
    input: Omit<DebtPerson, 'id' | 'createdAt' | 'order'>
  ): Promise<DebtPerson> {
    const items = await read<DebtPerson>(KEYS.persons);
    const p: DebtPerson = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
      order: items.length,
    };
    await write(KEYS.persons, [...items, p]);
    return p;
  },

  async update(
    id: string,
    patch: Partial<Omit<DebtPerson, 'id' | 'createdAt'>>
  ): Promise<void> {
    const items = await read<DebtPerson>(KEYS.persons);
    await write(
      KEYS.persons,
      items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  },

  async remove(id: string): Promise<void> {
    const items = await read<DebtPerson>(KEYS.persons);
    await write(
      KEYS.persons,
      items.filter((i) => i.id !== id)
    );
    // Cascade delete folders and operations
    const folders = await read<DebtFolder>(KEYS.folders);
    await write(
      KEYS.folders,
      folders.filter((f) => f.personId !== id)
    );
    const ops = await read<DebtOperation>(KEYS.debtOps);
    await write(
      KEYS.debtOps,
      ops.filter((o) => o.personId !== id)
    );
  },

  async get(id: string): Promise<DebtPerson | undefined> {
    const items = await read<DebtPerson>(KEYS.persons);
    return items.find((i) => i.id === id);
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const items = await read<DebtPerson>(KEYS.persons);
    const map = new Map(items.map((i) => [i.id, i]));
    const next: DebtPerson[] = [];
    orderedIds.forEach((id, idx) => {
      const it = map.get(id);
      if (it) next.push({ ...it, order: idx });
    });
    items.forEach((it) => {
      if (!orderedIds.includes(it.id)) next.push(it);
    });
    await write(KEYS.persons, next);
  },

  async removeMany(ids: string[]): Promise<void> {
    const items = await read<DebtPerson>(KEYS.persons);
    await write(
      KEYS.persons,
      items.filter((i) => !ids.includes(i.id))
    );
    const folders = await read<DebtFolder>(KEYS.folders);
    await write(
      KEYS.folders,
      folders.filter((f) => !ids.includes(f.personId))
    );
    const ops = await read<DebtOperation>(KEYS.debtOps);
    await write(
      KEYS.debtOps,
      ops.filter((o) => !ids.includes(o.personId))
    );
  },
};

/**
 * ============== DEBT FOLDERS ==============
 */
export const foldersRepo = {
  async list(): Promise<DebtFolder[]> {
    return read<DebtFolder>(KEYS.folders);
  },

  async listByPerson(personId: string): Promise<DebtFolder[]> {
    const items = await read<DebtFolder>(KEYS.folders);
    return items
      .filter((i) => i.personId === personId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  async create(
    input: Omit<DebtFolder, 'id' | 'createdAt' | 'order'>
  ): Promise<DebtFolder> {
    const items = await read<DebtFolder>(KEYS.folders);
    const personFolders = items.filter((x) => x.personId === input.personId);
    const f: DebtFolder = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
      order: personFolders.length,
    };
    await write(KEYS.folders, [...items, f]);
    return f;
  },

  async update(
    id: string,
    patch: Partial<Omit<DebtFolder, 'id' | 'createdAt'>>
  ): Promise<void> {
    const items = await read<DebtFolder>(KEYS.folders);
    await write(
      KEYS.folders,
      items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  },

  async remove(id: string): Promise<void> {
    const items = await read<DebtFolder>(KEYS.folders);
    await write(
      KEYS.folders,
      items.filter((i) => i.id !== id)
    );
    // Cascade delete operations
    const ops = await read<DebtOperation>(KEYS.debtOps);
    await write(
      KEYS.debtOps,
      ops.filter((o) => o.folderId !== id)
    );
  },

  async get(id: string): Promise<DebtFolder | undefined> {
    const items = await read<DebtFolder>(KEYS.folders);
    return items.find((i) => i.id === id);
  },
};

/**
 * ============== DEBT OPERATIONS ==============
 */
export const debtOpsRepo = {
  async list(): Promise<DebtOperation[]> {
    return read<DebtOperation>(KEYS.debtOps);
  },

  async listByFolder(folderId: string): Promise<DebtOperation[]> {
    const items = await read<DebtOperation>(KEYS.debtOps);
    return items
      .filter((i) => i.folderId === folderId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  async listByPerson(personId: string): Promise<DebtOperation[]> {
    const items = await read<DebtOperation>(KEYS.debtOps);
    return items.filter((i) => i.personId === personId);
  },

  async create(
    input: Omit<DebtOperation, 'id' | 'createdAt'>
  ): Promise<DebtOperation> {
    const items = await read<DebtOperation>(KEYS.debtOps);
    const o: DebtOperation = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    await write(KEYS.debtOps, [...items, o]);
    return o;
  },

  async update(
    id: string,
    patch: Partial<Omit<DebtOperation, 'id' | 'createdAt'>>
  ): Promise<void> {
    const items = await read<DebtOperation>(KEYS.debtOps);
    await write(
      KEYS.debtOps,
      items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  },

  async remove(id: string): Promise<void> {
    const items = await read<DebtOperation>(KEYS.debtOps);
    await write(
      KEYS.debtOps,
      items.filter((i) => i.id !== id)
    );
  },
};

/**
 * ============== BACKUP & EXPORT ==============
 */
export const backupService = {
  async exportAll(): Promise<string> {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      records: await read(KEYS.records),
      operations: await read(KEYS.operations),
      persons: await read(KEYS.persons),
      folders: await read(KEYS.folders),
      debtOps: await read(KEYS.debtOps),
    };
    return JSON.stringify(data, null, 2);
  },

  async importAll(
    json: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(json);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'صيغة الملف غير صحيحة' };
      }
      if (Array.isArray(data.records)) {
        await write(KEYS.records, data.records);
      }
      if (Array.isArray(data.operations)) {
        await write(KEYS.operations, data.operations);
      }
      if (Array.isArray(data.persons)) {
        await write(KEYS.persons, data.persons);
      }
      if (Array.isArray(data.folders)) {
        await write(KEYS.folders, data.folders);
      }
      if (Array.isArray(data.debtOps)) {
        await write(KEYS.debtOps, data.debtOps);
      }
      return { success: true, message: 'تم الاستيراد بنجاح' };
    } catch (error: any) {
      return {
        success: false,
        message: 'فشل قراءة الملف: ' + (error?.message || 'خطأ غير معروف'),
      };
    }
  },

  async clearAll(): Promise<void> {
    await Promise.all(
      Object.values(KEYS).map((k) => AsyncStorage.removeItem(k))
    );
  },

  async storageSize(): Promise<number> {
    let total = 0;
    for (const k of Object.values(KEYS)) {
      const v = await AsyncStorage.getItem(k);
      if (v) total += v.length;
    }
    return total;
  },
};
