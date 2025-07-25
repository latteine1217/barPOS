import { format, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import type { ChartConfig } from '../types';

// 圖表顏色主題
export const chartColors = {
  primary: '#3B82F6',    // blue-500
  secondary: '#8B5CF6',  // purple-500
  success: '#10B981',    // green-500
  warning: '#F59E0B',    // yellow-500
  danger: '#EF4444',     // red-500
  info: '#06B6D4',       // cyan-500
  
  // 多色彩盤
  palette: [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
    '#EF4444', '#06B6D4', '#84CC16', '#F97316',
    '#EC4899', '#6366F1', '#14B8A6', '#EAB308'
  ]
};

// 圖表主題配置
export const chartTheme = {
  grid: {
    stroke: 'rgba(255, 255, 255, 0.15)',
    strokeDasharray: '3 3'
  },
  axis: {
    tick: { fill: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: 500 },
    axisLine: { stroke: 'rgba(255, 255, 255, 0.3)' },
    tickLine: { stroke: 'rgba(255, 255, 255, 0.3)' }
  },
  legend: {
    wrapperStyle: { color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }
  }
};

// 格式化數值顯示
export const formatters = {
  currency: (value?: number): string => `$${value?.toLocaleString() || 0}`,
  percentage: (value?: number): string => `${(value || 0).toFixed(1)}%`,
  number: (value?: number): string => value?.toLocaleString() || '0',
  compact: (value?: number): string => {
    if (!value) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }
};

// 日期格式化
export const dateFormatters = {
  daily: (date: string | Date): string => format(new Date(date), 'MM/dd'),
  weekly: (date: string | Date): string => format(new Date(date), 'MM/dd'),
  monthly: (date: string | Date): string => format(new Date(date), 'yyyy/MM'),
  hourly: (date: string | Date): string => format(new Date(date), 'HH:mm')
};

// 時間軸數據項目介面
interface TimeAxisDataItem {
  date: string;
  label: string;
  value: number;
}

// 生成時間軸數據
export const generateTimeAxisData = (period: 'daily' | 'weekly' | 'monthly', days: number = 30): TimeAxisDataItem[] => {
  const now = new Date();
  const data: TimeAxisDataItem[] = [];
  
  switch (period) {
    case 'daily':
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(now, i);
        data.push({
          date: date.toISOString(),
          label: format(date, 'MM/dd'),
          value: 0
        });
      }
      break;
      
    case 'weekly':
      for (let i = Math.ceil(days / 7) - 1; i >= 0; i--) {
        const date = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        data.push({
          date: date.toISOString(),
          label: format(date, 'MM/dd'),
          value: 0
        });
      }
      break;
      
    case 'monthly':
      for (let i = Math.ceil(days / 30) - 1; i >= 0; i--) {
        const date = startOfMonth(subMonths(now, i));
        data.push({
          date: date.toISOString(),
          label: format(date, 'yyyy/MM'),
          value: 0
        });
      }
      break;
  }
  
  return data;
};

// 響應式圖表尺寸
interface ResponsiveSize {
  width: number;
  height: number;
}

export const getResponsiveSize = (containerWidth: number): ResponsiveSize => {
  if (containerWidth <= 640) {
    return { width: containerWidth - 32, height: 240 }; // mobile
  } else if (containerWidth <= 1024) {
    return { width: containerWidth - 48, height: 300 }; // tablet
  } else {
    return { width: containerWidth - 64, height: 400 }; // desktop
  }
};

// 數據源介面
// 定義圖表數據項的類型
interface ChartDataItem {
  [key: string]: string | number | boolean | null | undefined;
}

interface DataSource {
  key?: string;
  data: ChartDataItem[];
}

// 圖表數據處理工具
export const chartDataHelpers = {
  // 合併多個數據源
  mergeDataSources: (sources: DataSource[], keyField: string = 'date'): ChartDataItem[] => {
    const keyMap = new Map();
    
    sources.forEach((source, index) => {
      source.data.forEach(item => {
        const key = item[keyField];
        if (!keyMap.has(key)) {
          keyMap.set(key, { [keyField]: key });
        }
        keyMap.get(key)[source.key || `series${index}`] = item.value;
      });
    });
    
    return Array.from(keyMap.values()).sort((a, b) => 
      new Date(a[keyField]).getTime() - new Date(b[keyField]).getTime()
    );
  },
  
  // 計算同期比較
  calculatePeriodComparison: (current: number, previous: number): number | null => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  },
  
  // 計算數據趨勢
  calculateTrend: (data: ChartDataItem[], valueKey: string = 'value'): 'up' | 'down' | 'neutral' => {
    if (data.length < 2) return 'neutral';
    
    const recent = data.slice(-3); // 最近3個數據點
    const earlier = data.slice(-6, -3); // 之前3個數據點
    
    const recentAvg = recent.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0) / earlier.length;
    
    if (recentAvg > earlierAvg * 1.05) return 'up';
    if (recentAvg < earlierAvg * 0.95) return 'down';
    return 'neutral';
  }
};

// 動畫配置介面
interface AnimationConfig {
  animationBegin: number;
  animationDuration: number;
  animationEasing: string;
}

// 圖表動畫配置
export const chartAnimations: Record<string, AnimationConfig> = {
  line: {
    animationBegin: 0,
    animationDuration: 1500,
    animationEasing: 'ease-out'
  },
  bar: {
    animationBegin: 100,
    animationDuration: 1000,
    animationEasing: 'ease-out'
  },
  pie: {
    animationBegin: 200,
    animationDuration: 800,
    animationEasing: 'ease-in-out'
  }
};

// 常用圖表配置預設
export const chartDefaults: ChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  width: 400,
  height: 300
};

// 工具提示數據介面
interface TooltipData {
  name: string;
  value: string | number;
  color: string;
}

interface CustomTooltipResult {
  active: boolean;
  label: string | number;
  data: TooltipData[];
}

// 工具提示自定義內容生成器
export const createCustomTooltip = (
  labelFormatter?: (label: string | number) => string | number, 
  valueFormatter?: (value: string | number) => string | number
) => {
  return ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ name: string; value: string | number; color: string }>; 
    label?: string | number 
  }): CustomTooltipResult | null => {
    if (!active || !payload || payload.length === 0) return null;
    
    return {
      active,
      label: labelFormatter ? labelFormatter(label) : label,
      data: payload.map(entry => ({
        name: entry.name,
        value: valueFormatter ? valueFormatter(entry.value) : entry.value,
        color: entry.color
      }))
    };
  };
};