import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  isOpenAIConfigured,
  analyzeDataQuality,
  generateCodeFromLanguage,
  optimizeCode,
  debugCode,
  generateContextualPropertyPrediction,
  getETLAssistance,
  getETLOnboardingTips,
  generateConnectionTroubleshooting
} from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for accessing whitelisted environment variables
  app.get('/api/config', (req, res) => {
    // Only expose whitelisted environment variables
    const clientConfig = {
      // API keys
      hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
      hasOpenAIKey: isOpenAIConfigured()
    };
    
    res.json(clientConfig);
  });
  
  // API route to proxy Google Maps Extractor API requests
  app.post('/api/maps/query-locate', async (req, res) => {
    try {
      const { query, country, language } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Missing required parameter: query' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Build query string
      const params = new URLSearchParams();
      params.append('query', query);
      params.append('country', country || 'us');
      params.append('language', language || 'en');
      
      const url = `https://google-maps-extractor2.p.rapidapi.com/query_locate?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'google-maps-extractor2.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from Google Maps API:', error);
      res.status(500).json({ error: 'Failed to fetch location data from Google Maps' });
    }
  });
  
  // API route to proxy Zillow API property details
  app.post('/api/zillow/property-data', async (req, res) => {
    try {
      const { zpid, data: dataType } = req.body;
      
      if (!zpid) {
        return res.status(400).json({ error: 'Missing required parameter: zpid' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Use the Realty in US API for property details
      const url = `https://realty-in-us.p.rapidapi.com/properties/v3/detail?zpid=${zpid}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch property data from Zillow' });
    }
  });
  
  // API route to proxy Zillow property search
  app.post('/api/zillow/search', async (req, res) => {
    try {
      const { location, price_min, price_max, beds_min, baths_min, home_types, searchType, page } = req.body;
      
      if (!location) {
        return res.status(400).json({ error: 'Missing required parameter: location' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Build query string
      const params = new URLSearchParams();
      params.append('location', location);
      if (searchType) params.append('searchType', searchType || 'forsale');
      if (page) params.append('page', page.toString());
      if (price_min) params.append('price_min', price_min.toString());
      if (price_max) params.append('price_max', price_max.toString());
      if (beds_min) params.append('beds_min', beds_min.toString());
      if (baths_min) params.append('baths_min', baths_min.toString());
      if (home_types) params.append('home_type', home_types);
      
      const url = `https://realty-in-us.p.rapidapi.com/properties/v2/list-for-sale?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error searching properties from Zillow API:', error);
      res.status(500).json({ error: 'Failed to search properties from Zillow' });
    }
  });
  
  // API route to get similar homes
  app.post('/api/zillow/similar-homes', async (req, res) => {
    try {
      const { property_id } = req.body;
      
      if (!property_id) {
        return res.status(400).json({ error: 'Missing required parameter: property_id' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      const url = `https://realty-in-us.p.rapidapi.com/properties/v2/list-similar-homes?property_id=${property_id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching similar homes from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch similar homes' });
    }
  });
  
  // API route to get similar rental homes
  app.post('/api/zillow/similar-rentals', async (req, res) => {
    try {
      const { postal_code, property_id } = req.body;
      
      if (!postal_code || !property_id) {
        return res.status(400).json({ error: 'Missing required parameters: postal_code and property_id' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      const url = `https://realty-in-us.p.rapidapi.com/properties/v2/list-similar-rental-homes?postal_code=${postal_code}&property_id=${property_id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching similar rental homes from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch similar rental homes' });
    }
  });
  
  // API route to check mortgage rates
  app.post('/api/zillow/mortgage-rates', async (req, res) => {
    try {
      const { 
        creditScore, 
        points, 
        loanPurpose, 
        loanTypes, 
        loanPercent, 
        propertyPrice, 
        zip 
      } = req.body;
      
      if (!creditScore || !propertyPrice || !zip) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Build query string
      const params = new URLSearchParams();
      params.append('creditScore', creditScore);
      params.append('points', points || 'all');
      params.append('loanPurpose', loanPurpose || 'purchase');
      params.append('loanTypes', loanTypes || 'ALL');
      params.append('loanPercent', loanPercent || '80');
      params.append('propertyPrice', propertyPrice);
      params.append('zip', zip);
      
      const url = `https://realty-in-us.p.rapidapi.com/mortgage/check-rates?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching mortgage rates from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch mortgage rates' });
    }
  });
  // Sample property data (simulating database)
  const properties = [
    {
      id: '1',
      parcelId: 'P123456',
      address: '123 Main St, Richland, WA',
      owner: 'John Doe',
      value: '450000',
      squareFeet: 2500,
      yearBuilt: 1998,
      landValue: '120000',
      coordinates: [46.2804, -119.2752],
      neighborhood: 'North Richland',
      bedrooms: 3,
      bathrooms: 2.5,
      lotSize: 8500
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
      coordinates: [46.2087, -119.1361],
      neighborhood: 'South Kennewick',
      bedrooms: 3,
      bathrooms: 2,
      lotSize: 7200
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
      coordinates: [46.2395, -119.1005],
      neighborhood: 'East Pasco',
      bedrooms: 4,
      bathrooms: 3,
      lotSize: 9800
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
      coordinates: [46.2933, -119.2871],
      neighborhood: 'North Richland',
      bedrooms: 4,
      bathrooms: 3.5,
      lotSize: 12000
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
      coordinates: [46.2118, -119.1667],
      neighborhood: 'Central Kennewick',
      bedrooms: 3,
      bathrooms: 2,
      lotSize: 8100
    },
    {
      id: '6',
      parcelId: 'P246810',
      address: '654 Birch Rd, Richland, WA',
      owner: 'Sarah Miller',
      value: '480000',
      squareFeet: 2800,
      yearBuilt: 2008,
      landValue: '135000',
      coordinates: [46.2766, -119.2834],
      neighborhood: 'West Richland',
      bedrooms: 4,
      bathrooms: 2.5,
      lotSize: 9000
    },
    {
      id: '7',
      parcelId: 'P135790',
      address: '852 Elm St, Kennewick, WA',
      owner: 'Michael Wilson',
      value: '350000',
      squareFeet: 1950,
      yearBuilt: 1995,
      landValue: '90000',
      coordinates: [46.2055, -119.1532],
      neighborhood: 'South Kennewick',
      bedrooms: 3,
      bathrooms: 1.5,
      lotSize: 7000
    },
    {
      id: '8',
      parcelId: 'P802468',
      address: '159 Spruce Ave, Pasco, WA',
      owner: 'Lisa Anderson',
      value: '420000',
      squareFeet: 2400,
      yearBuilt: 2005,
      landValue: '115000',
      coordinates: [46.2412, -119.0903],
      neighborhood: 'West Pasco',
      bedrooms: 3,
      bathrooms: 2,
      lotSize: 8200
    }
  ];

  // API routes for property data
  
  // Get all properties
  app.get('/api/properties', async (req, res) => {
    try {
      // Get filter parameters from query string
      const minYearBuilt = req.query.minYearBuilt ? parseInt(req.query.minYearBuilt as string) : undefined;
      const maxYearBuilt = req.query.maxYearBuilt ? parseInt(req.query.maxYearBuilt as string) : undefined;
      const minValue = req.query.minValue ? parseInt(req.query.minValue as string) : undefined;
      const maxValue = req.query.maxValue ? parseInt(req.query.maxValue as string) : undefined;
      const minSquareFeet = req.query.minSquareFeet ? parseInt(req.query.minSquareFeet as string) : undefined;
      const maxSquareFeet = req.query.maxSquareFeet ? parseInt(req.query.maxSquareFeet as string) : undefined;
      const propertyType = req.query.propertyType as string | undefined;
      const neighborhood = req.query.neighborhood as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      // Get filtered properties from storage
      const properties = await storage.getPropertiesByFilter({
        minYearBuilt,
        maxYearBuilt,
        minValue,
        maxValue,
        minSquareFeet,
        maxSquareFeet,
        propertyType,
        neighborhood,
        sortBy,
        sortOrder,
        limit,
        offset
      });
      
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  });
  
  // Get a single property by ID
  app.get('/api/properties/:id', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: 'Invalid property ID' });
      }
      
      const property = await storage.getPropertyById(propertyId);
      
      if (property) {
        res.json(property);
      } else {
        res.status(404).json({ error: 'Property not found' });
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({ error: 'Failed to fetch property' });
    }
  });
  
  // Search properties by text
  app.get('/api/properties/search', async (req, res) => {
    try {
      const searchText = req.query.q as string || '';
      
      if (!searchText) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const properties = await storage.searchProperties(searchText);
      res.json(properties);
    } catch (error) {
      console.error('Error searching properties:', error);
      res.status(500).json({ error: 'Failed to search properties' });
    }
  });
  
  // Find similar properties
  app.get('/api/properties/similar/:id', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: 'Invalid property ID' });
      }
      
      // Get the reference property
      const referenceProperty = await storage.getPropertyById(propertyId);
      
      if (!referenceProperty) {
        return res.status(404).json({ error: 'Reference property not found' });
      }
      
      // Get all properties
      const allProperties = await storage.getProperties();
      
      // Calculate similarity scores
      const similarProperties = allProperties
        .filter(p => p.id !== propertyId) // Exclude the reference property
        .map(property => {
          // Calculate similarity based on weighted factors
          let similarityScore = 0;
          
          // Factor: Square footage (30% weight)
          const sqftDiff = Math.abs(property.squareFeet - referenceProperty.squareFeet);
          const sqftSimilarity = Math.max(0, 1 - (sqftDiff / 2000)); // Normalize to 0-1
          similarityScore += sqftSimilarity * 0.3;
          
          // Factor: Year built (20% weight)
          if (property.yearBuilt && referenceProperty.yearBuilt) {
            const yearDiff = Math.abs(property.yearBuilt - referenceProperty.yearBuilt);
            const yearSimilarity = Math.max(0, 1 - (yearDiff / 50)); // Normalize to 0-1
            similarityScore += yearSimilarity * 0.2;
          }
          
          // Factor: Neighborhood (30% weight)
          if (property.neighborhood && referenceProperty.neighborhood) {
            const neighborhoodSimilarity = property.neighborhood === referenceProperty.neighborhood ? 1 : 0;
            similarityScore += neighborhoodSimilarity * 0.3;
          }
          
          // Factor: Property type (10% weight)
          if (property.propertyType && referenceProperty.propertyType) {
            const propertyTypeSimilarity = property.propertyType === referenceProperty.propertyType ? 1 : 0;
            similarityScore += propertyTypeSimilarity * 0.1;
          }
          
          // Factor: Value (10% weight)
          if (property.value && referenceProperty.value) {
            const propertyValue = parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
            const referenceValue = parseFloat(referenceProperty.value.replace(/[^0-9.-]+/g, ''));
            const valueDiff = Math.abs(propertyValue - referenceValue);
            const valueSimilarity = Math.max(0, 1 - (valueDiff / 500000)); // Normalize to 0-1
            similarityScore += valueSimilarity * 0.1;
          }
          
          return { ...property, similarityScore };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore) // Sort by similarity (descending)
        .slice(0, limit); // Limit the number of results
      
      res.json(similarProperties.map(({ similarityScore, ...property }) => property));
    } catch (error) {
      console.error('Error finding similar properties:', error);
      res.status(500).json({ error: 'Failed to find similar properties' });
    }
  });
  
  // Find properties within a geographic region
  app.get('/api/properties/region', async (req, res) => {
    try {
      const south = parseFloat(req.query.south as string);
      const west = parseFloat(req.query.west as string);
      const north = parseFloat(req.query.north as string);
      const east = parseFloat(req.query.east as string);
      
      if (isNaN(south) || isNaN(west) || isNaN(north) || isNaN(east)) {
        return res.status(400).json({ error: 'Invalid bounds parameters' });
      }
      
      const properties = await storage.getPropertiesInRegion([south, west, north, east]);
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties in region:', error);
      res.status(500).json({ error: 'Failed to fetch properties in region' });
    }
  });
  
  // Import properties from CSV
  app.post('/api/properties/import', async (req, res) => {
    try {
      const { properties } = req.body;
      
      if (!Array.isArray(properties) || properties.length === 0) {
        return res.status(400).json({ 
          success: false, 
          imported: 0, 
          errors: [{ message: 'No valid properties provided' }] 
        });
      }
      
      // Track successes and errors
      const results = {
        success: true,
        imported: 0,
        errors: [] as any[]
      };
      
      // Process each property
      for (const propertyData of properties) {
        try {
          // Validate required fields
          if (!propertyData.parcelId || !propertyData.address) {
            results.errors.push({
              property: propertyData,
              message: 'Missing required fields: parcelId and address'
            });
            continue;
          }
          
          // Create the property
          await storage.createProperty(propertyData);
          results.imported++;
        } catch (error: any) {
          console.error('Error importing property:', error);
          results.errors.push({
            property: propertyData,
            message: error.message || 'Failed to import property'
          });
        }
      }
      
      // If we have any errors, mark the overall operation as partially successful
      if (results.errors.length > 0) {
        results.success = results.imported > 0;
      }
      
      res.json(results);
    } catch (error: any) {
      console.error('Error importing properties:', error);
      res.status(500).json({ 
        success: false, 
        imported: 0, 
        errors: [{ message: error.message || 'Failed to import properties' }] 
      });
    }
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
  
  // Income approach functionality was removed

  // OpenAI powered natural language scripting routes
  
  // Generate JavaScript code from natural language
  app.post('/api/ai/generate-code', async (req, res) => {
    try {
      const { naturalLanguage, context } = req.body;
      
      if (!naturalLanguage) {
        return res.status(400).json({ error: 'Missing required parameter: naturalLanguage' });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' });
      }
      
      const result = await generateCodeFromLanguage(naturalLanguage, context);
      res.json(result);
    } catch (error) {
      console.error('Error generating code from natural language:', error);
      res.status(500).json({ error: 'Failed to generate code from natural language' });
    }
  });
  
  // Optimize JavaScript code
  app.post('/api/ai/optimize-code', async (req, res) => {
    try {
      const { code, instructions } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Missing required parameter: code' });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' });
      }
      
      const result = await optimizeCode(code, instructions);
      res.json(result);
    } catch (error) {
      console.error('Error optimizing code:', error);
      res.status(500).json({ error: 'Failed to optimize code' });
    }
  });
  
  // Debug JavaScript code
  app.post('/api/ai/debug-code', async (req, res) => {
    try {
      const { code, errorMessage } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Missing required parameter: code' });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' });
      }
      
      const result = await debugCode(code, errorMessage);
      res.json(result);
    } catch (error) {
      console.error('Error debugging code:', error);
      res.status(500).json({ error: 'Failed to debug code' });
    }
  });
  
  // ML-powered contextual property prediction
  app.post('/api/ml/contextual-prediction', async (req, res) => {
    try {
      const { property, context, mlPrediction, comparableProperties, includeExplanation } = req.body;
      
      if (!property || !context || !mlPrediction) {
        return res.status(400).json({ 
          error: 'Missing required parameters: property, context, and mlPrediction are required' 
        });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ 
          error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' 
        });
      }
      
      const result = await generateContextualPropertyPrediction(
        property, 
        context, 
        parseFloat(mlPrediction), 
        comparableProperties || []
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error generating contextual property prediction:', error);
      res.status(500).json({ error: 'Failed to generate contextual property prediction' });
    }
  });

  // AI-powered ETL Assistant endpoints
  
  // Get ETL assistance based on user interaction context
  app.post('/api/etl/assistant', async (req, res) => {
    try {
      const { context, dataSources, userExperience, previousInteractions } = req.body;
      
      if (!context || !context.page) {
        return res.status(400).json({ 
          error: 'Missing required parameter: context.page' 
        });
      }
      
      // We don't need to check if OpenAI is configured anymore as our implementation now handles this gracefully
      // with fallback responses in the getETLAssistance function
      
      try {
        const result = await getETLAssistance(
          context,
          dataSources || [],
          userExperience || 'beginner',
          previousInteractions || []
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error in ETL assistant:', error);
        
        // Return a user-friendly fallback response instead of an error
        res.json({
          message: "AI assistance is currently running in offline mode. Basic guidance is still available.",
          tips: [
            "You can continue using the ETL features with standard functionality.",
            "The system uses predefined guidance when AI assistance is unavailable.",
            "Try selecting specific data sources to get contextual tips about them."
          ],
          suggestedActions: [
            { 
              label: "Continue",
              description: "Proceed with basic assistance",
              action: "continue"
            },
            {
              label: "Learn ETL Basics",
              description: "Read documentation on ETL concepts",
              action: "learn_etl"
            }
          ],
          isFallbackMode: true
        });
      }
    } catch (error) {
      console.error('Error generating ETL assistance:', error);
      res.status(500).json({ 
        error: 'Failed to generate ETL assistance',
        message: "ETL Assistant is experiencing technical difficulties. Basic functionality is still available."
      });
    }
  });
  
  // Get ETL onboarding tips for specific features
  app.post('/api/etl/onboarding-tips', async (req, res) => {
    try {
      const { feature, userExperience } = req.body;
      
      if (!feature) {
        return res.status(400).json({ 
          error: 'Missing required parameter: feature' 
        });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ 
          error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' 
        });
      }
      
      const validFeatures = ['data_sources', 'transformation_rules', 'jobs', 'optimization', 'general'];
      
      if (!validFeatures.includes(feature)) {
        return res.status(400).json({
          error: `Invalid feature. Must be one of: ${validFeatures.join(', ')}`
        });
      }
      
      const result = await getETLOnboardingTips(
        feature as any,
        userExperience || 'beginner'
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error generating ETL onboarding tips:', error);
      res.status(500).json({ error: 'Failed to generate ETL onboarding tips' });
    }
  });
  
  // Generate connection troubleshooting suggestions
  app.post('/api/etl/connection-troubleshooting', async (req, res) => {
    try {
      const { dataSource, errorMessage } = req.body;
      
      if (!dataSource || !errorMessage) {
        return res.status(400).json({ 
          error: 'Missing required parameters: dataSource and errorMessage' 
        });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ 
          error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' 
        });
      }
      
      const result = await generateConnectionTroubleshooting(
        dataSource,
        errorMessage
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error generating connection troubleshooting suggestions:', error);
      res.status(500).json({ error: 'Failed to generate connection troubleshooting suggestions' });
    }
  });

  // ETL Data Sources endpoints
  app.get('/api/etl/data-sources', async (req, res) => {
    try {
      const dataSources = await storage.getEtlDataSources();
      res.json(dataSources);
    } catch (error: any) {
      console.error('Error fetching ETL data sources:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL data sources' });
    }
  });

  app.get('/api/etl/data-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      res.json(dataSource);
    } catch (error: any) {
      console.error('Error fetching ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL data source' });
    }
  });

  app.post('/api/etl/data-sources', async (req, res) => {
    try {
      const dataSource = req.body;
      const newDataSource = await storage.createEtlDataSource(dataSource);
      res.status(201).json(newDataSource);
    } catch (error: any) {
      console.error('Error creating ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to create ETL data source' });
    }
  });

  app.put('/api/etl/data-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = req.body;
      const updatedDataSource = await storage.updateEtlDataSource(id, dataSource);
      
      if (!updatedDataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      res.json(updatedDataSource);
    } catch (error: any) {
      console.error('Error updating ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to update ETL data source' });
    }
  });

  app.delete('/api/etl/data-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const success = await storage.deleteEtlDataSource(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to delete ETL data source' });
    }
  });
  
  // Data preview endpoint for ETL data sources
  app.get('/api/etl/data-sources/:id/preview', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      // This would normally connect to the actual data source and pull a sample
      // For demo purposes, we're generating sample data based on the data source type
      
      let previewData: {
        columns: string[];
        rows: any[][];
        totalRows: number;
      };
      
      // Generate different sample data based on the type of data source
      switch (dataSource.type) {
        case 'postgres':
        case 'mysql':
          previewData = {
            columns: ['id', 'property_id', 'address', 'value', 'last_updated'],
            rows: [
              [1, 1001, '123 Main St', 349000, '2023-01-15'],
              [2, 1002, '456 Oak Ave', 425000, '2023-01-16'],
              [3, 1003, '789 Pine Rd', 512000, '2023-01-17'],
              [4, 1004, '321 Cedar Ln', 275000, '2023-01-18'],
              [5, 1005, '654 Maple Dr', 590000, '2023-01-19'],
            ],
            totalRows: 5000 // In a real implementation, this would be the actual count
          };
          break;
          
        case 'api':
          previewData = {
            columns: ['id', 'parcel_id', 'location', 'assessed_value', 'tax_year', 'land_size'],
            rows: [
              ['A1', 'P-10023', { lat: 46.23, lng: -119.51 }, 280000, 2023, 0.25],
              ['A2', 'P-10024', { lat: 46.24, lng: -119.52 }, 320000, 2023, 0.33],
              ['A3', 'P-10025', { lat: 46.25, lng: -119.53 }, 295000, 2023, 0.28],
              ['A4', 'P-10026', { lat: 46.26, lng: -119.54 }, 410000, 2023, 0.5],
            ],
            totalRows: 2500
          };
          break;
          
        case 'csv':
        case 'excel':
          previewData = {
            columns: ['PropertyID', 'Address', 'City', 'State', 'ZIP', 'Value', 'YearBuilt', 'SquareFeet'],
            rows: [
              ['BC12345', '789 Washington Blvd', 'Richland', 'WA', '99352', 450000, 1985, 2400],
              ['BC12346', '456 Jefferson St', 'Kennewick', 'WA', '99336', 380000, 1992, 1950],
              ['BC12347', '123 Lincoln Ave', 'Pasco', 'WA', '99301', 325000, 2005, 1800],
              ['BC12348', '321 Roosevelt Dr', 'Richland', 'WA', '99352', 520000, 2010, 2800],
              ['BC12349', '654 Adams Ct', 'Kennewick', 'WA', '99336', 410000, 1998, 2100],
              ['BC12350', '987 Monroe Way', 'Pasco', 'WA', '99301', 295000, 1978, 1650],
            ],
            totalRows: 3200
          };
          break;
          
        default:
          previewData = {
            columns: ['Column1', 'Column2', 'Column3'],
            rows: [
              ['No preview available for this data source type.', '', ''],
            ],
            totalRows: 0
          };
      }
      
      res.json(previewData);
    } catch (error: any) {
      console.error('Error generating data preview:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to generate data preview',
        columns: ['Error'],
        rows: [['An error occurred while previewing data']],
        totalRows: 1
      });
    }
  });
  
  // Data quality analysis endpoint for ETL data sources
  app.get('/api/etl/data-sources/:id/quality', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      // This would normally connect to the actual data source and analyze its data quality
      // For demo purposes, we're generating quality analysis results based on the data source type
      
      // Define the quality analysis interface
      interface DataQualityItem {
        field: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
        recommendation: string;
      }
      
      interface DataQualityAnalysis {
        totalIssues: number;
        completeness: number;
        accuracy: number;
        consistency: number;
        issues: DataQualityItem[];
        summary: string;
        aiRecommendations?: string[];
      }
      
      let qualityAnalysis: DataQualityAnalysis;
      
      // Generate different quality analysis based on the type of data source
      switch (dataSource.type) {
        case 'postgres':
        case 'mysql':
          qualityAnalysis = {
            totalIssues: 3,
            completeness: 94,
            accuracy: 88,
            consistency: 92,
            issues: [
              {
                field: 'address',
                issue: 'Found 128 records with incomplete or malformed address data',
                severity: 'medium',
                recommendation: 'Apply address standardization transformation to normalize address formats'
              },
              {
                field: 'last_updated',
                issue: 'Found 56 records with future dates',
                severity: 'high',
                recommendation: 'Add date validation rule to prevent invalid dates'
              },
              {
                field: 'value',
                issue: 'Found 212 records with outlier values (>3 std. dev. from mean)',
                severity: 'low',
                recommendation: 'Review outlier detection parameters and add validation rule'
              }
            ],
            summary: 'Database quality analysis detected several issues with data consistency and completeness. Address formatting issues and date validation errors should be addressed before using this data source in production.'
          };
          break;
          
        case 'api':
          qualityAnalysis = {
            totalIssues: 2,
            completeness: 96,
            accuracy: 91,
            consistency: 89,
            issues: [
              {
                field: 'location',
                issue: 'Found 45 records with coordinates outside the expected region bounds',
                severity: 'medium',
                recommendation: 'Add geospatial validation rule to flag coordinates outside the county boundary'
              },
              {
                field: 'assessed_value',
                issue: 'Found inconsistent value formats and potential currency conversion issues',
                severity: 'high',
                recommendation: 'Implement currency standardization in the transformation pipeline'
              }
            ],
            summary: 'API data source has good completeness but shows some inconsistency in location data and value formatting. Adding proper validation rules would significantly improve data quality.'
          };
          break;
          
        case 'csv':
        case 'excel':
          qualityAnalysis = {
            totalIssues: 4,
            completeness: 87,
            accuracy: 82,
            consistency: 78,
            issues: [
              {
                field: 'PropertyID',
                issue: 'Found 18 duplicate PropertyID values',
                severity: 'high',
                recommendation: 'Add deduplication step in the transformation pipeline'
              },
              {
                field: 'ZIP',
                issue: 'Found 124 records with invalid or incomplete ZIP codes',
                severity: 'medium',
                recommendation: 'Implement ZIP code validation and standardization'
              },
              {
                field: 'YearBuilt',
                issue: 'Found 56 records with YearBuilt in the future',
                severity: 'medium',
                recommendation: 'Add date validation to prevent future years'
              },
              {
                field: 'Value',
                issue: 'Found 211 null or zero values',
                severity: 'high',
                recommendation: 'Add data completeness check and implement fallback value estimation'
              }
            ],
            summary: 'The CSV data source has significant data quality issues including duplicate IDs, invalid ZIP codes, and missing values. Implementing the recommended transformations would improve data quality by approximately 15%.'
          };
          break;
          
        default:
          qualityAnalysis = {
            totalIssues: 0,
            completeness: 0,
            accuracy: 0,
            consistency: 0,
            issues: [],
            summary: 'Unable to analyze data quality for this source type. Please connect to the data source and try again.'
          };
      }
      
      // If OpenAI is configured, enhance analysis with AI insights
      if (isOpenAIConfigured()) {
        try {
          // Create a sample of data for analysis
          const dataSample = {
            columns: ['id', 'address', 'value', 'yearBuilt', 'parcelId'],
            rows: [
              [1, '123 Main St', 450000, 2008, 'P123456'],
              [2, '456 Oak Ave', 375000, 2004, 'P789012'],
              [3, '789 Pine Ln', 525000, 2012, 'P345678'],
              [4, '321 Cedar Dr', 625000, 2015, 'P901234'],
              [5, '987 Maple St', 395000, 2001, 'P567890']
            ]
          };
          
          // Call OpenAI for enhanced analysis
          const aiAnalysis = await analyzeDataQuality(
            dataSource.name,
            dataSource.type,
            dataSample,
            qualityAnalysis.issues
          );
          
          // Add AI-powered insights to the response
          qualityAnalysis.summary = aiAnalysis.enhancedSummary;
          qualityAnalysis.aiRecommendations = aiAnalysis.additionalRecommendations;
        } catch (aiError) {
          console.error('Error getting AI-powered data quality insights:', aiError);
          // Continue with basic analysis if AI enhancement fails
        }
      }
      
      res.json(qualityAnalysis);
    } catch (error: any) {
      console.error('Error analyzing data quality:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to analyze data quality',
        totalIssues: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        issues: [],
        summary: 'An error occurred while analyzing data quality'
      });
    }
  });

  // API endpoint for direct data quality analysis
  app.post('/api/etl/analyze-data-quality', async (req, res) => {
    try {
      // Extract the sample data from the request body
      const { name, type, columns, rows } = req.body;
      
      if (!name || !type || !columns || !rows) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, type, columns, rows',
          totalIssues: 0,
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          issues: [],
          summary: 'Invalid request parameters'
        });
      }
      
      // Simple validation of the data
      if (!Array.isArray(columns) || !Array.isArray(rows)) {
        return res.status(400).json({ 
          error: 'Columns and rows must be arrays',
          totalIssues: 0,
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          issues: [],
          summary: 'Invalid data format'
        });
      }
      
      // Perform basic data quality analysis
      const qualityIssues = [];
      let completeness = 100;
      let accuracy = 100;
      let consistency = 100;
      
      // Check for basic data quality issues
      const rowCount = rows.length;
      if (rowCount > 0) {
        // Column completeness
        let missingValueCount = 0;
        let totalFields = 0;
        let numericIssues = 0;
        let dateIssues = 0;
        let duplicateValues: { [key: string]: number } = {};
        
        rows.forEach(row => {
          if (row.length !== columns.length) {
            qualityIssues.push({
              field: 'all',
              issue: 'Row length does not match column count',
              severity: 'high',
              recommendation: 'Ensure all rows have the same number of fields as columns'
            });
            consistency -= 10;
          }
          
          // Track primary key values for duplicate detection
          if (columns.includes('id') || columns.includes('ID') || columns.includes('Id')) {
            const idIndex = columns.findIndex(col => col.toLowerCase() === 'id');
            if (idIndex >= 0 && row[idIndex]) {
              const idValue = String(row[idIndex]);
              duplicateValues[idValue] = (duplicateValues[idValue] || 0) + 1;
            }
          }
          
          row.forEach((value: any, index: number) => {
            totalFields++;
            const columnName = columns[index] || `column${index}`;
            
            // Check for missing values
            if (value === null || value === undefined || value === '') {
              missingValueCount++;
              qualityIssues.push({
                field: columnName,
                issue: `Found missing value in ${columnName}`,
                severity: 'medium',
                recommendation: `Add data validation for ${columnName} to ensure completeness`
              });
            } 
            // Check for numeric column issues
            else if (columnName.toLowerCase().includes('value') || 
                    columnName.toLowerCase().includes('price') || 
                    columnName.toLowerCase().includes('area') || 
                    columnName.toLowerCase().includes('feet')) {
              
              const numVal = Number(value);
              if (isNaN(numVal)) {
                numericIssues++;
                qualityIssues.push({
                  field: columnName,
                  issue: `Non-numeric value found in numeric column ${columnName}`,
                  severity: 'high',
                  recommendation: `Add numeric validation for ${columnName}`
                });
                accuracy -= 5;
              } else if (numVal < 0) {
                numericIssues++;
                qualityIssues.push({
                  field: columnName,
                  issue: `Negative value found in ${columnName}: ${value}`,
                  severity: 'medium',
                  recommendation: `Add range validation for ${columnName} to ensure positive values`
                });
                accuracy -= 3;
              }
            }
            // Check for date column issues
            else if (columnName.toLowerCase().includes('date') || 
                    columnName.toLowerCase().includes('year') || 
                    columnName.toLowerCase().includes('time')) {
              
              if (columnName.toLowerCase().includes('year')) {
                const yearVal = Number(value);
                const currentYear = new Date().getFullYear();
                
                if (!isNaN(yearVal) && yearVal > currentYear) {
                  dateIssues++;
                  qualityIssues.push({
                    field: columnName,
                    issue: `Future year found in ${columnName}: ${value}`,
                    severity: 'medium',
                    recommendation: `Add date validation for ${columnName} to prevent future dates`
                  });
                  accuracy -= 2;
                }
              }
              // Add more date validation if needed
            }
          });
        });
        
        // Check for duplicate IDs
        const duplicateIDs = Object.entries(duplicateValues)
          .filter(([_, count]) => count > 1)
          .map(([id]) => id);
          
        if (duplicateIDs.length > 0) {
          qualityIssues.push({
            field: 'id',
            issue: `Found ${duplicateIDs.length} duplicate ID values`,
            severity: 'high',
            recommendation: 'Add uniqueness constraint on ID fields and implement deduplication logic'
          });
          consistency -= 15;
        }
        
        // Calculate final metrics
        if (totalFields > 0) {
          const missingPercentage = (missingValueCount / totalFields) * 100;
          completeness = Math.max(0, 100 - missingPercentage);
          
          // Adjust accuracy based on issues found
          if (numericIssues > 0 || dateIssues > 0) {
            accuracy = Math.max(50, accuracy - (numericIssues + dateIssues) * 3);
          }
          
          if (missingPercentage > 5) {
            qualityIssues.push({
              field: 'multiple',
              issue: `Found ${missingValueCount} missing values (${missingPercentage.toFixed(1)}%)`,
              severity: missingPercentage > 20 ? 'high' : missingPercentage > 10 ? 'medium' : 'low',
              recommendation: 'Add data validation rules to ensure data completeness'
            });
          }
        }
      } else {
        completeness = 0;
        accuracy = 0;
        consistency = 0;
        qualityIssues.push({
          field: 'all',
          issue: 'No data rows provided',
          severity: 'high',
          recommendation: 'Provide sample data rows for analysis'
        });
      }
      
      // Initial quality analysis result
      const qualityAnalysis: {
        totalIssues: number;
        completeness: number;
        accuracy: number;
        consistency: number;
        issues: Array<{
          field: string;
          issue: string;
          severity: 'low' | 'medium' | 'high';
          recommendation: string;
        }>;
        summary: string;
        aiRecommendations?: string[];
      } = {
        totalIssues: qualityIssues.length,
        completeness: Math.round(completeness),
        accuracy: Math.round(accuracy),
        consistency: Math.round(consistency),
        issues: qualityIssues,
        summary: 'Initial data quality analysis completed. Further analysis may be needed for production use.',
        aiRecommendations: []
      };
      
      // If OpenAI is configured, enhance analysis with AI insights
      if (isOpenAIConfigured()) {
        try {
          // Format data for OpenAI
          const dataSample = {
            columns,
            rows: rows.slice(0, 5) // Only use first 5 rows to limit token usage
          };
          
          // Call OpenAI for enhanced analysis
          const aiAnalysis = await analyzeDataQuality(
            name,
            type,
            dataSample,
            qualityIssues
          );
          
          // Add AI-powered insights to the response
          qualityAnalysis.summary = aiAnalysis.enhancedSummary;
          qualityAnalysis.aiRecommendations = aiAnalysis.additionalRecommendations;
        } catch (aiError) {
          console.error('Error getting AI-powered data quality insights:', aiError);
          // Continue with basic analysis if AI enhancement fails
        }
      }
      
      res.json(qualityAnalysis);
    } catch (error: any) {
      console.error('Error analyzing data quality:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to analyze data quality',
        totalIssues: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        issues: [],
        summary: 'An error occurred while analyzing data quality'
      });
    }
  });

  // Endpoint for suggesting transformation rules based on data quality issues
  app.post('/api/etl/suggest-transformation-rules', async (req, res) => {
    try {
      const { issues } = req.body;
      
      if (!issues || !Array.isArray(issues)) {
        return res.status(400).json({ 
          error: 'Missing or invalid issues array',
          suggestions: []
        });
      }
      
      // Create transformation rule suggestions based on detected issues
      const suggestedRules = [];
      
      // Track which types of issues we've already created rules for to avoid duplicates
      const handledIssueTypes = new Set();
      
      issues.forEach(issue => {
        const field = issue.field;
        const issueText = issue.issue;
        const severity = issue.severity;
        
        // Skip if the field is "all" or "multiple" which are generic fields
        if (field === 'all' || field === 'multiple') {
          return;
        }
        
        // Generate rule suggestions based on issue type
        if (issueText.includes('missing value') && !handledIssueTypes.has('missing_value_' + field)) {
          handledIssueTypes.add('missing_value_' + field);
          suggestedRules.push({
            name: `Fill Missing ${field} Values`,
            description: `Handles missing values in ${field} column`,
            sourceField: field,
            targetField: field,
            transformationType: 'fillMissingValues',
            transformationConfig: {
              strategy: 'defaultValue',
              defaultValue: field.toLowerCase().includes('date') ? 'CURRENT_DATE' : 
                           field.toLowerCase().includes('year') ? new Date().getFullYear() : 
                           field.toLowerCase().includes('value') || field.toLowerCase().includes('price') ? 0 : 'N/A'
            },
            isEnabled: true
          });
        }
        
        if ((issueText.includes('Non-numeric') || issueText.includes('not a number')) && !handledIssueTypes.has('numeric_validation_' + field)) {
          handledIssueTypes.add('numeric_validation_' + field);
          suggestedRules.push({
            name: `Validate ${field} as Numeric`,
            description: `Ensures ${field} column contains valid numeric values`,
            sourceField: field,
            targetField: field,
            transformationType: 'validation',
            transformationConfig: {
              validationType: 'numeric',
              action: 'convert',
              fallbackValue: 0
            },
            isEnabled: true
          });
        }
        
        if (issueText.includes('Negative value') && !handledIssueTypes.has('negative_value_' + field)) {
          handledIssueTypes.add('negative_value_' + field);
          suggestedRules.push({
            name: `Ensure Positive ${field}`,
            description: `Converts negative values in ${field} column to positive`,
            sourceField: field,
            targetField: field,
            transformationType: 'numberTransform',
            transformationConfig: {
              operation: 'abs'
            },
            isEnabled: true
          });
        }
        
        if (issueText.includes('duplicate') && !handledIssueTypes.has('duplicate_' + field)) {
          handledIssueTypes.add('duplicate_' + field);
          suggestedRules.push({
            name: `Handle Duplicate ${field}`,
            description: `Adds unique suffix to duplicate ${field} values`,
            sourceField: field,
            targetField: field,
            transformationType: 'deduplicate',
            transformationConfig: {
              strategy: 'addSuffix',
              suffixPattern: '_${index}'
            },
            isEnabled: true
          });
        }
        
        if ((issueText.includes('Future') || issueText.includes('invalid date')) && !handledIssueTypes.has('date_validation_' + field)) {
          handledIssueTypes.add('date_validation_' + field);
          suggestedRules.push({
            name: `Validate ${field} Dates`,
            description: `Ensures ${field} has valid dates (not in future)`,
            sourceField: field,
            targetField: field,
            transformationType: 'dateValidation',
            transformationConfig: {
              maxDate: 'CURRENT_DATE',
              invalidAction: 'setToMax'
            },
            isEnabled: true
          });
        }
      });
      
      // If OpenAI is configured, get AI suggestions for more advanced transformations
      if (isOpenAIConfigured() && issues.length > 0) {
        try {
          // This would be a call to OpenAI for advanced suggestions
          // For now we'll just add some static advanced rules since we have rate limits
          const advancedRules = [
            {
              name: 'Address Standardization',
              description: 'Standardizes address formatting for consistency',
              sourceField: 'address',
              targetField: 'address',
              transformationType: 'addressStandardization',
              transformationConfig: {
                format: 'USPS',
                includeZipCode: true
              },
              isEnabled: false
            },
            {
              name: 'Data Quality Score',
              description: 'Calculates and adds a data quality score column',
              sourceField: '*',
              targetField: 'qualityScore',
              transformationType: 'qualityScore',
              transformationConfig: {
                factors: ['completeness', 'validity'],
                weights: { completeness: 0.7, validity: 0.3 }
              },
              isEnabled: false
            }
          ];
          
          // Only add these if the appropriate fields exist
          if (issues.some(issue => issue.field === 'address')) {
            suggestedRules.push(advancedRules[0]);
          }
          
          // Always suggest the data quality score calculation
          suggestedRules.push(advancedRules[1]);
        } catch (aiError) {
          console.error('Error getting AI-powered transformation suggestions:', aiError);
          // Continue with basic suggestions if AI enhancement fails
        }
      }
      
      res.json({
        count: suggestedRules.length,
        suggestions: suggestedRules
      });
    } catch (error: any) {
      console.error('Error suggesting transformation rules:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to suggest transformation rules',
        suggestions: []
      });
    }
  });

  // ETL Transformation Rules endpoints
  app.get('/api/etl/transformation-rules', async (req, res) => {
    try {
      const rules = await storage.getEtlTransformationRules();
      res.json(rules);
    } catch (error: any) {
      console.error('Error fetching ETL transformation rules:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL transformation rules' });
    }
  });

  app.get('/api/etl/transformation-rules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transformation rule ID' });
      }
      
      const rule = await storage.getEtlTransformationRuleById(id);
      if (!rule) {
        return res.status(404).json({ error: 'Transformation rule not found' });
      }
      
      res.json(rule);
    } catch (error: any) {
      console.error('Error fetching ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL transformation rule' });
    }
  });

  app.post('/api/etl/transformation-rules', async (req, res) => {
    try {
      const rule = req.body;
      const newRule = await storage.createEtlTransformationRule(rule);
      res.status(201).json(newRule);
    } catch (error: any) {
      console.error('Error creating ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to create ETL transformation rule' });
    }
  });

  app.put('/api/etl/transformation-rules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transformation rule ID' });
      }
      
      const rule = req.body;
      const updatedRule = await storage.updateEtlTransformationRule(id, rule);
      
      if (!updatedRule) {
        return res.status(404).json({ error: 'Transformation rule not found' });
      }
      
      res.json(updatedRule);
    } catch (error: any) {
      console.error('Error updating ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to update ETL transformation rule' });
    }
  });

  app.delete('/api/etl/transformation-rules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transformation rule ID' });
      }
      
      const success = await storage.deleteEtlTransformationRule(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Transformation rule not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to delete ETL transformation rule' });
    }
  });

  // ETL Jobs endpoints
  app.get('/api/etl/jobs', async (req, res) => {
    try {
      const jobs = await storage.getEtlJobs();
      res.json(jobs);
    } catch (error: any) {
      console.error('Error fetching ETL jobs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL jobs' });
    }
  });

  app.get('/api/etl/jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const job = await storage.getEtlJobById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(job);
    } catch (error: any) {
      console.error('Error fetching ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL job' });
    }
  });

  app.post('/api/etl/jobs', async (req, res) => {
    try {
      const job = req.body;
      const newJob = await storage.createEtlJob(job);
      res.status(201).json(newJob);
    } catch (error: any) {
      console.error('Error creating ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to create ETL job' });
    }
  });

  app.put('/api/etl/jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const job = req.body;
      const updatedJob = await storage.updateEtlJob(id, job);
      
      if (!updatedJob) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(updatedJob);
    } catch (error: any) {
      console.error('Error updating ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to update ETL job' });
    }
  });

  app.delete('/api/etl/jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const success = await storage.deleteEtlJob(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to delete ETL job' });
    }
  });

  // ETL Transformation Rule Execution endpoint
  app.post('/api/etl/execute-transformation-rules', async (req, res) => {
    try {
      const { data, rules } = req.body;
      
      if (!data || !Array.isArray(data.rows) || !Array.isArray(data.columns)) {
        return res.status(400).json({ 
          error: 'Invalid data format. Expected {columns: string[], rows: any[][]}' 
        });
      }
      
      if (!rules || !Array.isArray(rules)) {
        return res.status(400).json({ 
          error: 'Invalid rules format. Expected an array of transformation rules' 
        });
      }

      // Create a copy of the data to avoid modifying the original
      const transformedData = {
        name: data.name || 'Transformed Data',
        type: data.type || 'csv',
        columns: [...data.columns],
        rows: data.rows.map(row => [...row])
      };
      
      // Apply each transformation rule in sequence
      const executionLog = [];
      const transformationStats = {
        totalTransformations: 0,
        byRule: {}
      };
      
      for (const rule of rules) {
        if (!rule.isEnabled) {
          executionLog.push({
            rule: rule.name,
            status: 'skipped',
            message: 'Rule is disabled'
          });
          continue;
        }
        
        try {
          // Initialize stats for this rule
          transformationStats.byRule[rule.name] = {
            cellsTransformed: 0,
            fieldsAffected: []
          };
          
          // Get column indexes
          const sourceColumnIndex = rule.sourceField === '*' 
            ? -1
            : transformedData.columns.indexOf(rule.sourceField);
            
          const targetColumnIndex = transformedData.columns.indexOf(rule.targetField);
          
          // Add target column if it doesn't exist (for new columns)
          if (targetColumnIndex === -1 && rule.targetField !== rule.sourceField) {
            transformedData.columns.push(rule.targetField);
            // Add empty values for the new column in all rows
            transformedData.rows.forEach(row => row.push(null));
          }
          
          // Re-fetch the target index in case we just added it
          const newTargetIndex = transformedData.columns.indexOf(rule.targetField);
          
          // Apply the transformation based on the rule type
          switch (rule.transformationType) {
            case 'fillMissingValues': {
              const defaultValue = rule.transformationConfig.defaultValue;
              const transformedCount = applyFillMissingValues(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                defaultValue
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'validation': {
              const { validationType, action, fallbackValue } = rule.transformationConfig;
              const transformedCount = applyValidation(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                validationType, 
                action, 
                fallbackValue
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'numberTransform': {
              const { operation } = rule.transformationConfig;
              const transformedCount = applyNumberTransform(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                operation
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'deduplicate': {
              const { strategy, suffixPattern } = rule.transformationConfig;
              const transformedCount = applyDeduplication(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                strategy, 
                suffixPattern
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'dateValidation': {
              const { maxDate, invalidAction } = rule.transformationConfig;
              const transformedCount = applyDateValidation(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                maxDate, 
                invalidAction
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }

            case 'qualityScore': {
              // Add a quality score column if it does not exist
              if (newTargetIndex === -1) {
                transformedData.columns.push(rule.targetField);
                // Add empty values for the new column in all rows
                transformedData.rows.forEach(row => row.push(null));
              }
              
              const qualityScoreIndex = transformedData.columns.indexOf(rule.targetField);
              const { factors, weights } = rule.transformationConfig;
              
              // Calculate quality score for each row
              let transformedCount = 0;
              transformedData.rows.forEach((row, rowIndex) => {
                let score = 100; // Start with perfect score
                
                // Check for completeness
                if (factors.includes('completeness')) {
                  const completenessWeight = weights.completeness || 0.5;
                  let missingCount = 0;
                  row.forEach(cell => {
                    if (cell === null || cell === undefined || cell === '') {
                      missingCount++;
                    }
                  });
                  
                  const completeness = 1 - (missingCount / row.length);
                  score -= (1 - completeness) * 100 * completenessWeight;
                }
                
                // Check for validity
                if (factors.includes('validity')) {
                  const validityWeight = weights.validity || 0.5;
                  let invalidCount = 0;
                  
                  transformedData.columns.forEach((column, colIndex) => {
                    const value = row[colIndex];
                    if (value !== null && value !== undefined && value !== '') {
                      // Check numeric fields
                      if (column.toLowerCase().includes('value') || 
                          column.toLowerCase().includes('price') || 
                          column.toLowerCase().includes('cost') || 
                          column.toLowerCase().includes('fee')) {
                        if (isNaN(Number(value)) || Number(value) < 0) {
                          invalidCount++;
                        }
                      }
                      
                      // Check date/year fields
                      if (column.toLowerCase().includes('date') || 
                          column.toLowerCase().includes('year')) {
                        const currentYear = new Date().getFullYear();
                        if (isNaN(Number(value)) || Number(value) > currentYear) {
                          invalidCount++;
                        }
                      }
                    }
                  });
                  
                  const validity = 1 - (invalidCount / row.length);
                  score -= (1 - validity) * 100 * validityWeight;
                }
                
                // Ensure score is between 0 and 100
                score = Math.max(0, Math.min(100, Math.round(score)));
                
                // Update the quality score
                row[qualityScoreIndex] = score;
                transformedCount++;
              });
              
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            default:
              executionLog.push({
                rule: rule.name,
                status: 'skipped',
                message: `Unsupported transformation type: ${rule.transformationType}`
              });
              continue;
          }
          
          // Add to execution log
          executionLog.push({
            rule: rule.name,
            status: 'success',
            message: `Applied ${rule.transformationType} transformation successfully`,
            transformedCount: transformationStats.byRule[rule.name].cellsTransformed
          });
          
          // Add to affected fields
          if (!transformationStats.byRule[rule.name].fieldsAffected.includes(rule.targetField)) {
            transformationStats.byRule[rule.name].fieldsAffected.push(rule.targetField);
          }
          
        } catch (ruleError) {
          console.error(`Error applying rule ${rule.name}:`, ruleError);
          executionLog.push({
            rule: rule.name,
            status: 'error',
            message: ruleError.message || `Error applying ${rule.name}`
          });
        }
      }
      
      // Return the transformed data with execution log
      res.json({
        transformedData,
        executionLog,
        transformationStats
      });
    } catch (error: any) {
      console.error('Error executing transformation rules:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to execute transformation rules' 
      });
    }
  });

  // Helper functions for transformations
  function applyFillMissingValues(rows: any[][], sourceIndex: number, targetIndex: number, defaultValue: any): number {
    let transformedCount = 0;
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      if (sourceValue === null || sourceValue === undefined || sourceValue === '') {
        row[targetIndex] = defaultValue === 'CURRENT_DATE' ? new Date().toISOString().split('T')[0] : defaultValue;
        transformedCount++;
      } else if (sourceIndex !== targetIndex) {
        // Only copy if source and target are different
        row[targetIndex] = sourceValue;
      }
    });
    
    return transformedCount;
  }
  
  function applyValidation(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    validationType: string, 
    action: string, 
    fallbackValue: any
  ): number {
    let transformedCount = 0;
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      let targetValue = sourceValue;
      
      if (validationType === 'numeric') {
        if (sourceValue === null || sourceValue === undefined || sourceValue === '' || isNaN(Number(sourceValue))) {
          if (action === 'convert') {
            targetValue = fallbackValue;
            transformedCount++;
          }
        } else {
          targetValue = Number(sourceValue);
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }
  
  function applyNumberTransform(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    operation: string
  ): number {
    let transformedCount = 0;
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      let targetValue = sourceValue;
      
      if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
        const numValue = Number(sourceValue);
        
        if (!isNaN(numValue)) {
          if (operation === 'abs') {
            targetValue = Math.abs(numValue);
            if (numValue !== targetValue) {
              transformedCount++;
            }
          }
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }
  
  function applyDeduplication(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    strategy: string, 
    suffixPattern: string
  ): number {
    let transformedCount = 0;
    const valueOccurrences: Record<string, number> = {};
    
    // First pass: count occurrences
    rows.forEach(row => {
      const sourceValue = String(row[sourceIndex]);
      valueOccurrences[sourceValue] = (valueOccurrences[sourceValue] || 0) + 1;
    });
    
    // Second pass: apply deduplication
    const processedValues: Record<string, number> = {};
    
    rows.forEach(row => {
      const sourceValue = String(row[sourceIndex]);
      let targetValue = sourceValue;
      
      if (valueOccurrences[sourceValue] > 1) {
        // Track how many times we've seen this value
        processedValues[sourceValue] = (processedValues[sourceValue] || 0) + 1;
        
        if (processedValues[sourceValue] > 1) { // First occurrence keeps original value
          if (strategy === 'addSuffix') {
            const suffix = suffixPattern.replace('${index}', processedValues[sourceValue].toString());
            targetValue = sourceValue + suffix;
            transformedCount++;
          }
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }
  
  function applyDateValidation(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    maxDate: string, 
    invalidAction: string
  ): number {
    let transformedCount = 0;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      let targetValue = sourceValue;
      
      // Handle year values (e.g., 2050) or date values
      if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
        const numValue = Number(sourceValue);
        
        if (!isNaN(numValue)) {
          // Check if it's a year and it's in the future
          if (numValue > 1000 && numValue <= 9999 && numValue > currentYear) {
            if (invalidAction === 'setToMax') {
              targetValue = currentYear;
              transformedCount++;
            }
          }
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }

  // ETL Job Execution endpoint
  app.post('/api/etl/jobs/:id/execute', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const job = await storage.getEtlJobById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      // Update job status to running
      await storage.updateEtlJob(id, { status: 'running' });
      
      // Execute the job (placeholder for actual execution logic)
      // In a real implementation, this would dispatch a background task or worker
      
      // For demo purposes, update job to success after a delay
      setTimeout(async () => {
        try {
          await storage.updateEtlJob(id, { 
            status: 'success',
            lastRunAt: new Date()
          });
        } catch (error) {
          console.error('Error updating job status:', error);
        }
      }, 5000);
      
      res.json({ message: 'Job execution started', jobId: id });
    } catch (error: any) {
      console.error('Error executing ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to execute ETL job' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
