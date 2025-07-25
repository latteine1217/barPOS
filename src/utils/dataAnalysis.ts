import { differenceInDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { groupBy, sumBy, meanBy, orderBy } from 'lodash';
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

// RFM 分析計算
export const calculateRFM = (orders: Order[], customerId: string | null = null): RFMAnalysis[] | RFMAnalysis | null => {
  const now = new Date();
  
  if (customerId) {
    // 單一客戶的 RFM 分析
    const customerOrders = orders.filter(order => order.customerId === customerId);
    if (customerOrders.length === 0) return null;
    
    const recency = differenceInDays(now, new Date(customerOrders[0].createdAt));
    const frequency = customerOrders.length;
    const monetary = sumBy(customerOrders, 'total');
    
    return {
      customerId,
      recency,
      frequency,
      monetary,
      score: calculateRFMScore(recency, frequency, monetary, orders)
    };
  } else {
    // 所有客戶的 RFM 分析
    const customerGroups = groupBy(orders.filter(o => o.customerId), 'customerId');
    
    return Object.entries(customerGroups).map(([id, customerOrders]) => {
      const sortedOrders = orderBy(customerOrders, 'createdAt', 'desc');
      const recency = differenceInDays(now, new Date(sortedOrders[0].createdAt));
      const frequency = customerOrders.length;
      const monetary = sumBy(customerOrders, 'total');
      
      return {
        customerId: id,
        recency,
        frequency,
        monetary,
        score: calculateRFMScore(recency, frequency, monetary, orders)
      };
    });
  }
};

// RFM 評分計算（1-5分制）
export const calculateRFMScore = (recency: number, frequency: number, monetary: number, allOrders: Order[]): string => {
  // 計算全體客戶的統計數據用於分位數計算
  const allCustomerData = calculateRFM(allOrders) as RFMAnalysis[];
  
  const recencyValues = allCustomerData.map(c => c.recency).sort((a, b) => a - b);
  const frequencyValues = allCustomerData.map(c => c.frequency).sort((a, b) => b - a);
  const monetaryValues = allCustomerData.map(c => c.monetary).sort((a, b) => b - a);
  
  const recencyScore = getQuantileScore(recency, recencyValues, true); // 越小越好
  const frequencyScore = getQuantileScore(frequency, frequencyValues, false); // 越大越好
  const monetaryScore = getQuantileScore(monetary, monetaryValues, false); // 越大越好
  
  return `${recencyScore}${frequencyScore}${monetaryScore}`;
};

// 分位數評分
const getQuantileScore = (value: number, sortedValues: number[], reverse: boolean = false): number => {
  const length = sortedValues.length;
  let position = sortedValues.findIndex(v => reverse ? v >= value : v <= value);
  if (position === -1) position = length - 1;
  
  const percentile = position / length;
  
  if (percentile <= 0.2) return reverse ? 5 : 1;
  if (percentile <= 0.4) return reverse ? 4 : 2;
  if (percentile <= 0.6) return reverse ? 3 : 3;
  if (percentile <= 0.8) return reverse ? 2 : 4;
  return reverse ? 1 : 5;
};

// 客戶分群
export const segmentCustomers = (rfmData: RFMAnalysis[]): (RFMAnalysis & { segment: CustomerSegment })[] => {
  return rfmData.map(customer => ({
    ...customer,
    segment: determineSegment(customer.score)
  }));
};

// 根據 RFM 分數確定客戶分群
const determineSegment = (rfmScore: string): CustomerSegment => {
  const [r, f, m] = rfmScore.split('').map(Number);
  
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions'; // 冠軍客戶
  if (r >= 3 && f >= 3 && m >= 4) return 'Loyal'; // 忠誠客戶
  if (r >= 4 && f <= 2 && m >= 3) return 'Potential'; // 潛力客戶
  if (r >= 4 && f >= 3 && m <= 2) return 'New'; // 新客戶
  if (r <= 2 && f >= 3 && m >= 3) return 'At Risk'; // 風險客戶
  if (r <= 2 && f <= 2 && m >= 4) return 'Cannot Lose'; // 不能失去
  if (r >= 3 && f <= 2 && m <= 2) return 'Hibernating'; // 休眠客戶
  
  return 'Others'; // 其他
};

// 時間區間數據篩選
export const filterOrdersByPeriod = (orders: Order[], period: TimePeriod): Order[] => {
  const now = new Date();
  let startDate: Date, endDate: Date;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 }); // 週一開始
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'all':
      return orders;
    default:
      return orders;
  }
  
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && orderDate < endDate;
  });
};

// 趨勢數據計算
export const calculateTrends = (orders: Order[], period: TrendPeriod = 'daily'): TrendData[] => {
  const groupedData = groupBy(orders, order => {
    const date = new Date(order.createdAt);
    
    switch (period) {
      case 'hourly':
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
      case 'daily':
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      case 'weekly': {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        return `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate()) / 7)}`;
      }
      case 'monthly':
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      default:
        return date.toDateString();
    }
  });
  
  return Object.entries(groupedData).map(([period, periodOrders]) => ({
    period,
    orderCount: periodOrders.length,
    revenue: sumBy(periodOrders, 'total'),
    averageOrderValue: meanBy(periodOrders, 'total'),
    customerCount: new Set(periodOrders.map(o => o.customerId).filter(Boolean)).size
  })).sort((a, b) => a.period.localeCompare(b.period));
};

// 產品分析
export const analyzeProducts = (orders: Order[]): ProductAnalysis[] => {
  const allItems = orders.flatMap(order => 
    order.items?.map(item => ({
      ...item,
      orderId: order.id,
      orderDate: order.createdAt,
      customerId: order.customerId
    })) || []
  );
  
  const productStats = groupBy(allItems, 'name');
  
  return Object.entries(productStats).map(([name, items]) => ({
    name,
    totalQuantity: sumBy(items, 'quantity'),
    totalRevenue: sumBy(items, item => item.price * item.quantity),
    orderCount: new Set(items.map(item => item.orderId)).size,
    averagePrice: meanBy(items, 'price'),
    uniqueCustomers: new Set(items.map(item => item.customerId).filter(Boolean)).size
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

// 座位分析
export const analyzeSeating = (orders: Order[]): SeatingAnalysis[] => {
  const seatData = groupBy(orders, 'tableNumber');
  
  return Object.entries(seatData).map(([tableNumber, tableOrders]) => ({
    tableNumber: parseInt(tableNumber),
    orderCount: tableOrders.length,
    totalRevenue: sumBy(tableOrders, 'total'),
    averageOrderValue: meanBy(tableOrders, 'total'),
    uniqueCustomers: new Set(tableOrders.map(o => o.customerId).filter(Boolean)).size,
    utilizationRate: calculateUtilizationRate(tableOrders)
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

// 座位利用率計算（簡化版本）
const calculateUtilizationRate = (orders: Order[]): number => {
  // 這裡可以根據營業時間和平均用餐時間來計算更精確的利用率
  // 暫時用訂單頻率作為利用率指標
  const hoursInPeriod = 24 * 30; // 假設 30 天統計期間
  return Math.min((orders.length / hoursInPeriod) * 100, 100);
};

// 預測功能（簡單線性預測）
export const predictRevenue = (trendData: TrendData[], days: number = 7): TrendData[] => {
  if (trendData.length < 2) return [];
  
  // 使用簡單線性回歸預測
  const recentData = trendData.slice(-14); // 取最近14天數據
  const avgGrowthRate = calculateGrowthRate(recentData);
  
  const lastValue = recentData[recentData.length - 1].revenue;
  const predictions: TrendData[] = [];
  
  for (let i = 1; i <= days; i++) {
    predictions.push({
      period: `預測 Day +${i}`,
      revenue: Math.max(0, lastValue * (1 + avgGrowthRate) ** i),
      orderCount: 0,
      averageOrderValue: 0,
      customerCount: 0,
      isPrediction: true
    });
  }
  
  return predictions;
};

// 計算平均增長率
const calculateGrowthRate = (data: TrendData[]): number => {
  if (data.length < 2) return 0;
  
  let totalGrowthRate = 0;
  let validPeriods = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1].revenue > 0) {
      const growthRate = (data[i].revenue - data[i - 1].revenue) / data[i - 1].revenue;
      totalGrowthRate += growthRate;
      validPeriods++;
    }
  }
  
  return validPeriods > 0 ? totalGrowthRate / validPeriods : 0;
};

// 客戶生命週期價值計算
export const calculateCLV = (customerOrders: Order[], periodInMonths: number = 12): number => {
  if (customerOrders.length === 0) return 0;
  
  const totalRevenue = sumBy(customerOrders, 'total');
  const monthsActive = calculateActiveMonths(customerOrders);
  const avgMonthlyRevenue = totalRevenue / Math.max(monthsActive, 1);
  
  return avgMonthlyRevenue * periodInMonths;
};

// 計算活躍月份
const calculateActiveMonths = (orders: Order[]): number => {
  const months = new Set(
    orders.map(order => {
      const date = new Date(order.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}`;
    })
  );
  return months.size;
};