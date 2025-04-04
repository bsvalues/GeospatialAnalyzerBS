import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  isOpenAIConfigured, 
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
