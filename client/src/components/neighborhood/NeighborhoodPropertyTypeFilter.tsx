import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';

interface PropertyTypeFilterProps {
  properties: Property[];
  onFilterChange: (filteredProperties: Property[]) => void;
  className?: string;
}

export const NeighborhoodPropertyTypeFilter: React.FC<PropertyTypeFilterProps> = ({
  properties,
  onFilterChange,
  className = ''
}) => {
  // Property type categories
  const propertyTypes = [
    { id: 'residential', label: 'Residential', checked: true },
    { id: 'commercial', label: 'Commercial', checked: true },
    { id: 'industrial', label: 'Industrial', checked: true },
    { id: 'land', label: 'Vacant Land', checked: true },
    { id: 'farm', label: 'Agricultural', checked: true }
  ];
  
  // State for selected property types
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    propertyTypes.filter(t => t.checked).map(t => t.id)
  );
  
  // Filter properties based on selected types
  useEffect(() => {
    const filteredProps = properties.filter(property => {
      // If property.type is not available, try to determine from other properties
      const type = property.type || 
        (property.isResidential ? 'residential' : 
          property.isCommercial ? 'commercial' : 
            property.isIndustrial ? 'industrial' : 
              property.isLand ? 'land' : 
                property.isFarm ? 'farm' : 'other');
                
      return selectedTypes.includes(type);
    });
    
    onFilterChange(filteredProps);
  }, [properties, selectedTypes, onFilterChange]);
  
  // Handle checkbox changes
  const handleTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes(prev => [...prev, typeId]);
    } else {
      setSelectedTypes(prev => prev.filter(id => id !== typeId));
    }
  };
  
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-primary" />
        <h3 className="text-base font-medium">Property Types</h3>
      </div>
      
      <div className="space-y-2">
        {propertyTypes.map(type => (
          <div key={type.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`type-${type.id}`} 
              checked={selectedTypes.includes(type.id)}
              onCheckedChange={(checked) => handleTypeChange(type.id, checked === true)}
            />
            <Label 
              htmlFor={`type-${type.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {type.label}
            </Label>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        {selectedTypes.length} of {propertyTypes.length} types selected
      </div>
    </div>
  );
};