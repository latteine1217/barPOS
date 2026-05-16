import React, { useMemo, useState, useCallback } from 'react';
import { Card, Select, Badge, Input, Button, Modal } from '@/components/ui';
import { useMenuItems, useMenuStore } from '@/stores/menuStore';

const ItemCard: React.FC<{ id?: string; name: string; price: number; cost?: number | undefined; category: string; baseSpirit?: string | undefined; available?: boolean | undefined; description?: string | undefined; onEdit?: (id: string) => void; onDelete?: (id: string) => void; }>
= ({ id, name, price, cost, category, baseSpirit, available = true, description, onEdit, onDelete }) => (
  <Card padding="lg" className={`card ${!available ? 'opacity-60' : ''} bg-white/10 dark:bg-white/5 hover:shadow-md transition-shadow`}>
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-white text-lg tracking-wide">{name}</h3>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm text-gray-700 dark:text-gray-100">${price}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${available ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
          {available ? '可供應' : '暫停'}
        </span>
        {typeof cost === 'number' && price > 0 && (() => {
          const ratio = cost / price;
          const percent = Math.round(ratio * 100);
          const cls = ratio >= 0.8
            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
            : ratio >= 0.6
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
          return (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
              成本 {percent}%
            </span>
          );
        })()}
      </div>
    </div>
     <div className="text-sm text-gray-600 dark:text-gray-200 space-y-1">      <div>分類：{category}</div>
      {baseSpirit && baseSpirit !== 'none' && <div>基酒：{baseSpirit}</div>}
      {description && <div>描述：{description}</div>}
    </div>
    {id && (
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => onEdit && onEdit(id)}>編輯</Button>
        <Button size="sm" variant="danger" onClick={() => onDelete && onDelete(id)}>刪除</Button>
      </div>
    )}
  </Card>
);

const Menu: React.FC = () => {
  const items = useMenuItems();
  const stats = useMemo(() => ({
    totalItems: items.length,
    availableItems: items.filter((i) => i.available).length,
    classicCount: items.filter((i) => i.category === 'classic').length,
    signatureCount: items.filter((i) => i.category === 'signature').length,
    mocktailCount: items.filter((i) => i.category === 'mocktail').length,
    wineCount: items.filter((i) => i.category === 'wine').length,
    otherCount: items.filter((i) => i.category === 'other').length,
    smallBiteCount: items.filter((i) => i.category === 'small_bite').length,
  }), [items]);
  type CategoryFilter = 'all' | 'classic' | 'mocktail' | 'wine' | 'signature' | 'other' | 'small_bite';
  type SpiritFilter = 'all' | 'whiskey' | 'gin' | 'rum' | 'tequila' | 'vodka' | 'brandy' | 'liqueur' | 'none';
  const [category, setCategory] = useState<CategoryFilter>(() => 'all');
  const [spirit, setSpirit] = useState<SpiritFilter>(() => 'all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(() => false);
  const [q, setQ] = useState<string>(() => '');

   const filtered = useMemo(() => items.filter((i) => {
    if (category !== 'all' && i.category !== category) return false;
    if (spirit !== 'all' && (category === 'classic' || category === 'signature' || category === 'other') && (i.baseSpirit || 'none') !== spirit) return false;
    if (onlyAvailable && !i.available) return false;
    const qq = q.trim();
    if (qq) {
      const t = qq.toLowerCase();
      const hay = `${i.name} ${i.description || ''} ${i.category} ${i.baseSpirit || ''}`.toLowerCase();
      if (!hay.includes(t)) return false;
    }
    return true;
   }), [items, category, spirit, onlyAvailable, q]);
   const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {} as Record<string, typeof filtered>;
    for (const it of filtered) {
      const k = it.category;
      if (!map[k]) map[k] = [] as unknown as typeof filtered;
      (map[k] as unknown as Array<(typeof filtered)[number]>).push(it);
    }
    return map;
  }, [filtered]);  const addMenuItem = useMenuStore(s => s.addMenuItem);
  const updateMenuItem = useMenuStore(s => s.updateMenuItem);
  const deleteMenuItem = useMenuStore(s => s.deleteMenuItem);
  const [editId, setEditId] = useState<string | null>(() => null);
  type MenuCategoryT = 'classic' | 'mocktail' | 'wine' | 'signature' | 'other' | 'small_bite';
  type BaseSpiritT = 'vodka' | 'gin' | 'rum' | 'whiskey' | 'tequila' | 'brandy' | 'liqueur' | 'none';

  const FILTER_CATEGORY_OPTIONS = useMemo(() => ([
    { value: 'all', label: '全部分類' },
    { value: 'classic', label: '經典調酒' },
    { value: 'signature', label: 'signature' },
    { value: 'mocktail', label: '無酒精調酒' },
    { value: 'wine', label: '葡萄酒' },
    { value: 'other', label: '其他酒類' },
    { value: 'small_bite', label: '小點' },
  ] as const), []);
  const FILTER_SPIRIT_OPTIONS = useMemo(() => ([
    { value: 'all', label: '全部基酒' },
    { value: 'whiskey', label: 'Whiskey' },
    { value: 'gin', label: 'Gin' },
    { value: 'rum', label: 'Rum' },
    { value: 'tequila', label: 'Tequila' },
    { value: 'vodka', label: 'Vodka' },
    { value: 'brandy', label: 'Brandy' },
    { value: 'liqueur', label: 'Liqueur' },
    { value: 'none', label: '無' },
  ] as const), []);

   const CATEGORY_OPTIONS = useMemo(() => ([
    { value: 'classic', label: '經典調酒' },
    { value: 'signature', label: 'signature' },
    { value: 'mocktail', label: '無酒精調酒' },
    { value: 'wine', label: '葡萄酒' },
    { value: 'other', label: '其他酒類' },
    { value: 'small_bite', label: '小點' },
   ] as const), []);
   const SPIRIT_OPTIONS = useMemo(() => ([
    { value: 'none', label: '無' },
    { value: 'whiskey', label: 'Whiskey' },
    { value: 'gin', label: 'Gin' },
    { value: 'rum', label: 'Rum' },
    { value: 'tequila', label: 'Tequila' },
    { value: 'vodka', label: 'Vodka' },
    { value: 'brandy', label: 'Brandy' },
    { value: 'liqueur', label: 'Liqueur' },
   ] as const), []);

   const [form, setForm] = useState<{ name: string; price: number; cost?: number; category: MenuCategoryT; baseSpirit: BaseSpiritT; description: string; available: boolean }>(() => ({ name: '', price: 0, category: 'classic', baseSpirit: 'none', description: '', available: true }));
   const [isFormOpen, setIsFormOpen] = useState(false);
   const openCreate = useCallback(() => { setEditId(() => null); setForm(() => ({ name: '', price: 0, category: 'classic', baseSpirit: 'none', description: '', available: true })); setIsFormOpen(() => true); }, []);
     const openEdit = useCallback((id: string) => {
      const item = items.find(i => i.id === id);
      if (!item) return;
      setEditId(() => id);
      setForm(() => ({
        name: item.name ?? '',
        price: (typeof item.price === 'number' ? item.price : 0),
        cost: (typeof (item as any).cost === 'number' ? (item as any).cost : undefined),
        category: (item.category ?? 'classic') as MenuCategoryT,
        baseSpirit: (item.baseSpirit ?? 'none') as BaseSpiritT,
        description: item.description ?? '',
        available: item.available ?? true,
      }));
      setIsFormOpen(() => true);
    }, [items]);  const resetForm = useCallback(() => { setEditId(() => null); setForm(() => ({ name: '', price: 0, category: 'classic', baseSpirit: 'none', description: '', available: true })); setIsFormOpen(() => false); }, []);
  const handleDelete = useCallback((id: string) => { deleteMenuItem(id); }, [deleteMenuItem]);

    const handleSubmit = useCallback(() => {
      const name = (form.name || '').trim();
      const price = Number.isFinite(form.price) ? form.price : 0;
      if (!name || price <= 0) return;
      if (editId) {
        updateMenuItem(editId, { ...form });
      } else {
        addMenuItem({ ...form } as any);
      }
      resetForm();
    }, [editId, form, updateMenuItem, addMenuItem, resetForm]);
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
       <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">酒單管理</h1>

           <Button onClick={openCreate}>新增品項</Button>
      </div>
      <Modal isOpen={isFormOpen} onClose={resetForm} title={editId ? '編輯品項' : '新增品項'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <Input label="名稱" info="顯示在菜單上的品項名稱" placeholder="例：Old Fashioned" value={form.name ?? ''} onChange={(e) => {
             const v = (e.target as HTMLInputElement).value;
             setForm(prev => ({ ...prev, name: v ?? '' }));
           }} />
           <Input label="售價" info="銷售價格（未稅）" helperText="顯示給客人的售價（未稅）" type="number" value={Number.isFinite(form.price) ? form.price : 0} onChange={(e) => {
             const v = (e.target as HTMLInputElement).value;
             setForm(prev => ({ ...prev, price: Number(v) || 0 }));
           }} error={form.price <= 0 ? '售價需大於 0' : undefined} />
           <Input label="成本 (可選)" info="製作此品項的平均成本" helperText="用於計算毛利與成本占比" type="number" value={form.cost ?? ''} onChange={(e) => {
              const v = (e.target as HTMLInputElement).value;
              setForm(prev => {
                const next = { ...prev };
                if (v === '') {
                  delete (next as { cost?: number }).cost;
                } else {
                  next.cost = Number(v) || 0;
                }
                return next;
              });
            }} error={typeof form.cost === 'number' && form.price > 0 && (form.cost > form.price) ? '成本不可高於售價' : undefined} />
            <Select label="分類" info="用於篩選與報表分類" value={(form.category ?? 'classic') as MenuCategoryT} onChange={(e) => {
             const v = (e.target as HTMLSelectElement).value as MenuCategoryT;
             setForm(prev => ({ ...prev, category: (v || 'classic') as MenuCategoryT }));
           }} options={CATEGORY_OPTIONS as any} />
           <Select label="基酒" info="此品項主要使用的酒類（若無可選『無』）" value={(form.baseSpirit ?? 'none') as BaseSpiritT} onChange={(e) => {
             const v = (e.target as HTMLSelectElement).value as BaseSpiritT;
             setForm(prev => ({ ...prev, baseSpirit: (v || 'none') as BaseSpiritT }));
           }} options={SPIRIT_OPTIONS as any} />
           <Input className="md:col-span-2" label="描述" info="配方、風味或備註（可選）" placeholder="配方或備註（選填）" value={form.description ?? ''} onChange={(e) => {
             const v = (e.target as HTMLInputElement).value;
             setForm(prev => ({ ...prev, description: v ?? '' }));
           }} />
          <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-elevated-border)]">
            <div>
              <div className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                可供應
                <span className="inline-flex items-center justify-center size-4 rounded-full bg-[var(--text-muted)]/20 text-[10px] text-[var(--text-secondary)] cursor-help select-none" title="開啟後，此品項將出現在點單與菜單列表中。">
                  i
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">開啟後會顯示在前台菜單</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.available}
              onClick={() => setForm(prev => ({ ...prev, available: !prev.available }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.available ? 'bg-[var(--color-accent)]' : 'bg-slate-400/50'}`}
            >
              <span
                className={`inline-block size-5 transform rounded-full bg-white transition-transform ${form.available ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={resetForm}>取消</Button>
            <Button onClick={handleSubmit}>{editId ? '更新' : '新增'}</Button>
          </div>
        </div>
      </Modal>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">總品項</div>
            <Badge>{stats.totalItems}</Badge>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">可供應</div>
            <Badge>{stats.availableItems}</Badge>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">經典調酒</div>
            <Badge>{stats.classicCount}</Badge>
          </div>
        </Card>
         <Card padding="md">
           <div className="flex items-center justify-between">
             <div className="text-sm text-gray-600 dark:text-gray-300">無酒精調酒</div>
             <Badge>{stats.mocktailCount}</Badge>
           </div>
         </Card>
      </div>

      <Card padding="md" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
             <Select size="sm" placeholder="全部分類" value={category ?? 'all'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(((e.target as HTMLSelectElement).value || 'all') as CategoryFilter)} options={FILTER_CATEGORY_OPTIONS as any} />
            <Select size="sm" placeholder="全部基酒" value={spirit ?? 'all'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSpirit(((e.target as HTMLSelectElement).value || 'all') as SpiritFilter)} options={FILTER_SPIRIT_OPTIONS as any} />
            <Input className="col-span-2 md:col-span-1" placeholder="搜尋名稱 / 描述" value={q} onChange={(e) => setQ(((e.target as HTMLInputElement).value))} />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input className="size-4" type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(((e as React.ChangeEvent<HTMLInputElement>).currentTarget.checked))} />
              僅顯示可供應
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => { setCategory('all'); setSpirit('all'); setOnlyAvailable(false); setQ(''); }}>重設</Button>
          </div>        </div>
      </Card>

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="space-y-3">
           <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
             {
               cat === 'classic' ? '經典調酒'
               : cat === 'signature' ? 'signature'
               : cat === 'mocktail' ? '無酒精調酒'
               : cat === 'wine' ? '葡萄酒'
               : cat === 'other' ? '其他酒類'
               : cat === 'small_bite' ? '小點'
               : cat
             }
           </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((it) => (
               <ItemCard key={it.id} {...it} id={it.id} onEdit={(id) => openEdit(id)} onDelete={(id) => handleDelete(id)} />            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍸</div>
           <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">找不到符合的品項</h3>
          <p className="text-gray-500 dark:text-gray-400">調整篩選條件再試試</p>
        </div>
      )}
    </div>
  );};

export default Menu;
