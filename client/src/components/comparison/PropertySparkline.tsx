import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, Dot } from 'recharts';
import { ValuationDataPoint, formatCurrency, calculateGrowthRate } from './ValuationTrendUtils';

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
   * Whether to highlight key points (min, max, last)
   */
  highlightPoints?: boolean;
  
  /**
   * Whether to show the current value label
   */
  showCurrentValue?: boolean;
  
  /**
   * Whether to show growth indicator
   */
  showGrowth?: boolean;
  
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
  highlightPoints = false,
  showCurrentValue = false,
  showGrowth = false,
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
  
  // Calculate growth rate percentage
  const growthRate = useMemo(() => calculateGrowthRate(data), [data]);
  
  // Find min, max, and current points
  const minMaxPoints = useMemo(() => {
    if (!highlightPoints || data.length <= 1) return { min: null, max: null };
    
    let minPoint = data[0];
    let maxPoint = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i].value < minPoint.value) minPoint = data[i];
      if (data[i].value > maxPoint.value) maxPoint = data[i];
    }
    
    return { min: minPoint, max: maxPoint };
  }, [data, highlightPoints]);
  
  // Get the current (last) value
  const currentValue = data[data.length - 1].value;
  const currentYear = data[data.length - 1].year;
  
  // Determine sparkline color based on growth
  const determineColors = () => {
    // Default positive
    if (growthRate >= 0) {
      return {
        line: color,
        area: color,
        opacity: 0.15
      };
    }
    
    // Negative growth
    return {
      line: '#ef4444', // red-500
      area: '#ef4444',
      opacity: 0.1
    };
  };
  
  const colors = determineColors();

  return (
    <div className={`relative ${className}`} style={{ height, width }} data-testid="property-sparkline">
      {/* Growth indicator */}
      {showGrowth && (
        <div 
          className={`absolute top-0 right-0 text-xs font-medium z-10 ${
            growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
          style={{ fontSize: '10px' }}
        >
          {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate).toFixed(1)}%
        </div>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: showCurrentValue ? 40 : 0, left: 0, bottom: 2 }}
        >
          {/* Hide the axes by default for a cleaner sparkline look */}
          <XAxis 
            dataKey="year" 
            hide={true} 
          />
          
          <YAxis 
            hide={true} 
            domain={['dataMin - 1000', 'dataMax + 1000']} 
          />
          
          {/* Optional tooltip with enhanced styling */}
          {showTooltip && (
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              labelFormatter={(label) => `Year: ${label}`}
              contentStyle={{ 
                fontSize: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                border: 'none',
                padding: '6px 10px'
              }}
            />
          )}
          
          {/* Enhanced area chart for the sparkline */}
          <defs>
            <linearGradient id={`sparkGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.area} stopOpacity={colors.opacity * 2} />
              <stop offset="95%" stopColor={colors.area} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Area chart for the sparkline */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors.line}
            strokeWidth={1.5}
            fill={`url(#sparkGradient-${color.replace('#', '')})`}
            fillOpacity={colors.opacity}
            isAnimationActive={false}
            connectNulls={true}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 1, fill: '#fff', stroke: colors.line }}
          />
          
          {/* Custom dots for key points (min, max, last) if enabled */}
          {highlightPoints && minMaxPoints.min && minMaxPoints.min !== data[data.length-1] && (
            <ReferenceLine 
              x={minMaxPoints.min.year} 
              stroke="none"
              ifOverflow="hidden"
            >
              <g>
                <circle
                  cx={0} 
                  cy={0} 
                  r={3}
                  fill="#fff"
                  stroke="#64748b"
                  strokeWidth={1}
                />
              </g>
            </ReferenceLine>
          )}
          
          {highlightPoints && minMaxPoints.max && minMaxPoints.max !== data[data.length-1] && (
            <ReferenceLine 
              x={minMaxPoints.max.year} 
              stroke="none"
              ifOverflow="hidden"
            >
              <g>
                <circle
                  cx={0} 
                  cy={0} 
                  r={3}
                  fill="#fff"
                  stroke={colors.line}
                  strokeWidth={1.5}
                />
              </g>
            </ReferenceLine>
          )}
          
          {/* Always highlight the last point for emphasis */}
          <ReferenceLine 
            x={currentYear} 
            stroke="none"
            ifOverflow="hidden"
          >
            <g>
              <circle
                cx={0} 
                cy={0} 
                r={3.5}
                fill="#fff"
                stroke={colors.line}
                strokeWidth={2}
              />
            </g>
          </ReferenceLine>
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Current value label outside the chart */}
      {showCurrentValue && (
        <div 
          className="absolute right-0 top-1/2 transform -translate-y-1/2 font-medium"
          style={{ fontSize: '12px' }}
        >
          {formatCurrency(currentValue)}
        </div>
      )}
    </div>
  );
};

export default PropertySparkline;