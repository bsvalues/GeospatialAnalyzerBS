import React, { useState, useMemo } from 'react';
import { Property } from '@shared/schema';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  formatChartDate, 
  formatChartCurrency,
  generatePropertyValueTrend, 
  ValuationTrendData,
  TrendPredictionParams,
  DEFAULT_PREDICTION_PARAMS
} from './ValuationTrendUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, TrendingUp, AlertCircle, Clock, Percent } from 'lucide-react';

interface ValuationTrendChartProps {
  property: Property;
  className?: string;
}

const ValuationTrendChart: React.FC<ValuationTrendChartProps> = ({ 
  property,
  className = '' 
}) => {
  // State for trend prediction parameters
  const [params, setParams] = useState<TrendPredictionParams>({
    ...DEFAULT_PREDICTION_PARAMS
  });
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  
  // Generate trend data based on current parameters
  const trendData = useMemo(() => 
    generatePropertyValueTrend(property, params),
    [property, params]
  );
  
  // Combined data for chart (historical + predicted)
  const chartData = useMemo(() => {
    return [
      ...trendData.historical.map(point => ({
        date: point.date,
        value: point.value,
        type: 'historical' as const
      })),
      ...trendData.predicted.map(point => ({
        date: point.date,
        value: point.value,
        upperBound: point.upperBound,
        lowerBound: point.lowerBound,
        type: 'predicted' as const
      }))
    ];
  }, [trendData]);
  
  // Calculated growth stats
  const growthStats = useMemo(() => {
    if (chartData.length < 2) return { totalGrowth: 0, annualRate: 0 };
    
    const firstValue = chartData[0].value;
    const currentValue = trendData.historical[trendData.historical.length - 1].value;
    const futureValue = trendData.predicted[trendData.predicted.length - 1].value;
    
    const historicalGrowth = ((currentValue - firstValue) / firstValue) * 100;
    const projectedGrowth = ((futureValue - currentValue) / currentValue) * 100;
    
    return {
      historicalGrowth: historicalGrowth.toFixed(1),
      projectedGrowth: projectedGrowth.toFixed(1),
      annualRate: (params.growthRate! * 100).toFixed(1)
    };
  }, [chartData, trendData, params.growthRate]);
  
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(label);
      const isPredicted = data.type === 'predicted';
      
      return (
        <div className="bg-white p-3 border rounded-md shadow-sm">
          <p className="font-semibold text-sm mb-1">{formatChartDate(date, 'full')}</p>
          <p className="text-sm text-primary">
            Value: {formatChartCurrency(data.value)}
          </p>
          {isPredicted && showConfidenceInterval && (
            <>
              <p className="text-xs text-gray-500 mt-1">Confidence Interval ({params.confidenceInterval}%):</p>
              <p className="text-xs text-green-600">
                Upper: {formatChartCurrency(data.upperBound || 0)}
              </p>
              <p className="text-xs text-red-600">
                Lower: {formatChartCurrency(data.lowerBound || 0)}
              </p>
            </>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {isPredicted ? 'Projected Value' : 'Historical Value'}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Handle parameter changes
  const handleGrowthRateChange = (value: number[]) => {
    setParams(prev => ({ ...prev, growthRate: value[0] / 100 }));
  };
  
  const handleTimeframeChange = (value: number[]) => {
    setParams(prev => ({ ...prev, timeframe: value[0] }));
  };
  
  const handleVolatilityChange = (value: number[]) => {
    setParams(prev => ({ ...prev, volatility: value[0] / 100 }));
  };
  
  const handleConfidenceIntervalChange = (value: number[]) => {
    // Map slider values to common confidence intervals
    const confidenceMap: Record<number, number> = {
      1: 80,
      2: 90,
      3: 95,
      4: 99
    };
    setParams(prev => ({ ...prev, confidenceInterval: confidenceMap[value[0]] }));
  };
  
  // Reset parameters to defaults
  const resetParams = () => {
    setParams({ ...DEFAULT_PREDICTION_PARAMS });
  };
  
  // Get the confidence interval text label
  const getConfidenceLabel = (value: number) => {
    switch (value) {
      case 80: return "80% (Conservative)";
      case 90: return "90% (Default)";
      case 95: return "95% (Standard)";
      case 99: return "99% (Broad)";
      default: return `${value}%`;
    }
  };
  
  // Map confidence interval to slider value
  const confidenceToSliderValue = (confidence: number) => {
    switch (confidence) {
      case 80: return 1;
      case 90: return 2;
      case 95: return 3;
      case 99: return 4;
      default: return 2; // Default to 90%
    }
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">Property Value Trend</CardTitle>
            <CardDescription>
              Historical values and future projections for {property.address}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
            className="p-0 h-8 w-8"
          >
            {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Growth summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-muted rounded-md p-2">
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Clock size={12} className="mr-1" />
              <span>Historical Growth</span>
            </div>
            <div className="text-sm font-semibold">
              {growthStats.historicalGrowth}%
            </div>
          </div>
          
          <div className="bg-muted rounded-md p-2">
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <TrendingUp size={12} className="mr-1" />
              <span>Projected Growth</span>
            </div>
            <div className="text-sm font-semibold text-primary">
              {growthStats.projectedGrowth}%
            </div>
          </div>
          
          <div className="bg-muted rounded-md p-2">
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Percent size={12} className="mr-1" />
              <span>Annual Rate</span>
            </div>
            <div className="text-sm font-semibold">
              {growthStats.annualRate}%
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatChartDate(new Date(date), 'short')} 
                minTickGap={30}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(value) => formatChartCurrency(value, true)} 
                width={55}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Today reference line */}
              <ReferenceLine 
                x={trendData.historical[trendData.historical.length - 1]?.date.getTime()} 
                stroke="#666" 
                strokeDasharray="3 3"
                label={{ value: 'Today', position: 'top', fontSize: 11 }}
              />
              
              {/* Historical values */}
              <Area 
                type="monotone" 
                dataKey="value" 
                name="Historical Value"
                stroke="#8884d8" 
                fillOpacity={1}
                fill="url(#colorHistorical)" 
                connectNulls
                activeDot={{ r: 8 }}
                dot={{ r: 2 }}
                isAnimationActive={true}
              />
              
              {/* Predicted values */}
              <Area 
                type="monotone" 
                dataKey="value" 
                name="Projected Value"
                stroke="#82ca9d" 
                fillOpacity={1}
                fill="url(#colorPredicted)" 
                connectNulls
                activeDot={{ r: 6 }}
                dot={{ r: 3 }}
                isAnimationActive={true}
              />
              
              {/* Confidence interval */}
              {showConfidenceInterval && (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="upperBound" 
                    name="Upper Bound"
                    stroke="none"
                    fill="url(#colorUpper)" 
                    fillOpacity={0.3}
                    activeDot={false}
                    dot={false}
                    isAnimationActive={true}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lowerBound" 
                    name="Lower Bound"
                    stroke="none"
                    fill="url(#colorLower)" 
                    fillOpacity={0.3}
                    activeDot={false}
                    dot={false}
                    isAnimationActive={true}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Forecast settings */}
        {showSettings && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium">Forecast Settings</h4>
              <div className="flex items-center">
                <Switch 
                  id="confidence-toggle"
                  checked={showConfidenceInterval}
                  onCheckedChange={setShowConfidenceInterval}
                  className="mr-2"
                />
                <Label htmlFor="confidence-toggle" className="text-xs">
                  Show Confidence Interval
                </Label>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs">Annual Growth Rate</Label>
                  <span className="text-xs font-medium">{(params.growthRate! * 100).toFixed(1)}%</span>
                </div>
                <Slider
                  value={[params.growthRate! * 100]}
                  min={-5}
                  max={15}
                  step={0.5}
                  onValueChange={handleGrowthRateChange}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs">Prediction Timeframe</Label>
                  <span className="text-xs font-medium">{params.timeframe} years</span>
                </div>
                <Slider
                  value={[params.timeframe!]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={handleTimeframeChange}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs">Market Volatility</Label>
                  <span className="text-xs font-medium">{(params.volatility! * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[params.volatility! * 100]}
                  min={5}
                  max={30}
                  step={5}
                  onValueChange={handleVolatilityChange}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs">Confidence Interval</Label>
                  <span className="text-xs font-medium">
                    {getConfidenceLabel(params.confidenceInterval!)}
                  </span>
                </div>
                <Slider
                  value={[confidenceToSliderValue(params.confidenceInterval!)]}
                  min={1}
                  max={4}
                  step={1}
                  onValueChange={handleConfidenceIntervalChange}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={resetParams}
              >
                Reset to Default
              </Button>
            </div>
            
            <Alert className="mt-5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Disclaimer</AlertTitle>
              <AlertDescription className="text-xs">
                This forecast is based on historical trends and current market conditions. 
                Actual property values may vary due to unforeseen economic factors, local market changes, 
                or property-specific developments.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValuationTrendChart;