import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Property } from '../../shared/schema';
import { PropertySearchResults } from './PropertySearchResults';

interface PropertySearchDialogProps {
  properties: Property[];
  buttonText?: string;
  onSelectProperty: (property: Property) => void;
}

export const PropertySearchDialog: React.FC<PropertySearchDialogProps> = ({
  properties,
  buttonText = "Search Properties",
  onSelectProperty,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = properties.filter(property => {
      // Search by address
      if (property.address?.toLowerCase().includes(query)) return true;
      
      // Search by parcel ID
      if (property.parcelId?.toLowerCase().includes(query)) return true;
      
      // Search by owner
      if (property.owner?.toLowerCase().includes(query)) return true;
      
      // Search by neighborhood
      if (property.neighborhood?.toLowerCase().includes(query)) return true;
      
      // Search by property type
      if (property.propertyType?.toLowerCase().includes(query)) return true;
      
      return false;
    }).slice(0, 20); // Limit to top 20 results

    setSearchResults(results);
  };

  const handlePropertySelect = (property: Property) => {
    onSelectProperty(property);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Properties</DialogTitle>
          <DialogDescription>
            Search by address, parcel ID, owner name, or neighborhood
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 my-4">
          <Input 
            placeholder="Enter search term..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
        
        <PropertySearchResults 
          results={searchResults} 
          onSelectProperty={handlePropertySelect}
        />
      </DialogContent>
    </Dialog>
  );
};