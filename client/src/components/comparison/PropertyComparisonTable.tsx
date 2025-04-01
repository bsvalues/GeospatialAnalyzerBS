import React from 'react';
import { Property } from '@shared/schema';
import { formatCurrency } from '../../lib/utils';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SimilarityScoreIndicator } from './SimilarityScoreIndicator';
import { ComparablePropertyResult } from '../../services/comparison/comparablesService';

interface PropertyComparisonTableProps {
  baseProperty: Property;
  selectedProperties: Property[];
  similarityScores?: Map<number | string, number>;
  className?: string;
}

/**
 * Table component for side-by-side property comparison
 */
export const PropertyComparisonTable: React.FC<PropertyComparisonTableProps> = ({
  baseProperty,
  selectedProperties,
  similarityScores,
  className = ''
}) => {
  // Filter out the base property if it's included in selectedProperties
  const comparableProperties = selectedProperties.filter(p => p.id !== baseProperty.id);
  
  // All properties to display (base property first)
  const allProperties = [baseProperty, ...comparableProperties];
  
  // Get similarity score for a property
  const getScore = (property: Property): number => {
    if (property.id === baseProperty.id) return 100; // Base property is 100% similar to itself
    return similarityScores?.get(property.id) || 0;
  };
  
  // Format field values for comparison
  const formatField = (property: Property, field: keyof Property): React.ReactNode => {
    if (property[field] === undefined || property[field] === null) return '—';
    
    // Format based on field type
    switch (field) {
      case 'value':
      case 'salePrice':
      case 'taxAssessment':
        return formatCurrency(parseFloat(property[field] as string || '0'));
      
      case 'propertyType':
        return (
          <Badge variant="outline" className="capitalize">
            {property[field] as string}
          </Badge>
        );
        
      case 'lastSaleDate':
        try {
          const date = new Date(property[field] as string);
          return date.toLocaleDateString();
        } catch (e) {
          return property[field];
        }
        
      case 'squareFeet':
      case 'lotSize':
        return `${property[field]?.toLocaleString()} sq.ft.`;
      
      default:
        return property[field];
    }
  };
  
  // Field groups for the table
  const fieldGroups = [
    {
      title: 'Basic Info',
      fields: [
        { key: 'address' as keyof Property, label: 'Address' },
        { key: 'parcelId' as keyof Property, label: 'Parcel ID' },
        { key: 'owner' as keyof Property, label: 'Owner' },
        { key: 'neighborhood' as keyof Property, label: 'Neighborhood' },
        { key: 'propertyType' as keyof Property, label: 'Property Type' },
        { key: 'zoning' as keyof Property, label: 'Zoning' },
      ]
    },
    {
      title: 'Property Details',
      fields: [
        { key: 'squareFeet' as keyof Property, label: 'Square Feet' },
        { key: 'bedrooms' as keyof Property, label: 'Bedrooms' },
        { key: 'bathrooms' as keyof Property, label: 'Bathrooms' },
        { key: 'yearBuilt' as keyof Property, label: 'Year Built' },
        { key: 'lotSize' as keyof Property, label: 'Lot Size' },
      ]
    },
    {
      title: 'Valuation',
      fields: [
        { key: 'value' as keyof Property, label: 'Value' },
        { key: 'salePrice' as keyof Property, label: 'Sale Price' },
        { key: 'lastSaleDate' as keyof Property, label: 'Last Sale Date' },
        { key: 'taxAssessment' as keyof Property, label: 'Tax Assessment' },
      ]
    },
  ];
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Property</TableHead>
            {allProperties.map((property, index) => (
              <TableHead 
                key={property.id} 
                className={`min-w-[200px] ${index === 0 ? 'bg-primary/5' : ''}`}
              >
                <div className="font-medium truncate mb-1">
                  {property.address}
                </div>
                <div className="text-xs text-gray-500 font-normal">
                  {property.parcelId}
                </div>
                {index > 0 && similarityScores && (
                  <div className="mt-2">
                    <SimilarityScoreIndicator 
                      score={getScore(property)} 
                      size="sm"
                    />
                  </div>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {fieldGroups.map((group) => (
            <React.Fragment key={group.title}>
              <TableRow className="bg-gray-50">
                <TableCell 
                  colSpan={allProperties.length + 1} 
                  className="font-medium py-2"
                >
                  {group.title}
                </TableCell>
              </TableRow>
              
              {group.fields.map((field) => (
                <TableRow key={field.key as string}>
                  <TableCell className="font-medium">{field.label}</TableCell>
                  {allProperties.map((property, index) => (
                    <TableCell 
                      key={`${property.id}-${field.key}`}
                      className={index === 0 ? 'bg-primary/5' : ''}
                    >
                      {formatField(property, field.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};