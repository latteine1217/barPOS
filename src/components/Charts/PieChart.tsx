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

// 定義圓餅圖數據的基本結構
interface PieChartDataItem {
  [key: string]: string | number | boolean | null | undefined;
}

interface CustomPieChartProps {
  data?: PieChartDataItem[];
  height?: number;
  showLegend?: boolean;
  valueKey?: string;
  tooltipFormatter?: (value: string | number) => string;
  colors?: string[];
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  labelFormatter?: (value: number) => string;
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
  const customTooltip = (
    <CustomTooltip 
      labelFormatter={undefined}
      valueFormatter={tooltipFormatter}
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
        {labelFormatter(percent * 100)}
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