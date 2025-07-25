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
  radius?: number | number[];
  props?: any;
}

interface CustomBarChartProps {
  data?: any[];
  bars?: BarConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  xAxisKey?: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => string;
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
  const customTooltip = (
    <CustomTooltip 
      labelFormatter={xAxisFormatter}
      valueFormatter={tooltipFormatter}
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
            dataKey={layout === 'vertical' ? undefined : xAxisKey}
            tick={chartTheme.axis.tick}
            axisLine={chartTheme.axis.axisLine}
            tickLine={chartTheme.axis.tickLine}
            tickFormatter={layout === 'vertical' ? yAxisFormatter : xAxisFormatter}
          />
          
          <YAxis 
            type={layout === 'vertical' ? 'category' : 'number'}
            dataKey={layout === 'vertical' ? xAxisKey : undefined}
            tick={chartTheme.axis.tick}
            axisLine={chartTheme.axis.axisLine}
            tickLine={chartTheme.axis.tickLine}
            tickFormatter={layout === 'vertical' ? xAxisFormatter : yAxisFormatter}
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