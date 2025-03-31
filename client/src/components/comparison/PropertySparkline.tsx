import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ValuationDataPoint, formatCurrency } from './ValuationTrendUtils';

export interface PropertySparklineProps {
  /**
   * Historical valuation data points
   */
  data: ValuationDataPoint[];
  
  /**
   * Height of the sparkline
   */
  height?: number | string;
  
  /**
   * Width of the sparkline
   */
  width?: number | string;
  
  /**
   * Whether to show tooltip on hover
   */
  showTooltip?: boolean;
  
  /**
   * Fill color for the area
   */
  color?: string;
  
  /**
   * CSS class name for additional styling
   */
  className?: string;
}

/**
 * A minimal sparkline chart to show property value trends in a compact form
 */
const PropertySparkline: React.FC<PropertySparklineProps> = ({
  data,
  height = 40,
  width = '100%',
  showTooltip = false,
  color = '#3b82f6',
  className = '',
}) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div 
        className={`bg-muted/50 rounded-sm ${className}`}
        style={{ height, width }}
        aria-label="No data available for sparkline"
      />
    );
  }

  return (
    <div 
      className={className} 
      style={{ height, width }}
      data-testid="property-sparkline"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          {/* Hide the axes by default for a cleaner sparkline look */}
          <XAxis 
            dataKey="year" 
            hide={true} 
          />
          <YAxis 
            hide={true} 
            domain={['dataMin', 'dataMax']} 
          />
          
          {/* Optional tooltip */}
          {showTooltip && (
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              labelFormatter={(label) => `Year: ${label}`}
              contentStyle={{ fontSize: '12px' }}
            />
          )}
          
          {/* Area chart for the sparkline */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PropertySparkline;