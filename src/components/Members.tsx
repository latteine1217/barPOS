import React, { useEffect, useState } from 'react';
import {
  useMembers,
  useAddMember,
  useDeleteMember,
  useRenameMember,
  useAddCups,
  useUseCups,
  useSetCups,
  useMembersInitialize,
} from '@/stores';

const Members: React.FC = () => {
  const members = useMembers();
  const addMember = useAddMember();
  const deleteMember = useDeleteMember();
  const renameMember = useRenameMember();
  const addCups = useAddCups();
  const useCups = useUseCups();
  const setCups = useSetCups();
  const initialize = useMembersInitialize();

  useEffect(() => { initialize?.(); }, [initialize]);

  const [name, setName] = useState('');
  const [cups, setInitialCups] = useState<number>(0);
  // 簡化需求：僅表格記錄名稱與杯數，不提供搜尋/過濾

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="card p-4 sm:p-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">會員紀錄</h1>
        <p className="text-sm text-[var(--text-muted)]">只記錄會員名稱與剩餘杯數。</p>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="會員姓名"
            className="flex-1 px-3 py-2 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)]"
          />
          <input
            type="number"
            min={0}
            value={cups}
            onChange={(e) => setInitialCups(parseInt(e.target.value) || 0)}
            placeholder="杯數"
            className="w-32 px-3 py-2 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)]"
          />
          <button
            onClick={() => { if (name.trim()) { addMember(name.trim(), cups || 0); setName(''); setInitialCups(0);} }}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:brightness-95"
          >
            新增
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--glass-surface)]">
            <tr>
              <th className="text-left px-4 py-3 text-sm text-[var(--text-secondary)]">姓名</th>
              <th className="text-left px-4 py-3 text-sm text-[var(--text-secondary)]">剩餘杯數</th>
              <th className="text-right px-4 py-3 text-sm text-[var(--text-secondary)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-t border-[var(--glass-elevated-border)]">
                <td className="px-4 py-3">
                  <input
                    defaultValue={m.name}
                    onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== m.name) renameMember(m.id, v); }}
                    className="bg-transparent outline-none border-b border-transparent focus:border-[var(--color-accent)] text-[var(--text-primary)]"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => useCups(m.id, 1)} className="w-7 h-7 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">-</button>
                    <input
                      type="number"
                      min={0}
                      defaultValue={m.cups}
                      onBlur={(e) => setCups(m.id, parseInt(e.target.value) || 0)}
                      className="w-20 text-center px-2 py-1 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)]"
                    />
                    <button onClick={() => addCups(m.id, 1)} className="w-7 h-7 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">+</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => deleteMember(m.id)} className="px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">目前沒有資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;
