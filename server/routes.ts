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
    res.json([
      { id: 1, name: 'Residential Model A', r2: 0.892, variables: 8, cov: 10.4, samples: 423, lastRun: '2024-03-30', type: 'multiple_regression' },
      { id: 2, name: 'Commercial Properties', r2: 0.815, variables: 6, cov: 12.7, samples: 156, lastRun: '2024-03-29', type: 'multiple_regression' },
      { id: 3, name: 'Agricultural Land', r2: 0.774, variables: 5, cov: 14.2, samples: 98, lastRun: '2024-03-27', type: 'spatial_regression' },
      { id: 4, name: 'Time Series Value Model', r2: 0.865, variables: 4, cov: 9.8, samples: 312, lastRun: '2024-03-25', type: 'time_series' },
      { id: 5, name: 'Neighborhood Factor Analysis', r2: 0.825, variables: 7, cov: 11.3, samples: 278, lastRun: '2024-03-22', type: 'geospatial' }
    ]);
  });
  
  // Get model variables by model ID
  app.get('/api/regression/models/:id/variables', (req, res) => {
    const modelId = parseInt(req.params.id);
    
    const variablesByModel = {
      1: [
        { name: 'squareFeet', coefficient: 105.82, tValue: 9.7, pValue: 0.00001, correlation: 0.84, included: true },
        { name: 'yearBuilt', coefficient: 524.34, tValue: 6.4, pValue: 0.00012, correlation: 0.72, included: true },
        { name: 'bathrooms', coefficient: 12500.00, tValue: 5.2, pValue: 0.00034, correlation: 0.68, included: true },
        { name: 'bedrooms', coefficient: 8750.00, tValue: 3.8, pValue: 0.00291, correlation: 0.64, included: true },
        { name: 'lotSize', coefficient: 2.15, tValue: 4.1, pValue: 0.00125, correlation: 0.59, included: true },
        { name: 'garageSpaces', coefficient: 9800.00, tValue: 3.2, pValue: 0.00427, correlation: 0.46, included: true },
        { name: 'hasBasement', coefficient: 15200.00, tValue: 2.9, pValue: 0.00621, correlation: 0.42, included: true },
        { name: 'hasPool', coefficient: 18500.00, tValue: 2.1, pValue: 0.03781, correlation: 0.35, included: false },
        { name: 'distanceToSchool', coefficient: -1250.00, tValue: -1.8, pValue: 0.07253, correlation: -0.32, included: false },
        { name: 'yearRenovated', coefficient: 210.45, tValue: 1.7, pValue: 0.09124, correlation: 0.28, included: false }
      ],
      2: [
        { name: 'buildingSize', coefficient: 87.45, tValue: 9.1, pValue: 0.00002, correlation: 0.82, included: true },
        { name: 'yearBuilt', coefficient: 850.23, tValue: 6.8, pValue: 0.00008, correlation: 0.74, included: true },
        { name: 'parkingSpaces', coefficient: 3500.00, tValue: 5.6, pValue: 0.00021, correlation: 0.69, included: true },
        { name: 'lotSize', coefficient: 1.85, tValue: 4.5, pValue: 0.00087, correlation: 0.63, included: true },
        { name: 'trafficCount', coefficient: 25.40, tValue: 3.7, pValue: 0.00243, correlation: 0.56, included: true },
        { name: 'distanceToCBD', coefficient: -4500.00, tValue: -3.2, pValue: 0.00389, correlation: -0.48, included: true },
        { name: 'cornerLocation', coefficient: 75000.00, tValue: 2.1, pValue: 0.03815, correlation: 0.36, included: false },
        { name: 'zoning', coefficient: 28000.00, tValue: 1.8, pValue: 0.07581, correlation: 0.33, included: false }
      ],
      3: [
        { name: 'acreage', coefficient: 2450.00, tValue: 8.7, pValue: 0.00003, correlation: 0.81, included: true },
        { name: 'soilQuality', coefficient: 18500.00, tValue: 6.9, pValue: 0.00007, correlation: 0.75, included: true },
        { name: 'irrigationAccess', coefficient: 35000.00, tValue: 5.8, pValue: 0.00018, correlation: 0.72, included: true },
        { name: 'roadFrontage', coefficient: 125.00, tValue: 4.2, pValue: 0.00098, correlation: 0.62, included: true },
        { name: 'distanceToMarket', coefficient: -85.00, tValue: -3.5, pValue: 0.00354, correlation: -0.49, included: true },
        { name: 'floodZone', coefficient: -12500.00, tValue: -2.2, pValue: 0.03124, correlation: -0.38, included: false },
        { name: 'landUseRestriction', coefficient: -8900.00, tValue: -1.9, pValue: 0.06213, correlation: -0.31, included: false }
      ],
      4: [
        { name: 'monthsSinceSale', coefficient: 950.00, tValue: 8.5, pValue: 0.00002, correlation: 0.83, included: true },
        { name: 'interestRate', coefficient: -22500.00, tValue: -6.3, pValue: 0.00014, correlation: -0.76, included: true },
        { name: 'unemploymentRate', coefficient: -8500.00, tValue: -4.8, pValue: 0.00057, correlation: -0.65, included: true },
        { name: 'medianIncomeChange', coefficient: 12500.00, tValue: 4.2, pValue: 0.00112, correlation: 0.58, included: true },
        { name: 'housingStarts', coefficient: 850.00, tValue: 2.3, pValue: 0.02687, correlation: 0.41, included: false },
        { name: 'inflationRate', coefficient: -5500.00, tValue: -1.9, pValue: 0.06124, correlation: -0.35, included: false }
      ],
      5: [
        { name: 'neighborhoodIndex', coefficient: 24500.00, tValue: 7.8, pValue: 0.00004, correlation: 0.77, included: true },
        { name: 'schoolScore', coefficient: 18500.00, tValue: 6.5, pValue: 0.00010, correlation: 0.73, included: true },
        { name: 'distanceToAmenities', coefficient: -2800.00, tValue: -5.7, pValue: 0.00023, correlation: -0.68, included: true },
        { name: 'walkabilityScore', coefficient: 6500.00, tValue: 5.3, pValue: 0.00031, correlation: 0.65, included: true },
        { name: 'transitAccess', coefficient: 4200.00, tValue: 4.1, pValue: 0.00120, correlation: 0.57, included: true },
        { name: 'crimeRate', coefficient: -15000.00, tValue: -3.8, pValue: 0.00234, correlation: -0.54, included: true },
        { name: 'parkProximity', coefficient: 8200.00, tValue: 2.1, pValue: 0.03567, correlation: 0.38, included: true },
        { name: 'noiseLevel', coefficient: -3500.00, tValue: -1.8, pValue: 0.07342, correlation: -0.29, included: false }
      ]
    };
    
    // Return the variables for the requested model, or an empty array if model not found
    res.json(variablesByModel[modelId as keyof typeof variablesByModel] || []);
  });
  
  // Get model predictions
  app.get('/api/regression/models/:id/predictions', (req, res) => {
    const modelId = parseInt(req.params.id);
    
    // Generate realistic prediction data with actual vs predicted values
    const predictions = Array.from({ length: 40 }, (_, i) => {
      const actualValue = 200000 + Math.random() * 400000;
      const error = (Math.random() * 0.2 - 0.1) * actualValue; // ±10% error
      const predictedValue = actualValue + error;
      return {
        id: i + 1,
        actualValue: Math.round(actualValue),
        predictedValue: Math.round(predictedValue),
        absoluteError: Math.round(Math.abs(error)),
        percentError: Math.round(Math.abs(error / actualValue * 100) * 10) / 10,
        parcelId: `P${100000 + i}`,
        address: `${1000 + i} Sample St, Benton County, WA`
      };
    });
    
    res.json(predictions);
  });
  
  // Get model diagnostics
  app.get('/api/regression/models/:id/diagnostics', (req, res) => {
    const modelId = parseInt(req.params.id);
    
    // Generate histogram data for residuals
    const residualBins = [
      { bin: '-30% to -25%', count: Math.floor(Math.random() * 5) },
      { bin: '-25% to -20%', count: Math.floor(Math.random() * 8) },
      { bin: '-20% to -15%', count: Math.floor(Math.random() * 12) },
      { bin: '-15% to -10%', count: Math.floor(Math.random() * 18) },
      { bin: '-10% to -5%', count: Math.floor(Math.random() * 25) + 10 },
      { bin: '-5% to 0%', count: Math.floor(Math.random() * 30) + 25 },
      { bin: '0% to 5%', count: Math.floor(Math.random() * 30) + 25 },
      { bin: '5% to 10%', count: Math.floor(Math.random() * 25) + 10 },
      { bin: '10% to 15%', count: Math.floor(Math.random() * 18) },
      { bin: '15% to 20%', count: Math.floor(Math.random() * 12) },
      { bin: '20% to 25%', count: Math.floor(Math.random() * 8) },
      { bin: '25% to 30%', count: Math.floor(Math.random() * 5) }
    ];
    
    // Generate scatter plot data (predicted vs actual)
    const scatterData = Array.from({ length: 50 }, () => {
      const actual = 200000 + Math.random() * 400000;
      const error = (Math.random() * 0.2 - 0.1) * actual; // ±10% error
      return {
        actual: Math.round(actual),
        predicted: Math.round(actual + error)
      };
    });
    
    // Model metrics
    const metrics = {
      r2: 0.75 + Math.random() * 0.15,
      adjustedR2: 0.73 + Math.random() * 0.15,
      standardError: 25000 + Math.random() * 15000,
      observations: 180 + Math.floor(Math.random() * 70),
      fStatistic: 45 + Math.random() * 25,
      pValue: 0.00001 + Math.random() * 0.0001,
      akaike: 2500 + Math.random() * 500,
      cov: 8 + Math.random() * 7,
      prd: 0.95 + Math.random() * 0.1
    };
    
    res.json({
      residualHistogram: residualBins,
      scatterPlot: scatterData,
      metrics: metrics
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
