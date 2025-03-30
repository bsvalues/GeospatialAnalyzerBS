import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Property } from '@/shared/types';
import { PropertySearchResults } from './PropertySearchResults';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Search, MapPin, Ruler, Calendar, DollarSign } from 'lucide-react';
import { 
  calculatePropertySimilarity, 
  DEFAULT_SIMILARITY_CONFIG, 
  SimilarityScore 
} from './PropertyScoring';

// Define the search form schema
const searchFormSchema = z.object({
  radiusMiles: z.number()
    .min(0.1, 'Radius must be at least 0.1 miles')
    .max(10, 'Radius cannot exceed 10 miles'),
  squareFootageMin: z.number()
    .min(100, 'Minimum value is 100 sq ft')
    .nullable(),
  squareFootageMax: z.number()
    .nullable(),
  yearBuiltMin: z.number()
    .min(1800, 'Minimum year is 1800')
    .nullable(),
  yearBuiltMax: z.number()
    .max(new Date().getFullYear(), `Maximum year is ${new Date().getFullYear()}`)
    .nullable(),
  priceMin: z.number()
    .min(1000, 'Minimum price is $1,000')
    .nullable(),
  priceMax: z.number()
    .nullable()
});

// Ensure max values are greater than min values
searchFormSchema
  .refine(
    data => !data.squareFootageMin || !data.squareFootageMax || data.squareFootageMin <= data.squareFootageMax,
    {
      message: 'Maximum square footage must be greater than minimum',
      path: ['squareFootageMax']
    }
  )
  .refine(
    data => !data.yearBuiltMin || !data.yearBuiltMax || data.yearBuiltMin <= data.yearBuiltMax,
    {
      message: 'Maximum year must be greater than minimum',
      path: ['yearBuiltMax']
    }
  )
  .refine(
    data => !data.priceMin || !data.priceMax || data.priceMin <= data.priceMax,
    {
      message: 'Maximum price must be greater than minimum',
      path: ['priceMax']
    }
  );

type SearchFormValues = z.infer<typeof searchFormSchema>;

// Search parameters including reference property
interface SearchParams extends SearchFormValues {
  referencePropertyId: string;
}

interface PropertySearchDialogProps {
  isOpen: boolean;
  referenceProperty: Property;
  onSearch: (params: SearchParams) => Promise<Property[]>;
  onSelect: (property: Property) => void;
  onClose: () => void;
  initialSearchResults?: Property[];
}

