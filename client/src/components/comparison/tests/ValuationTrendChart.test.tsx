import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ValuationTrendChart } from '../ValuationTrendChart';
import { calculateValueForecast } from '../ValuationTrendUtils';

// Mock recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div data-testid="chart-line"></div>,
    XAxis: () => <div data-testid="x-axis"></div>,
    YAxis: () => <div data-testid="y-axis"></div>,
    CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
    Tooltip: () => <div data-testid="chart-tooltip"></div>,
    Legend: () => <div data-testid="chart-legend"></div>,
    ReferenceLine: () => <div data-testid="reference-line"></div>
  };
});

describe('ValuationTrendChart', () => {
  // Mock historical data
  const historicalData = [
    { year: 2018, value: 280000 },
    { year: 2019, value: 290000 },
    { year: 2020, value: 300000 },
    { year: 2021, value: 320000 },
    { year: 2022, value: 340000 }
  ];

  test('renders the valuation trend chart with historical data', () => {
    render(<ValuationTrendChart historicalData={historicalData} />);
    
    // Chart elements should be rendered
    expect(screen.getByTestId('valuation-trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
    
    // Title should be displayed
    expect(screen.getByText('Property Value Trend')).toBeInTheDocument();
  });

  test('displays forecast data when showForecast is true', () => {
    render(<ValuationTrendChart historicalData={historicalData} showForecast={true} forecastYears={2} />);
    
    // Chart should include forecast line
    expect(screen.getAllByTestId('chart-line')).toHaveLength(2);
    
    // Legend should show both historical and forecast
    expect(screen.getByText('Historical Value')).toBeInTheDocument();
    expect(screen.getByText('Forecasted Value')).toBeInTheDocument();
  });

  test('handles empty historical data gracefully', () => {
    render(<ValuationTrendChart historicalData={[]} />);
    
    // Should show no data message
    expect(screen.getByText('No historical data available')).toBeInTheDocument();
  });

  test('displays neighborhood comparison when provided', () => {
    const neighborhoodData = [
      { year: 2018, value: 270000 },
      { year: 2019, value: 285000 },
      { year: 2020, value: 295000 },
      { year: 2021, value: 310000 },
      { year: 2022, value: 330000 }
    ];
    
    render(
      <ValuationTrendChart 
        historicalData={historicalData} 
        neighborhoodData={neighborhoodData}
        neighborhoodName="Central Benton"
        showNeighborhoodComparison={true}
      />
    );
    
    // Should have 2 lines (property and neighborhood)
    expect(screen.getAllByTestId('chart-line')).toHaveLength(2);
    
    // Should show neighborhood name in legend
    expect(screen.getByText('Central Benton Average')).toBeInTheDocument();
  });

  test('handles custom year range selection', () => {
    render(
      <ValuationTrendChart 
        historicalData={historicalData} 
        startYear={2019}
        endYear={2021}
      />
    );
    
    // Chart should still render
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('displays appropriate annotations', () => {
    const annotations = [
      { year: 2019, label: 'Renovated Kitchen', description: 'Major kitchen upgrade' },
      { year: 2021, label: 'Added Bathroom', description: 'Added half bath on main floor' }
    ];
    
    render(
      <ValuationTrendChart 
        historicalData={historicalData} 
        annotations={annotations}
      />
    );
    
    // Reference lines for annotations should be present
    expect(screen.getAllByTestId('reference-line')).toHaveLength(2);
    
    // Annotation labels should be visible
    expect(screen.getByText('Renovated Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Added Bathroom')).toBeInTheDocument();
  });
});

describe('calculateValueForecast', () => {
  test('provides reasonable projection based on historical data', () => {
    const historicalData = [
      { year: 2018, value: 280000 },
      { year: 2019, value: 290000 },
      { year: 2020, value: 300000 },
      { year: 2021, value: 320000 },
      { year: 2022, value: 340000 }
    ];
    
    const forecast = calculateValueForecast(historicalData, 2);
    
    // Should return 2 future years
    expect(forecast).toHaveLength(2);
    
    // Years should be consecutive
    expect(forecast[0].year).toBe(2023);
    expect(forecast[1].year).toBe(2024);
    
    // Values should follow trend (increasing)
    expect(forecast[0].value).toBeGreaterThan(340000);
    expect(forecast[1].value).toBeGreaterThan(forecast[0].value);
  });

  test('handles insufficient data gracefully', () => {
    // Only one data point is insufficient for forecasting
    const insufficientData = [{ year: 2022, value: 340000 }];
    
    const forecast = calculateValueForecast(insufficientData, 2);
    
    // Should return empty array when data is insufficient
    expect(forecast).toHaveLength(0);
  });

  test('handles inconsistent year spacing', () => {
    // Data with gaps in years
    const inconsistentData = [
      { year: 2018, value: 280000 },
      { year: 2019, value: 290000 },
      // Missing 2020
      { year: 2021, value: 320000 },
      { year: 2022, value: 340000 }
    ];
    
    const forecast = calculateValueForecast(inconsistentData, 2);
    
    // Should still provide forecast
    expect(forecast).toHaveLength(2);
    expect(forecast[0].year).toBe(2023);
  });

  test('returns values within reasonable range', () => {
    const historicalData = [
      { year: 2018, value: 280000 },
      { year: 2019, value: 290000 },
      { year: 2020, value: 300000 },
      { year: 2021, value: 320000 },
      { year: 2022, value: 340000 }
    ];
    
    const forecast = calculateValueForecast(historicalData, 3);
    
    // Ensure forecasted values are within a reasonable range
    // Using average annual growth of ~5-6% based on the historical data
    expect(forecast[0].value).toBeGreaterThanOrEqual(340000 * 1.03); // At least 3% growth
    expect(forecast[0].value).toBeLessThanOrEqual(340000 * 1.10); // At most 10% growth
  });
});