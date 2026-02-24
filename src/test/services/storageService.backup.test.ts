import { beforeEach, describe, expect, it } from 'vitest';
import {
  exportAllData,
  importAllData,
  PERSIST_STORE_KEYS,
  STORAGE_KEYS,
  type ExportData
} from '@/services/storageService';

const storage = new Map<string, string>();

describe('storageService backup compatibility', () => {
  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window.localStorage, 'getItem', {
      value: (key: string) => storage.get(key) ?? null,
      configurable: true
    });
    Object.defineProperty(window.localStorage, 'setItem', {
      value: (key: string, value: string) => {
        storage.set(key, value);
      },
      configurable: true
    });
    Object.defineProperty(window.localStorage, 'removeItem', {
      value: (key: string) => {
        storage.delete(key);
      },
      configurable: true
    });
    Object.defineProperty(window.localStorage, 'clear', {
      value: () => {
        storage.clear();
      },
      configurable: true
    });
  });

  it('應該匯出 Zustand persist keys 與 legacy storage keys', async () => {
    const persistedOrderState = { state: { orders: [{ id: 'o-1' }] }, version: 0 };
    storage.set(PERSIST_STORE_KEYS.ORDERS, JSON.stringify(persistedOrderState));
    storage.set(STORAGE_KEYS.ORDERS, JSON.stringify([{ id: 'legacy-o-1' }]));

    const exported = await exportAllData();

    expect(exported.data[PERSIST_STORE_KEYS.ORDERS]).toEqual(persistedOrderState);
    expect(exported.data[STORAGE_KEYS.ORDERS]).toEqual([{ id: 'legacy-o-1' }]);
  });

  it('應該能匯入 persist keys 並寫回 localStorage', async () => {
    const persistedOrderState = { state: { orders: [{ id: 'o-2' }] }, version: 0 };
    const exportedData: ExportData = {
      platform: 'web',
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      data: {
        [PERSIST_STORE_KEYS.ORDERS]: persistedOrderState,
        [STORAGE_KEYS.ORDERS]: [{ id: 'legacy-o-2' }]
      }
    };

    const ok = await importAllData(exportedData);

    expect(ok).toBe(true);
    expect(storage.get(PERSIST_STORE_KEYS.ORDERS)).toBe(JSON.stringify(persistedOrderState));
    expect(storage.get(STORAGE_KEYS.ORDERS)).toBe(JSON.stringify([{ id: 'legacy-o-2' }]));
  });
});