export const PropertySearchDialog: React.FC<PropertySearchDialogProps> = ({
  isOpen,
  referenceProperty,
  onSearch,
  onSelect,
  onClose,
  initialSearchResults = []
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Property[]>(initialSearchResults);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [similarityScores, setSimilarityScores] = useState<Record<string, SimilarityScore>>({});

  // Set up form with default values based on reference property
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      radiusMiles: 1,
      squareFootageMin: referenceProperty.squareFeet ? Math.floor(referenceProperty.squareFeet * 0.8) : null,
      squareFootageMax: referenceProperty.squareFeet ? Math.ceil(referenceProperty.squareFeet * 1.2) : null,
      yearBuiltMin: referenceProperty.yearBuilt ? referenceProperty.yearBuilt - 5 : null,
      yearBuiltMax: referenceProperty.yearBuilt ? referenceProperty.yearBuilt + 5 : null,
      priceMin: referenceProperty.value ? 
        parseFloat(referenceProperty.value.replace(/[$,]/g, '')) * 0.8 : null,
      priceMax: referenceProperty.value ? 
        parseFloat(referenceProperty.value.replace(/[$,]/g, '')) * 1.2 : null
    }
  });
  
  // Calculate similarity scores for all properties
  useEffect(() => {
    const scores: Record<string, SimilarityScore> = {};
    
    searchResults.forEach(property => {
      scores[property.id] = calculatePropertySimilarity(
        referenceProperty,
        property,
        DEFAULT_SIMILARITY_CONFIG
      );
    });
    
    setSimilarityScores(scores);
  }, [searchResults, referenceProperty]);
  
  // Handle search submission
  const onSubmit = async (values: SearchFormValues) => {
    setIsSearching(true);
    
    try {
      const params: SearchParams = {
        ...values,
        referencePropertyId: referenceProperty.id
      };
      
      const results = await onSearch(params);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle property selection
  const handlePropertySelect = (property: Property) => {
    if (!selectedProperties.some(p => p.id === property.id)) {
      setSelectedProperties(prev => [...prev, property]);
      onSelect(property);
    }
  };
  
  // Handle select all properties
  const handleSelectAll = (properties: Property[]) => {
    const newSelections = properties.filter(
      p => !selectedProperties.some(sp => sp.id === p.id)
    );
    
    // Update local state
    setSelectedProperties(prev => [...prev, ...newSelections]);
    
    // Notify parent for each new selection
    newSelections.forEach(property => {
      onSelect(property);
    });
  };
  
  // Handle select top N properties
  const handleSelectTop = (count: number) => {
    // Sort by similarity score
    const sortedProperties = [...searchResults]
      .sort((a, b) => (similarityScores[b.id]?.total || 0) - (similarityScores[a.id]?.total || 0))
      .slice(0, count);
    
    // Filter out already selected properties
    const newSelections = sortedProperties.filter(
      p => !selectedProperties.some(sp => sp.id === p.id)
    );
    
    // Update local state
    setSelectedProperties(prev => [...prev, ...newSelections]);
    
    // Notify parent for each new selection
    newSelections.forEach(property => {
      onSelect(property);
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Find Comparable Properties</DialogTitle>
          <DialogDescription>
            Search for properties similar to {referenceProperty.address}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 overflow-auto">
          <Accordion 
            type="single" 
            collapsible 
            defaultValue="search-form"
            className="w-full"
          >
            <AccordionItem value="search-form">
              <AccordionTrigger>Search Criteria</AccordionTrigger>
              <AccordionContent>
                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit(onSubmit)} 
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="radiusMiles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Distance Radius
                            </FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-2">
                                <Slider
                                  min={0.1}
                                  max={10}
                                  step={0.1}
                                  defaultValue={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">0.1 miles</span>
                                  <span className="font-medium">{field.value} miles</span>
                                  <span className="text-sm text-muted-foreground">10 miles</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Search radius from the reference property
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    
                      <div className="flex flex-col gap-6">
                        <FormField
                          control={form.control}
                          name="squareFootageMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Ruler className="h-4 w-4" />
                                Square Footage Range
                              </FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Min"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                </FormControl>
                                <span>to</span>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Max"
                                    {...form.register('squareFootageMax', { valueAsNumber: true })}
                                    value={form.watch('squareFootageMax') ?? ''}
                                    onChange={e => form.setValue(
                                      'squareFootageMax', 
                                      e.target.value ? Number(e.target.value) : null
                                    )}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    
                      <div className="flex flex-col gap-6">
                        <FormField
                          control={form.control}
                          name="yearBuiltMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Year Built Range
                              </FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Min"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                </FormControl>
                                <span>to</span>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Max"
                                    {...form.register('yearBuiltMax', { valueAsNumber: true })}
                                    value={form.watch('yearBuiltMax') ?? ''}
                                    onChange={e => form.setValue(
                                      'yearBuiltMax', 
                                      e.target.value ? Number(e.target.value) : null
                                    )}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    
                      <div className="flex flex-col gap-6">
                        <FormField
                          control={form.control}
                          name="priceMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Price Range
                              </FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Min"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                </FormControl>
                                <span>to</span>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Max"
                                    {...form.register('priceMax', { valueAsNumber: true })}
                                    value={form.watch('priceMax') ?? ''}
                                    onChange={e => form.setValue(
                                      'priceMax', 
                                      e.target.value ? Number(e.target.value) : null
                                    )}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  
                    <Button type="submit" disabled={isSearching}>
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <PropertySearchResults
            properties={searchResults}
            similarityScores={similarityScores}
            onSelect={handlePropertySelect}
            onSelectAll={handleSelectAll}
            onSelectTop={handleSelectTop}
            selectedProperties={selectedProperties}
            isLoading={isSearching}
            referenceProperty={referenceProperty}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PropertySearchDialog;