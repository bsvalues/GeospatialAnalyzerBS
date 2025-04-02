import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleMapsConnectorPanel from '../components/etl/GoogleMapsConnectorPanel';
import { DatabaseIcon, GlobeIcon, Map, Info } from 'lucide-react';

// Import existing components that would be reused
const DataConnectorsPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Connectors</h1>
          <p className="text-muted-foreground">Connect to and import data from various sources</p>
        </div>
      </div>
      
      <Tabs defaultValue="googlemaps" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="googlemaps" className="flex items-center">
            <Map className="h-4 w-4 mr-2" />
            Google Maps
          </TabsTrigger>
          <TabsTrigger value="zillow" className="flex items-center">
            <GlobeIcon className="h-4 w-4 mr-2" />
            Zillow
          </TabsTrigger>
          <TabsTrigger value="countygis" className="flex items-center">
            <DatabaseIcon className="h-4 w-4 mr-2" />
            County GIS
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="googlemaps" className="space-y-4">
          <GoogleMapsConnectorPanel />
        </TabsContent>
        
        <TabsContent value="zillow" className="space-y-4">
          <div className="p-6 text-center">
            <Info className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">Zillow Data Connector</h3>
            <p className="mt-1 text-sm text-gray-500">
              Switch to the Google Maps tab to see the active connector implementation.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="countygis" className="space-y-4">
          <div className="p-6 text-center">
            <Info className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">County GIS Data Connector</h3>
            <p className="mt-1 text-sm text-gray-500">
              Switch to the Google Maps tab to see the active connector implementation.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataConnectorsPage;