import { 
  calculateRFM, 
  segmentCustomers, 
  filterOrdersByPeriod, 
  calculateTrends, 
  analyzeProducts, 
  analyzeSeating,
  calculateCLV
} from '../utils/dataAnalysis';
import { format, subDays, startOfDay } from 'date-fns';
import type { 
  Order, 
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

// 分析服務類
export class AnalyticsService {
  private orders: Order[];

  constructor(orders: Order[] = []) {
    this.orders = orders;
  }

  // 更新數據
  updateData(orders: Order[]): void {
    this.orders = orders;
  }

  // 獲取基礎統計
  getBasicStats(period: TimePeriod = 'all'): BasicStats {
    const filteredOrders = filterOrdersByPeriod(this.orders, period);
    
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
  getRevenueTrends(period: TrendPeriod = 'daily', days: number = 30): Array<TrendData & { date: string; formattedDate: string }> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    const relevantOrders = this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const trends = calculateTrends(relevantOrders, period);
    
    // 填補缺失的日期
    const filledTrends = this.fillMissingDates(trends);
    
    return filledTrends.map(trend => ({
      ...trend,
      date: this.formatTrendDate(trend.period),
      formattedDate: format(new Date(trend.period), 'MM/dd')
    }));
  }

  // 獲取產品分析
  getProductAnalysis(): ProductAnalysisResult {
    const productStats = analyzeProducts(this.orders);
    
    return {
      topSellingProducts: productStats.slice(0, 10),
      totalProducts: productStats.length,
      totalQuantitySold: productStats.reduce((sum, p) => sum + p.totalQuantity, 0),
      averagePrice: productStats.length > 0 ? productStats.reduce((sum, p) => sum + p.averagePrice, 0) / productStats.length : 0,
      categories: this.getProductCategories(productStats)
    };
  }

  // 獲取座位分析
  getSeatingAnalysis(): SeatingAnalysisResult {
    const seatStats = analyzeSeating(this.orders);
    
    return {
      topPerformingTables: seatStats.slice(0, 10),
      averageUtilization: seatStats.length > 0 ? seatStats.reduce((sum, s) => sum + s.utilizationRate, 0) / seatStats.length : 0,
      totalTables: seatStats.length,
      revenueDistribution: this.calculateSeatRevenueDistribution(seatStats)
    };
  }

  // 獲取客戶分析
  getCustomerAnalysis(): CustomerAnalysisResult {
    const rfmData = calculateRFM(this.orders) as RFMAnalysis[];
    const segmentedCustomers = segmentCustomers(rfmData);
    
    const segments = this.groupBySegment(segmentedCustomers);
    
    return {
      totalCustomers: rfmData.length,
      segments,
      averageCLV: this.calculateAverageCLV(),
      topCustomers: this.getTopCustomers(rfmData),
      newCustomers: this.getNewCustomers(),
      customerRetention: this.calculateRetentionRate()
    };
  }

  // 獲取時段分析
  getTimeAnalysis(): TimeAnalysisResult {
    const hourlyData: { [key: number]: { hour: number; orderCount: number; revenue: number } } = {};
    const dailyData: { [key: number]: { day: number; orderCount: number; revenue: number } } = {};
    
    this.orders.forEach(order => {
      const date = new Date(order.createdAt);
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

    return {
      hourlyDistribution: Object.values(hourlyData).map(h => ({
        ...h,
        label: `${h.hour}:00`
      })),
      weeklyDistribution: Object.values(dailyData).map(d => ({
        ...d,
        label: this.getDayName(d.day)
      })),
      peakHours: this.findPeakHours(Object.values(hourlyData)),
      peakDays: this.findPeakDays(Object.values(dailyData))
    };
  }

  // 私有方法
  private getPreviousPeriodOrders(period: TimePeriod): Order[] {
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    switch (period) {
      case 'today':
        endDate = startOfDay(now);
        startDate = subDays(endDate, 1);
        break;
      case 'week':
        endDate = subDays(now, 7);
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        endDate = subDays(now, 30);
        startDate = subDays(endDate, 30);
        break;
      default:
        return [];
    }
    
    return this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate < endDate;
    });
  }

  private calculateChange(current: number, previous: number): number | null {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  private fillMissingDates(trends: TrendData[]): TrendData[] {
    // 為簡化，這裡返回原始趨勢數據
    // 實際應用中可以填補缺失的日期數據
    return trends;
  }

  private formatTrendDate(period: string): string {
    // 格式化趨勢日期用於圖表顯示
    return period;
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

  private calculateAverageCLV(): number {
    if (this.orders.length === 0) return 0;
    
    const customerGroups: { [key: string]: Order[] } = {};
    this.orders.forEach(order => {
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

  private getTopCustomers(rfmData: RFMAnalysis[]): Array<RFMAnalysis & { clv: number }> {
    return rfmData
      .sort((a, b) => b.monetary - a.monetary)
      .slice(0, 10)
      .map(customer => ({
        ...customer,
        clv: calculateCLV(this.orders.filter(o => o.customerId === customer.customerId))
      }));
  }

  private getNewCustomers(): number {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const newCustomerIds = new Set<string>();
    
    this.orders.forEach(order => {
      if (order.customerId && new Date(order.createdAt) >= thirtyDaysAgo) {
        const earliestOrder = this.orders
          .filter(o => o.customerId === order.customerId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        
        if (earliestOrder && new Date(earliestOrder.createdAt) >= thirtyDaysAgo) {
          newCustomerIds.add(order.customerId);
        }
      }
    });

    return newCustomerIds.size;
  }

  private calculateRetentionRate(): number {
    // 簡化的留存率計算
    const customerFirstOrders: { [key: string]: string } = {};
    const customerLastOrders: { [key: string]: string } = {};

    this.orders.forEach(order => {
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
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(h => ({ hour: h.hour, revenue: h.revenue }));
  }

  private findPeakDays(dailyData: Array<{ day: number; revenue: number }>): Array<{ day: string; revenue: number }> {
    return dailyData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(d => ({ day: this.getDayName(d.day), revenue: d.revenue }));
  }
}

export default AnalyticsService;
