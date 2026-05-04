import React, { useCallback, useEffect, useId, useState } from 'react';
import {
  useMembers,
  useAddMember,
  useDeleteMember,
  useRenameMember,
  useAddCups,
  useUseCups,
  useSetCups,
  useMembersInitialize,
  useMembersLoaded,
} from '@/stores';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';

interface MemberRowProps {
  id: string;
  name: string;
  cups: number;
  onRename: (id: string, name: string) => void;
  onAddCups: (id: string) => void;
  onDeductCups: (id: string) => void;
  onSetCups: (id: string, cups: number) => void;
  onRequestDelete: (id: string, name: string) => void;
}

const MemberRow = React.memo<MemberRowProps>(({
  id,
  name,
  cups,
  onRename,
  onAddCups,
  onDeductCups,
  onSetCups,
  onRequestDelete,
}) => {
  const [draftName, setDraftName] = useState(name);

  // 父層更新時同步本地草稿（避免外部 rename 之後仍顯示舊值）
  useEffect(() => {
    setDraftName(name);
  }, [name]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setDraftName(name);
      return;
    }
    if (trimmed !== name) onRename(id, trimmed);
  };

  return (
    <tr className="border-t border-[var(--glass-elevated-border)]">
      <td className="px-4 py-3">
        <input
          aria-label="會員姓名"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setDraftName(name);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="bg-transparent outline-none border-b border-transparent focus:border-[var(--color-accent)] text-[var(--text-primary)] w-full max-w-[14rem] py-1"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDeductCups(id)}
            disabled={cups <= 0}
            className="w-9 h-9 rounded-lg bg-gray-200 text-gray-700 text-lg leading-none hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
            aria-label={`扣除 1 杯（目前 ${cups}）`}
          >
            −
          </button>
          <input
            type="number"
            min={0}
            value={cups}
            onChange={(e) => onSetCups(id, Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-20 text-center px-2 py-1.5 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
            aria-label="剩餘杯數"
          />
          <button
            type="button"
            onClick={() => onAddCups(id)}
            className="w-9 h-9 rounded-lg bg-gray-200 text-gray-700 text-lg leading-none hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
            aria-label={`增加 1 杯（目前 ${cups}）`}
          >
            ＋
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onRequestDelete(id, name)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
            aria-label={`刪除會員 ${name}`}
          >
            刪除
          </button>
        </div>
      </td>
    </tr>
  );
});
MemberRow.displayName = 'MemberRow';

const Members: React.FC = () => {
  const members = useMembers();
  const addMember = useAddMember();
  const deleteMember = useDeleteMember();
  const renameMember = useRenameMember();
  const addCups = useAddCups();
  const deductCups = useUseCups();
  const setCups = useSetCups();
  const initialize = useMembersInitialize();
  const loaded = useMembersLoaded();

  const confirm = useConfirm();
  const toast = useToast();

  useEffect(() => {
    if (!loaded) initialize?.();
  }, [loaded, initialize]);

  const [name, setName] = useState('');
  const [cups, setInitialCups] = useState<number>(0);
  const nameInputId = useId();
  const cupsInputId = useId();

  const handleAdd = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.warning('請輸入會員姓名');
      return;
    }
    addMember(trimmed, cups || 0);
    setName('');
    setInitialCups(0);
    toast.success(`已新增會員：${trimmed}`);
  }, [name, cups, addMember, toast]);

  const handleRequestDelete = useCallback(
    async (id: string, memberName: string) => {
      const ok = await confirm({
        title: `刪除會員「${memberName}」？`,
        description: '此動作無法復原，將永久移除該會員的杯數紀錄。',
        confirmText: '刪除',
        cancelText: '取消',
        variant: 'danger',
      });
      if (!ok) return;
      deleteMember(id);
      toast.success(`已刪除會員：${memberName}`);
    },
    [confirm, deleteMember, toast],
  );

  const handleAddCups = useCallback((id: string) => addCups(id, 1), [addCups]);
  const handleDeductCups = useCallback((id: string) => deductCups(id, 1), [deductCups]);
  const handleSetCups = useCallback(
    (id: string, value: number) => setCups(id, value),
    [setCups],
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="card p-4 sm:p-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">會員紀錄</h1>
        <p className="text-sm text-[var(--text-muted)]">只記錄會員名稱與剩餘杯數。</p>
      </div>

      <form
        className="card p-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label htmlFor={nameInputId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              會員姓名
            </label>
            <input
              id={nameInputId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：王小明"
              className="w-full px-3 py-2 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
              autoComplete="off"
            />
          </div>
          <div className="w-full sm:w-32">
            <label htmlFor={cupsInputId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              初始杯數
            </label>
            <input
              id={cupsInputId}
              type="number"
              min={0}
              value={cups}
              onChange={(e) => setInitialCups(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-accent)]/60 disabled:opacity-50"
            disabled={!name.trim()}
          >
            新增
          </button>
        </div>
      </form>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--glass-surface)]">
            <tr>
              <th scope="col" className="text-left px-4 py-3 text-sm text-[var(--text-secondary)]">姓名</th>
              <th scope="col" className="text-left px-4 py-3 text-sm text-[var(--text-secondary)]">剩餘杯數</th>
              <th scope="col" className="text-right px-4 py-3 text-sm text-[var(--text-secondary)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                id={m.id}
                name={m.name}
                cups={m.cups}
                onRename={renameMember}
                onAddCups={handleAddCups}
                onDeductCups={handleDeductCups}
                onSetCups={handleSetCups}
                onRequestDelete={handleRequestDelete}
              />
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                  <div className="flex flex-col items-center gap-2 opacity-80">
                    <span className="text-2xl" aria-hidden="true">🍶</span>
                    <span>還沒有會員，從上方新增第一筆吧</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;
