import type { Order } from '@/types';

/**
 * 訂單金額計算純函式。集中所有「總額 / 營收 / 小費」的口徑，避免分散在
 * analytics / dashboard / dataAnalysis 各自重新實作而造成口徑分裂。
 *
 * 重要：店家營收（revenue）不應包含小費（tip），因為小費屬於員工 /
 * 服務生收入。對於沒有 tip 欄位的舊資料 fallback 為 total。
 */

/**
 * 單筆訂單的「店家營收」金額：total - tip。
 * 包含 adjustment（折扣 / 加價），不含 tip。
 */
export const orderRevenue = (order: Order): number => {
  return (order.total ?? 0) - (order.tip ?? 0);
};

/**
 * 多筆訂單的營收總和。
 */
export const sumOrderRevenue = (orders: readonly Order[]): number => {
  return orders.reduce((sum, order) => sum + orderRevenue(order), 0);
};

/**
 * 多筆訂單的平均營收（無資料時回 0）。
 */
export const meanOrderRevenue = (orders: readonly Order[]): number => {
  if (orders.length === 0) return 0;
  return sumOrderRevenue(orders) / orders.length;
};
