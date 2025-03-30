/**
 * Map layer types for the GIS application
 */

// Type of map layer
export type MapLayerType = 'base' | 'viewable' | 'overlay' | 'analysis';

// Map layer configuration
export interface MapLayer {
  id: string;
  name: string;
  type: MapLayerType;
  url?: string;
  visible?: boolean;
  checked?: boolean;
  opacity?: number;
  legend?: string;
  description?: string;
  attribution?: string;
  zIndex?: number;
  minZoom?: number;
  maxZoom?: number;
}

// Map options for configuring the map display
export interface MapOptions {
  center: [number, number]; // [latitude, longitude]
  zoom: number;
  maxZoom?: number;
  minZoom?: number;
  opacity?: number;
  labels?: boolean;
  zoomControl?: boolean;
  attribution?: boolean;
  basemap?: string;
  viewableLayers?: string[];
}

// Parcel type for GIS data
export interface Parcel {
  id: string;
  geometry: any; // GeoJSON geometry object
  properties: {
    parcelId: string;
    address?: string;
    owner?: string;
    value?: number;
    area?: number;
    zoning?: string;
  };
}

// GIS feature collection
export interface GISFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: string;
      coordinates: number[] | number[][] | number[][][];
    };
    properties: Record<string, any>;
  }>;
}

// Map event handlers
export interface MapEventHandlers {
  onClick?: (e: any) => void;
  onMouseOver?: (e: any) => void;
  onMouseOut?: (e: any) => void;
  onZoomEnd?: (e: any) => void;
  onMoveEnd?: (e: any) => void;
}

// Map bounds
export type MapBounds = [number, number, number, number]; // [south, west, north, east]

/**
 * Script module types for property valuation script functionality
 */

// Script group for organizing script steps
export interface ScriptGroup {
  id: string;
  name: string;
  active: boolean;
  order?: number;
}

// Script step status
export type ScriptStepStatus = 'pending' | 'active' | 'complete' | 'error';

// Script step type
export type ScriptStepType = 'compute' | 'group' | 'combine' | 'filter' | 'sort' | 'export';

// Script step for property valuation calculations
export interface ScriptStep {
  id: string;
  name: string;
  status: ScriptStepStatus;
  type: ScriptStepType;
  code?: string;
  order?: number;
  groupId?: string;
  outputField?: string;
  dependencies?: string[];
  lastRun?: string;
  runCount?: number;
}