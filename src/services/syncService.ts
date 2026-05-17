/**
 * 同步相關純函式工具。本檔不依賴 React / Zustand，可被 component、
 * service、或測試直接呼叫，便於覆蓋 critical path。
 */

export type SyncableEntity = {
  id: string | number;
  updatedAt?: string | undefined;
  createdAt?: string | undefined;
};

/**
 * 以 updatedAt（無則 fallback createdAt）合併本地與遠端集合。
 *
 * 行為：
 * - 本地獨有：保留（避免遺失離線新建項目）
 * - 遠端獨有：加入
 * - 雙方都有：取 updatedAt 較新者勝出
 * - 時間戳缺失或無效：視為 0
 *
 * 注意：當雙邊時間戳皆為 0 時，本地勝出（保守策略 — 寧可保留本地多餘
 * 副本也不要靜默丟資料）。長期應在 server 補 default now() 或 client
 * 收到 fetch 結果時補 updatedAt 標記為「server truth」。
 */
export const mergeByUpdatedAt = <T extends SyncableEntity>(
  local: readonly T[],
  remote: readonly T[],
): T[] => {
  const map = new Map<T['id'], T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    const localTs = Date.parse(existing.updatedAt ?? existing.createdAt ?? '') || 0;
    const remoteTs = Date.parse(item.updatedAt ?? item.createdAt ?? '') || 0;
    if (remoteTs > localTs) map.set(item.id, item);
  }
  return Array.from(map.values());
};
