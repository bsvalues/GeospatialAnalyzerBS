import React, { useState } from 'react';
import { Database, Search, Download, UploadCloud, Table, MapPin, Home } from 'lucide-react';
import { PropertyList } from '../property/PropertyList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const DataPanel: React.FC = () => {
  // Define placeholders for the data tables
  const dataSources = [
    { id: 'properties', name: 'Properties', count: 1250, selected: true },
    { id: 'sales', name: 'Sales', count: 523, selected: false },
    { id: 'permits', name: 'Permits', count: 86, selected: false },
    { id: 'landuse', name: 'Land Use', count: 1250, selected: false },
    { id: 'improvements', name: 'Improvements', count: 1124, selected: false }
  ];
  
  const [dataSourceSearchQuery, setDataSourceSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('properties');
  
  const filteredDataSources = dataSources.filter(source => 
    source.name.toLowerCase().includes(dataSourceSearchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* Data Source Sidebar */}
      <div className="w-64 border-r p-4 flex flex-col">
        <h2 className="font-medium text-lg mb-4 flex items-center">
          <Database size={18} className="mr-2 text-primary" />
          Data Sources
        </h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search data sources..." 
            className="w-full border rounded-md pl-8 py-2 text-sm"
            value={dataSourceSearchQuery}
            onChange={(e) => setDataSourceSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="flex-1">
          {filteredDataSources.map(source => (
            <Button 
              key={source.id}
              variant={source.id === selectedSource ? "default" : "ghost"}
              className="w-full justify-between mb-1"
              onClick={() => setSelectedSource(source.id)}
            >
              <span className="flex items-center">
                {source.id === 'properties' ? (
                  <Home className="mr-2 h-4 w-4" />
                ) : (
                  <Table className="mr-2 h-4 w-4" />
                )}
                {source.name}
              </span>
              <Badge variant="secondary" className="ml-2">
                {source.count}
              </Badge>
            </Button>
          ))}
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t">
          <Button className="w-full mb-2">
            <UploadCloud className="mr-2 h-4 w-4" />
            Import Data
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
      
      {/* Data Content */}
      <div className="flex-1 flex flex-col">
        {/* Data Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h1 className="text-xl font-medium flex items-center">
              {selectedSource === 'properties' ? (
                <>
                  <Home className="mr-2 h-5 w-5 text-primary" />
                  Property Data
                </>
              ) : (
                <>
                  <Table className="mr-2 h-5 w-5 text-primary" />
                  {dataSources.find(s => s.id === selectedSource)?.name || 'Data'} Records
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {dataSources.find(s => s.id === selectedSource)?.count || 0} records | Last updated: Today, 09:15 AM
            </p>
          </div>
        </div>
        
        {/* Data Content */}
        <div className="flex-1 p-4 overflow-auto">
          <Tabs defaultValue="list">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="list">Card View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="map">Map View</TabsTrigger>
              </TabsList>
              
              {selectedSource === 'properties' && (
                <Button variant="outline" size="sm">
                  <MapPin className="mr-2 h-4 w-4" />
                  Neighborhood Analysis
                </Button>
              )}
            </div>
            
            <TabsContent value="list" className="mt-0">
              {selectedSource === 'properties' && <PropertyList />}
              {selectedSource !== 'properties' && (
                <div className="flex items-center justify-center h-80 border rounded-lg">
                  <div className="text-center">
                    <h3 className="font-medium">Select Properties Source</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This demo focuses on Properties with neighborhood insights.
                    </p>
                    <Button 
                      variant="default" 
                      className="mt-4"
                      onClick={() => setSelectedSource('properties')}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Switch to Properties
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="table" className="mt-0">
              <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-medium">Table View</h3>
                <p className="mt-2 text-muted-foreground">
                  This view has been implemented to showcase the neighborhood insights feature.
                  <br />Please switch to Card View to see properties with neighborhood data.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="mt-0">
              <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-medium">Map View</h3>
                <p className="mt-2 text-muted-foreground">
                  The map view would display properties geographically with neighborhood overlays.
                  <br />Please switch to Card View to see properties with neighborhood data.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
