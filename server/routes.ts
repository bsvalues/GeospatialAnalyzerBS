import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for property data
  app.get('/api/properties', (req, res) => {
    // Return properties in Benton County, Washington area with coordinates
    res.json([
      {
        id: '1',
        parcelId: 'P123456',
        address: '123 Main St, Richland, WA',
        owner: 'John Doe',
        value: '450000',
        squareFeet: 2500,
        yearBuilt: 1998,
        landValue: '120000',
        coordinates: [46.2804, -119.2752]
      },
      {
        id: '2',
        parcelId: 'P789012',
        address: '456 Oak Ave, Kennewick, WA',
        owner: 'Jane Smith',
        value: '375000',
        squareFeet: 2100,
        yearBuilt: 2004,
        landValue: '95000',
        coordinates: [46.2087, -119.1361]
      },
      {
        id: '3',
        parcelId: 'P345678',
        address: '789 Pine Ln, Pasco, WA',
        owner: 'Robert Johnson',
        value: '525000',
        squareFeet: 3200,
        yearBuilt: 2012,
        landValue: '150000',
        coordinates: [46.2395, -119.1005]
      },
      {
        id: '4',
        parcelId: 'P901234',
        address: '321 Cedar Dr, Richland, WA',
        owner: 'Mary Williams',
        value: '625000',
        squareFeet: 3800,
        yearBuilt: 2015,
        landValue: '180000',
        coordinates: [46.2933, -119.2871]
      },
      {
        id: '5',
        parcelId: 'P567890',
        address: '987 Maple St, Kennewick, WA',
        owner: 'David Brown',
        value: '395000',
        squareFeet: 2300,
        yearBuilt: 2001,
        landValue: '110000',
        coordinates: [46.2118, -119.1667]
      }
    ]);
  });

  // API route for project overview data
  app.get('/api/project', (req, res) => {
    res.json({
      id: 'p1',
      name: 'Benton County Assessment 2024',
      year: '2024',
      metrics: {
        activeLayers: 8,
        savedLocations: 14,
        activeScripts: 6,
        sqlQueries: 8,
        modelR2: 0.892,
        prdValue: 1.02
      },
      records: {
        properties: 1250,
        sales: 523,
        models: 8,
        analyses: 438
      }
    });
  });

  // API routes for map layers
  app.get('/api/layers', (req, res) => {
    res.json({
      baseLayers: [
        { id: 'imagery', name: 'Imagery', type: 'base', checked: true },
        { id: 'street', name: 'Street Map', type: 'base', checked: true },
        { id: 'topo', name: 'Topo', type: 'base', checked: false },
        { id: 'flood', name: 'FEMA Flood', type: 'base', checked: false },
        { id: 'usgs', name: 'USGS Imagery', type: 'base', checked: false }
      ],
      viewableLayers: [
        { id: 'parcels', name: 'Parcels', type: 'viewable', checked: true },
        { id: 'shortplats', name: 'Short Plats', type: 'viewable', checked: false },
        { id: 'longplats', name: 'Long Plats', type: 'viewable', checked: false },
        { id: 'flood', name: 'Flood Zones', type: 'viewable', checked: false },
        { id: 'welllogs', name: 'Well Logs', type: 'viewable', checked: false },
        { id: 'zoning', name: 'Zoning', type: 'viewable', checked: false }
      ]
    });
  });

  // API routes for script data
  app.get('/api/scripts', (req, res) => {
    res.json({
      scriptGroups: [
        { id: 'data-review', name: 'Data Review', active: false },
        { id: 'sales-review', name: 'Sales Review', active: false },
        { id: 'modeling-prep', name: 'Modeling Prep', active: true },
        { id: 'regression-analysis', name: 'Regression Analysis', active: false },
        { id: 'comparable-analysis', name: 'Comparable Analysis', active: false }
      ],
      scriptSteps: [
        { id: 'compute-bppsf', name: 'Compute BPPSF', status: 'complete', type: 'compute' },
        { id: 'compute-useablesale', name: 'Compute UseableSale', status: 'complete', type: 'compute' },
        { id: 'compute-sizerange', name: 'Compute SIZERANGE', status: 'active', type: 'compute' },
        { id: 'compute-outliertag', name: 'Compute OutlierTag', status: 'pending', type: 'compute' },
        { id: 'group-by-neighborhood', name: 'Group By Neighborhood', status: 'pending', type: 'group' }
      ],
      sqlQueries: [
        { id: 'prop-data', name: 'Prop Data SQL' },
        { id: 'property', name: 'Property' },
        { id: 'permits', name: 'Permits' },
        { id: 'land', name: 'Land' }
      ]
    });
  });

  // API routes for regression models
  app.get('/api/regression/models', (req, res) => {
    res.json({
      models: [
        { id: 1, name: 'Residential Model A', r2: 0.892, variables: 8, cov: 10.4, samples: 423, lastRun: 'Today, 11:42 AM' },
        { id: 2, name: 'Commercial Properties', r2: 0.815, variables: 6, cov: 12.7, samples: 156, lastRun: 'Yesterday, 2:15 PM' },
        { id: 3, name: 'Agricultural Land', r2: 0.774, variables: 5, cov: 14.2, samples: 98, lastRun: '3 days ago' }
      ]
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
