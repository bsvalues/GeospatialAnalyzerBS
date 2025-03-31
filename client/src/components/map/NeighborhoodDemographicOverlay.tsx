import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  getDemographicGeoJSON, 
  demographicMetrics, 
  colorSchemes, 
  DemographicOverlayOptions
} from '@/services/neighborhoodDemographicService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Info, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NeighborhoodDemographicOverlayProps {
  visible: boolean;
  className?: string;
  onClose?: () => void;
}

export const NeighborhoodDemographicOverlay: React.FC<NeighborhoodDemographicOverlayProps> = ({
  visible,
  className,
  onClose
}) => {
  const map = useMap();
  const [overlayOptions, setOverlayOptions] = useState<DemographicOverlayOptions>({
    metric: 'medianIncome',
    opacity: 0.7,
    colorScheme: 'blues'
  });
  const [geoJSONLayer, setGeoJSONLayer] = useState<L.GeoJSON | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

  // Add GeoJSON layer to map when overlay becomes visible
  useEffect(() => {
    if (visible) {
      updateOverlay();
    } else {
      // Remove layer when not visible
      if (geoJSONLayer) {
        geoJSONLayer.removeFrom(map);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (geoJSONLayer) {
        geoJSONLayer.removeFrom(map);
      }
    };
  }, [visible, map, overlayOptions]);

  const updateOverlay = () => {
    // Remove existing layer if any
    if (geoJSONLayer) {
      geoJSONLayer.removeFrom(map);
    }
    
    // Generate new GeoJSON with current options
    const geoJSON = getDemographicGeoJSON(
      overlayOptions.metric, 
      overlayOptions.colorScheme
    );
    
    // Create new layer with styling and interaction
    const layer = L.geoJSON(geoJSON as any, {
      style: (feature) => ({
        fillColor: feature?.properties?.color || '#cccccc',
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: overlayOptions.opacity
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => highlightFeature(e),
          mouseout: (e) => resetHighlight(e),
          click: (e) => {
            setSelectedNeighborhood(feature.properties.id);
            
            // Center the map on the clicked neighborhood
            if (e.target && e.target.getBounds) {
              map.fitBounds(e.target.getBounds());
            }
          }
        });
      }
    }).addTo(map);
    
    setGeoJSONLayer(layer);
  };

  const highlightFeature = (e: L.LeafletEvent) => {
    const layer = e.target;
    
    if (layer) {
      layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.9
      });
      
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
      
      // Update info control with neighborhood data
      if (layer.feature && layer.feature.properties) {
        const { name, value } = layer.feature.properties;
        const metricInfo = demographicMetrics.find(m => m.id === overlayOptions.metric);
        
        // Create info div if not exists
        let infoDiv = document.getElementById('demographic-info');
        if (!infoDiv) {
          infoDiv = document.createElement('div');
          infoDiv.id = 'demographic-info';
          infoDiv.className = 'bg-white shadow-md rounded p-3 absolute bottom-10 right-10 z-[1000] text-sm';
          document.body.appendChild(infoDiv);
        }
        
        // Format value based on metric type
        let formattedValue = value;
        if (metricInfo) {
          if (metricInfo.format === 'currency') {
            formattedValue = new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD',
              maximumFractionDigits: 0 
            }).format(value);
          } else if (metricInfo.format === 'percent') {
            formattedValue = `${value}%`;
          }
        }
        
        infoDiv.innerHTML = `
          <h3 class="font-bold">${name}</h3>
          <p>${metricInfo?.label}: ${formattedValue}</p>
        `;
        infoDiv.style.display = 'block';
      }
    }
  };

  const resetHighlight = (e: L.LeafletEvent) => {
    if (geoJSONLayer) {
      geoJSONLayer.resetStyle(e.target);
    }
    
    // Hide info div
    const infoDiv = document.getElementById('demographic-info');
    if (infoDiv) {
      infoDiv.style.display = 'none';
    }
  };

  const handleMetricChange = (value: string) => {
    setOverlayOptions(prev => ({ ...prev, metric: value }));
  };

  const handleColorSchemeChange = (value: string) => {
    setOverlayOptions(prev => ({ ...prev, colorScheme: value }));
  };

  const handleOpacityChange = (value: number[]) => {
    setOverlayOptions(prev => ({ ...prev, opacity: value[0] }));
  };

  if (!visible) return null;

  return (
    <Card className={cn("w-80 absolute z-10 top-20 right-4 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Demographic Overlay
        </CardTitle>
        <CardDescription>
          View neighborhood demographics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="metric">Demographic Metric</Label>
          <Select 
            value={overlayOptions.metric} 
            onValueChange={handleMetricChange}
          >
            <SelectTrigger id="metric">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {demographicMetrics.map(metric => (
                <SelectItem key={metric.id} value={metric.id}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="colorScheme">Color Scheme</Label>
          <Select 
            value={overlayOptions.colorScheme} 
            onValueChange={handleColorSchemeChange}
          >
            <SelectTrigger id="colorScheme">
              <SelectValue placeholder="Select color scheme" />
            </SelectTrigger>
            <SelectContent>
              {colorSchemes.map(scheme => (
                <SelectItem key={scheme.id} value={scheme.id}>
                  {scheme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="opacity">Opacity</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(overlayOptions.opacity * 100)}%
            </span>
          </div>
          <Slider
            id="opacity"
            min={0.1}
            max={1}
            step={0.1}
            value={[overlayOptions.opacity]}
            onValueChange={handleOpacityChange}
          />
        </div>

        <div className="flex items-center justify-center mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={updateOverlay}
          >
            Update Overlay
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-1"
        >
          <Info className="h-4 w-4" />
          <span>Legend</span>
        </Button>
        
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NeighborhoodDemographicOverlay;