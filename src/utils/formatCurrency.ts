/**
 * 統一專案內所有金額格式：NT$ 1,500（千分位 + 幣別前綴）。
 *
 * 先前 OrderDetailsModal 顯示 "NT$ 1500"、History 顯示 "$1500"、
 * OrderingSummary 顯示 "$1,500"、Dashboard 顯示 "$1,500" — 同筆訂單
 * 在不同頁面看起來像不同金額。
 *
 * 此函式接受 number 或 number | undefined（不存在時回 NT$ 0）。
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  const value = Number.isFinite(amount as number) ? (amount as number) : 0;
  // 整數顯示（POS 場景常用），如需小數可調 minimumFractionDigits
  return `NT$ ${value.toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/** 不含 NT$ 前綴的純千分位數字（給 Dashboard / Settings 等已有 $ 字面前綴的情境暫時相容） */
export const formatAmount = (amount: number | null | undefined): string => {
  const value = Number.isFinite(amount as number) ? (amount as number) : 0;
  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
