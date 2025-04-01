import React, { useRef, useEffect, useState } from 'react';
import { Property } from '@shared/schema';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ScatterController
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '../../lib/utils';

// Register Chart.js components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController
);

interface MarketPositionScatterProps {
  baseProperty: Property;
  selectedProperties: Property[];
  allProperties: Property[];
  className?: string;
  xAxisProperty?: 'squareFeet' | 'yearBuilt' | 'lotSize';
}

/**
 * Scatter plot component showing the market position of properties
 */
export const MarketPositionScatter: React.FC<MarketPositionScatterProps> = ({
  baseProperty,
  selectedProperties,
  allProperties,
  className = '',
  xAxisProperty = 'squareFeet'
}) => {
  const chartRef = useRef<ChartJS>(null);
  const [chartData, setChartData] = useState<ChartData<'scatter'>>({ datasets: [] });
  const [chartOptions, setChartOptions] = useState<ChartOptions<'scatter'>>({});

  useEffect(() => {
    // Get all visible properties (selected + base)
    const visibleProperties = [baseProperty, ...selectedProperties.filter(p => p.id !== baseProperty.id)];
    
    // Filter properties with valid data points
    const validMarketProperties = allProperties.filter(p => 
      p.value !== undefined && 
      parseFloat(p.value) > 0 &&
      p[xAxisProperty] !== undefined
    );
    
    // Map to data points
    const marketData = validMarketProperties.map(p => ({
      x: p[xAxisProperty] as number,
      y: parseFloat(p.value || '0'),
      property: p
    }));
    
    // Create highlighted points for selected properties
    const highlightedData = visibleProperties
      .filter(p => p.value !== undefined && p[xAxisProperty] !== undefined)
      .map(p => ({
        x: p[xAxisProperty] as number,
        y: parseFloat(p.value || '0'),
        property: p
      }));
    
    // Create datasets
    const datasets = [
      {
        label: 'Market Properties',
        data: marketData,
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Selected Properties',
        data: highlightedData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ];
    
    setChartData({ datasets });
    
    // Set chart options
    const xAxisLabel = xAxisProperty === 'squareFeet' 
      ? 'Square Footage' 
      : xAxisProperty === 'yearBuilt' 
        ? 'Year Built' 
        : 'Lot Size';
    
    setChartOptions({
      scales: {
        x: {
          title: {
            display: true,
            text: xAxisLabel
          },
          ticks: {
            callback: function(value) {
              if (xAxisProperty === 'yearBuilt') {
                return value;
              } else {
                // Add commas for thousands
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              }
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Property Value ($)'
          },
          ticks: {
            callback: function(value) {
              return formatCurrency(Number(value), false);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const point = context.raw as { x: number; y: number; property: Property };
              return [
                `Address: ${point.property.address}`,
                `Value: ${formatCurrency(point.y)}`,
                xAxisProperty === 'squareFeet'
                  ? `Square Feet: ${point.x.toLocaleString()}`
                  : xAxisProperty === 'yearBuilt'
                  ? `Year Built: ${point.x}`
                  : `Lot Size: ${point.x.toLocaleString()}`
              ];
            }
          }
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      },
      maintainAspectRatio: false,
      aspectRatio: 1.5
    });
  }, [baseProperty, selectedProperties, allProperties, xAxisProperty]);

  // Calculate trendline
  const calculateTrendline = () => {
    if (!chartRef.current) return;
    
    // Get valid data points
    const validPoints = allProperties
      .filter(p => p.value !== undefined && p[xAxisProperty] !== undefined)
      .map(p => ({ 
        x: p[xAxisProperty] as number, 
        y: parseFloat(p.value || '0')
      }));
    
    if (validPoints.length < 2) return;
    
    // Calculate linear regression
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (const point of validPoints) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }
    
    const n = validPoints.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Get chart instance and data
    const chart = chartRef.current;
    
    // Add trendline dataset if it doesn't exist
    if (!chart.data.datasets || chart.data.datasets.length < 3) {
      const xValues = validPoints.map(p => p.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      const trendlineData = [
        { x: minX, y: minX * slope + intercept },
        { x: maxX, y: maxX * slope + intercept }
      ];
      
      if (chart.data.datasets) {
        chart.data.datasets.push({
          label: 'Market Trend',
          data: trendlineData,
          type: 'line' as const,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        });
        
        chart.update();
      }
    }
  };
  
  useEffect(() => {
    // Add trendline after initial render
    setTimeout(calculateTrendline, 500);
  }, [chartData]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Market Position</CardTitle>
        <CardDescription>
          Property values vs. {xAxisProperty === 'squareFeet' 
            ? 'square footage' 
            : xAxisProperty === 'yearBuilt' 
              ? 'year built'
              : 'lot size'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80">
          <Scatter 
            ref={chartRef}
            data={chartData as any} 
            options={chartOptions as any} 
          />
        </div>
      </CardContent>
    </Card>
  );
};