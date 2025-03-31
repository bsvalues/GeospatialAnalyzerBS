import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Property } from '@/shared/schema';
import { usePropertyFilter } from '@/contexts/PropertyFilterContext';
import { useMapAccessibility } from '@/contexts/MapAccessibilityContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Map,
  Grid,
  Target,
  AlertTriangle,
  Download,
  Filter as FilterIcon,
  PanelRight,
  Layers,
  Settings
} from 'lucide-react';

import HeatmapVisualization from './HeatmapVisualization';
import SpatialClusteringComponent from './SpatialClusteringComponent';
import ProximityAnalysisComponent from './ProximityAnalysisComponent';
import OutlierDetectionComponent from './OutlierDetectionComponent';
import { PropertyFilterPanel } from '@/components/filters/PropertyFilterPanel';

type SpatialAnalysisTab = 'heatmap' | 'clustering' | 'proximity' | 'outliers';

interface SpatialAnalyticsPanelProps {
  className?: string;
}

export default function SpatialAnalyticsPanel({ className = '' }: SpatialAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<SpatialAnalysisTab>('heatmap');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Property filter context
  const { filters, dispatch } = usePropertyFilter();
  
  // Map accessibility context
  const { highContrastMode } = useMapAccessibility();
  
  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch amenities
  const { data: amenities = [], isLoading: isLoadingAmenities } = useQuery({
    queryKey: ['/api/amenities'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Return empty array if endpoint doesn't exist
    onError: () => [],
  });
  
  // Initialize tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['heatmap', 'clustering', 'proximity', 'outliers'].includes(tabParam)) {
      setActiveTab(tabParam as SpatialAnalysisTab);
    }
    
    // Initialize filters from URL params
    const propertyType = searchParams.get('propertyType');
    if (propertyType) {
      dispatch({ type: 'SET_PROPERTY_TYPES', payload: [propertyType] });
    }
    
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');
    if (minValue && maxValue) {
      dispatch({ 
        type: 'SET_VALUE_RANGE', 
        payload: [parseInt(minValue), parseInt(maxValue)] 
      });
    }
    
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    if (minYear && maxYear) {
      dispatch({ 
        type: 'SET_YEAR_BUILT_RANGE', 
        payload: [parseInt(minYear), parseInt(maxYear)] 
      });
    }
    
    const minSqFt = searchParams.get('minSqFt');
    const maxSqFt = searchParams.get('maxSqFt');
    if (minSqFt && maxSqFt) {
      dispatch({ 
        type: 'SET_SQUARE_FEET_RANGE', 
        payload: [parseInt(minSqFt), parseInt(maxSqFt)] 
      });
    }
    
    const neighborhood = searchParams.get('neighborhood');
    if (neighborhood) {
      dispatch({ 
        type: 'SET_NEIGHBORHOODS', 
        payload: [neighborhood] 
      });
    }
  }, []);
  
  // Update URL when tab changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', activeTab);
    setSearchParams(newParams);
  }, [activeTab]);
  
  // Tab icon mapping
  const tabIcons = {
    heatmap: <Map className="h-4 w-4 mr-2" />,
    clustering: <Grid className="h-4 w-4 mr-2" />,
    proximity: <Target className="h-4 w-4 mr-2" />,
    outliers: <AlertTriangle className="h-4 w-4 mr-2" />
  };
  
  // Helper to export current analysis
  const exportAnalysis = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const exportData = {
      type: activeTab,
      timestamp,
      filters,
      data: {
        // Would include actual data from active analysis component
        // This is a placeholder
        summary: `${activeTab} analysis with ${properties.length} properties`
      }
    };
    
    console.log('Exporting analysis:', exportData);
    // In a real implementation, this would call an export service
    alert('Export functionality would be implemented here');
  };
  
  // Count active filters
  const activeFilterCount = filters.activeFilterCount;
  
  if (isLoadingProperties) {
    return (
      <div className={`flex items-center justify-center h-[600px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-2xl font-bold">Spatial Analytics</h2>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span 
                className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                data-testid="active-filters-count"
              >
                {activeFilterCount}
              </span>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={exportAnalysis}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>
      
      <div className="flex">
        <div className={`${showFilters ? 'w-1/4 mr-4' : 'hidden'}`}>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Property Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowFilters(false)}
              >
                ✕
              </Button>
            </div>
            <PropertyFilterPanel />
          </div>
        </div>
        
        <div className={`${showFilters ? 'w-3/4' : 'w-full'}`}>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as SpatialAnalysisTab)}
            className="w-full"
          >
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="heatmap" data-testid="heatmap-tab" className="flex-1">
                {tabIcons.heatmap} Heatmap
              </TabsTrigger>
              <TabsTrigger value="clustering" data-testid="clustering-tab" className="flex-1">
                {tabIcons.clustering} Clustering
              </TabsTrigger>
              <TabsTrigger value="proximity" data-testid="proximity-tab" className="flex-1">
                {tabIcons.proximity} Proximity
              </TabsTrigger>
              <TabsTrigger value="outliers" data-testid="outliers-tab" className="flex-1">
                {tabIcons.outliers} Outliers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="heatmap" className="mt-0">
              <HeatmapVisualization
                properties={properties}
                height={600}
                colorScheme={
                  highContrastMode
                    ? { start: '#f8fafc', end: '#0f172a' }
                    : { start: '#3b82f6', end: '#ef4444' }
                }
              />
            </TabsContent>
            
            <TabsContent value="clustering" className="mt-0">
              <SpatialClusteringComponent
                properties={properties}
                height={600}
              />
            </TabsContent>
            
            <TabsContent value="proximity" className="mt-0">
              <ProximityAnalysisComponent
                properties={properties}
                amenities={amenities}
                height={600}
              />
            </TabsContent>
            
            <TabsContent value="outliers" className="mt-0">
              <OutlierDetectionComponent
                properties={properties}
                height={600}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}