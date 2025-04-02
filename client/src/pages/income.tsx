import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import IncomeHotelMotelPanel from '@/components/income/IncomeHotelMotelPanel';
import { useQuery } from '@tanstack/react-query';

const IncomePage: React.FC = () => {
  const [incomeYear, setIncomeYear] = useState<string>('2024');
  const [supNum, setSupNum] = useState<number>(1);
  const [incomeId, setIncomeId] = useState<number>(101);
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [assessedValue, setAssessedValue] = useState<string>("5000000");

  // Fetch property data (if available)
  const {
    data: property,
    isLoading: isLoadingProperty,
  } = useQuery({
    queryKey: ['/api/properties', incomeId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/properties/${incomeId}`);
        if (!response.ok) {
          throw new Error('Property not found');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching property:', error);
        return null;
      }
    },
    enabled: showPanel,
  });

  const handleLoad = () => {
    setShowPanel(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Income Approach</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Property Income Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="incomeYear">Income Year</Label>
              <Input
                id="incomeYear"
                value={incomeYear}
                onChange={(e) => setIncomeYear(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supNum">Supplement Number</Label>
              <Input
                id="supNum"
                type="number"
                value={supNum}
                onChange={(e) => setSupNum(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="incomeId">Income ID</Label>
              <Input
                id="incomeId"
                type="number"
                value={incomeId}
                onChange={(e) => setIncomeId(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="assessedValue">Assessed Value</Label>
              <Input
                id="assessedValue"
                type="text"
                value={assessedValue}
                onChange={(e) => setAssessedValue(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={handleLoad} disabled={showPanel}>
            {showPanel ? 'Income Panel Loaded' : 'Load Income Panel'}
          </Button>
        </CardContent>
      </Card>
      
      {showPanel && (
        <div className="mb-6">
          <IncomeHotelMotelPanel 
            incomeYear={incomeYear}
            supNum={supNum}
            incomeId={incomeId}
            assessedValue={assessedValue}
          />
        </div>
      )}
      
      {showPanel && property && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Parcel ID</Label>
                <div className="p-2 bg-gray-50 rounded">{property.parcelId || 'N/A'}</div>
              </div>
              <div>
                <Label>Address</Label>
                <div className="p-2 bg-gray-50 rounded">{property.address || 'N/A'}</div>
              </div>
              <div>
                <Label>Property Type</Label>
                <div className="p-2 bg-gray-50 rounded">{property.propertyType || 'N/A'}</div>
              </div>
              <div>
                <Label>Square Feet</Label>
                <div className="p-2 bg-gray-50 rounded">{property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}</div>
              </div>
              <div>
                <Label>Year Built</Label>
                <div className="p-2 bg-gray-50 rounded">{property.yearBuilt || 'N/A'}</div>
              </div>
              <div>
                <Label>Tax Assessment</Label>
                <div className="p-2 bg-gray-50 rounded">{property.taxAssessment || 'N/A'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IncomePage;