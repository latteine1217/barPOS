import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { chartTheme, chartColors, formatters } from '../../utils/chartHelpers';
import CustomTooltip from './CustomTooltip';

interface BarConfig {
  dataKey: string;
  name?: string;
  color?: string;
  radius?: number | [number, number, number, number];
  props?: Record<string, unknown>;
}

interface CustomBarChartProps {
  data?: object[];
  bars?: BarConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  xAxisKey?: string;
  xAxisFormatter?: ((value: string | number | undefined) => string) | undefined;
  yAxisFormatter?: ((value: string | number | undefined) => string) | undefined;
  tooltipFormatter?: ((value: string | number | undefined) => string) | undefined;
  className?: string;
  layout?: 'vertical' | 'horizontal';
}

const CustomBarChart: React.FC<CustomBarChartProps> = ({ 
  data = [], 
  bars = [], 
  height = 300,
  showGrid = true,
  showLegend = true,
  xAxisKey = 'name',
  xAxisFormatter,
  yAxisFormatter = formatters.number,
  tooltipFormatter = formatters.number,
  className = '',
  layout = 'vertical' // 'vertical' 或 'horizontal'
}) => {
  // 創建統一的 tickFormatter 函數來處理類型安全
  const createTickFormatter = (formatter?: (value: string | number | undefined) => string) => {
    if (!formatter) return undefined;
    return (value: unknown): string => {
      if (typeof value === 'string' || typeof value === 'number') {
        return formatter(value);
      }
      return formatter(undefined);
    };
  };

  const xAxisTickFormatter = createTickFormatter(xAxisFormatter);
  const yAxisTickFormatter = createTickFormatter(yAxisFormatter);

  const customTooltip = (
    <CustomTooltip 
      labelFormatter={xAxisFormatter ? (value) => xAxisFormatter(value) : null}
      valueFormatter={tooltipFormatter ? (value) => tooltipFormatter(value) : null}
    />
  );

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid 
              stroke={chartTheme.grid.stroke} 
              strokeDasharray={chartTheme.grid.strokeDasharray} 
            />
          )}
          
          <XAxis 
            type={layout === 'vertical' ? 'number' : 'category'}
            {...(layout !== 'vertical' && { dataKey: xAxisKey || 'name' })}
            tick={chartTheme.axis.tick}
            axisLine={chartTheme.axis.axisLine}
            tickLine={chartTheme.axis.tickLine}
            {...(layout === 'vertical' && yAxisTickFormatter && { tickFormatter: yAxisTickFormatter })}
            {...(layout !== 'vertical' && xAxisTickFormatter && { tickFormatter: xAxisTickFormatter })}
          />
          
          <YAxis 
            type={layout === 'vertical' ? 'category' : 'number'}
            {...(layout === 'vertical' && { dataKey: xAxisKey || 'name' })}
            tick={chartTheme.axis.tick}
            axisLine={chartTheme.axis.axisLine}
            tickLine={chartTheme.axis.tickLine}
            {...(layout === 'vertical' && xAxisTickFormatter && { tickFormatter: xAxisTickFormatter })}
            {...(layout !== 'vertical' && yAxisTickFormatter && { tickFormatter: yAxisTickFormatter })}
            width={layout === 'vertical' ? 80 : undefined}
          />
          
          <Tooltip content={customTooltip} />
          
          {showLegend && (
            <Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
          )}
          
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color || chartColors.palette[index % chartColors.palette.length]}
              name={bar.name || bar.dataKey}
              radius={bar.radius || [0, 4, 4, 0]}
              animationDuration={800}
              animationBegin={index * 50}
              animationEasing="ease-out"
              isAnimationActive={true}
              {...bar.props}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
