import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Label
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ValuationDataPoint,
  calculateGrowthRate,
  calculateCompoundAnnualGrowthRate,
  generateTrendLineData,
  predictFutureValues,
  formatCurrency,
  formatPercentage
} from './ValuationTrendUtils';

export interface ValuationTrendChartProps {
  /**
   * Historical valuation data points
   */
  data: ValuationDataPoint[];
  
  /**
   * Optional comparison data for another property
   */
  comparisonData?: ValuationDataPoint[];
  
  /**
   * Label for the comparison data
   */
  comparisonLabel?: string;
  
  /**
   * Chart title
   */
  title?: string;
  
  /**
   * Chart description
   */
  description?: string;
  
  /**
   * Whether to show growth rate
   */
  showGrowthRate?: boolean;
  
  /**
   * Whether to show CAGR (Compound Annual Growth Rate)
   */
  showCAGR?: boolean;
  
  /**
   * Whether to show prediction for future years
   */
  showPrediction?: boolean;
  
  /**
   * Number of years to predict into the future
   */
  predictionYears?: number;
  
  /**
   * CSS class name for additional styling
   */
  className?: string;
}

export const ValuationTrendChart: React.FC<ValuationTrendChartProps> = ({
  data,
  comparisonData,
  comparisonLabel = 'Comparable Property',
  title = 'Property Valuation Trend',
  description,
  showGrowthRate = false,
  showCAGR = false,
  showPrediction = false,
  predictionYears = 2,
  className = '',
}) => {
  // Generate derived data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Generate trend line data
    const trendData = generateTrendLineData(data);
    
    // Generate prediction data if needed
    const predictionData = showPrediction ? predictFutureValues(data, predictionYears) : [];
    
    // Combine all data sources for the chart
    const allYears = new Set([
      ...data.map(d => d.year),
      ...(comparisonData || []).map(d => d.year),
      ...(showPrediction ? predictionData.map(d => d.year) : [])
    ]);
    
    // Create complete dataset with all data series
    return Array.from(allYears)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(year => {
        const dataPoint = data.find(d => d.year === year);
        const comparisonPoint = comparisonData?.find(d => d.year === year);
        const trendPoint = trendData.find(d => d.year === year);
        const predictionPoint = predictionData.find(d => d.year === year);
        
        return {
          year,
          actualValue: dataPoint?.value,
          trendValue: trendPoint?.value,
          comparisonValue: comparisonPoint?.value,
          predictedValue: predictionPoint?.value,
          // Flag to identify prediction points vs actual data
          isPrediction: !!predictionPoint
        };
      });
  }, [data, comparisonData, showPrediction, predictionYears]);
  
  // Calculate metrics
  const growthRate = useMemo(() => {
    return calculateGrowthRate(data);
  }, [data]);
  
  const cagr = useMemo(() => {
    return calculateCompoundAnnualGrowthRate(data);
  }, [data]);
  
  // Custom tooltip formatter
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  // Render empty state if no data
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No valuation data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="valuation-trend-chart">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        
        {/* Growth metrics */}
        <div className="flex flex-wrap gap-3 mt-2">
          {showGrowthRate && (
            <div className="text-sm bg-muted py-1 px-3 rounded">
              <span className={growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {growthRate >= 0 ? '+' : ''}{formatPercentage(growthRate)} growth
              </span>
            </div>
          )}
          
          {showCAGR && (
            <div className="text-sm bg-muted py-1 px-3 rounded">
              <span className={cagr >= 0 ? 'text-green-600' : 'text-red-600'}>
                CAGR: {cagr >= 0 ? '+' : ''}{formatPercentage(cagr)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
                axisLine={{ strokeWidth: 1 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                width={60}
                tick={{ fontSize: 12 }}
                axisLine={{ strokeWidth: 1 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatTooltipValue(value)]}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend verticalAlign="top" height={36} />
              
              {/* Actual property value line */}
              <Line
                type="monotone"
                dataKey="actualValue"
                name="Property Value"
                stroke="#3b82f6" // Blue
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              {/* Trend line */}
              <Line
                type="monotone"
                dataKey="trendValue"
                name="Trend Line"
                stroke="#94a3b8" // Slate
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
              
              {/* Comparison property line if data is provided */}
              {comparisonData && comparisonData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="comparisonValue"
                  name={comparisonLabel}
                  stroke="#10b981" // Emerald
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
              
              {/* Prediction line if enabled */}
              {showPrediction && (
                <Line
                  type="monotone"
                  dataKey="predictedValue"
                  name="Predicted Value"
                  stroke="#f97316" // Orange
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 4 }}
                />
              )}
              
              {/* Reference line between actual and predicted data */}
              {showPrediction && data.length > 0 && (
                <ReferenceLine
                  x={data[data.length - 1].year}
                  stroke="#64748b" // Slate
                  strokeDasharray="3 3"
                  label={
                    <Label
                      value="Current"
                      position="insideBottomRight"
                      offset={-10}
                      style={{ fontSize: 10, fill: '#64748b' }}
                    />
                  }
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Current value and prediction summary */}
        {data.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current Value: </span>
              <span className="font-medium">{formatCurrency(data[data.length - 1].value)}</span>
            </div>
            
            {showPrediction && predictionYears > 0 && (
              <div>
                <span className="text-muted-foreground">Projected {data[data.length - 1].year + predictionYears}: </span>
                <span className="font-medium text-amber-600">
                  {formatCurrency(predictFutureValues(data, predictionYears)[predictionYears - 1].value)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValuationTrendChart;