import React from 'react';

interface TooltipPayload {
  name: string;
  value: string | number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  labelFormatter?: ((label: string | number | undefined) => string) | null | undefined;
  valueFormatter?: ((value: string | number | undefined) => string) | null | undefined;
}

// 自定義工具提示組件
const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  labelFormatter, 
  valueFormatter 
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-gray-900/95 backdrop-blur border border-white/30 rounded-lg p-4 shadow-2xl">
      <p className="text-white font-semibold mb-3 text-sm">
        {labelFormatter ? labelFormatter(label ?? '') : label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm mb-1 flex items-center justify-between gap-3">
          <span className="text-white/90 font-medium flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full inline-block" 
              style={{ backgroundColor: entry.color }}
            ></span>
            {entry.name}:
          </span>
          <span className="font-bold text-white" style={{ color: entry.color }}>
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip;