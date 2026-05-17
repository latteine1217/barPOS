import React from 'react';
import { formatters } from '../../utils/chartHelpers';

type MetricColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'pink' | 'indigo' | 'cyan' | 'emerald';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon?: string | React.ReactNode;
  color?: MetricColor;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage' | 'compact';
  className?: string;
  onClick?: () => void;
}

// Tailwind JIT 需要完整字面量才不會被 purge — 動態 `text-${color}-400`
// 在 build time source code 中不存在這個字串，JIT 偵測不到，整批顏色
// 會被 tree-shake 移除。集中於此 map 才能保證所有 variant 都進 bundle。
const COLOR_TEXT: Record<MetricColor, string> = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
  yellow: 'text-yellow-400',
  pink: 'text-pink-400',
  indigo: 'text-indigo-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
};

const COLOR_GRADIENT: Record<MetricColor, string> = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-green-400 to-green-600',
  purple: 'from-purple-400 to-purple-600',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-red-400 to-red-600',
  yellow: 'from-yellow-400 to-yellow-600',
  pink: 'from-pink-400 to-pink-600',
  indigo: 'from-indigo-400 to-indigo-600',
  cyan: 'from-cyan-400 to-cyan-600',
  emerald: 'from-emerald-400 to-emerald-600',
};

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
      {...(onClick
        ? {
            onClick,
            role: 'button',
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* 改用 CSS variable 而非 text-white/90，使 light theme 下不會白字白底 */}
          <p className="text-[var(--text-primary)] text-sm font-semibold mb-2">{title}</p>
          <p className={`text-3xl font-bold ${COLOR_TEXT[color]} mb-1 drop-shadow-sm`}>
            {formatValue(value)}
          </p>
          {change !== null && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${getTrendColor()} drop-shadow-sm`}>
                {getTrendIcon()} {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">vs 上期</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`${COLOR_TEXT[color]} text-4xl opacity-90 drop-shadow-sm`}>
            {typeof icon === 'string' ? (
              <span>{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
      </div>
      
      {/* 底部裝飾線 */}
      <div className={`h-1 bg-gradient-to-r ${COLOR_GRADIENT[color]} rounded-full mt-4 opacity-70`}></div>
    </div>
  );
};

export default MetricCard;