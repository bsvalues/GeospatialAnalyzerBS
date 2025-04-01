import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { ComparableFilters } from '../../services/comparison/comparablesService';
import { SimilarityWeights } from '../../services/comparison/similarityService';
import { findComparableProperties, ComparablePropertyResult } from '../../services/comparison/comparablesService';
import { analyzePropertyValue, PropertyValueAnalysis } from '../../services/comparison/valueAnalysisService';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  X, 
  BarChart3, 
  Table as TableIcon, 
  Map,
  FileBarChart 
} from 'lucide-react';

import { ComparablePropertyCard } from './ComparablePropertyCard';
import { ComparableFiltersForm } from './ComparableFiltersForm';
import { PropertyComparisonTable } from './PropertyComparisonTable';
import { MarketPositionScatter } from './MarketPositionScatter';
import { PropertyValueAnalysisCard } from './PropertyValueAnalysisCard';

interface EnhancedPropertyComparisonProps {
  baseProperty: Property;
  allProperties: Property[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * Enhanced property comparison dialog component
 */
export const EnhancedPropertyComparison: React.FC<EnhancedPropertyComparisonProps> = ({
  baseProperty,
  allProperties,
  isOpen,
  onClose,
  className = ''
}) => {
  // Current view tab
  const [activeTab, setActiveTab] = useState<string>('search');
  
  // Selected properties for comparison
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([baseProperty]);
  
  // Comparable properties search results
  const [comparableResults, setComparableResults] = useState<ComparablePropertyResult[]>([]);
  
  // Property value analysis
  const [valueAnalysis, setValueAnalysis] = useState<PropertyValueAnalysis | null>(null);
  
  // Loading states
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Current filter settings
  const [currentFilters, setCurrentFilters] = useState<ComparableFilters>({});
  
  // Map of similarity scores (using Record instead of Map)
  const [similarityScores, setSimilarityScores] = useState<Record<string | number, number>>({});
  
  // Find comparable properties
  const handleFindComparables = () => {
    setIsSearching(true);
    
    // Default search with no filters
    const results = findComparableProperties(baseProperty, allProperties);
    setComparableResults(results);
    
    // Create an object of similarity scores
    const scoresObj: Record<string | number, number> = {};
    results.forEach(result => {
      scoresObj[result.property.id] = result.similarityScore;
    });
    setSimilarityScores(scoresObj);
    
    setIsSearching(false);
  };
  
  // Apply filters to search
  const handleApplyFilters = (filters: ComparableFilters) => {
    setIsSearching(true);
    setCurrentFilters(filters);
    
    // Search with filters
    const results = findComparableProperties(baseProperty, allProperties, filters);
    setComparableResults(results);
    
    // Update similarity scores
    const scoresObj: Record<string | number, number> = {};
    results.forEach(result => {
      scoresObj[result.property.id] = result.similarityScore;
    });
    setSimilarityScores(scoresObj);
    
    setIsSearching(false);
  };
  
  // Toggle property selection
  const handleToggleSelect = (property: Property) => {
    // If already selected, remove it
    if (selectedProperties.some(p => p.id === property.id)) {
      setSelectedProperties(prev => prev.filter(p => p.id !== property.id));
    } 
    // Otherwise add it if we have room (max 5 properties)
    else if (selectedProperties.length < 5) {
      setSelectedProperties(prev => [...prev, property]);
    }
  };
  
  // Run property value analysis
  const analyzeSelectedProperty = () => {
    if (!baseProperty) return;
    
    setIsAnalyzing(true);
    const analysis = analyzePropertyValue(baseProperty, allProperties);
    setValueAnalysis(analysis);
    setIsAnalyzing(false);
  };
  
  // Run analysis when component loads or baseProperty changes
  useEffect(() => {
    if (isOpen && baseProperty) {
      // Make sure base property is always selected
      if (!selectedProperties.find(p => p.id === baseProperty.id)) {
        setSelectedProperties([baseProperty]);
      }
      
      // Reset or find comparables if none are loaded
      if (comparableResults.length === 0) {
        handleFindComparables();
      }
      
      // Run value analysis if not done
      if (!valueAnalysis) {
        analyzeSelectedProperty();
      }
    }
  }, [isOpen, baseProperty]);
  
  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('search');
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0" forceMount>
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Property Comparison</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Find comparable properties and analyze market position
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 border-b">
            <TabsList className="justify-start">
              <TabsTrigger value="search" className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                <span>Search</span>
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center">
                <TableIcon className="h-4 w-4 mr-2" />
                <span>Compare</span>
                <span className="ml-2 bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {selectedProperties.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="market" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span>Market Position</span>
              </TabsTrigger>
              <TabsTrigger value="valuation" className="flex items-center">
                <FileBarChart className="h-4 w-4 mr-2" />
                <span>Valuation</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {/* Search Tab */}
            <TabsContent value="search" className="m-0 h-full flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* Left sidebar - search filters */}
                <div className="p-6 border-r overflow-auto">
                  <ComparableFiltersForm 
                    baseProperty={baseProperty}
                    onApplyFilters={handleApplyFilters}
                  />
                </div>
                
                {/* Property search results */}
                <div className="md:col-span-2 p-6 overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Comparable Properties</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleFindComparables}
                      disabled={isSearching}
                    >
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Find Comparables
                    </Button>
                  </div>
                  
                  {isSearching ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-3 mx-auto"></div>
                        <p>Searching for comparable properties...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {comparableResults.length === 0 ? (
                        <div className="text-center p-8 border rounded-md bg-gray-50">
                          <p className="text-gray-500">No comparable properties found. Try adjusting your filters.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {comparableResults.map((comparable) => (
                            <ComparablePropertyCard
                              key={comparable.property.id}
                              baseProperty={baseProperty}
                              comparable={comparable}
                              isSelected={selectedProperties.some(p => p.id === comparable.property.id)}
                              onToggleSelect={handleToggleSelect}
                              disabled={
                                selectedProperties.length >= 5 && 
                                !selectedProperties.some(p => p.id === comparable.property.id)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Compare Tab */}
            <TabsContent value="compare" className="m-0 h-full overflow-auto p-6">
              {selectedProperties.length <= 1 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center max-w-md">
                    <TableIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No properties selected for comparison</h3>
                    <p className="text-gray-500 mb-4">
                      Please select properties in the Search tab to enable side-by-side comparison.
                    </p>
                    <Button onClick={() => setActiveTab('search')}>
                      <Search className="h-4 w-4 mr-2" />
                      Search Properties
                    </Button>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <PropertyComparisonTable
                    baseProperty={baseProperty}
                    selectedProperties={selectedProperties}
                    similarityScores={similarityScores}
                  />
                </ScrollArea>
              )}
            </TabsContent>
            
            {/* Market Position Tab */}
            <TabsContent value="market" className="m-0 h-full overflow-auto p-6">
              <div className="space-y-6">
                <MarketPositionScatter
                  baseProperty={baseProperty}
                  selectedProperties={selectedProperties}
                  allProperties={allProperties}
                  xAxisProperty="squareFeet"
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MarketPositionScatter
                    baseProperty={baseProperty}
                    selectedProperties={selectedProperties}
                    allProperties={allProperties}
                    xAxisProperty="yearBuilt"
                  />
                  
                  <MarketPositionScatter
                    baseProperty={baseProperty}
                    selectedProperties={selectedProperties}
                    allProperties={allProperties}
                    xAxisProperty="lotSize"
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Valuation Tab */}
            <TabsContent value="valuation" className="m-0 h-full overflow-auto p-6">
              {isAnalyzing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-3 mx-auto"></div>
                    <p>Analyzing property value...</p>
                  </div>
                </div>
              ) : valueAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PropertyValueAnalysisCard analysis={valueAnalysis} />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Comparable Properties Used</h3>
                    <div className="space-y-3">
                      {valueAnalysis.comparableProperties.slice(0, 3).map((comparable) => (
                        <div key={comparable.property.id} className="p-3 border rounded-md bg-gray-50">
                          <div className="flex justify-between mb-1">
                            <h4 className="font-medium">{comparable.property.address}</h4>
                            <div className="text-sm text-gray-500">{comparable.similarityScore}% Similar</div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <div>
                              {comparable.property.squareFeet} sq.ft. / Built {comparable.property.yearBuilt}
                            </div>
                            <div className="font-medium">
                              {comparable.property.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p>Unable to analyze property value. Please try again.</p>
                    <Button onClick={analyzeSelectedProperty} className="mt-4">
                      Retry Analysis
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};