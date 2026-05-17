import type { Order } from '@/types';

/**
 * 訂單金額計算純函式。集中所有「總額 / 營收 / 小費」的口徑，避免分散在
 * analytics / dashboard / dataAnalysis 各自重新實作而造成口徑分裂。
 *
 * 重要：店家營收（revenue）不應包含小費（tip），因為小費屬於員工 /
 * 服務生收入。對於沒有 tip 欄位的舊資料 fallback 為 total。
 *
 * 取消狀態（cancelled）的訂單不計入營收統計 — 否則使用者按下「取消」後
 * 該筆 total 仍會出現在 Dashboard 與報表，造成虛胖。
 */

/** 訂單是否應計入店家營收（排除 cancelled）。 */
export const isRevenueOrder = (order: Order): boolean => {
  return order.status !== 'cancelled';
};

/**
 * 單筆訂單的「店家營收」金額：total - tip。
 * 包含 adjustment（折扣 / 加價），不含 tip。
 * Cancelled 訂單回傳 0。
 */
export const orderRevenue = (order: Order): number => {
  if (!isRevenueOrder(order)) return 0;
  return (order.total ?? 0) - (order.tip ?? 0);
};

/**
 * 多筆訂單的營收總和。cancelled 訂單自動排除。
 */
export const sumOrderRevenue = (orders: readonly Order[]): number => {
  return orders.reduce((sum, order) => sum + orderRevenue(order), 0);
};

/**
 * 多筆訂單的平均營收（無資料時回 0）。分母仍是「全部訂單數」以保留
 * 跟先前語意一致（cancelled 訂單拉低平均）；若需排除 cancelled 應在
 * caller 先 filter。
 */
export const meanOrderRevenue = (orders: readonly Order[]): number => {
  if (orders.length === 0) return 0;
  return sumOrderRevenue(orders) / orders.length;
};
