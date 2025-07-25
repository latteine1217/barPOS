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
  xAxisFormatter?: (value: string | number) => string;
  yAxisFormatter?: (value: string | number) => string;
  tooltipFormatter?: (value: string | number) => string;
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
            tickFormatter={xAxisFormatter}
          />
          
          <YAxis 
            tick={chartTheme.axis.tick}
            axisLine={chartTheme.axis.axisLine}
            tickLine={chartTheme.axis.tickLine}
            tickFormatter={yAxisFormatter}
          />
          
          <Tooltip 
            content={
              <CustomTooltip 
                labelFormatter={xAxisFormatter}
                valueFormatter={tooltipFormatter}
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
              dot={line.showDots !== false ? { fill: line.color || chartColors.palette[index], strokeWidth: 2, r: 4 } : false}
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