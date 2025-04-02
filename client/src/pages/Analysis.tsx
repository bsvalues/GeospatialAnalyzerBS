/**
 * Analysis Page
 * 
 * This page provides spatial analysis tools and visualization
 * for property data in Benton County.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Temporarily commenting out to avoid the Leaflet errors
// import MapComponent from '../components/map/MapComponent';

const AnalysisPage = () => {
  // State for controlling the map center and zoom
  const [mapCenter] = useState<[number, number]>([46.2087, -119.1372]); // Kennewick, WA (Benton County)
  const [mapZoom] = useState<number>(12);
  
  // State for analysis options
  const [showAnalysisOptions, setShowAnalysisOptions] = useState<boolean>(false);
  
  // Function to handle creating a new analysis
  const handleNewAnalysis = () => {
    setShowAnalysisOptions(true);
  };
  
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-4">Property Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Controls Panel */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-4" 
                onClick={handleNewAnalysis}
              >
                New Analysis
              </Button>
              
              {showAnalysisOptions && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Analysis Type</h3>
                  <Button className="w-full" variant="outline">Property Value Heat Map</Button>
                  <Button className="w-full" variant="outline">Market Trend Analysis</Button>
                  <Button className="w-full" variant="outline">Neighborhood Comparison</Button>
                  <Button className="w-full" variant="outline">Custom Spatial Query</Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No active analyses.</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Map container */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardContent className="p-0 overflow-hidden rounded-lg">
              {/* Temporarily disabled to avoid errors */}
              {/* <MapComponent 
                center={mapCenter} 
                zoom={mapZoom} 
                height="600px" 
              /> */}
              <div 
                style={{ height: "600px", width: "100%" }}
                className="flex items-center justify-center bg-gray-100 rounded-lg"
              >
                <div className="text-center p-4">
                  <h3 className="font-semibold text-lg">Map Temporarily Unavailable</h3>
                  <p className="text-muted-foreground">
                    The map component is being updated. Please check back soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;