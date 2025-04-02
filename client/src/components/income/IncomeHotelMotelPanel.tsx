import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { apiRequest } from '@/lib/queryClient';

// Types based on schema.ts
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
  roomRevenueUpdate: string;
  vacancyCollectionLoss: string;
  vacancyCollectionLossPct: string;
  vacancyCollectionLossUpdate: string;
  foodBeverageIncome: string;
  foodBeverageIncomePct: string;
  foodBeverageIncomeUpdate: string;
  miscIncome: string;
  miscIncomePct: string;
  miscIncomeUpdate: string;
  effectiveGrossIncome: string;
  effectiveGrossIncomePct: string;
  utilities: string;
  utilitiesPct: string;
  utilitiesUpdate: string;
  maintenanceRepair: string;
  maintenanceRepairPct: string;
  maintenanceRepairUpdate: string;
  departmentExpenses: string;
  departmentExpensesPct: string;
  departmentExpensesUpdate: string;
  management: string;
  managementPct: string;
  managementUpdate: string;
  administrative: string;
  administrativePct: string;
  administrativeUpdate: string;
  payroll: string;
  payrollPct: string;
  payrollUpdate: string;
  insurance: string;
  insurancePct: string;
  insuranceUpdate: string;
  marketing: string;
  marketingPct: string;
  marketingUpdate: string;
  realEstateTax: string;
  realEstateTaxPct: string;
  realEstateTaxUpdate: string;
  franchiseFee: string;
  franchiseFeePct: string;
  franchiseFeeUpdate: string;
  other: string;
  otherPct: string;
  otherUpdate: string;
  totalExpenses: string;
  totalExpensesPct: string;
  totalExpensesUpdate: string;
  netOperatingIncome: string;
  netOperatingIncomePct: string;
  capRate: string;
  capRateUpdate: string;
  taxRate: string;
  taxRateUpdate: string;
  overallCapRate: string;
  incomeValue: string;
  personalPropertyValue: string;
  personalPropertyValueUpdate: string;
  otherValue: string;
  otherValueUpdate: string;
  indicatedIncomeValue: string;
}

// Form schema for the General section
const generalFormSchema = z.object({
  sizeInSqft: z.string()
    .min(1, { message: 'Size is required' })
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 99999999, {
      message: 'Size must be a number between 0 and 99,999,999',
    }),
  averageDailyRoomRate: z.string()
    .min(1, { message: 'Average Daily Room Rate is required' })
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 9999999.99, {
      message: 'Average Daily Room Rate must be a number between 0 and 9,999,999.99',
    }),
  numberOfRooms: z.string()
    .min(1, { message: 'Number of Rooms is required' })
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 9999, {
      message: 'Number of Rooms must be a number between 0 and 9,999',
    }),
  incomeValueReconciled: z.string()
    .min(1, { message: 'Income Value Reconciled is required' })
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Income Value Reconciled must be a non-negative number',
    }),
});

type GeneralFormValues = z.infer<typeof generalFormSchema>;

interface IncomeHotelMotelPanelProps {
  incomeYear: string;
  supNum: number;
  incomeId: number;
  assessedValue?: string;
}

const IncomeHotelMotelPanel: React.FC<IncomeHotelMotelPanelProps> = ({
  incomeYear,
  supNum,
  incomeId,
  assessedValue = "0",
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [userModifiedCells, setUserModifiedCells] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Hotel/Motel data
  const {
    data: hotelMotel,
    isLoading: isLoadingHotelMotel,
    error: hotelMotelError,
  } = useQuery({
    queryKey: ['/api/income-hotel-motel', incomeYear, supNum, incomeId],
    queryFn: async () => {
      const response = await fetch(`/api/income-hotel-motel/${incomeYear}/${supNum}/${incomeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel/motel data');
      }
      return response.json() as Promise<IncomeHotelMotel>;
    },
  });

  // Fetch Hotel/Motel details
  const {
    data: hotelMotelDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useQuery({
    queryKey: ['/api/income-hotel-motel-details', incomeYear, supNum, incomeId],
    queryFn: async () => {
      const response = await fetch(`/api/income-hotel-motel-details/${incomeYear}/${supNum}/${incomeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel/motel details');
      }
      return response.json() as Promise<IncomeHotelMotelDetail[]>;
    },
  });

  // Get actual and proforma data
  const actualData = hotelMotelDetails?.find(detail => detail.valueType === 'A');
  const proformaData = hotelMotelDetails?.find(detail => detail.valueType === 'P');

  // Update hotel/motel mutation
  const updateHotelMotel = useMutation({
    mutationFn: async (data: Partial<IncomeHotelMotel>) => {
      return apiRequest(
        'PATCH', 
        `/api/income-hotel-motel/${incomeYear}/${supNum}/${incomeId}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income-hotel-motel', incomeYear, supNum, incomeId] });
      toast({
        title: 'Success',
        description: 'Hotel/Motel data updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update hotel/motel data: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Update hotel/motel detail mutation
  const updateHotelMotelDetail = useMutation({
    mutationFn: async ({ valueType, data }: { valueType: string; data: Partial<IncomeHotelMotelDetail> }) => {
      return apiRequest(
        'PATCH',
        `/api/income-hotel-motel-detail/${incomeYear}/${supNum}/${incomeId}/${valueType}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income-hotel-motel-details', incomeYear, supNum, incomeId] });
      toast({
        title: 'Success',
        description: 'Hotel/Motel detail updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update hotel/motel detail: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Create hotel/motel if it doesn't exist
  const createHotelMotel = useMutation({
    mutationFn: async (data: Partial<IncomeHotelMotel>) => {
      return apiRequest(
        'POST',
        '/api/income-hotel-motel',
        {
          incomeYear,
          supNum,
          incomeId,
          ...data,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income-hotel-motel', incomeYear, supNum, incomeId] });
      toast({
        title: 'Success',
        description: 'Hotel/Motel record created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create hotel/motel record: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Create hotel/motel detail if it doesn't exist
  const createHotelMotelDetail = useMutation({
    mutationFn: async ({ valueType, data }: { valueType: string; data: Partial<IncomeHotelMotelDetail> }) => {
      return apiRequest(
        'POST',
        '/api/income-hotel-motel-detail',
        {
          incomeYear,
          supNum,
          incomeId,
          valueType,
          ...data,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income-hotel-motel-details', incomeYear, supNum, incomeId] });
      toast({
        title: 'Success',
        description: 'Hotel/Motel detail record created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create hotel/motel detail record: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Form for general section
  const form = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      sizeInSqft: "0",
      averageDailyRoomRate: "0",
      numberOfRooms: "0",
      incomeValueReconciled: "0",
    },
  });

  // Update form values when hotel/motel data changes
  useEffect(() => {
    if (hotelMotel) {
      form.reset({
        sizeInSqft: hotelMotel.sizeInSqft,
        averageDailyRoomRate: hotelMotel.averageDailyRoomRate,
        numberOfRooms: hotelMotel.numberOfRooms,
        incomeValueReconciled: hotelMotel.incomeValueReconciled,
      });
    }
  }, [hotelMotel, form]);

  // Calculate room nights when number of rooms changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'numberOfRooms') {
        const roomNights = Number(value.numberOfRooms) * 365;
        if (hotelMotel && roomNights.toString() !== hotelMotel.numberOfRoomNights) {
          updateHotelMotel.mutate({ numberOfRoomNights: roomNights.toString() });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, hotelMotel, updateHotelMotel]);

  // Submit handler for general form
  const onSubmitGeneral = (data: GeneralFormValues) => {
    if (hotelMotel) {
      updateHotelMotel.mutate(data);
    } else {
      createHotelMotel.mutate(data);
    }
  };

  // Reset total expenses
  const resetTotalExpenses = () => {
    if (proformaData) {
      updateHotelMotelDetail.mutate({
        valueType: 'P',
        data: {
          totalExpenses: "0",
          totalExpensesPct: "0",
          totalExpensesUpdate: "",
        },
      });
    }
  };

  // Handle value change in the grid
  const handleGridValueChange = (field: keyof IncomeHotelMotelDetail, value: string, valueType: string) => {
    setUserModifiedCells(prev => ({ ...prev, [`${field}-${valueType}`]: true }));
    
    // Create the update data object with the field value
    const updateData: Partial<IncomeHotelMotelDetail> = {
      [field]: value,
    };
    
    // Manually add the update field with 'V' value
    // Using type assertion to bypass TypeScript's type checking for this dynamic property
    (updateData as any)[`${field}Update`] = 'V';

    if (valueType === 'A' || valueType === 'P') {
      const existingDetail = hotelMotelDetails?.find(detail => detail.valueType === valueType);
      
      if (existingDetail) {
        updateHotelMotelDetail.mutate({ valueType, data: updateData });
      } else {
        createHotelMotelDetail.mutate({ 
          valueType, 
          data: {
            ...updateData,
            // Set default values for required fields
            roomRevenue: "0",
            roomRevenuePct: "0",
            vacancyCollectionLoss: "0",
            vacancyCollectionLossPct: "0",
            effectiveGrossIncome: "0",
            effectiveGrossIncomePct: "0",
            netOperatingIncome: "0",
            netOperatingIncomePct: "0"
          }
        });
      }
    }
  };

  // Format currency value
  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "$0" : `$${numValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Format percentage value
  const formatPercentage = (value: string) => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "0.00%" : `${numValue.toFixed(2)}%`;
  };

  // Cell class based on user modification
  const getCellClass = (field: keyof IncomeHotelMotelDetail, valueType: string) => {
    // Check if the cell was modified in the current session
    const isCurrentlyModified = userModifiedCells[`${field}-${valueType}`];
    
    // Check if the cell was previously modified (has 'V' value in the update field)
    const detail = hotelMotelDetails?.find(d => d.valueType === valueType);
    const updateField = `${field}Update`;
    const isPreviouslyModified = detail && (detail as any)[updateField] === 'V';
    
    // Apply green background if the cell was modified in any way
    return `p-2 border ${(isCurrentlyModified || isPreviouslyModified) ? 'bg-green-100' : ''}`;
  };

  // Loading indicator
  if (isLoadingHotelMotel || isLoadingDetails) {
    return <div className="p-4">Loading income data...</div>;
  }

  // Error handling
  if (hotelMotelError || detailsError) {
    return (
      <div className="p-4 text-red-500">
        Error loading income data. Please try again.
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Income Approach - Hotel/Motel</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="hotelMotelInfo">Hotel/Motel Information</TabsTrigger>
            <TabsTrigger value="statistics">Statistics Information</TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitGeneral)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sizeInSqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size in Sqft</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="averageDailyRoomRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Daily Room Rate (ADR)</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="numberOfRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel># of Rooms</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <Label># of Room Nights</Label>
                    <Input 
                      value={hotelMotel?.numberOfRoomNights || '0'} 
                      disabled 
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Calculated as: # of Rooms × 365
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="incomeValueReconciled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Income Value - Reconciled</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" disabled={updateHotelMotel.isPending || createHotelMotel.isPending}>
                  {updateHotelMotel.isPending || createHotelMotel.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Hotel/Motel Information Tab */}
          <TabsContent value="hotelMotelInfo">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  onClick={resetTotalExpenses} 
                  variant="outline" 
                  disabled={updateHotelMotelDetail.isPending}
                >
                  Reset Total Expenses
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border font-medium text-left"></th>
                      <th colSpan={2} className="p-2 border font-medium text-center">Actual</th>
                      <th colSpan={2} className="p-2 border font-medium text-center">Proforma</th>
                    </tr>
                    <tr>
                      <th className="p-2 border font-medium text-left"></th>
                      <th className="p-2 border font-medium text-center">Value</th>
                      <th className="p-2 border font-medium text-center">%</th>
                      <th className="p-2 border font-medium text-center">Value</th>
                      <th className="p-2 border font-medium text-center">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Income Section */}
                    <tr className="bg-gray-100">
                      <td colSpan={5} className="p-2 border font-medium">Income</td>
                    </tr>
                    
                    {/* Room Revenue */}
                    <tr>
                      <td className="p-2 border">Room Revenue</td>
                      <td className={getCellClass('roomRevenue', 'A')}>
                        <Input
                          value={actualData?.roomRevenue || '0'}
                          onChange={(e) => handleGridValueChange('roomRevenue', e.target.value, 'A')}
                          className="border-0 p-0 bg-transparent"
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.roomRevenuePct || '0')}
                      </td>
                      <td className={getCellClass('roomRevenue', 'P')}>
                        <Input
                          value={proformaData?.roomRevenue || '0'}
                          onChange={(e) => handleGridValueChange('roomRevenue', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(proformaData?.roomRevenuePct || '0')}
                      </td>
                    </tr>
                    
                    {/* Vacancy & Collection Loss */}
                    <tr>
                      <td className="p-2 border">Vacancy & Collection Loss</td>
                      <td className={getCellClass('vacancyCollectionLoss', 'A')}>
                        <Input
                          value={actualData?.vacancyCollectionLoss || '0'}
                          onChange={(e) => handleGridValueChange('vacancyCollectionLoss', e.target.value, 'A')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.vacancyCollectionLossPct || '0')}
                      </td>
                      <td className={getCellClass('vacancyCollectionLoss', 'P')}>
                        <Input
                          value={proformaData?.vacancyCollectionLoss || '0'}
                          onChange={(e) => handleGridValueChange('vacancyCollectionLoss', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className={getCellClass('vacancyCollectionLossPct', 'P')}>
                        <Input
                          value={proformaData?.vacancyCollectionLossPct || '0'}
                          onChange={(e) => handleGridValueChange('vacancyCollectionLossPct', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                    </tr>
                    
                    {/* Food & Beverage Income */}
                    <tr>
                      <td className="p-2 border">Food & Beverage Income</td>
                      <td className={getCellClass('foodBeverageIncome', 'A')}>
                        <Input
                          value={actualData?.foodBeverageIncome || '0'}
                          onChange={(e) => handleGridValueChange('foodBeverageIncome', e.target.value, 'A')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.foodBeverageIncomePct || '0')}
                      </td>
                      <td className={getCellClass('foodBeverageIncome', 'P')}>
                        <Input
                          value={proformaData?.foodBeverageIncome || '0'}
                          onChange={(e) => handleGridValueChange('foodBeverageIncome', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(proformaData?.foodBeverageIncomePct || '0')}
                      </td>
                    </tr>
                    
                    {/* Misc Income */}
                    <tr>
                      <td className="p-2 border">Misc Income</td>
                      <td className={getCellClass('miscIncome', 'A')}>
                        <Input
                          value={actualData?.miscIncome || '0'}
                          onChange={(e) => handleGridValueChange('miscIncome', e.target.value, 'A')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.miscIncomePct || '0')}
                      </td>
                      <td className={getCellClass('miscIncome', 'P')}>
                        <Input
                          value={proformaData?.miscIncome || '0'}
                          onChange={(e) => handleGridValueChange('miscIncome', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(proformaData?.miscIncomePct || '0')}
                      </td>
                    </tr>
                    
                    {/* Effective Gross Income */}
                    <tr className="bg-gray-50">
                      <td className="p-2 border font-medium">Effective Gross Income</td>
                      <td className="p-2 border font-medium">
                        {formatCurrency(actualData?.effectiveGrossIncome || '0')}
                      </td>
                      <td className="p-2 border font-medium">
                        {formatPercentage(actualData?.effectiveGrossIncomePct || '0')}
                      </td>
                      <td className="p-2 border font-medium">
                        {formatCurrency(proformaData?.effectiveGrossIncome || '0')}
                      </td>
                      <td className="p-2 border font-medium">
                        {formatPercentage(proformaData?.effectiveGrossIncomePct || '0')}
                      </td>
                    </tr>
                    
                    {/* Expense Section */}
                    <tr className="bg-gray-100">
                      <td colSpan={5} className="p-2 border font-medium">Expenses</td>
                    </tr>
                    
                    {/* Utilities */}
                    <tr>
                      <td className="p-2 border">Utilities</td>
                      <td className={getCellClass('utilities', 'A')}>
                        <Input
                          value={actualData?.utilities || '0'}
                          onChange={(e) => handleGridValueChange('utilities', e.target.value, 'A')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.utilitiesPct || '0')}
                      </td>
                      <td className={getCellClass('utilities', 'P')}>
                        <Input
                          value={proformaData?.utilities || '0'}
                          onChange={(e) => handleGridValueChange('utilities', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(proformaData?.utilitiesPct || '0')}
                      </td>
                    </tr>
                    
                    {/* Maintenance & Repair */}
                    <tr>
                      <td className="p-2 border">Maintenance & Repair</td>
                      <td className={getCellClass('maintenanceRepair', 'A')}>
                        <Input
                          value={actualData?.maintenanceRepair || '0'}
                          onChange={(e) => handleGridValueChange('maintenanceRepair', e.target.value, 'A')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.maintenanceRepairPct || '0')}
                      </td>
                      <td className={getCellClass('maintenanceRepair', 'P')}>
                        <Input
                          value={proformaData?.maintenanceRepair || '0'}
                          onChange={(e) => handleGridValueChange('maintenanceRepair', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(proformaData?.maintenanceRepairPct || '0')}
                      </td>
                    </tr>
                    
                    {/* Management */}
                    <tr>
                      <td className="p-2 border">Management</td>
                      <td className={getCellClass('management', 'A')}>
                        <Input
                          value={actualData?.management || '0'}
                          onChange={(e) => handleGridValueChange('management', e.target.value, 'A')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.managementPct || '0')}
                      </td>
                      <td className={getCellClass('management', 'P')}>
                        <Input
                          value={proformaData?.management || '0'}
                          onChange={(e) => handleGridValueChange('management', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border">
                        {formatPercentage(proformaData?.managementPct || '0')}
                      </td>
                    </tr>
                    
                    {/* Total Expenses */}
                    <tr className="bg-gray-50">
                      <td className="p-2 border font-medium">Total Expenses</td>
                      <td className="p-2 border font-medium">
                        {formatCurrency(actualData?.totalExpenses || '0')}
                      </td>
                      <td className="p-2 border font-medium">
                        {formatPercentage(actualData?.totalExpensesPct || '0')}
                      </td>
                      <td className={getCellClass('totalExpenses', 'P')}>
                        <Input
                          value={proformaData?.totalExpenses || '0'}
                          onChange={(e) => handleGridValueChange('totalExpenses', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent font-medium"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className={getCellClass('totalExpensesPct', 'P')}>
                        <Input
                          value={proformaData?.totalExpensesPct || '0'}
                          onChange={(e) => handleGridValueChange('totalExpensesPct', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent font-medium"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                    </tr>
                    
                    {/* Net Operating Income */}
                    <tr className="bg-gray-50">
                      <td className="p-2 border font-medium">Net Operating Income</td>
                      <td className="p-2 border font-medium">
                        {formatCurrency(actualData?.netOperatingIncome || '0')}
                      </td>
                      <td className="p-2 border font-medium">
                        {formatPercentage(actualData?.netOperatingIncomePct || '0')}
                      </td>
                      <td className="p-2 border font-medium">
                        {formatCurrency(proformaData?.netOperatingIncome || '0')}
                      </td>
                      <td className="p-2 border font-medium">
                        {formatPercentage(proformaData?.netOperatingIncomePct || '0')}
                      </td>
                    </tr>
                    
                    {/* Cap Rate */}
                    <tr>
                      <td className="p-2 border">Cap Rate</td>
                      <td className="p-2 border">
                        {formatPercentage(actualData?.capRate || '0')}
                      </td>
                      <td className="p-2 border"></td>
                      <td className={getCellClass('capRate', 'P')}>
                        <Input
                          value={proformaData?.capRate || '0'}
                          onChange={(e) => handleGridValueChange('capRate', e.target.value, 'P')}
                          className="border-0 p-0 bg-transparent"
                          disabled={updateHotelMotelDetail.isPending}
                        />
                      </td>
                      <td className="p-2 border"></td>
                    </tr>
                    
                    {/* Income Value */}
                    <tr className="bg-gray-50">
                      <td className="p-2 border font-medium">Income Value</td>
                      <td className="p-2 border font-medium">
                        {formatCurrency(actualData?.incomeValue || '0')}
                      </td>
                      <td className="p-2 border"></td>
                      <td className="p-2 border font-medium">
                        {formatCurrency(proformaData?.incomeValue || '0')}
                      </td>
                      <td className="p-2 border"></td>
                    </tr>
                    
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          {/* Statistics Information Tab */}
          <TabsContent value="statistics">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Assessed Value</Label>
                  <Input value={assessedValue} disabled className="bg-gray-50" />
                </div>
                
                <div>
                  <Label>Value per Room - Income</Label>
                  <Input 
                    value={hotelMotel?.incomeValuePerRoom || '0'} 
                    disabled 
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated as: Income Value - Reconciled ÷ Number of Rooms
                  </p>
                </div>
                
                <div>
                  <Label>Value per Room - Assessment</Label>
                  <Input 
                    value={hotelMotel?.assessmentValuePerRoom || '0'} 
                    disabled 
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated as: Assessment Value ÷ Number of Rooms
                  </p>
                </div>
                
                <div>
                  <Label>Value per Sqft - Income</Label>
                  <Input 
                    value={hotelMotel?.incomeValuePerSqft || '0'} 
                    disabled 
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated as: Income Value - Reconciled ÷ Size in Sqft
                  </p>
                </div>
                
                <div>
                  <Label>Value per Sqft - Assessment</Label>
                  <Input 
                    value={hotelMotel?.assessmentValuePerSqft || '0'} 
                    disabled 
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated as: Assessment Value ÷ Size in Sqft
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IncomeHotelMotelPanel;