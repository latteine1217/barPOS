import React from 'react';
import { formatters } from '../../utils/chartHelpers';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon?: string | React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage' | 'compact';
  className?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  previousValue,
  icon, 
  color = "blue",
  trend,
  format = "number",
  className = "",
  onClick
}) => {
  // 計算變化百分比
  const calculateChange = (): number | null => {
    if (!previousValue || previousValue === 0) return null;
    return ((value - previousValue) / previousValue) * 100;
  };

  const change = calculateChange();
  const trendDirection = trend || (change !== null ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral');

  // 格式化數值
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency': return formatters.currency(val);
      case 'percentage': return formatters.percentage(val);
      case 'compact': return formatters.compact(val);
      default: return formatters.number(val);
    }
  };

  const getTrendIcon = (): string => {
    switch (trendDirection) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getTrendColor = (): string => {
    switch (trendDirection) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div 
      className={`card p-6 transition-all duration-200 hover:scale-105 ${
        onClick ? 'cursor-pointer hover:bg-white/10' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white/90 text-sm font-semibold mb-2">{title}</p>
          <p className={`text-3xl font-bold text-${color}-400 mb-1 drop-shadow-sm`}>
            {formatValue(value)}
          </p>
          {change !== null && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${getTrendColor()} drop-shadow-sm`}>
                {getTrendIcon()} {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-white/70 font-medium">vs 上期</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`text-${color}-400 text-4xl opacity-90 drop-shadow-sm`}>
            {typeof icon === 'string' ? (
              <span>{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
      </div>
      
      {/* 底部裝飾線 */}
      <div className={`h-1 bg-gradient-to-r from-${color}-400 to-${color}-600 rounded-full mt-4 opacity-70`}></div>
    </div>
  );
};

export default MetricCard;