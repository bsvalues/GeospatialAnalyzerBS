import React, { useState, useMemo } from 'react';
import { Property } from '@shared/schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronRight, 
  MapPin, 
  Home, 
  X, 
  Calculator, 
  DollarSign, 
  Calendar, 
  Ruler, 
  DownloadCloud, 
  Search, 
  Filter, 
  ArrowUpDown, 
  User, 
  Building,
  Briefcase,
  Clock,
  Percent,
  Settings
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { ExportButton } from '../export/ExportButton';
import { PropertyReportGenerator } from '../export/PropertyReportGenerator';
import { ExportService } from '@/services/exportService';

interface PropertyComparisonToolProps {
  properties: Property[];
  onClose?: () => void;
}

// Extended interface for comparison metrics
interface ComparisonMetric {
  id: string;
  label: string;
  format: 'text' | 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  calculated?: boolean;
  description?: string;
  category?: 'basic' | 'financial' | 'physical' | 'advanced';
  sortable?: boolean;
  visible?: boolean;
}

// The metrics to compare between properties
const comparisonMetrics: ComparisonMetric[] = [
  { 
    id: 'address', 
    label: 'Address', 
    format: 'text', 
    icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
    category: 'basic',
    description: 'Property location address',
    visible: true
  },
  { 
    id: 'parcelId', 
    label: 'Parcel ID', 
    format: 'text', 
    icon: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    category: 'basic',
    description: 'County parcel identifier',
    visible: true
  },
  { 
    id: 'owner', 
    label: 'Owner', 
    format: 'text', 
    icon: <User className="h-4 w-4 text-muted-foreground" />,
    category: 'basic',
    description: 'Current property owner',
    visible: true
  },
  { 
    id: 'salePrice', 
    label: 'Sale Price', 
    format: 'currency', 
    icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    category: 'financial',
    description: 'Last recorded sale price',
    sortable: true,
    visible: true
  },
  { 
    id: 'value', 
    label: 'Assessed Value', 
    format: 'currency', 
    icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
    category: 'financial',
    description: 'Current assessed value',
    sortable: true,
    visible: true
  },
  { 
    id: 'squareFeet', 
    label: 'Square Feet', 
    format: 'number', 
    icon: <Ruler className="h-4 w-4 text-muted-foreground" />,
    category: 'physical',
    description: 'Building square footage',
    sortable: true,
    visible: true
  },
  { 
    id: 'yearBuilt', 
    label: 'Year Built', 
    format: 'number', 
    icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
    category: 'physical',
    description: 'Year of construction',
    sortable: true,
    visible: true
  },
  { 
    id: 'landValue', 
    label: 'Land Value', 
    format: 'currency', 
    icon: <Calculator className="h-4 w-4 text-muted-foreground" />,
    category: 'financial',
    description: 'Assessed land value',
    sortable: true,
    visible: true
  },
  { 
    id: 'buildingValue', 
    label: 'Building Value', 
    format: 'currency', 
    icon: <Building className="h-4 w-4 text-muted-foreground" />,
    category: 'financial',
    description: 'Assessed building value',
    calculated: true,
    sortable: true,
    visible: false
  },
  { 
    id: 'pricePerSqFt', 
    label: 'Price per Sq. Ft.', 
    format: 'currency', 
    icon: <Calculator className="h-4 w-4 text-muted-foreground" />,
    category: 'advanced',
    description: 'Sale price divided by square feet',
    calculated: true,
    sortable: true,
    visible: true
  },
  {
    id: 'landToValueRatio',
    label: 'Land to Value Ratio',
    format: 'percent',
    icon: <Percent className="h-4 w-4 text-muted-foreground" />,
    category: 'advanced',
    description: 'Land value as percentage of total value',
    calculated: true,
    sortable: true,
    visible: false
  },
  {
    id: 'valueChangePercent',
    label: 'Value Change %',
    format: 'percent',
    icon: <ArrowUpDown className="h-4 w-4 text-muted-foreground" />,
    category: 'advanced',
    description: 'Percent change between sale price and current value',
    calculated: true,
    sortable: true,
    visible: false
  },
  {
    id: 'propertyAge',
    label: 'Property Age',
    format: 'number',
    icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    category: 'advanced',
    description: 'Age of the property in years',
    calculated: true,
    sortable: true,
    visible: false
  }
];

export const PropertyComparisonTool: React.FC<PropertyComparisonToolProps> = ({ properties, onClose }) => {
  // State for metric visibility
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(
    comparisonMetrics.filter(m => m.visible).map(m => m.id)
  );
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: null,
    direction: null
  });
  
  // State for filtering
  const [filterValue, setFilterValue] = useState('');
  const [activeTab, setActiveTab] = useState('table');
  
  // Format a value based on metric type and property data
  const formatValue = (property: Property, metric: string, format: string): string => {
    // Handle calculated metrics
    if (metric === 'pricePerSqFt') {
      if (property.salePrice && property.squareFeet) {
        const numericPrice = Number(property.salePrice.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numericPrice) && property.squareFeet > 0) {
          const pricePerSqFt = Math.round(numericPrice / property.squareFeet);
          return `$${pricePerSqFt}`;
        }
      }
      return 'N/A';
    }
    
    if (metric === 'propertyAge') {
      if (property.yearBuilt) {
        const currentYear = new Date().getFullYear();
        return (currentYear - property.yearBuilt).toString();
      }
      return 'N/A';
    }
    
    if (metric === 'buildingValue') {
      const landValue = property.landValue ? Number(property.landValue.replace(/[^0-9.-]+/g, '')) : 0;
      const totalValue = property.value ? Number(property.value.replace(/[^0-9.-]+/g, '')) : 0;
      
      if (landValue && totalValue) {
        const buildingValue = totalValue - landValue;
        return `$${buildingValue.toLocaleString()}`;
      }
      return 'N/A';
    }
    
    if (metric === 'landToValueRatio') {
      const landValue = property.landValue ? Number(property.landValue.replace(/[^0-9.-]+/g, '')) : 0;
      const totalValue = property.value ? Number(property.value.replace(/[^0-9.-]+/g, '')) : 0;
      
      if (landValue && totalValue && totalValue > 0) {
        const ratio = (landValue / totalValue) * 100;
        return `${ratio.toFixed(1)}%`;
      }
      return 'N/A';
    }
    
    if (metric === 'valueChangePercent') {
      const salePrice = property.salePrice ? Number(property.salePrice.replace(/[^0-9.-]+/g, '')) : 0;
      const currentValue = property.value ? Number(property.value.replace(/[^0-9.-]+/g, '')) : 0;
      
      if (salePrice && currentValue && salePrice > 0) {
        const changePercent = ((currentValue - salePrice) / salePrice) * 100;
        return `${changePercent.toFixed(1)}%`;
      }
      return 'N/A';
    }

    // For regular values
    const value = property[metric as keyof Property];
    
    if (value === undefined || value === null) {
      return 'N/A';
    }
    
    switch (format) {
      case 'currency':
        // Return as is if it's already formatted with currency symbol
        if (typeof value === 'string' && value.includes('$')) {
          return value;
        }
        // Otherwise format it
        return typeof value === 'number' 
          ? `$${value.toLocaleString()}`
          : `$${value}`;
      
      case 'number':
        return typeof value === 'number' 
          ? value.toLocaleString()
          : value.toString();
          
      case 'percent':
        return typeof value === 'number'
          ? `${value.toFixed(1)}%`
          : value.toString();
      
      default:
        return value.toString();
    }
  };
  
  // Get raw numeric value from formatted value
  const getNumericValue = (property: Property, metricId: string, format: string): number => {
    const formattedValue = formatValue(property, metricId, format);
    
    if (formattedValue === 'N/A') {
      return NaN;
    }
    
    if (format === 'percent') {
      return parseFloat(formattedValue.replace('%', ''));
    }
    
    if (format === 'currency' || format === 'number') {
      return Number(formattedValue.replace(/[^0-9.-]+/g, ''));
    }
    
    return NaN;
  };

  // Function to toggle metric visibility
  const toggleMetricVisibility = (metricId: string) => {
    setVisibleMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  };
  
  // Handle sort request
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' | null = 'ascending';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };
  
  // Sort properties based on the sort configuration
  const sortedProperties = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return properties;
    }
    
    const metric = comparisonMetrics.find(m => m.id === sortConfig.key);
    if (!metric) return properties;
    
    return [...properties].sort((a, b) => {
      const valueA = getNumericValue(a, sortConfig.key!, metric.format);
      const valueB = getNumericValue(b, sortConfig.key!, metric.format);
      
      // Handle NaN values
      if (isNaN(valueA) && !isNaN(valueB)) return 1;
      if (!isNaN(valueA) && isNaN(valueB)) return -1;
      if (isNaN(valueA) && isNaN(valueB)) return 0;
      
      if (sortConfig.direction === 'ascending') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }, [properties, sortConfig]);
  
  // Filter metrics based on search input
  const filteredMetrics = useMemo(() => {
    if (!filterValue.trim()) {
      return comparisonMetrics.filter(metric => visibleMetrics.includes(metric.id));
    }
    
    const search = filterValue.toLowerCase();
    return comparisonMetrics.filter(metric => 
      (visibleMetrics.includes(metric.id)) && 
      (metric.label.toLowerCase().includes(search) || 
       (metric.description && metric.description.toLowerCase().includes(search)))
    );
  }, [visibleMetrics, filterValue]);
  
  // Find the highest and lowest values for each metric
  const extremeValues = useMemo(() => {
    const extremes: Record<string, { min?: number; max?: number; }> = {};

    comparisonMetrics.forEach(metric => {
      if (metric.format === 'currency' || metric.format === 'number' || metric.format === 'percent') {
        const values = properties.map(prop => getNumericValue(prop, metric.id, metric.format))
          .filter(val => !isNaN(val));
        
        if (values.length > 0) {
          extremes[metric.id] = {
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      }
    });
    
    return extremes;
  }, [properties]);
  
  // Export data to CSV
  const exportToCSV = () => {
    // Build CSV header
    let csvContent = 'Property,';
    csvContent += filteredMetrics.map(m => `"${m.label}"`).join(',') + '\n';
    
    // Add data rows
    sortedProperties.forEach((property, index) => {
      csvContent += `"Property ${index + 1} (${property.address})",`;
      csvContent += filteredMetrics.map(metric => 
        `"${formatValue(property, metric.id, metric.format)}"`
      ).join(',') + '\n';
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `property-comparison-${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  // Export data to JSON
  const exportToJSON = () => {
    const exportData = sortedProperties.map((property, index) => {
      const propertyData: Record<string, any> = {
        id: property.id,
        label: `Property ${index + 1}`
      };
      
      filteredMetrics.forEach(metric => {
        propertyData[metric.id] = formatValue(property, metric.id, metric.format);
      });
      
      return propertyData;
    });
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, `property-comparison-${new Date().toISOString().split('T')[0]}.json`);
  };
  
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Property Comparison</CardTitle>
            <CardDescription>
              Comparing {properties.length} properties in Benton County
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ExportButton 
              properties={properties}
              metrics={comparisonMetrics.map(metric => ({
                id: metric.id,
                label: metric.label,
                format: metric.format
              }))}
              exportType="comparison"
              fileName={`property-comparison-${new Date().toISOString().split('T')[0]}`}
              size="sm"
              variant="outline"
              trigger={
                <Button variant="outline" size="sm">
                  <DownloadCloud className="h-4 w-4 mr-1" />
                  Export
                </Button>
              }
            />
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Comparison Table</TabsTrigger>
            <TabsTrigger value="settings">Metrics & Settings</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="table" className="pt-4">
          <div className="px-6 mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter metrics..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="h-8 w-full"
              />
            </div>
          </div>
          
          <CardContent className="pb-6 px-0">
            <ScrollArea className="h-[460px] w-full">
              <div className="px-6 pb-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px] sticky left-0 bg-background z-20">
                          <div className="flex items-center gap-1">
                            Metric
                            {sortConfig.key === null && (
                              <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />
                            )}
                          </div>
                        </TableHead>
                        {sortedProperties.map((property, index) => (
                          <TableHead key={property.id} className={properties.length > 5 ? "min-w-[120px]" : ""}>
                            <div className="flex flex-col items-center">
                              <Badge variant="outline" className="mb-1">Property {index + 1}</Badge>
                              <span className="text-xs truncate max-w-[120px]" title={property.address}>
                                {property.address}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMetrics.map((metric) => (
                        <TableRow key={metric.id}>
                          <TableCell 
                            className={`font-medium sticky left-0 bg-background z-20 ${metric.sortable ? 'cursor-pointer' : ''}`}
                            onClick={() => metric.sortable && requestSort(metric.id)}
                          >
                            <div className="flex items-center gap-2">
                              {metric.icon}
                              <span title={metric.description}>{metric.label}</span>
                              {sortConfig.key === metric.id && (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          
                          {sortedProperties.map((property) => {
                            const value = formatValue(property, metric.id, metric.format);
                            const numericValue = getNumericValue(property, metric.id, metric.format);
                            
                            let statusClass = '';
                            
                            // Only apply highlighting for numeric metrics that have extremes
                            if (!isNaN(numericValue) && extremeValues[metric.id]) {
                              if (numericValue === extremeValues[metric.id].max) {
                                // For these metrics, higher is worse
                                statusClass = ['pricePerSqFt'].includes(metric.id)
                                  ? 'text-red-500 font-medium' 
                                  : 'text-green-500 font-medium';
                              } else if (numericValue === extremeValues[metric.id].min) {
                                // For these metrics, lower is worse
                                statusClass = ['pricePerSqFt'].includes(metric.id)
                                  ? 'text-green-500 font-medium'
                                  : 'text-orange-500 font-medium';
                              }
                            }
                            
                            return (
                              <TableCell key={`${property.id}-${metric.id}`} className={statusClass}>
                                {value}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="settings" className="pt-4">
          <CardContent>
            <div className="mb-6">
              <h3 className="font-medium mb-3">Visible Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {comparisonMetrics.map(metric => (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`metric-${metric.id}`} 
                      checked={visibleMetrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetricVisibility(metric.id)}
                    />
                    <Label 
                      htmlFor={`metric-${metric.id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {metric.icon}
                      <span>{metric.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Legend</h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Highest Value (Better)
                </span>
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                  Lowest Value (Worse)
                </span>
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                  Highest Value (Worse for Price/Sqft)
                </span>
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Lowest Value (Better for Price/Sqft)
                </span>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-xs text-muted-foreground flex items-center">
          <span className="mr-4">Click on metric names to sort</span>
          <PropertyReportGenerator
            properties={properties}
            metrics={comparisonMetrics.map(metric => ({
              id: metric.id,
              label: metric.label,
              format: metric.format
            }))}
            trigger={
              <Button variant="outline" size="xs" className="h-7 text-xs">
                Generate Detailed Report
              </Button>
            }
          />
        </div>
        
        {onClose && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
          >
            Close Comparison
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PropertyComparisonTool;