import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for property data
  app.get('/api/properties', (req, res) => {
    res.json({
      properties: [
        { id: '1', parcelId: '10425-01-29', address: '123 Main St', owner: 'Smith, John', value: '$375,000', squareFeet: 2300, yearBuilt: 2005 },
        { id: '2', parcelId: '10425-02-13', address: '456 Oak Ave', owner: 'Johnson, Lisa', value: '$425,000', squareFeet: 3150, yearBuilt: 2010 },
        { id: '3', parcelId: '10426-05-02', address: '789 Pine Rd', owner: 'Garcia, Maria', value: '$295,000', squareFeet: 1320, yearBuilt: 1998 },
        { id: '4', parcelId: '10427-01-15', address: '321 Elm St', owner: 'Taylor, Robert', value: '$512,000', squareFeet: 4200, yearBuilt: 2015 },
        { id: '5', parcelId: '10427-03-08', address: '555 Cedar Ln', owner: 'Wilson, Sarah', value: '$335,000', squareFeet: 1650, yearBuilt: 2002 }
      ]
    });
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
