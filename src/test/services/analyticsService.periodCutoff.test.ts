import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsService from '@/services/analyticsService';
import type { Order, OrderStatus } from '@/types';

const createOrder = (
  id: string,
  createdAt: string,
  status: OrderStatus,
  total: number,
  customerId: string,
  itemName: string,
  quantity: number = 1
): Order => ({
  id,
  tableNumber: 1,
  items: [
    {
      id: `${id}-item`,
      name: itemName,
      price: total,
      quantity
    }
  ],
  subtotal: total,
  total,
  status,
  customers: 1,
  customerId,
  createdAt,
  updatedAt: createdAt
});

describe('AnalyticsService period + status + cutoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('應套用狀態過濾，且所有分析可依 selectedPeriod 篩選', () => {
    vi.setSystemTime(new Date('2026-02-24T02:30:00'));

    const orders: Order[] = [
      createOrder('paid-in-range', '2026-02-24T01:30:00', 'paid', 100, 'C-1', 'Paid Item'),
      createOrder('pending-in-range', '2026-02-23T20:00:00', 'pending', 500, 'C-2', 'Pending Item'),
      createOrder('paid-out-of-range', '2026-02-24T04:30:00', 'paid', 200, 'C-3', 'Late Item')
    ];

    const service = new AnalyticsService(orders, {
      cutoffHour: 3,
      includedStatuses: ['paid']
    });

    const basic = service.getBasicStats('today');
    expect(basic.current.totalOrders).toBe(1);
    expect(basic.current.totalRevenue).toBe(100);

    const product = service.getProductAnalysis('today');
    expect(product.totalQuantitySold).toBe(1);
    expect(product.topSellingProducts[0]?.name).toBe('Paid Item');

    const customers = service.getCustomerAnalysis('today');
    expect(customers.totalCustomers).toBe(1);

    const time = service.getTimeAnalysis('today');
    const orderCount = time.hourlyDistribution.reduce((sum, row) => sum + row.orderCount, 0);
    expect(orderCount).toBe(1);
  });

  it('應依 businessDay cutoff 做跨日歸屬，並補齊缺失趨勢點', () => {
    vi.setSystemTime(new Date('2026-02-24T12:00:00'));

    const orders: Order[] = [
      createOrder('cross-1', '2026-02-24T01:30:00', 'paid', 100, 'C-1', 'A'),
      createOrder('cross-2', '2026-02-23T22:15:00', 'paid', 50, 'C-2', 'B'),
      createOrder('same-day', '2026-02-24T10:00:00', 'paid', 70, 'C-3', 'C')
    ];

    const service = new AnalyticsService(orders, {
      cutoffHour: 3,
      includedStatuses: ['paid']
    });

    const trends = service.getRevenueTrends('daily', 2, 'all');

    const day23 = trends.find((row) => row.period === '2026-02-23');
    const day24 = trends.find((row) => row.period === '2026-02-24');

    expect(day23?.revenue).toBe(150);
    expect(day23?.orderCount).toBe(2);
    expect(day24?.revenue).toBe(70);
    expect(day24?.orderCount).toBe(1);
    expect(trends.some((row) => row.orderCount === 0)).toBe(true);
  });

  it('不同 selectedPeriod 應回傳不同分析範圍（products/customers/time）', () => {
    vi.setSystemTime(new Date('2026-02-24T12:00:00'));

    const orders: Order[] = [
      createOrder('today', '2026-02-24T04:00:00', 'paid', 100, 'C-1', 'Today Drink', 1),
      createOrder('month', '2026-02-10T12:00:00', 'paid', 200, 'C-2', 'Month Drink', 2),
      createOrder('old', '2026-01-28T12:00:00', 'paid', 300, 'C-3', 'Old Drink', 3)
    ];

    const service = new AnalyticsService(orders, {
      cutoffHour: 3,
      includedStatuses: ['paid']
    });

    const todayProduct = service.getProductAnalysis('today');
    const monthProduct = service.getProductAnalysis('month');
    expect(todayProduct.totalQuantitySold).toBe(1);
    expect(monthProduct.totalQuantitySold).toBe(3);

    const todayCustomer = service.getCustomerAnalysis('today');
    const monthCustomer = service.getCustomerAnalysis('month');
    expect(todayCustomer.totalCustomers).toBe(1);
    expect(monthCustomer.totalCustomers).toBe(2);

    const todayTime = service.getTimeAnalysis('today');
    const monthTime = service.getTimeAnalysis('month');
    const todayOrders = todayTime.hourlyDistribution.reduce((sum, row) => sum + row.orderCount, 0);
    const monthOrders = monthTime.hourlyDistribution.reduce((sum, row) => sum + row.orderCount, 0);
    expect(todayOrders).toBe(1);
    expect(monthOrders).toBe(2);
  });
});
