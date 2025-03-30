import React, { useState } from 'react';
import { Layers, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface MapLayer {
  id: string;
  name: string;
  type: 'base' | 'viewable';
  checked: boolean;
}

export const MapPanel: React.FC = () => {
  const [baseLayers, setBaseLayers] = useState<MapLayer[]>([
    { id: 'imagery', name: 'Imagery', type: 'base', checked: true },
    { id: 'street-map', name: 'Street Map', type: 'base', checked: true },
    { id: 'topo', name: 'Topo', type: 'base', checked: false },
    { id: 'fema-flood', name: 'FEMA Flood', type: 'base', checked: false },
    { id: 'usgs-imagery', name: 'USGS Imagery', type: 'base', checked: false },
  ]);
  
  const [viewableLayers, setViewableLayers] = useState<MapLayer[]>([
    { id: 'parcels', name: 'Parcels', type: 'viewable', checked: true },
    { id: 'short-plats', name: 'Short Plats', type: 'viewable', checked: false },
    { id: 'long-plats', name: 'Long Plats', type: 'viewable', checked: false },
    { id: 'flood-zones', name: 'Flood Zones', type: 'viewable', checked: false },
    { id: 'well-logs', name: 'Well Logs', type: 'viewable', checked: false },
    { id: 'zoning', name: 'Zoning', type: 'viewable', checked: false },
  ]);
  
  const [selectedProperty, setSelectedProperty] = useState({
    address: '123 Main Street',
    parcelId: '10425-01-29',
    salePrice: '$375,000',
    squareFeet: '2,300',
  });
  
  const handleBaseLayerChange = (id: string, checked: boolean) => {
    setBaseLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === id ? { ...layer, checked } : layer
      )
    );
  };
  
  const handleViewableLayerChange = (id: string, checked: boolean) => {
    setViewableLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === id ? { ...layer, checked } : layer
      )
    );
  };
  
  return (
    <div className="p-1 flex h-full">
      {/* Left sidebar - Layer controls */}
      <div className="w-64 bg-card border-r border-border p-4 flex flex-col">
        <h2 className="font-bold text-lg mb-4 flex items-center">
          <Layers size={18} className="mr-2 text-primary" />
          Map Layers
        </h2>
        
        <h3 className="text-sm font-medium text-primary mt-2 mb-2">Base Layers</h3>
        <div className="space-y-2 mb-4">
          {baseLayers.map((layer) => (
            <div key={layer.id} className="flex items-center p-2 rounded hover:bg-muted">
              <Checkbox 
                id={`layer-${layer.id}`} 
                className="mr-2"
                checked={layer.checked}
                onCheckedChange={(checked) => handleBaseLayerChange(layer.id, checked === true)}
              />
              <Label htmlFor={`layer-${layer.id}`} className="cursor-pointer flex-1 text-sm">
                {layer.name}
              </Label>
            </div>
          ))}
        </div>
        
        <h3 className="text-sm font-medium text-primary mt-4 mb-2">Viewable Layers</h3>
        <div className="space-y-2 mb-4">
          {viewableLayers.map((layer) => (
            <div key={layer.id} className="flex items-center p-2 rounded hover:bg-muted">
              <Checkbox 
                id={`viewlayer-${layer.id}`} 
                className="mr-2"
                checked={layer.checked}
                onCheckedChange={(checked) => handleViewableLayerChange(layer.id, checked === true)}
              />
              <Label htmlFor={`viewlayer-${layer.id}`} className="cursor-pointer flex-1 text-sm">
                {layer.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main map area */}
      <div className="flex-1 relative bg-gradient-to-br from-muted/50 to-muted/80">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-card bg-opacity-70 px-12 py-6 rounded-lg text-center shadow-lg">
            <MapPin size={60} className="mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">GIS Map View</h3>
            <p className="text-muted-foreground">Interactive property mapping with real-time data integration</p>
          </div>
        </div>
        
        {/* Property markers (illustrative) */}
        <div className="absolute top-1/4 left-1/4 h-4 w-4">
          <div className="absolute inset-0 bg-primary rounded-full opacity-90"></div>
        </div>
        <div className="absolute bottom-1/3 right-1/3 h-4 w-4">
          <div className="absolute inset-0 bg-primary rounded-full opacity-90"></div>
        </div>
        
        {/* Property Info Panel */}
        <Card className="absolute top-4 left-4 w-72">
          <div className="p-3 bg-primary text-primary-foreground font-medium">
            Selected Property: {selectedProperty.address}
          </div>
          <CardContent className="p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parcel ID:</span>
              <span>{selectedProperty.parcelId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sale Price:</span>
              <span>{selectedProperty.salePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Square Feet:</span>
              <span>{selectedProperty.squareFeet}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};