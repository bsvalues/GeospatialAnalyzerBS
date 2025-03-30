/**
 * GIS Layer Source Interface
 * Defines the structure for map layers in the application
 */
export interface GisLayerSource {
  id: string;
  name: string;
  type: 'tile' | 'wms' | 'geojson';
  url: string;
  attribution: string;
  opacity: number;
  description?: string;        // Description of what the layer shows
  dataSource?: string;         // Original source of the data
  category?: string;           // Category for grouping in UI
  lastUpdated?: string;        // When the data was last updated
  options?: Record<string, any>;
}

/**
 * Base map sources for different backgrounds
 * These provide the underlying map imagery
 */
export const basemapSources: Record<string, GisLayerSource> = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    type: 'tile',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    opacity: 1,
    description: 'Standard OpenStreetMap base map with streets, buildings, and points of interest',
    dataSource: 'OpenStreetMap Contributors',
    category: 'Base Maps',
    lastUpdated: 'Continuously updated',
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Imagery',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
    opacity: 1,
    description: 'High-resolution satellite and aerial imagery',
    dataSource: 'Esri, Maxar, GeoEye, Earthstar Geographics',
    category: 'Base Maps',
    lastUpdated: 'Updated annually',
  },
  topo: {
    id: 'topo',
    name: 'Topographic',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
    opacity: 1,
    description: 'Detailed topographic map with terrain features, contour lines, and landmarks',
    dataSource: 'Esri, USGS, NOAA',
    category: 'Base Maps',
    lastUpdated: '2023',
  },
  light: {
    id: 'light',
    name: 'Light Map',
    type: 'tile',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    opacity: 1,
    description: 'Minimal, light-colored map ideal for data visualization overlays',
    dataSource: 'CartoDB, OpenStreetMap',
    category: 'Base Maps',
    lastUpdated: 'Continuously updated',
  }
};

/**
 * Optional satellite labels layer
 * Can be overlaid on satellite imagery to add place names
 */
export const satelliteLabelsLayer: GisLayerSource = {
  id: 'satellite-labels',
  name: 'Labels for Satellite',
  type: 'tile',
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
  opacity: 0.8,
  description: 'Text labels for roads, cities, and landmarks to overlay on satellite imagery',
  dataSource: 'Esri',
  category: 'Base Maps',
  lastUpdated: '2023',
};

/**
 * Overlay GIS layers (data visualization layers)
 * These layers contain specific GIS data that can be toggled on/off
 */
export const overlayLayerSources: GisLayerSource[] = [
  // Property Data Category
  {
    id: 'parcels',
    name: 'Property Parcels',
    type: 'wms',
    url: 'https://gis.bentoncountywa.gov/arcgis/services/Assessor/Parcels/MapServer/WMSServer',
    attribution: '&copy; Benton County GIS',
    opacity: 0.7,
    description: 'Property parcel boundaries showing lot lines, dimensions, and ownership information',
    dataSource: 'Benton County Assessor\'s Office',
    category: 'Property Data',
    lastUpdated: 'March 2024',
    options: {
      layers: 'Parcels',
      format: 'image/png',
      transparent: true
    }
  },
  {
    id: 'zoning',
    name: 'Zoning Districts',
    type: 'wms',
    url: 'https://gis.bentoncountywa.gov/arcgis/services/Planning/Zoning/MapServer/WMSServer',
    attribution: '&copy; Benton County GIS',
    opacity: 0.6,
    description: 'Official zoning classifications including residential, commercial, industrial, and agricultural zones',
    dataSource: 'Benton County Planning Department',
    category: 'Property Data',
    lastUpdated: 'December 2023',
    options: {
      layers: 'Zoning',
      format: 'image/png',
      transparent: true
    }
  },
  
  // Environmental Category
  {
    id: 'floodZones',
    name: 'FEMA Flood Zones',
    type: 'wms',
    url: 'https://gis.bentoncountywa.gov/arcgis/services/Planning/Flood/MapServer/WMSServer',
    attribution: '&copy; Benton County GIS, FEMA',
    opacity: 0.5,
    description: 'FEMA designated flood hazard areas showing 100-year and 500-year flood zones',
    dataSource: 'Federal Emergency Management Agency (FEMA)',
    category: 'Environmental',
    lastUpdated: 'September 2023',
    options: {
      layers: 'Flood',
      format: 'image/png',
      transparent: true
    }
  },
  {
    id: 'wetlands',
    name: 'Wetlands & Critical Areas',
    type: 'wms',
    url: 'https://gis.bentoncountywa.gov/arcgis/services/Planning/Wetlands/MapServer/WMSServer',
    attribution: '&copy; Benton County GIS, National Wetlands Inventory',
    opacity: 0.5,
    description: 'Protected wetlands, riparian corridors, and environmentally sensitive areas',
    dataSource: 'Benton County Planning Department, National Wetlands Inventory',
    category: 'Environmental',
    lastUpdated: 'January 2024',
    options: {
      layers: 'Wetlands',
      format: 'image/png',
      transparent: true
    }
  },
  
  // Administrative Category
  {
    id: 'schools',
    name: 'School Districts',
    type: 'wms',
    url: 'https://gis.bentoncountywa.gov/arcgis/services/Planning/SchoolDistricts/MapServer/WMSServer',
    attribution: '&copy; Benton County GIS',
    opacity: 0.5,
    description: 'School district boundaries and associated school locations',
    dataSource: 'Benton County, WA Office of Superintendent of Public Instruction',
    category: 'Administrative',
    lastUpdated: 'August 2023',
    options: {
      layers: 'SchoolDistricts',
      format: 'image/png',
      transparent: true
    }
  },
  
  // Imagery Category
  {
    id: 'aerials2021',
    name: '2021 Aerial Photography',
    type: 'wms',
    url: 'https://gis.bentoncountywa.gov/arcgis/services/Base/Aerials2021/MapServer/WMSServer',
    attribution: '&copy; Benton County GIS',
    opacity: 0.8,
    description: 'High-resolution aerial imagery from 2021 with 6-inch pixel resolution',
    dataSource: 'Benton County GIS, Pictometry International',
    category: 'Imagery',
    lastUpdated: 'July 2021',
    options: {
      layers: 'Aerials2021',
      format: 'image/png',
      transparent: false
    }
  }
];