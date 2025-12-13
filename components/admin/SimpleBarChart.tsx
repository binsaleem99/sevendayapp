import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showValues?: boolean;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  color = '#CCFF00',
  height = 200,
  showValues = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 justify-around" style={{ height: `${height}px` }}>
        {data.map((point, index) => {
          const barHeight = maxValue > 0 ? (point.value / maxValue) * 100 : 0;

          return (
            <div key={index} className="flex flex-col items-center justify-end flex-1 gap-2">
              {/* Value on top */}
              {showValues && point.value > 0 && (
                <span className="text-xs text-gray-400 font-bold">
                  {point.value}
                </span>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80 relative group"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: point.value > 0 ? '4px' : '0px'
                }}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {point.value}
                </div>
              </div>

              {/* Label */}
              <span className="text-xs text-gray-500 mt-2">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
