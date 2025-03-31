import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ValuationTrendChart from './ValuationTrendChart';
import PropertySparkline from './PropertySparkline';
import { ValuationDataPoint } from './ValuationTrendUtils';

// Sample data for demonstration purposes
const demoPropertyData: ValuationDataPoint[] = [
  { year: '2019', value: 250000 },
  { year: '2020', value: 275000 },
  { year: '2021', value: 290000 },
  { year: '2022', value: 315000 },
  { year: '2023', value: 350000 },
];

const comparablePropertyData: ValuationDataPoint[] = [
  { year: '2019', value: 240000 },
  { year: '2020', value: 260000 },
  { year: '2021', value: 275000 },
  { year: '2022', value: 290000 },
  { year: '2023', value: 320000 },
];

const neighborhoodTrendData: ValuationDataPoint[] = [
  { year: '2019', value: 235000 },
  { year: '2020', value: 255000 },
  { year: '2021', value: 280000 },
  { year: '2022', value: 310000 },
  { year: '2023', value: 340000 },
];

const PropertyTrendsDemo: React.FC = () => {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Property Valuation Trends</h1>
        <p className="text-muted-foreground mt-2">
          Analyze historical property values and projected future growth
        </p>
      </div>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
          <TabsTrigger value="sparklines">Sparklines</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-6 mt-4">
          {/* Basic trend chart */}
          <ValuationTrendChart 
            data={demoPropertyData} 
            title="Property Value History" 
            description="Historical valuation data over the past 5 years"
          />
          
          {/* Chart with comparison */}
          <ValuationTrendChart 
            data={demoPropertyData} 
            comparisonData={comparablePropertyData}
            comparisonLabel="Nearby Similar Property"
            title="Property Comparison" 
            description="Value comparison with a similar property in the area"
            showGrowthRate={true}
          />
          
          {/* Chart with predictions */}
          <ValuationTrendChart 
            data={demoPropertyData} 
            title="Future Value Projection" 
            description="Projected property values based on historical trend"
            showPrediction={true}
            predictionYears={3}
            showCAGR={true}
          />
          
          {/* Neighborhood comparison */}
          <ValuationTrendChart 
            data={demoPropertyData} 
            comparisonData={neighborhoodTrendData}
            comparisonLabel="Neighborhood Average"
            title="Neighborhood Comparison" 
            description="Property value compared to neighborhood average"
            showGrowthRate={true}
            showCAGR={true}
          />
        </TabsContent>
        
        <TabsContent value="sparklines" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sparkline examples */}
            <Card>
              <CardHeader>
                <CardTitle>Compact Property Trends</CardTitle>
                <CardDescription>Various property trend sparklines for compact displays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Basic Sparkline</h3>
                  <PropertySparkline data={demoPropertyData} height={40} />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Interactive Sparkline (hover to see details)</h3>
                  <PropertySparkline 
                    data={demoPropertyData} 
                    height={50} 
                    showTooltip={true} 
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Custom Color</h3>
                  <PropertySparkline 
                    data={demoPropertyData} 
                    height={40}
                    color="#10b981" // Emerald green
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Declining Value Example</h3>
                  <PropertySparkline 
                    data={[
                      { year: '2019', value: 350000 },
                      { year: '2020', value: 340000 },
                      { year: '2021', value: 330000 },
                      { year: '2022', value: 325000 },
                      { year: '2023', value: 310000 },
                    ]} 
                    height={40}
                    color="#ef4444" // Red
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Property List with Sparklines</CardTitle>
                <CardDescription>Example of how sparklines can be used in a property list</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex items-center p-3 border rounded-md">
                      <div className="flex-1">
                        <h3 className="font-medium">123 Main St, Unit {index}</h3>
                        <p className="text-sm text-muted-foreground">3 bed, 2 bath • 1,850 sqft</p>
                      </div>
                      <div className="w-24 flex flex-col items-end">
                        <span className="text-sm font-medium">$350,000</span>
                        <PropertySparkline 
                          data={[...demoPropertyData].map((d, i) => ({
                            ...d,
                            value: d.value * (1 + (index - 3) * 0.1)
                          }))} 
                          height={25} 
                          width={60}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyTrendsDemo;