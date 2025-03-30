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
  
  // API routes for property valuations with historical data for visualization
  app.get('/api/valuations', (req, res) => {
    // Filter parameters
    const neighborhood = req.query.neighborhood as string;
    const yearBuilt = req.query.yearBuilt as string;
    
    const valuationData = [
      {
        id: '1',
        parcelId: 'P123456',
        address: '123 Main St, Richland, WA',
        neighborhood: 'Central Richland',
        yearBuilt: 1998,
        squareFeet: 2500,
        valuationHistory: [
          { year: 2020, assessed: 380000, market: 390000, landValue: 100000, improvementValue: 280000 },
          { year: 2021, assessed: 405000, market: 415000, landValue: 105000, improvementValue: 300000 },
          { year: 2022, assessed: 430000, market: 445000, landValue: 112000, improvementValue: 318000 },
          { year: 2023, assessed: 442000, market: 465000, landValue: 118000, improvementValue: 324000 },
          { year: 2024, assessed: 450000, market: 480000, landValue: 120000, improvementValue: 330000 }
        ],
        salesHistory: [
          { date: '2015-06-12', price: 320000 },
          { date: '2009-03-28', price: 255000 }
        ]
      },
      {
        id: '2',
        parcelId: 'P789012',
        address: '456 Oak Ave, Kennewick, WA',
        neighborhood: 'South Kennewick',
        yearBuilt: 2004,
        squareFeet: 2100,
        valuationHistory: [
          { year: 2020, assessed: 325000, market: 335000, landValue: 85000, improvementValue: 240000 },
          { year: 2021, assessed: 340000, market: 355000, landValue: 88000, improvementValue: 252000 },
          { year: 2022, assessed: 360000, market: 370000, landValue: 92000, improvementValue: 268000 },
          { year: 2023, assessed: 368000, market: 380000, landValue: 94000, improvementValue: 274000 },
          { year: 2024, assessed: 375000, market: 390000, landValue: 95000, improvementValue: 280000 }
        ],
        salesHistory: [
          { date: '2018-09-05', price: 310000 },
          { date: '2004-11-15', price: 210000 }
        ]
      },
      {
        id: '3',
        parcelId: 'P345678',
        address: '789 Pine Ln, Pasco, WA',
        neighborhood: 'East Pasco',
        yearBuilt: 2012,
        squareFeet: 3200,
        valuationHistory: [
          { year: 2020, assessed: 480000, market: 490000, landValue: 130000, improvementValue: 350000 },
          { year: 2021, assessed: 495000, market: 505000, landValue: 135000, improvementValue: 360000 },
          { year: 2022, assessed: 510000, market: 520000, landValue: 142000, improvementValue: 368000 },
          { year: 2023, assessed: 518000, market: 535000, landValue: 148000, improvementValue: 370000 },
          { year: 2024, assessed: 525000, market: 545000, landValue: 150000, improvementValue: 375000 }
        ],
        salesHistory: [
          { date: '2016-05-18', price: 455000 }
        ]
      },
      {
        id: '4',
        parcelId: 'P901234',
        address: '321 Cedar Dr, Richland, WA',
        neighborhood: 'North Richland',
        yearBuilt: 2015,
        squareFeet: 3800,
        valuationHistory: [
          { year: 2020, assessed: 575000, market: 590000, landValue: 160000, improvementValue: 415000 },
          { year: 2021, assessed: 595000, market: 610000, landValue: 165000, improvementValue: 430000 },
          { year: 2022, assessed: 610000, market: 625000, landValue: 172000, improvementValue: 438000 },
          { year: 2023, assessed: 618000, market: 650000, landValue: 178000, improvementValue: 440000 },
          { year: 2024, assessed: 625000, market: 665000, landValue: 180000, improvementValue: 445000 }
        ],
        salesHistory: [
          { date: '2019-08-22', price: 580000 },
          { date: '2015-02-10', price: 510000 }
        ]
      },
      {
        id: '5',
        parcelId: 'P567890',
        address: '987 Maple St, Kennewick, WA',
        neighborhood: 'West Kennewick',
        yearBuilt: 2001,
        squareFeet: 2300,
        valuationHistory: [
          { year: 2020, assessed: 345000, market: 355000, landValue: 95000, improvementValue: 250000 },
          { year: 2021, assessed: 360000, market: 370000, landValue: 100000, improvementValue: 260000 },
          { year: 2022, assessed: 375000, market: 385000, landValue: 105000, improvementValue: 270000 },
          { year: 2023, assessed: 385000, market: 395000, landValue: 108000, improvementValue: 277000 },
          { year: 2024, assessed: 395000, market: 408000, landValue: 110000, improvementValue: 285000 }
        ],
        salesHistory: [
          { date: '2017-07-03', price: 330000 },
          { date: '2008-04-19', price: 260000 }
        ]
      },
      {
        id: '6',
        parcelId: 'P112233',
        address: '555 Birch Blvd, Richland, WA',
        neighborhood: 'Central Richland',
        yearBuilt: 1995,
        squareFeet: 2800,
        valuationHistory: [
          { year: 2020, assessed: 405000, market: 415000, landValue: 110000, improvementValue: 295000 },
          { year: 2021, assessed: 420000, market: 435000, landValue: 115000, improvementValue: 305000 },
          { year: 2022, assessed: 440000, market: 455000, landValue: 120000, improvementValue: 320000 },
          { year: 2023, assessed: 465000, market: 480000, landValue: 125000, improvementValue: 340000 },
          { year: 2024, assessed: 485000, market: 500000, landValue: 130000, improvementValue: 355000 }
        ],
        salesHistory: [
          { date: '2014-09-10', price: 350000 },
          { date: '2005-05-22', price: 268000 }
        ]
      },
      {
        id: '7',
        parcelId: 'P445566',
        address: '222 Elm Way, Pasco, WA',
        neighborhood: 'West Pasco',
        yearBuilt: 2008,
        squareFeet: 2400,
        valuationHistory: [
          { year: 2020, assessed: 365000, market: 375000, landValue: 100000, improvementValue: 265000 },
          { year: 2021, assessed: 380000, market: 395000, landValue: 105000, improvementValue: 275000 },
          { year: 2022, assessed: 395000, market: 410000, landValue: 110000, improvementValue: 285000 },
          { year: 2023, assessed: 420000, market: 435000, landValue: 115000, improvementValue: 305000 },
          { year: 2024, assessed: 440000, market: 455000, landValue: 120000, improvementValue: 320000 }
        ],
        salesHistory: [
          { date: '2015-11-20', price: 340000 }
        ]
      }
    ];
    
    // Filter by neighborhood if specified
    let filteredData = valuationData;
    if (neighborhood) {
      filteredData = filteredData.filter(item => 
        item.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
      );
    }
    
    // Filter by year built if specified
    if (yearBuilt) {
      const yearBuiltNum = parseInt(yearBuilt);
      if (!isNaN(yearBuiltNum)) {
        filteredData = filteredData.filter(item => item.yearBuilt >= yearBuiltNum);
      }
    }
    
    res.json(filteredData);
  });

  const httpServer = createServer(app);

  return httpServer;
}
