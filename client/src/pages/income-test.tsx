import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface IncomeHotelMotel {
  incomeYear: string;
  supNum: number;
  incomeId: number;
  sizeInSqft: string;
  averageDailyRoomRate: string;
  numberOfRooms: string;
  numberOfRoomNights: string;
  incomeValueReconciled: string;
  incomeValuePerRoom: string;
  assessmentValuePerRoom: string;
  incomeValuePerSqft: string;
  assessmentValuePerSqft: string;
}

interface IncomeHotelMotelDetail {
  incomeYear: string;
  supNum: number;
  incomeId: number;
  valueType: string;
  roomRevenue: string;
  roomRevenuePct: string;
  netOperatingIncome: string;
  capRate: string;
  incomeValue: string;
}

interface IncomeLeaseUp {
  incomeLeaseUpId: number;
  incomeYear: string;
  supNum: number;
  incomeId: number;
  frequency: string;
  leaseType: string | null;
  rentSqft: string | null;
  rentTotal: string | null;
}

const IncomeTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('hotel-motel');
  const [incomeYear, setIncomeYear] = useState<string>('2024');
  const [supNum, setSupNum] = useState<number>(1);
  const [incomeId, setIncomeId] = useState<number>(101);
  const [valueType, setValueType] = useState<string>('A');
  
  const [hotelMotel, setHotelMotel] = useState<IncomeHotelMotel | null>(null);
  const [hotelMotelDetails, setHotelMotelDetails] = useState<IncomeHotelMotelDetail[]>([]);
  const [leaseUps, setLeaseUps] = useState<IncomeLeaseUp[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  // Reset message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const createHotelMotel = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/income-hotel-motel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomeYear,
          supNum,
          incomeId,
          sizeInSqft: '25000',
          averageDailyRoomRate: '150.00',
          numberOfRooms: '200',
          numberOfRoomNights: '73000',
          incomeValueReconciled: '15000000',
          incomeValuePerRoom: '75000',
          assessmentValuePerRoom: '70000',
          incomeValuePerSqft: '600',
          assessmentValuePerSqft: '580'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setHotelMotel(data);
        setMessage('Hotel/Motel data created successfully');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getHotelMotel = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/income-hotel-motel/${incomeYear}/${supNum}/${incomeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setHotelMotel(data);
        setMessage('Hotel/Motel data fetched successfully');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const createHotelMotelDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/income-hotel-motel-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomeYear,
          supNum,
          incomeId,
          valueType,
          roomRevenue: '10950000',
          roomRevenuePct: '100.00',
          roomRevenueUpdate: '',
          vacancyCollectionLoss: '1095000',
          vacancyCollectionLossPct: '10.00',
          foodBeverageIncome: '3650000',
          foodBeverageIncomePct: '33.33',
          miscIncome: '730000',
          miscIncomePct: '6.67',
          effectiveGrossIncome: '14235000',
          utilities: '1423500',
          utilitiesPct: '10.00',
          management: '1423500',
          managementPct: '10.00',
          totalExpenses: '7117500',
          totalExpensesPct: '50.00',
          netOperatingIncome: '7117500',
          netOperatingIncomePct: '50.00',
          capRate: '9.50',
          incomeValue: '15000000',
          indicatedIncomeValue: '15000000'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        getHotelMotelDetails();
        setMessage('Hotel/Motel detail created successfully');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getHotelMotelDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/income-hotel-motel-details/${incomeYear}/${supNum}/${incomeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setHotelMotelDetails(data);
        setMessage('Hotel/Motel details fetched successfully');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const createLeaseUp = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/income-lease-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomeYear,
          supNum,
          incomeId,
          frequency: 'A',
          leaseType: 'M',
          unitOfMeasure: 'S',
          rentLossAreaSqft: '5000',
          rentSqft: '25.00',
          rentNumberOfYears: '1.00',
          rentTotal: '125000',
          leasePct: '100.00',
          leaseTotal: '125000'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        getLeaseUps();
        setMessage('Lease Up created successfully');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getLeaseUps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/income-lease-ups/${incomeYear}/${supNum}/${incomeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setLeaseUps(data);
        setMessage('Lease Ups fetched successfully');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteLeaseUp = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/income-lease-up/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        getLeaseUps();
        setMessage('Lease Up deleted successfully');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Income Approach Grouping - Test Page</h1>
      
      {message && (
        <div className={`p-3 mb-4 rounded text-white ${message.startsWith('Error') ? 'bg-red-500' : 'bg-green-500'}`}>
          {message}
        </div>
      )}
      
      <div className="mb-4 flex space-x-4">
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
          <Label htmlFor="valueType">Value Type</Label>
          <Input
            id="valueType"
            value={valueType}
            onChange={(e) => setValueType(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="hotel-motel">Hotel/Motel</TabsTrigger>
          <TabsTrigger value="hotel-motel-detail">Hotel/Motel Detail</TabsTrigger>
          <TabsTrigger value="lease-up">Lease Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hotel-motel" className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={createHotelMotel} disabled={loading}>Create Hotel/Motel</Button>
            <Button onClick={getHotelMotel} disabled={loading} variant="outline">Get Hotel/Motel</Button>
          </div>
          
          {hotelMotel && (
            <Card>
              <CardHeader>
                <CardTitle>Hotel/Motel Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded">
                  {JSON.stringify(hotelMotel, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="hotel-motel-detail" className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={createHotelMotelDetail} disabled={loading}>Create Detail</Button>
            <Button onClick={getHotelMotelDetails} disabled={loading} variant="outline">Get Details</Button>
          </div>
          
          {hotelMotelDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hotel/Motel Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hotelMotelDetails.map((detail, index) => (
                    <div key={index} className="bg-gray-100 p-4 rounded">
                      <h3 className="font-bold">Value Type: {detail.valueType}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>Room Revenue: {detail.roomRevenue}</div>
                        <div>Room Revenue %: {detail.roomRevenuePct}%</div>
                        <div>NOI: {detail.netOperatingIncome}</div>
                        <div>Cap Rate: {detail.capRate}%</div>
                        <div>Income Value: {detail.incomeValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="lease-up" className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={createLeaseUp} disabled={loading}>Create Lease Up</Button>
            <Button onClick={getLeaseUps} disabled={loading} variant="outline">Get Lease Ups</Button>
          </div>
          
          {leaseUps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lease Ups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaseUps.map((leaseUp) => (
                    <div key={leaseUp.incomeLeaseUpId} className="bg-gray-100 p-4 rounded flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">Lease Up ID: {leaseUp.incomeLeaseUpId}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>Frequency: {leaseUp.frequency}</div>
                          <div>Lease Type: {leaseUp.leaseType || 'N/A'}</div>
                          <div>Rent per Sqft: {leaseUp.rentSqft || 'N/A'}</div>
                          <div>Rent Total: {leaseUp.rentTotal || 'N/A'}</div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => deleteLeaseUp(leaseUp.incomeLeaseUpId)} 
                        variant="destructive"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomeTestPage;