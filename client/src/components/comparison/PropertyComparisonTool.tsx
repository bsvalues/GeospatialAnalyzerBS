import React from 'react';
import { Property } from '@/shared/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, MapPin, Home, X, Calculator, DollarSign, Calendar, Ruler } from 'lucide-react';

interface PropertyComparisonToolProps {
  properties: Property[];
  onClose?: () => void;
}

// The metrics to compare between properties
const comparisonMetrics = [
  { id: 'address', label: 'Address', format: 'text', icon: <MapPin className="h-4 w-4 text-muted-foreground" /> },
  { id: 'parcelId', label: 'Parcel ID', format: 'text', icon: <ChevronRight className="h-4 w-4 text-muted-foreground" /> },
  { id: 'salePrice', label: 'Sale Price', format: 'currency', icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
  { id: 'squareFeet', label: 'Square Feet', format: 'number', icon: <Ruler className="h-4 w-4 text-muted-foreground" /> },
  { id: 'yearBuilt', label: 'Year Built', format: 'number', icon: <Calendar className="h-4 w-4 text-muted-foreground" /> },
  { id: 'landValue', label: 'Land Value', format: 'currency', icon: <Calculator className="h-4 w-4 text-muted-foreground" /> },
  { id: 'pricePerSqFt', label: 'Price per Sq. Ft.', format: 'currency', icon: <Calculator className="h-4 w-4 text-muted-foreground" />, calculated: true }
];

export const PropertyComparisonTool: React.FC<PropertyComparisonToolProps> = ({ properties, onClose }) => {
  const formatValue = (property: Property, metric: string, format: string): string => {
    if (metric === 'pricePerSqFt') {
      // Calculate price per square foot if we have both values
      if (property.salePrice && property.squareFeet) {
        const numericPrice = Number(property.salePrice.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numericPrice) && property.squareFeet > 0) {
          const pricePerSqFt = Math.round(numericPrice / property.squareFeet);
          return `$${pricePerSqFt}`;
        }
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
      
      default:
        return value.toString();
    }
  };

  // Find the highest and lowest values for each metric
  const findExtremeValues = () => {
    const extremes: Record<string, { min?: number; max?: number; }> = {};

    comparisonMetrics.forEach(metric => {
      if (metric.format === 'currency' || metric.format === 'number') {
        const values = properties.map(prop => {
          let value: any;
          
          if (metric.id === 'pricePerSqFt') {
            if (prop.salePrice && prop.squareFeet) {
              const numericPrice = Number(prop.salePrice.replace(/[^0-9.-]+/g, ''));
              if (!isNaN(numericPrice) && prop.squareFeet > 0) {
                return numericPrice / prop.squareFeet;
              }
            }
            return NaN;
          } else {
            value = prop[metric.id as keyof Property];
            
            if (typeof value === 'string' && value.includes('$')) {
              return Number(value.replace(/[^0-9.-]+/g, ''));
            }
            
            return typeof value === 'number' ? value : NaN;
          }
        }).filter(val => !isNaN(val));
        
        if (values.length > 0) {
          extremes[metric.id] = {
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      }
    });
    
    return extremes;
  };
  
  const extremeValues = findExtremeValues();
  
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Property Comparison</CardTitle>
            <CardDescription>
              Comparing {properties.length} properties in Benton County
            </CardDescription>
          </div>
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
      </CardHeader>
      
      <CardContent className="pb-6 px-0">
        <ScrollArea className="h-[500px] w-full">
          <div className="px-6 pb-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] sticky left-0 bg-background z-20">Metric</TableHead>
                    {properties.map((property, index) => (
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
                  {comparisonMetrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell className="font-medium sticky left-0 bg-background z-20">
                        <div className="flex items-center gap-2">
                          {metric.icon}
                          {metric.label}
                        </div>
                      </TableCell>
                      
                      {properties.map((property) => {
                        const value = formatValue(property, metric.id, metric.format);
                        const numericValue = metric.format === 'currency' || metric.format === 'number'
                          ? Number(value.replace(/[^0-9.-]+/g, ''))
                          : NaN;
                          
                        let statusClass = '';
                        
                        // Only apply highlighting for numeric metrics that have extremes
                        if (!isNaN(numericValue) && extremeValues[metric.id]) {
                          if (numericValue === extremeValues[metric.id].max) {
                            statusClass = metric.id === 'pricePerSqFt' 
                              ? 'text-red-500 font-medium' // Higher price per sq ft is worse
                              : 'text-green-500 font-medium'; // Higher is better for other metrics
                          } else if (numericValue === extremeValues[metric.id].min) {
                            statusClass = metric.id === 'pricePerSqFt'
                              ? 'text-green-500 font-medium' // Lower price per sq ft is better
                              : 'text-orange-500 font-medium'; // Lower is worse for other metrics
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
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            Highest Value
          </span>
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
            Lowest Value
          </span>
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