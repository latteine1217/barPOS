import { describe, expect, it } from 'vitest';
import { mergeByUpdatedAt } from '@/services/syncService';

type Item = { id: string; name: string; updatedAt?: string; createdAt?: string };

const make = (id: string, name: string, updatedAt?: string, createdAt?: string): Item => ({
  id,
  name,
  ...(updatedAt !== undefined ? { updatedAt } : {}),
  ...(createdAt !== undefined ? { createdAt } : {}),
});

describe('mergeByUpdatedAt', () => {
  it('local 獨有 → 保留（防離線單被吞）', () => {
    const local: Item[] = [make('a', 'local-A', '2026-01-01T00:00:00Z')];
    const remote: Item[] = [];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'a', name: 'local-A' });
  });

  it('remote 獨有 → 加入', () => {
    const local: Item[] = [];
    const remote: Item[] = [make('b', 'remote-B', '2026-01-01T00:00:00Z')];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'b', name: 'remote-B' });
  });

  it('雙方都有 + remote 較新 → remote 勝出', () => {
    const local: Item[] = [make('a', 'local-old', '2026-01-01T00:00:00Z')];
    const remote: Item[] = [make('a', 'remote-new', '2026-02-01T00:00:00Z')];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'a', name: 'remote-new' });
  });

  it('雙方都有 + local 較新 → local 勝出（保護未上傳的本地修改）', () => {
    const local: Item[] = [make('a', 'local-new', '2026-02-01T00:00:00Z')];
    const remote: Item[] = [make('a', 'remote-old', '2026-01-01T00:00:00Z')];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'a', name: 'local-new' });
  });

  it('雙方時間戳皆缺失 → 保守保留 local（不靜默丟資料）', () => {
    const local: Item[] = [make('a', 'local-no-ts')];
    const remote: Item[] = [make('a', 'remote-no-ts')];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ name: 'local-no-ts' });
  });

  it('fallback 用 createdAt 當 updatedAt 缺失時的依據', () => {
    const local: Item[] = [make('a', 'local', undefined, '2026-01-01T00:00:00Z')];
    const remote: Item[] = [make('a', 'remote', undefined, '2026-03-01T00:00:00Z')];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged[0]).toMatchObject({ name: 'remote' });
  });

  it('混合 local-only / remote-only / 衝突項目', () => {
    const local: Item[] = [
      make('a', 'local-A', '2026-01-01T00:00:00Z'),
      make('b', 'local-only-B', '2026-01-15T00:00:00Z'),
    ];
    const remote: Item[] = [
      make('a', 'remote-A-new', '2026-02-01T00:00:00Z'),
      make('c', 'remote-only-C', '2026-02-10T00:00:00Z'),
    ];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged).toHaveLength(3);

    const byId = new Map(merged.map(m => [m.id, m]));
    expect(byId.get('a')?.name).toBe('remote-A-new');
    expect(byId.get('b')?.name).toBe('local-only-B');
    expect(byId.get('c')?.name).toBe('remote-only-C');
  });

  it('支援 number id（如 Table.id）', () => {
    type NumItem = { id: number; name: string; updatedAt?: string };
    const local: NumItem[] = [{ id: 1, name: 'local-1', updatedAt: '2026-01-01T00:00:00Z' }];
    const remote: NumItem[] = [{ id: 1, name: 'remote-1', updatedAt: '2026-02-01T00:00:00Z' }];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged[0]?.name).toBe('remote-1');
  });

  it('無效 updatedAt 字串 → 視為 0', () => {
    const local: Item[] = [make('a', 'local', 'not-a-date')];
    const remote: Item[] = [make('a', 'remote', '2026-02-01T00:00:00Z')];
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged[0]?.name).toBe('remote');
  });
});
