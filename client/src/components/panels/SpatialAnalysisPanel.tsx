import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { 
  CircleDot, 
  Layers, 
  Grid3X3, 
  TrendingUp, 
  Map as MapIcon, 
  Maximize2, 
  Minimize2, 
  Filter 
} from 'lucide-react';
import { Property } from '../../shared/schema';
import { ClusteringPanel } from '../analysis/ClusteringPanel';

export interface SpatialAnalysisPanelProps {
  properties: Property[];
  className?: string;
}

export const SpatialAnalysisPanel: React.FC<SpatialAnalysisPanelProps> = ({ 
  properties,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Additional fullscreen handling code here if needed
  };

  return (
    <div className={`h-full flex flex-col ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold flex items-center">
          <MapIcon className="mr-2 h-5 w-5 text-primary/70" />
          Spatial Analysis Tools
        </h2>
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-gray-600" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      <div className="flex-grow overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid grid-cols-5 gap-2">
              <TabsTrigger value="overview" onClick={() => setActiveTab('overview')}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="hotspot" onClick={() => setActiveTab('hotspot')}>
                <CircleDot className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Hotspot</span>
              </TabsTrigger>
              <TabsTrigger value="clustering" onClick={() => setActiveTab('clustering')}>
                <Layers className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Clustering</span>
              </TabsTrigger>
              <TabsTrigger value="regression" onClick={() => setActiveTab('regression')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Regression</span>
              </TabsTrigger>
              <TabsTrigger value="filter" onClick={() => setActiveTab('filter')}>
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Filter</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-grow overflow-hidden p-4">
            <TabsContent value="overview" className="h-full overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hotspot Analysis</CardTitle>
                    <CardDescription>
                      Identify clusters of high-value and low-value properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Hotspot analysis uses the Getis-Ord Gi* statistic to identify
                      statistically significant spatial clusters of high values (hot spots)
                      and low values (cold spots) in your property data.
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-sm">Hot spots (high values)</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Cold spots (low values)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Spatial Clustering</CardTitle>
                    <CardDescription>
                      Group properties into clusters based on location and attributes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Spatial clustering uses advanced k-means++ algorithm to group
                      properties into distinct clusters based on location and other
                      attributes, helping identify neighborhood patterns.
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-sm">Cluster centers</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                        <span className="text-sm">Cluster boundaries</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Spatial Regression</CardTitle>
                    <CardDescription>
                      Create models that account for spatial dependencies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Spatial regression extends traditional regression modeling to account
                      for spatial dependence. This analysis helps identify how location
                      influences property values.
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                        <span className="text-sm">High influence areas</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-300"></div>
                        <span className="text-sm">Spatial relationships</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Spatial Filtering</CardTitle>
                    <CardDescription>
                      Select properties using advanced geographic tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Spatial filtering lets you select properties using drawing tools,
                      radius searches, and polygon creation. These filters can be combined
                      with attribute filters for comprehensive analysis.
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                        <span className="text-sm">Selected areas</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 rounded-full bg-teal-500"></div>
                        <span className="text-sm">Filtered properties</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started with Spatial Analysis</CardTitle>
                    <CardDescription>
                      Follow these steps to analyze your property data spatially
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                      <li>
                        <strong>Explore the data:</strong> Start with the Filter tab to select a subset of properties to analyze
                      </li>
                      <li>
                        <strong>Run hotspot analysis:</strong> Identify statistically significant clusters of high and low values
                      </li>
                      <li>
                        <strong>Perform clustering:</strong> Group properties based on location and attributes
                      </li>
                      <li>
                        <strong>Build regression models:</strong> Create models that account for spatial relationships
                      </li>
                      <li>
                        <strong>Export your results:</strong> Save your analysis for reporting or further study
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hotspot" className="h-full">
              <div className="flex flex-col space-y-4 h-full">
                <Card className="flex-grow overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle>Hotspot Analysis</CardTitle>
                    <CardDescription>
                      Identifying statistically significant spatial clusters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)] overflow-hidden">
                    <div className="bg-gray-100 rounded-md h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <CircleDot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Hotspot Analysis</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          This feature will display a map with hotspot analysis results, highlighting areas
                          with statistically significant high or low property values in Benton County.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clustering" className="h-full">
              <ClusteringPanel properties={properties} className="h-full" />
            </TabsContent>

            <TabsContent value="regression" className="h-full">
              <div className="flex flex-col space-y-4 h-full">
                <Card className="flex-grow overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle>Spatial Regression</CardTitle>
                    <CardDescription>
                      Modeling property values with spatial relationships
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)] overflow-hidden">
                    <div className="bg-gray-100 rounded-md h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Spatial Regression</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          This feature will provide advanced spatial regression modeling capabilities,
                          allowing you to analyze how location and neighborhood characteristics
                          influence property values in Benton County.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="filter" className="h-full">
              <div className="flex flex-col space-y-4 h-full">
                <Card className="flex-grow overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle>Spatial Filtering</CardTitle>
                    <CardDescription>
                      Select properties using geographic tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)] overflow-hidden">
                    <div className="bg-gray-100 rounded-md h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Spatial Filtering</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          This feature will provide advanced spatial filtering tools, allowing you
                          to select properties by drawing shapes, setting radius searches, and
                          defining custom geographic areas in Benton County.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SpatialAnalysisPanel;