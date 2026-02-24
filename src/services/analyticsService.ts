import { 
  calculateRFM, 
  segmentCustomers, 
  filterOrdersByPeriod, 
  calculateTrends, 
  analyzeProducts, 
  analyzeSeating,
  calculateCLV,
  getPeriodRange,
} from '../utils/dataAnalysis';
import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  format,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import type { 
  Order, 
  OrderStatus,
  RFMAnalysis, 
  CustomerSegment, 
  TimePeriod, 
  TrendPeriod, 
  TrendData, 
  ProductAnalysis, 
  SeatingAnalysis 
} from '../types';

// 基礎統計介面
interface BasicStats {
  current: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    uniqueCustomers: number;
  };
  previous: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  changes: {
    revenue: number | null;
    orders: number | null;
    aov: number | null;
  };
}

// 產品分析結果介面
interface ProductAnalysisResult {
  topSellingProducts: ProductAnalysis[];
  totalProducts: number;
  totalQuantitySold: number;
  averagePrice: number;
  categories: Array<{
    name: string;
    count: number;
    revenue: number;
    quantity: number;
  }>;
}

// 座位分析結果介面
interface SeatingAnalysisResult {
  topPerformingTables: SeatingAnalysis[];
  averageUtilization: number;
  totalTables: number;
  revenueDistribution: Array<SeatingAnalysis & { percentage: number }>;
}

// 客戶分析結果介面
interface CustomerAnalysisResult {
  totalCustomers: number;
  segments: Array<{
    name: CustomerSegment;
    count: number;
    totalValue: number;
    averageValue: number;
  }>;
  averageCLV: number;
  topCustomers: Array<RFMAnalysis & { clv: number }>;
  newCustomers: number;
  customerRetention: number;
}

// 時段分析結果介面
interface TimeAnalysisResult {
  hourlyDistribution: Array<{
    hour: number;
    orderCount: number;
    revenue: number;
    label: string;
  }>;
  weeklyDistribution: Array<{
    day: number;
    orderCount: number;
    revenue: number;
    label: string;
  }>;
  peakHours: Array<{ hour: number; revenue: number }>;
  peakDays: Array<{ day: string; revenue: number }>;
}

interface AnalyticsServiceOptions {
  cutoffHour?: number;
  includedStatuses?: OrderStatus[];
}

const HOUR_IN_MS = 60 * 60 * 1000;

// 分析服務類
export class AnalyticsService {
  private orders: Order[];
  private cutoffHour: number;
  private includedStatuses: Set<OrderStatus>;

  constructor(orders: Order[] = [], options: AnalyticsServiceOptions = {}) {
    this.orders = orders;
    this.cutoffHour = this.normalizeCutoffHour(options.cutoffHour);
    const statuses: OrderStatus[] = options.includedStatuses && options.includedStatuses.length > 0
      ? options.includedStatuses
      : ['completed', 'paid'];
    this.includedStatuses = new Set(statuses);
  }

  // 更新數據
  updateData(orders: Order[]): void {
    this.orders = orders;
  }

  // 獲取基礎統計
  getBasicStats(period: TimePeriod = 'all'): BasicStats {
    const filteredOrders = this.getScopedOrders(period);
    
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customerId).filter(Boolean)).size;

    // 計算同期比較
    const previousPeriodOrders = this.getPreviousPeriodOrders(period);
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total, 0);
    const previousOrderCount = previousPeriodOrders.length;
    const previousAOV = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

    return {
      current: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        uniqueCustomers
      },
      previous: {
        totalOrders: previousOrderCount,
        totalRevenue: previousRevenue,
        averageOrderValue: previousAOV
      },
      changes: {
        revenue: this.calculateChange(totalRevenue, previousRevenue),
        orders: this.calculateChange(totalOrders, previousOrderCount),
        aov: this.calculateChange(averageOrderValue, previousAOV)
      }
    };
  }

  // 獲取營收趨勢
  getRevenueTrends(
    period: TrendPeriod = 'daily',
    days: number = 30,
    timePeriod: TimePeriod = 'all'
  ): Array<TrendData & { date: string; formattedDate: string }> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const relevantOrders = this.getScopedOrders(timePeriod).filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const trends = calculateTrends(relevantOrders, period, { cutoffHour: this.cutoffHour });
    
    // 填補缺失的日期
    const filledTrends = this.fillMissingDates(trends, period, startDate, endDate);
    
    return filledTrends.map(trend => ({
      ...trend,
      date: this.formatTrendDate(trend.period, period),
      formattedDate: this.formatTrendLabel(trend.period, period)
    }));
  }

  // 獲取產品分析
  getProductAnalysis(period: TimePeriod = 'all'): ProductAnalysisResult {
    const productStats = analyzeProducts(this.getScopedOrders(period));
    
    return {
      topSellingProducts: productStats.slice(0, 10),
      totalProducts: productStats.length,
      totalQuantitySold: productStats.reduce((sum, p) => sum + p.totalQuantity, 0),
      averagePrice: productStats.length > 0 ? productStats.reduce((sum, p) => sum + p.averagePrice, 0) / productStats.length : 0,
      categories: this.getProductCategories(productStats)
    };
  }

  // 獲取座位分析
  getSeatingAnalysis(period: TimePeriod = 'all'): SeatingAnalysisResult {
    const seatStats = analyzeSeating(this.getScopedOrders(period));
    
    return {
      topPerformingTables: seatStats.slice(0, 10),
      averageUtilization: seatStats.length > 0 ? seatStats.reduce((sum, s) => sum + s.utilizationRate, 0) / seatStats.length : 0,
      totalTables: seatStats.length,
      revenueDistribution: this.calculateSeatRevenueDistribution(seatStats)
    };
  }

  // 獲取客戶分析
  getCustomerAnalysis(period: TimePeriod = 'all'): CustomerAnalysisResult {
    const scopedOrders = this.getScopedOrders(period);
    const rfmData = calculateRFM(scopedOrders) as RFMAnalysis[];
    const segmentedCustomers = segmentCustomers(rfmData);
    
    const segments = this.groupBySegment(segmentedCustomers);
    
    return {
      totalCustomers: rfmData.length,
      segments,
      averageCLV: this.calculateAverageCLV(scopedOrders),
      topCustomers: this.getTopCustomers(rfmData, scopedOrders),
      newCustomers: this.getNewCustomers(scopedOrders),
      customerRetention: this.calculateRetentionRate(scopedOrders)
    };
  }

  // 獲取時段分析
  getTimeAnalysis(period: TimePeriod = 'all'): TimeAnalysisResult {
    const scopedOrders = this.getScopedOrders(period);
    const hourlyData: { [key: number]: { hour: number; orderCount: number; revenue: number } } = {};
    const dailyData: { [key: number]: { day: number; orderCount: number; revenue: number } } = {};
    
    scopedOrders.forEach(order => {
      const date = new Date(new Date(order.createdAt).getTime() - this.cutoffHour * HOUR_IN_MS);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      // 按小時統計
      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour, orderCount: 0, revenue: 0 };
      }
      hourlyData[hour]!.orderCount++;
      hourlyData[hour]!.revenue += order.total;
      
      // 按星期統計
      if (!dailyData[dayOfWeek]) {
        dailyData[dayOfWeek] = { day: dayOfWeek, orderCount: 0, revenue: 0 };
      }
      dailyData[dayOfWeek]!.orderCount++;
      dailyData[dayOfWeek]!.revenue += order.total;
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const row = hourlyData[hour] || { hour, orderCount: 0, revenue: 0 };
      return { ...row, label: `${row.hour}:00` };
    });

    const weeklyDistribution = Array.from({ length: 7 }, (_, day) => {
      const row = dailyData[day] || { day, orderCount: 0, revenue: 0 };
      return { ...row, label: this.getDayName(row.day) };
    });

    return {
      hourlyDistribution,
      weeklyDistribution,
      peakHours: this.findPeakHours(hourlyDistribution),
      peakDays: this.findPeakDays(weeklyDistribution)
    };
  }

  // 私有方法
  private getPreviousPeriodOrders(period: TimePeriod): Order[] {
    const currentRange = getPeriodRange(period, { cutoffHour: this.cutoffHour });
    if (!currentRange) return [];

    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    const previousStart = new Date(currentRange.start.getTime() - duration);
    const previousEnd = new Date(currentRange.start.getTime());
    return this.getOrdersInRange(previousStart, previousEnd);
  }

  private calculateChange(current: number, previous: number): number | null {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  private fillMissingDates(
    trends: TrendData[],
    period: TrendPeriod,
    rangeStart: Date,
    rangeEnd: Date
  ): TrendData[] {
    const shiftedStart = new Date(rangeStart.getTime() - this.cutoffHour * HOUR_IN_MS);
    const shiftedEnd = new Date(rangeEnd.getTime() - this.cutoffHour * HOUR_IN_MS);
    let cursor = this.normalizeTrendCursor(shiftedStart, period);
    const endCursor = this.normalizeTrendCursor(shiftedEnd, period);
    const trendMap = new Map(trends.map((trend) => [trend.period, trend]));
    const filled: TrendData[] = [];

    while (cursor.getTime() <= endCursor.getTime()) {
      const key = this.formatTrendKey(cursor, period);
      const existing = trendMap.get(key);
      filled.push(existing ?? {
        period: key,
        orderCount: 0,
        revenue: 0,
        averageOrderValue: 0,
        customerCount: 0
      });
      cursor = this.stepTrendCursor(cursor, period);
    }

    return filled;
  }

  private formatTrendDate(periodKey: string, trendPeriod: TrendPeriod): string {
    const parsedDate = this.parseTrendPeriod(periodKey, trendPeriod);
    return parsedDate ? parsedDate.toISOString() : periodKey;
  }

  private formatTrendLabel(periodKey: string, trendPeriod: TrendPeriod): string {
    const parsedDate = this.parseTrendPeriod(periodKey, trendPeriod);
    if (!parsedDate) return periodKey;

    switch (trendPeriod) {
      case 'hourly':
        return format(parsedDate, 'MM/dd HH:00');
      case 'monthly':
        return format(parsedDate, 'yyyy/MM');
      case 'weekly':
      case 'daily':
      default:
        return format(parsedDate, 'MM/dd');
    }
  }

  private getProductCategories(productStats: ProductAnalysis[]): Array<{
    name: string;
    count: number;
    revenue: number;
    quantity: number;
  }> {
    // 根據產品名稱推斷分類（基酒分類）
    const categories: { [key: string]: ProductAnalysis[] } = {
      'Gin': [],
      'Whisky': [],
      'Rum': [],
      'Tequila': [],
      'Vodka': [],
      'Brandy': [],
      'Mocktail': [],
      'Others': []
    };

    productStats.forEach(product => {
      const name = product.name.toLowerCase();
      let categoryFound = false;

      Object.keys(categories).forEach(category => {
        if (name.includes(category.toLowerCase())) {
          categories[category]!.push(product);
          categoryFound = true;
        }
      });

      if (!categoryFound) {
        categories['Others']!.push(product);
      }
    });

    return Object.entries(categories).map(([name, products]) => ({
      name,
      count: products.length,
      revenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
      quantity: products.reduce((sum, p) => sum + p.totalQuantity, 0)
    })).filter(cat => cat.count > 0);
  }

  private calculateSeatRevenueDistribution(seatStats: SeatingAnalysis[]): Array<SeatingAnalysis & { percentage: number }> {
    const total = seatStats.reduce((sum, s) => sum + s.totalRevenue, 0);
    return seatStats.map(seat => ({
      ...seat,
      percentage: total > 0 ? (seat.totalRevenue / total) * 100 : 0
    }));
  }

  private groupBySegment(segmentedCustomers: Array<RFMAnalysis & { segment: CustomerSegment }>): Array<{
    name: CustomerSegment;
    count: number;
    totalValue: number;
    averageValue: number;
  }> {
    const segments: { [key: string]: {
      name: CustomerSegment;
      count: number;
      totalValue: number;
      averageValue: number;
    } } = {};
    
    segmentedCustomers.forEach(customer => {
      if (!segments[customer.segment]) {
        segments[customer.segment] = {
          name: customer.segment,
          count: 0,
          totalValue: 0,
          averageValue: 0
        };
      }
      
      segments[customer.segment]!.count++;
      segments[customer.segment]!.totalValue += customer.monetary;
    });

    Object.values(segments).forEach(segment => {
      if (segment) {
        segment.averageValue = segment.count > 0 ? segment.totalValue / segment.count : 0;
      }
    });

    return Object.values(segments).filter(Boolean) as Array<{
      name: CustomerSegment;
      count: number;
      totalValue: number;
      averageValue: number;
    }>;
  }

  private calculateAverageCLV(orders: Order[]): number {
    if (orders.length === 0) return 0;
    
    const customerGroups: { [key: string]: Order[] } = {};
    orders.forEach(order => {
      if (order.customerId) {
        if (!customerGroups[order.customerId]) {
          customerGroups[order.customerId] = [];
        }
        customerGroups[order.customerId]!.push(order);
      }
    });

    const clvValues = Object.values(customerGroups).map(orders => 
      calculateCLV(orders)
    );

    return clvValues.length > 0 ? clvValues.reduce((sum, clv) => sum + clv, 0) / clvValues.length : 0;
  }

  private getTopCustomers(rfmData: RFMAnalysis[], orders: Order[]): Array<RFMAnalysis & { clv: number }> {
    return rfmData
      .sort((a, b) => b.monetary - a.monetary)
      .slice(0, 10)
      .map(customer => ({
        ...customer,
        clv: calculateCLV(orders.filter(o => o.customerId === customer.customerId))
      }));
  }

  private getNewCustomers(orders: Order[]): number {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const newCustomerIds = new Set<string>();
    
    orders.forEach(order => {
      if (order.customerId && new Date(order.createdAt) >= thirtyDaysAgo) {
        const earliestOrder = orders
          .filter(o => o.customerId === order.customerId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        
        if (earliestOrder && new Date(earliestOrder.createdAt) >= thirtyDaysAgo) {
          newCustomerIds.add(order.customerId);
        }
      }
    });

    return newCustomerIds.size;
  }

  private calculateRetentionRate(orders: Order[]): number {
    // 簡化的留存率計算
    const customerFirstOrders: { [key: string]: string } = {};
    const customerLastOrders: { [key: string]: string } = {};

    orders.forEach(order => {
      if (order.customerId) {
        const orderDate = new Date(order.createdAt);
        
        const firstOrderDate = customerFirstOrders[order.customerId];
        if (!firstOrderDate || orderDate < new Date(firstOrderDate)) {
          customerFirstOrders[order.customerId] = order.createdAt;
        }
        
        const lastOrderDate = customerLastOrders[order.customerId];
        if (!lastOrderDate || orderDate > new Date(lastOrderDate)) {
          customerLastOrders[order.customerId] = order.createdAt;
        }
      }
    });

    const totalCustomers = Object.keys(customerFirstOrders).length;
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const retainedCustomers = Object.keys(customerLastOrders).filter(customerId => {
      const lastOrderDate = customerLastOrders[customerId];
      return lastOrderDate ? new Date(lastOrderDate) >= thirtyDaysAgo : false;
    }).length;

    return totalCustomers > 0 ? (retainedCustomers / totalCustomers) * 100 : 0;
  }

  private getDayName(dayIndex: number): string {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return days[dayIndex] || '未知';
  }

  private findPeakHours(hourlyData: Array<{ hour: number; revenue: number }>): Array<{ hour: number; revenue: number }> {
    return hourlyData
      .filter((hour) => hour.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(h => ({ hour: h.hour, revenue: h.revenue }));
  }

  private findPeakDays(dailyData: Array<{ day: number; revenue: number }>): Array<{ day: string; revenue: number }> {
    return dailyData
      .filter((day) => day.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(d => ({ day: this.getDayName(d.day), revenue: d.revenue }));
  }

  private normalizeCutoffHour(hour: number | undefined): number {
    const value = Number.isFinite(hour) ? Math.floor(hour as number) : 3;
    return Math.max(0, Math.min(23, value));
  }

  private getScopedOrders(period: TimePeriod = 'all'): Order[] {
    return filterOrdersByPeriod(this.orders, period, {
      cutoffHour: this.cutoffHour,
      includedStatuses: Array.from(this.includedStatuses),
    });
  }

  private getOrdersInRange(start: Date, end: Date): Order[] {
    return this.orders.filter((order) => {
      if (!this.includedStatuses.has(order.status)) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate < end;
    });
  }

  private normalizeTrendCursor(date: Date, period: TrendPeriod): Date {
    switch (period) {
      case 'hourly':
        return startOfHour(date);
      case 'weekly':
        return startOfWeek(date, { weekStartsOn: 1 });
      case 'monthly':
        return startOfMonth(date);
      case 'daily':
      default:
        return startOfDay(date);
    }
  }

  private stepTrendCursor(date: Date, period: TrendPeriod): Date {
    switch (period) {
      case 'hourly':
        return addHours(date, 1);
      case 'weekly':
        return addWeeks(date, 1);
      case 'monthly':
        return addMonths(date, 1);
      case 'daily':
      default:
        return addDays(date, 1);
    }
  }

  private formatTrendKey(date: Date, period: TrendPeriod): string {
    switch (period) {
      case 'hourly':
        return format(date, 'yyyy-MM-dd-HH');
      case 'weekly':
      case 'daily':
        return format(date, 'yyyy-MM-dd');
      case 'monthly':
        return format(date, 'yyyy-MM');
      default:
        return format(date, 'yyyy-MM-dd');
    }
  }

  private parseTrendPeriod(periodKey: string, trendPeriod: TrendPeriod): Date | null {
    if (trendPeriod === 'hourly') {
      const parts = periodKey.split('-');
      if (parts.length !== 4) return null;
      const datePart = `${parts[0]}-${parts[1]}-${parts[2]}`;
      const hourPart = parts[3];
      if (!datePart || !hourPart) return null;
      const dateParts = datePart.split('-').map(Number);
      const year = dateParts[0] ?? NaN;
      const month = dateParts[1] ?? NaN;
      const day = dateParts[2] ?? NaN;
      const hour = Number(hourPart);
      if (![year, month, day, hour].every((value) => Number.isFinite(value))) return null;
      return new Date(year, month - 1, day, hour, 0, 0, 0);
    }

    if (trendPeriod === 'monthly') {
      const parts = periodKey.split('-').map(Number);
      if (parts.length !== 2) return null;
      const year = parts[0] ?? NaN;
      const month = parts[1] ?? NaN;
      if (![year, month].every((value) => Number.isFinite(value))) return null;
      return new Date(year, month - 1, 1, 0, 0, 0, 0);
    }

    const parts = periodKey.split('-').map(Number);
    if (parts.length !== 3) return null;
    const year = parts[0] ?? NaN;
    const month = parts[1] ?? NaN;
    const day = parts[2] ?? NaN;
    if (![year, month, day].every((value) => Number.isFinite(value))) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
}

export default AnalyticsService;
