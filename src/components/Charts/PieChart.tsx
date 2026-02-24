import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { chartTheme, chartColors, formatters } from '../../utils/chartHelpers';
import CustomTooltip from './CustomTooltip';

interface CustomPieChartProps {
  data?: object[];
  height?: number;
  showLegend?: boolean;
  valueKey?: string;
  tooltipFormatter?: (value: string | number | undefined) => string;
  colors?: string[];
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  labelFormatter?: (value: number | undefined) => string;
}

interface LabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const CustomPieChart: React.FC<CustomPieChartProps> = ({ 
  data = [], 
  height = 300,
  showLegend = true,
  valueKey = 'value',
  tooltipFormatter = formatters.number,
  colors = chartColors.palette,
  className = '',
  innerRadius = 0,
  outerRadius = 80,
  showLabels = false,
  labelFormatter = formatters.percentage
}) => {
  // 創建統一的 labelFormatter 函數來處理類型安全
  const createLabelFormatter = (formatter?: (value: number | undefined) => string) => {
    if (!formatter) return (value: number | undefined) => `${(value || 0).toFixed(1)}%`;
    return (value: unknown): string => {
      if (typeof value === 'number') {
        return formatter(value);
      }
      return formatter(undefined);
    };
  };

  const safeLabelFormatter = createLabelFormatter(labelFormatter);

  const customTooltip = (
    <CustomTooltip 
      labelFormatter={null}
      valueFormatter={tooltipFormatter ? (value) => tooltipFormatter(value) : null}
    />
  );

  const renderCustomLabel = (props: LabelProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    
    if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent || percent < 0.05) {
      return null;
    }
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {safeLabelFormatter(percent * 100)}
      </text>
    );
  };

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderCustomLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={valueKey}
            animationBegin={0}
            animationDuration={600}
            animationEasing="ease-out"
            isAnimationActive={true}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          
          <Tooltip content={customTooltip} />
          
          {showLegend && (
            <Legend 
              wrapperStyle={chartTheme.legend.wrapperStyle}
              formatter={(value) => value}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;
