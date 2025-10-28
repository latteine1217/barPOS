import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { loadFromStorage, STORAGE_KEYS } from '@/services/storageService';
import type { MemberRecord, ID } from '@/types';

interface MembersState {
  members: MemberRecord[];
  isLoaded: boolean;
}

interface MembersActions {
  initialize: () => Promise<void>;
  addMember: (name: string, cups?: number, notes?: string) => void;
  deleteMember: (id: ID) => void;
  renameMember: (id: ID, name: string) => void;
  addCups: (id: ID, cups: number) => void;
  useCups: (id: ID, cups?: number) => void; // 預設 1 杯
  setCups: (id: ID, cups: number) => void;
  setMembers: (members: MemberRecord[]) => void;
}

export type MembersStore = MembersState & MembersActions;

export const useMembersStore = create<MembersStore>()(
  persist(
    immer((set, get) => ({
      members: [],
      isLoaded: false,

      initialize: async () => {
        try {
          // 1) 若 persist 已載入且有資料，避免覆蓋
          const current = get().members;
          if (Array.isArray(current) && current.length > 0) {
            set((s) => { s.isLoaded = true; });
            return;
          }

          // 2) 嘗試從 persist 的 localStorage 快照讀取
          let persistedMembers: MemberRecord[] | null = null;
          try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem('members-store') : null;
            if (raw) {
              const parsed = JSON.parse(raw);
              const persistedState = parsed?.state;
              if (persistedState && Array.isArray(persistedState.members)) {
                persistedMembers = persistedState.members as MemberRecord[];
              }
            }
          } catch {
            // Ignore parsing errors for persisted state
          }

          if (persistedMembers && persistedMembers.length > 0) {
            set((s) => {
              s.members = persistedMembers!.map(m => ({ ...m }));
              s.isLoaded = true;
            });
            return;
          }

          // 3) 回退至 storageService
          const saved = await loadFromStorage<MemberRecord[]>(STORAGE_KEYS.MEMBERS, []);
          set((s) => {
            s.members = Array.isArray(saved) ? saved : [];
            s.isLoaded = true;
          });
        } catch {
          set((s) => { s.isLoaded = true; });
        }
      },

      addMember: (name: string, cups: number = 0, notes?: string) => {
        set((s) => {
          const now = new Date().toISOString();
          const rec: MemberRecord = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            name: name.trim(),
            cups: Math.max(0, Math.floor(cups)),
            createdAt: now,
            updatedAt: now,
            ...(typeof notes === 'string' ? { notes } : {})
          };
          s.members.push(rec);
        });
      },

      deleteMember: (id: ID) => {
        set((s) => {
          s.members = s.members.filter(m => m.id !== id);
        });
      },

      renameMember: (id: ID, name: string) => {
        set((s) => {
          const m = s.members.find(x => x.id === id);
          if (!m) return;
          m.name = name.trim();
          m.updatedAt = new Date().toISOString();
        });
      },

      addCups: (id: ID, cups: number) => {
        set((s) => {
          const m = s.members.find(x => x.id === id);
          if (!m) return;
          m.cups = Math.max(0, m.cups + Math.max(0, Math.floor(cups)));
          m.updatedAt = new Date().toISOString();
        });
      },

      useCups: (id: ID, cups: number = 1) => {
        set((s) => {
          const m = s.members.find(x => x.id === id);
          if (!m) return;
          m.cups = Math.max(0, m.cups - Math.max(0, Math.floor(cups)));
          m.updatedAt = new Date().toISOString();
        });
      },

      setCups: (id: ID, cups: number) => {
        set((s) => {
          const m = s.members.find(x => x.id === id);
          if (!m) return;
          m.cups = Math.max(0, Math.floor(cups));
          m.updatedAt = new Date().toISOString();
        });
      },

      setMembers: (members: MemberRecord[]) => {
        set((s) => {
          s.members = Array.isArray(members) ? members.map(m => ({ ...m })) : [];
          s.isLoaded = true;
        });
      },
    })),
    { name: 'members-store', partialize: (s) => ({ members: s.members }) }
  )
);

export const useMembers = () => useMembersStore((s) => s.members);
export const useMembersLoaded = () => useMembersStore((s) => s.isLoaded);
// 為避免 React 19 對 useSyncExternalStore 的快照警告，避免回傳臨時物件
export const useAddMember = () => useMembersStore((s) => s.addMember);
export const useDeleteMember = () => useMembersStore((s) => s.deleteMember);
export const useRenameMember = () => useMembersStore((s) => s.renameMember);
export const useAddCups = () => useMembersStore((s) => s.addCups);
export const useUseCups = () => useMembersStore((s) => s.useCups);
export const useSetCups = () => useMembersStore((s) => s.setCups);
export const useMembersInitialize = () => useMembersStore((s) => s.initialize);
export const useSetMembers = () => useMembersStore((s) => s.setMembers);
