import React, { useState, useMemo } from 'react';
import { useOrders, useSettingsStore } from '@/stores';
import AnalyticsService from '@/services/analyticsService';
import { LineChart, BarChart, PieChart, MetricCard } from './Charts';
import { chartColors, formatters } from '@/utils/chartHelpers';
import OrderDetailsModal from './OrderDetailsModal';
import type { Order, TimePeriod, TrendPeriod } from '@/types';

type ViewType = 'overview' | 'revenue' | 'products' | 'customers' | 'time';

const EnhancedAnalytics: React.FC = () => {
  const orders = useOrders();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [selectedView, setSelectedView] = useState<ViewType>('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const businessDayCutoffHour = useSettingsStore((state) => state.businessDayCutoffHour ?? 3);

  const trendConfig = useMemo<{ period: TrendPeriod; days: number }>(() => {
    if (selectedPeriod === 'today') {
      return { period: 'hourly', days: 1 };
    }
    if (selectedPeriod === 'week') {
      return { period: 'daily', days: 7 };
    }
    if (selectedPeriod === 'month') {
      return { period: 'daily', days: 30 };
    }
    return { period: 'daily', days: 90 };
  }, [selectedPeriod]);

  // 初始化分析服務
  const analyticsService = useMemo(() => {
    return new AnalyticsService(orders || [], {
      cutoffHour: businessDayCutoffHour,
      includedStatuses: ['completed', 'paid']
    });
  }, [orders, businessDayCutoffHour]);

  // 計算基礎統計數據
  const basicStats = useMemo(() => {
    return analyticsService.getBasicStats(selectedPeriod);
  }, [analyticsService, selectedPeriod]);

  // 計算營收趨勢
  const revenueTrends = useMemo(() => {
    return analyticsService.getRevenueTrends(trendConfig.period, trendConfig.days, selectedPeriod);
  }, [analyticsService, trendConfig, selectedPeriod]);

  // 計算產品分析
  const productAnalysis = useMemo(() => {
    return analyticsService.getProductAnalysis(selectedPeriod);
  }, [analyticsService, selectedPeriod]);

  // 計算客戶分析
  const customerAnalysis = useMemo(() => {
    return analyticsService.getCustomerAnalysis(selectedPeriod);
  }, [analyticsService, selectedPeriod]);

  const timeAnalysis = useMemo(() => {
    return analyticsService.getTimeAnalysis(selectedPeriod);
  }, [analyticsService, selectedPeriod]);

  const handleCloseModal = (): void => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const getPeriodText = (period: TimePeriod): string => {
    const texts: Record<TimePeriod, string> = {
      today: '今日',
      week: '本週', 
      month: '本月',
      all: '全部'
    };
    return texts[period] || period;
  };

  const getViewText = (view: ViewType): string => {
    const texts: Record<ViewType, string> = {
      overview: '總覽',
      revenue: '營收分析',
      products: '產品分析', 
      customers: '客戶分析',
      time: '時段分析'
    };
    return texts[view] || view;
  };

  // 渲染總覽視圖
  const renderOverview = (): React.ReactElement => (
    <div className="space-y-8">
      {/* 主要指標卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="總營收"
          value={basicStats.current.totalRevenue}
          previousValue={basicStats.previous.totalRevenue}
          format="currency"
          color="green"
          icon="💰"
        />
        <MetricCard
          title="訂單數量"
          value={basicStats.current.totalOrders}
          previousValue={basicStats.previous.totalOrders}
          format="number"
          color="blue"
          icon="📋"
        />
        <MetricCard
          title="平均客單價"
          value={basicStats.current.averageOrderValue}
          previousValue={basicStats.previous.averageOrderValue}
          format="currency"
          color="purple"
          icon="💳"
        />
        <MetricCard
          title="客戶數量"
          value={basicStats.current.uniqueCustomers}
          format="number"
          color="orange"
          icon="👥"
        />
      </div>

      {/* 營收趨勢圖 */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">營收趨勢</h3>
        <LineChart
          data={revenueTrends}
          height={300}
          lines={[
            {
              dataKey: 'revenue',
              color: chartColors.success,
              name: '營收',
              strokeWidth: 3
            },
            {
              dataKey: 'orderCount',
              color: chartColors.primary,
              name: '訂單數量',
              strokeWidth: 2
            }
          ]}
          xAxisKey="formattedDate"
          yAxisFormatter={formatters.compact}
          tooltipFormatter={formatters.currency}
        />
      </div>

      {/* 產品和客戶概況 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 熱門產品 */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">熱門調酒 Top 5</h3>
          <BarChart
            data={productAnalysis.topSellingProducts.slice(0, 5)}
            height={250}
            layout="vertical"
            bars={[
              {
                dataKey: 'totalRevenue',
                color: chartColors.warning,
                name: '營收'
              }
            ]}
            xAxisKey="name"
            yAxisFormatter={formatters.currency}
            tooltipFormatter={formatters.currency}
          />
        </div>

        {/* 客戶分群 */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">客戶分群</h3>
          <PieChart
            data={customerAnalysis.segments.map(segment => ({
              name: segment.name,
              value: segment.count
            }))}
            height={250}
            showLabels={true}
            tooltipFormatter={(value) => `${value} 人`}
          />
        </div>
      </div>
    </div>
  );

  // 渲染營收分析視圖
  const renderRevenueAnalysis = (): React.ReactElement => (
    <div className="space-y-8">
      {/* 詳細營收趨勢 */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">營收詳細分析</h3>
        <LineChart
          data={revenueTrends}
          height={400}
          lines={[
            {
              dataKey: 'revenue',
              color: chartColors.success,
              name: '營收',
              strokeWidth: 3
            },
            {
              dataKey: 'orderCount',
              color: chartColors.primary,
              name: '訂單數量',
              strokeWidth: 2
            },
            {
              dataKey: 'averageOrderValue',
              color: chartColors.secondary,
              name: '平均客單價',
              strokeWidth: 2
            }
          ]}
          xAxisKey="formattedDate"
          yAxisFormatter={formatters.compact}
          tooltipFormatter={formatters.currency}
        />
      </div>

      {/* 基酒分類營收 */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">基酒分類營收</h3>
        <BarChart
          data={productAnalysis.categories}
          height={300}
          bars={[
            {
              dataKey: 'revenue',
              color: chartColors.info,
              name: '營收'
            }
          ]}
          xAxisKey="name"
          yAxisFormatter={formatters.currency}
          tooltipFormatter={formatters.currency}
        />
      </div>
    </div>
  );

  // 渲染產品分析視圖
  const renderProductAnalysis = (): React.ReactElement => (
    <div className="space-y-8">
      {/* 產品銷售排行 */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">產品銷售排行</h3>
        <BarChart
          data={productAnalysis.topSellingProducts}
          height={400}
          layout="vertical"
          bars={[
            {
              dataKey: 'totalRevenue',
              color: chartColors.warning,
              name: '營收'
            },
            {
              dataKey: 'totalQuantity',
              color: chartColors.info,
              name: '銷量'
            }
          ]}
          xAxisKey="name"
          yAxisFormatter={formatters.currency}
          tooltipFormatter={formatters.number}
        />
      </div>

      {/* 基酒分類分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">基酒分類營收佔比</h3>
          <PieChart
            data={productAnalysis.categories.map(cat => ({
              name: cat.name,
              value: cat.revenue
            }))}
            height={300}
            showLabels={true}
            tooltipFormatter={formatters.currency}
          />
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">基酒分類銷量佔比</h3>
          <PieChart
            data={productAnalysis.categories.map(cat => ({
              name: cat.name,
              value: cat.quantity
            }))}
            height={300}
            showLabels={true}
            tooltipFormatter={(value) => `${value} 份`}
          />
        </div>
      </div>
    </div>
  );

  // 渲染客戶分析視圖
  const renderCustomerAnalysis = (): React.ReactElement => (
    <div className="space-y-8">
      {/* 客戶關鍵指標 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="總客戶數"
          value={customerAnalysis.totalCustomers}
          format="number"
          color="blue"
          icon="👥"
        />
        <MetricCard
          title="平均客戶價值"
          value={customerAnalysis.averageCLV}
          format="currency"
          color="green"
          icon="💎"
        />
        <MetricCard
          title="客戶留存率"
          value={customerAnalysis.customerRetention}
          format="percentage"
          color="purple"
          icon="🔄"
        />
      </div>

      {/* 客戶分群分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">客戶分群分佈</h3>
          <PieChart
            data={customerAnalysis.segments.map(segment => ({
              name: segment.name,
              value: segment.count
            }))}
            height={300}
            showLabels={true}
            tooltipFormatter={(value) => `${value} 人`}
          />
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">分群平均價值</h3>
          <BarChart
            data={customerAnalysis.segments}
            height={300}
            bars={[
              {
                dataKey: 'averageValue',
                color: chartColors.secondary,
                name: '平均價值'
              }
            ]}
            xAxisKey="name"
            yAxisFormatter={formatters.currency}
            tooltipFormatter={formatters.currency}
          />
        </div>
      </div>

      {/* 高價值客戶 */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">高價值客戶 Top 10</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="card bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">客戶ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">消費總額</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">消費頻率</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase">客戶價值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {customerAnalysis.topCustomers.map((customer) => (
                <tr key={customer.customerId} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-white">#{customer.customerId}</td>
                  <td className="px-4 py-3 text-sm text-green-400 font-semibold">
                    {formatters.currency(customer.monetary)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{customer.frequency} 次</td>
                  <td className="px-4 py-3 text-sm text-purple-400 font-semibold">
                    {formatters.currency(customer.clv)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 渲染時段分析視圖
  const renderTimeAnalysis = (): React.ReactElement => (
    <div className="space-y-8">
      {/* 每小時營收分佈 */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">24小時營收分佈</h3>
        <BarChart
          data={timeAnalysis.hourlyDistribution}
          height={300}
          bars={[
            {
              dataKey: 'revenue',
              color: chartColors.info,
              name: '營收'
            }
          ]}
          xAxisKey="label"
          yAxisFormatter={formatters.currency}
          tooltipFormatter={formatters.currency}
        />
      </div>

      {/* 週間營收分佈 */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">一週營收分佈</h3>
        <BarChart
          data={timeAnalysis.weeklyDistribution}
          height={300}
          bars={[
            {
              dataKey: 'revenue',
              color: chartColors.secondary,
              name: '營收'
            }
          ]}
          xAxisKey="label"
          yAxisFormatter={formatters.currency}
          tooltipFormatter={formatters.currency}
        />
      </div>

      {/* 熱門時段統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">熱門時段 Top 3</h3>
          <div className="space-y-4">
            {timeAnalysis.peakHours.map((hour, index) => (
              <div key={hour.hour} className="flex items-center justify-between p-4 card bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    'bg-orange-300 text-orange-900'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-white font-medium">{hour.hour}:00</span>
                </div>
                <span className="text-green-400 font-bold">
                  {formatters.currency(hour.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">熱門日期 Top 3</h3>
          <div className="space-y-4">
            {timeAnalysis.peakDays.map((day, index) => (
              <div key={day.day} className="flex items-center justify-between p-4 card bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    'bg-orange-300 text-orange-900'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-white font-medium">{day.day}</span>
                </div>
                <span className="text-green-400 font-bold">
                  {formatters.currency(day.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = (): React.ReactElement => {
    switch (selectedView) {
      case 'revenue': return renderRevenueAnalysis();
      case 'products': return renderProductAnalysis();
      case 'customers': return renderCustomerAnalysis();
      case 'time': return renderTimeAnalysis();
      default: return renderOverview();
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* 標題和控制項 */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">酒吧營運分析</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 時間篩選 */}
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'all'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  selectedPeriod === period
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                {getPeriodText(period)}
              </button>
            ))}
          </div>

          {/* 視圖切換 */}
          <div className="flex flex-wrap gap-2">
            {(['overview', 'revenue', 'products', 'customers', 'time'] as const).map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  selectedView === view
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {getViewText(view)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      {renderCurrentView()}

      {/* 訂單詳情模態框 */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseModal}
          onUpdateStatus={() => {}}
          onReleaseTable={() => {}}
          isHistoryMode={true}
        />
      )}
    </div>
  );
};

export default EnhancedAnalytics;
