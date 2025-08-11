import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { chartTheme, chartColors, formatters } from '../../utils/chartHelpers';
import CustomTooltip from './CustomTooltip';

// 定義圖表數據的基本結構
interface ChartDataItem {
  [key: string]: string | number | boolean | null | undefined;
}

interface LineConfig {
  dataKey: string;
  name?: string;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  props?: Record<string, unknown>;
}

interface CustomLineChartProps {
  data?: ChartDataItem[];
  lines?: LineConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  xAxisKey?: string;
  xAxisFormatter?: (value: string | number | undefined) => string;
  yAxisFormatter?: (value: string | number | undefined) => string;
  tooltipFormatter?: (value: string | number | undefined) => string;
  className?: string;
}

const CustomLineChart: React.FC<CustomLineChartProps> = ({ 
  data = [], 
  lines = [], 
  height = 300,
  showGrid = true,
  showLegend = true,
  xAxisKey = 'date',
  xAxisFormatter,
  yAxisFormatter = formatters.number,
  tooltipFormatter = formatters.number,
  className = ''
}) => {
  // 創建統一的 tickFormatter 函數來處理類型安全
  const createTickFormatter = (formatter?: (value: string | number | undefined) => string) => {
    if (!formatter) return undefined;
    return (value: any): string => {
      return formatter(value);
    };
  };

  const xAxisTickFormatter = createTickFormatter(xAxisFormatter);
  const yAxisTickFormatter = createTickFormatter(yAxisFormatter);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              stroke={chartTheme.grid.stroke} 
              strokeDasharray={chartTheme.grid.strokeDasharray} 
            />
          )}
          
          <XAxis 
            dataKey={xAxisKey}
            tick={chartTheme.axis.tick}
            axisLine={chartTheme.axis.axisLine}
            tickLine={chartTheme.axis.tickLine}
            {...(xAxisTickFormatter && { tickFormatter: xAxisTickFormatter })}
          />
          
          <YAxis 
            tick={chartTheme.axis.tick}
            axisLine={chartTheme.axis.axisLine}
            tickLine={chartTheme.axis.tickLine}
            {...(yAxisTickFormatter && { tickFormatter: yAxisTickFormatter })}
          />
          
          <Tooltip 
            content={
              <CustomTooltip 
                labelFormatter={xAxisFormatter ? (value) => xAxisFormatter(value) : null}
                valueFormatter={tooltipFormatter ? (value) => tooltipFormatter(value) : null}
              />
            }
          />
          
          {showLegend && (
            <Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
          )}
          
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color || chartColors.palette[index % chartColors.palette.length]}
              strokeWidth={line.strokeWidth || 2}
              dot={line.showDots !== false ? { 
                fill: line.color || chartColors.palette[index % chartColors.palette.length] || chartColors.primary, 
                strokeWidth: 2, 
                r: 4 
              } : false}
              activeDot={{ r: 6, strokeWidth: 2 }}
              name={line.name || line.dataKey}
              connectNulls={false}
              animationDuration={1000}
              animationEasing="ease-out"
              isAnimationActive={true}
              {...line.props}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomLineChart;