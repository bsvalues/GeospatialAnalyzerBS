import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { Property } from '../../shared/schema';
import { 
  generateHistoricalData,
  predictFutureValues,
  formatChartCurrency
} from './ValuationTrendUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PropertySparklineProps {
  property: Property;
  showPredicted?: boolean;
  height?: number;
  width?: number;
  className?: string;
  onClick?: (property: Property) => void;
  interactive?: boolean;
}

/**
 * A compact sparkline chart showing property value trends
 */
const PropertySparkline: React.FC<PropertySparklineProps> = ({
  property,
  showPredicted = true,
  height = 30,
  width = 120,
  className = '',
  onClick,
  interactive = true
}) => {
  // Generate data for the sparkline
  const historicalData = generateHistoricalData(property, 3);
  
  // Only include the last 6 quarters for a cleaner sparkline
  const sparklineHistoricalData = historicalData.slice(-6);
  
  // Generate predictions if needed
  let predictedData: Array<{date: Date, value: number}> = [];
  if (showPredicted) {
    // Generate predictions with default parameters, but only for 1 year
    predictedData = predictFutureValues(historicalData, { timeframe: 1 }).slice(0, 2);
  }
  
  // Combine data for the chart
  const chartData = [
    ...sparklineHistoricalData.map(point => ({ value: point.value, predicted: false })),
    ...predictedData.map(point => ({ value: point.value, predicted: true }))
  ];
  
  // Calculate trend
  const firstValue = chartData[0]?.value || 0;
  const lastValue = chartData[chartData.length - 1]?.value || 0;
  const percentChange = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  
  // Determine trend direction for styling
  const trend = percentChange > 1 ? 'up' : percentChange < -1 ? 'down' : 'neutral';
  
  // Color based on trend
  const lineColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
  
  // Handle click events
  const handleClick = () => {
    if (onClick && interactive) {
      onClick(property);
    }
  };
  
  // Skip rendering if no data
  if (chartData.length === 0) return null;
  
  const sparklineContent = (
    <div 
      className={`${className} relative`}
      onClick={handleClick}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ r: 1, strokeWidth: 1, fill: 'white' }}
              isAnimationActive={false}
            />
            <ReferenceLine
              y={chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length}
              stroke="#718096"
              strokeDasharray="2 2"
              strokeOpacity={0.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Trend indicator icon */}
      <div className="absolute -top-1 -right-1 rounded-full bg-white shadow-sm w-4 h-4 flex items-center justify-center">
        {trend === 'up' ? (
          <TrendingUp size={12} className="text-green-500" />
        ) : trend === 'down' ? (
          <TrendingDown size={12} className="text-red-500" />
        ) : (
          <Minus size={12} className="text-gray-500" />
        )}
      </div>
    </div>
  );
  
  // If not interactive, just return the sparkline
  if (!interactive) {
    return sparklineContent;
  }
  
  // Add tooltip for interactive mode
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {sparklineContent}
        </TooltipTrigger>
        <TooltipContent className="p-0">
          <div className="p-2 text-xs">
            <div className="font-medium mb-1">Value Trend</div>
            <div className="flex items-center justify-between gap-3">
              <span>Current: </span>
              <span className="font-medium">{formatChartCurrency(chartData[chartData.length - (showPredicted ? 3 : 1)].value)}</span>
            </div>
            {showPredicted && (
              <div className="flex items-center justify-between gap-3">
                <span>Projected: </span>
                <span className="font-medium">{formatChartCurrency(lastValue)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 mt-1">
              <span>Change: </span>
              <span 
                className={
                  trend === 'up' 
                    ? 'text-green-500 font-medium' 
                    : trend === 'down' 
                    ? 'text-red-500 font-medium' 
                    : 'text-gray-500 font-medium'
                }
              >
                {percentChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PropertySparkline;