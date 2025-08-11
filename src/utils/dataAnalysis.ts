import { differenceInDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth, startOfDay, format } from 'date-fns';
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

// Private helper to get raw RFM values for all customers
const getAllRFMValues = (orders: Order[]): Omit<RFMAnalysis, 'score'>[] => {
  const now = new Date();
  const customerGroups = groupBy(orders.filter(o => o.customerId), 'customerId');
  
  return Object.entries(customerGroups).map(([id, customerOrders]) => {
    if (!customerOrders || customerOrders.length === 0) {
      // This case should ideally not be reached with lodash's groupBy
      return { customerId: id, recency: 999, frequency: 0, monetary: 0 };
    }
    const sortedOrders = orderBy(customerOrders, 'createdAt', 'desc');
    const mostRecentOrder = sortedOrders[0];
    
    const recency = mostRecentOrder ? differenceInDays(now, new Date(mostRecentOrder.createdAt)) : 999;
    const frequency = customerOrders.length;
    const monetary = sumBy(customerOrders, 'total');
    
    return { customerId: id, recency, frequency, monetary };
  });
};

// Quantile scoring function
const getQuantileScore = (value: number, sortedValues: number[], reverse: boolean = false): number => {
  const length = sortedValues.length;
  if (length === 0) return 1; // Default score

  // Find position, assuming values are sorted ascending
  const position = sortedValues.findIndex(v => value <= v);

  if (position === -1) { // Value is greater than all elements
    return 5;
  }

  const percentile = (position + 1) / length;
  const score = Math.ceil(percentile * 5);

  return reverse ? 6 - score : score;
};

// Main RFM calculation function
export const calculateRFM = (orders: Order[], customerId: string | null = null): RFMAnalysis[] | RFMAnalysis | null => {
  if (!orders || orders.length === 0) {
    return customerId ? null : [];
  }

  const allCustomerData = getAllRFMValues(orders);
  if (allCustomerData.length === 0) {
    return customerId ? null : [];
  }

  const recencyValues = allCustomerData.map(c => c.recency).sort((a, b) => a - b);
  const frequencyValues = allCustomerData.map(c => c.frequency).sort((a, b) => a - b);
  const monetaryValues = allCustomerData.map(c => c.monetary).sort((a, b) => a - b);

  const fullRFMData = allCustomerData.map(customer => {
    const recencyScore = getQuantileScore(customer.recency, recencyValues, true); // Lower is better (reversed)
    const frequencyScore = getQuantileScore(customer.frequency, frequencyValues, false);
    const monetaryScore = getQuantileScore(customer.monetary, monetaryValues, false);
    return {
      ...customer,
      score: `${recencyScore}${frequencyScore}${monetaryScore}`
    };
  });

  if (customerId) {
    return fullRFMData.find(c => c.customerId === customerId) || null;
  } else {
    return fullRFMData;
  }
};

// Customer segmentation
export const segmentCustomers = (rfmData: RFMAnalysis[]): (RFMAnalysis & { segment: CustomerSegment })[] => {
  return rfmData.map(customer => ({
    ...customer,
    segment: determineSegment(customer.score)
  }));
};

// Determine customer segment based on RFM score
const determineSegment = (rfmScore: string): CustomerSegment => {
  if (typeof rfmScore !== 'string' || rfmScore.length !== 3) return 'Others';
  const [r, f, m] = rfmScore.split('').map(s => Number(s) || 0);

  if (r === undefined || f === undefined || m === undefined || isNaN(r) || isNaN(f) || isNaN(m)) return 'Others';

  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 3 && f >= 3 && m >= 4) return 'Loyal';
  if (r >= 4 && f <= 2 && m >= 3) return 'Potential';
  if (r >= 4 && f >= 3 && m <= 2) return 'New';
  if (r <= 2 && f >= 3 && m >= 3) return 'At Risk';
  if (r <= 2 && f <= 2 && m >= 4) return 'Cannot Lose';
  if (r >= 3 && f <= 2 && m <= 2) return 'Hibernating';
  
  return 'Others';
};

// Filter orders by time period
export const filterOrdersByPeriod = (orders: Order[], period: TimePeriod): Order[] => {
  const now = new Date();
  let startDate: Date, endDate: Date;
  
  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      endDate = new Date(); // up to now
      break;
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'all':
    default:
      return orders;
  }
  
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });
};

// Calculate trend data
export const calculateTrends = (orders: Order[], period: TrendPeriod = 'daily'): TrendData[] => {
  const groupedData = groupBy(orders, order => {
    const date = new Date(order.createdAt);
    switch (period) {
      case 'hourly': return format(date, 'yyyy-MM-dd-HH');
      case 'daily': return format(date, 'yyyy-MM-dd');
      case 'weekly': return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      case 'monthly': return format(date, 'yyyy-MM');
      default: return format(date, 'yyyy-MM-dd');
    }
  });
  
  return Object.entries(groupedData).map(([periodStr, periodOrders]) => ({
    period: periodStr,
    orderCount: periodOrders.length,
    revenue: sumBy(periodOrders, 'total'),
    averageOrderValue: meanBy(periodOrders, 'total') || 0,
    customerCount: new Set(periodOrders.map(o => o.customerId).filter(Boolean)).size
  })).sort((a, b) => a.period.localeCompare(b.period));
};

// Product analysis
export const analyzeProducts = (orders: Order[]): ProductAnalysis[] => {
  const allItems = orders.flatMap(order => 
    order.items?.map(item => ({ ...item, orderId: order.id, customerId: order.customerId })) || []
  );
  
  const productStats = groupBy(allItems, 'name');
  
  return Object.entries(productStats).map(([name, items]) => ({
    name,
    totalQuantity: sumBy(items, 'quantity'),
    totalRevenue: sumBy(items, item => item.price * item.quantity),
    orderCount: new Set(items.map(item => item.orderId)).size,
    averagePrice: meanBy(items, 'price') || 0,
    uniqueCustomers: new Set(items.map(item => item.customerId).filter(Boolean)).size
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

// Seating analysis
export const analyzeSeating = (orders: Order[]): SeatingAnalysis[] => {
  const seatData = groupBy(orders.filter(o => o.tableNumber != null), 'tableNumber');
  
  return Object.entries(seatData).map(([tableNumber, tableOrders]) => ({
    tableNumber: parseInt(tableNumber),
    orderCount: tableOrders.length,
    totalRevenue: sumBy(tableOrders, 'total'),
    averageOrderValue: meanBy(tableOrders, 'total') || 0,
    uniqueCustomers: new Set(tableOrders.map(o => o.customerId).filter(Boolean)).size,
    utilizationRate: calculateUtilizationRate(tableOrders)
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

// Simplified seat utilization rate
const calculateUtilizationRate = (orders: Order[]): number => {
  const hoursInPeriod = 24 * 30; // Assuming a 30-day period
  return Math.min((orders.length / hoursInPeriod) * 100, 100);
};

// Revenue prediction
export const predictRevenue = (trendData: TrendData[], days: number = 7): TrendData[] => {
  if (trendData.length < 2) return [];
  
  const recentData = trendData.slice(-14);
  const avgGrowthRate = calculateGrowthRate(recentData);
  
  const lastValue = recentData[recentData.length - 1]?.revenue || 0;
  const predictions: TrendData[] = [];
  
  for (let i = 1; i <= days; i++) {
    predictions.push({
      period: `Pred. +${i}d`,
      revenue: Math.max(0, lastValue * (1 + avgGrowthRate) ** i),
      orderCount: 0,
      averageOrderValue: 0,
      customerCount: 0,
      isPrediction: true
    });
  }
  
  return predictions;
};

// Average growth rate calculation
const calculateGrowthRate = (data: TrendData[]): number => {
  if (data.length < 2) return 0;
  
  let totalGrowthRate = 0;
  let validPeriods = 0;
  
  for (let i = 1; i < data.length; i++) {
    const currentRevenue = data[i]?.revenue;
    const previousRevenue = data[i - 1]?.revenue;
    if (previousRevenue && currentRevenue && previousRevenue > 0) {
      const growthRate = (currentRevenue - previousRevenue) / previousRevenue;
      totalGrowthRate += growthRate;
      validPeriods++;
    }
  }
  
  return validPeriods > 0 ? totalGrowthRate / validPeriods : 0;
};

// Customer Lifetime Value calculation
export const calculateCLV = (customerOrders: Order[], periodInMonths: number = 12): number => {
  if (customerOrders.length === 0) return 0;
  
  const totalRevenue = sumBy(customerOrders, 'total');
  const monthsActive = calculateActiveMonths(customerOrders);
  const avgMonthlyRevenue = totalRevenue / Math.max(monthsActive, 1);
  
  return avgMonthlyRevenue * periodInMonths;
};

// Calculate active months for a customer
const calculateActiveMonths = (orders: Order[]): number => {
  const months = new Set(
    orders.map(order => format(new Date(order.createdAt), 'yyyy-MM'))
  );
  return months.size;
};