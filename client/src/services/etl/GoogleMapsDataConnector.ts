/**
 * Google Maps Data Connector
 * 
 * This service provides functionality to connect to the Google Maps Extractor API
 * via RapidAPI and retrieve location data for use in the ETL pipeline.
 */

import { DataSource } from './ETLTypes';
import { etlPipelineManager } from './ETLPipelineManager';
import { dataConnector } from './DataConnector';

// API configuration
const RAPIDAPI_HOST = 'google-maps-extractor2.p.rapidapi.com';
// The API key is retrieved from environment variables for security

/**
 * Interface for Google Maps location query parameters
 */
interface GoogleMapsLocationQueryParams {
  query: string;
  country?: string;
  language?: string;
}

/**
 * Interface for Google Maps location data
 */
interface GoogleMapsLocationData {
  id: string;
  name: string;
  address: string;
  addressComponents?: {
    streetNumber?: string;
    route?: string;
    neighborhood?: string;
    locality?: string; // city
    administrativeAreaLevel1?: string; // state
    administrativeAreaLevel2?: string; // county
    country?: string;
    postalCode?: string;
  };
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  latitude: number;
  longitude: number;
  placeTypes?: string[];
  openingHours?: string[];
  priceLevel?: number;
}

/**
 * GoogleMapsDataConnector class for handling Google Maps API interactions
 */
class GoogleMapsDataConnector {
  private dataSourceId: string | null = null;
  
  constructor() {
    // Register Google Maps as a data source when initialized
    this.registerGoogleMapsDataSource();
  }
  
  /**
   * Register Google Maps as a data source in the ETL system
   */
  async registerGoogleMapsDataSource(): Promise<void> {
    try {
      // Check if API key is available
      const isApiAvailable = await this.isGoogleMapsApiAvailable();
      if (!isApiAvailable) {
        console.error('Google Maps API key is not set on the server. Please configure the RAPIDAPI_KEY environment variable.');
        return;
      }
      
      // Register the data source with the ETL data connector
      const dataSource = dataConnector.registerDataSource({
        name: 'Google Maps Location Data',
        description: 'Location data from Google Maps via RapidAPI',
        type: 'api',
        connectionDetails: {
          baseUrl: '/api/maps', // Use our proxy endpoint
          authType: 'none', // No auth needed for our proxy
          headers: {
            'Content-Type': 'application/json'
          }
        }
      });
      
      this.dataSourceId = dataSource.id;
      console.log('Google Maps data source registered with ID:', this.dataSourceId);
    } catch (error) {
      console.error('Failed to register Google Maps data source:', error);
    }
  }
  
  /**
   * Get the Google Maps data source ID
   */
  getDataSourceId(): string | null {
    return this.dataSourceId;
  }
  
  /**
   * Check if the Google Maps API is available
   */
  async isGoogleMapsApiAvailable(): Promise<boolean> {
    try {
      const configResponse = await fetch('/api/config');
      const config = await configResponse.json();
      return !!config.hasRapidApiKey;
    } catch (error) {
      console.error('Error checking Google Maps API availability:', error);
      return false;
    }
  }
  
  /**
   * Query locations from Google Maps API
   */
  async queryLocations(params: GoogleMapsLocationQueryParams): Promise<GoogleMapsLocationData[]> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isGoogleMapsApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Google Maps API key is not configured on the server');
        return [];
      }
      
      // Use our secure proxy endpoint
      const response = await fetch('/api/maps/query-locate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.places || !Array.isArray(data.places)) {
        return [];
      }
      
      // Transform the response data
      return data.places.map((place: any) => this.transformLocationData(place));
    } catch (error) {
      console.error('Error querying locations from Google Maps:', error);
      return [];
    }
  }
  
  /**
   * Find nearby points of interest
   * This can be used to enrich property data with information about local amenities
   */
  async findNearbyPOIs(latitude: number, longitude: number, type: string, radius: number = 2000): Promise<GoogleMapsLocationData[]> {
    try {
      // First check if API is available
      const isApiAvailable = await this.isGoogleMapsApiAvailable();
      
      if (!isApiAvailable) {
        console.error('Google Maps API key is not configured on the server');
        return [];
      }
      
      // Build a location-based query string
      const query = `${type} near ${latitude},${longitude}`;
      
      // Use the query-locate endpoint
      const response = await fetch('/api/maps/query-locate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          country: 'us',
          language: 'en'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.places || !Array.isArray(data.places)) {
        return [];
      }
      
      // Transform the response data
      return data.places.map((place: any) => this.transformLocationData(place));
    } catch (error) {
      console.error('Error finding nearby POIs from Google Maps:', error);
      return [];
    }
  }
  
  /**
   * Create an ETL job to import location data from Google Maps
   */
  async createLocationImportJob(searchQuery: string, targetDataSourceId: string, jobName?: string): Promise<string | null> {
    try {
      if (!this.dataSourceId) {
        throw new Error('Google Maps data source not registered');
      }
      
      // Create a job to import data from Google Maps to the target data source
      const job = etlPipelineManager.createJob({
        name: jobName || `Google Maps Import - ${searchQuery}`,
        description: `Import location data for "${searchQuery}" from Google Maps API`,
        sourceId: this.dataSourceId,
        targetId: targetDataSourceId,
        transformationRules: [], // Will be populated by default transformation rules
      });
      
      console.log('Created Google Maps import job:', job.id);
      return job.id;
    } catch (error) {
      console.error('Error creating Google Maps import job:', error);
      return null;
    }
  }
  
  /**
   * Transform raw Google Maps API data into a standardized format
   */
  private transformLocationData(rawData: any): GoogleMapsLocationData {
    // Extract and normalize data from the API response
    const locationData: GoogleMapsLocationData = {
      id: rawData.place_id || rawData.id || `gm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: rawData.name || '',
      address: rawData.formatted_address || rawData.address || '',
      latitude: rawData.geometry?.location?.lat || rawData.lat || 0,
      longitude: rawData.geometry?.location?.lng || rawData.lng || 0,
      rating: rawData.rating || 0,
      reviewCount: rawData.user_ratings_total || rawData.reviews_count || 0,
      phone: rawData.international_phone_number || rawData.phone || '',
      website: rawData.website || '',
      priceLevel: rawData.price_level || 0,
      placeTypes: rawData.types || []
    };
    
    // Process address components if available
    if (rawData.address_components && Array.isArray(rawData.address_components)) {
      const addressComponents: any = {};
      
      rawData.address_components.forEach((component: any) => {
        if (component.types && component.types.includes('street_number')) {
          addressComponents.streetNumber = component.long_name;
        } else if (component.types && component.types.includes('route')) {
          addressComponents.route = component.long_name;
        } else if (component.types && component.types.includes('neighborhood')) {
          addressComponents.neighborhood = component.long_name;
        } else if (component.types && component.types.includes('locality')) {
          addressComponents.locality = component.long_name;
        } else if (component.types && component.types.includes('administrative_area_level_1')) {
          addressComponents.administrativeAreaLevel1 = component.long_name;
        } else if (component.types && component.types.includes('administrative_area_level_2')) {
          addressComponents.administrativeAreaLevel2 = component.long_name;
        } else if (component.types && component.types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (component.types && component.types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        }
      });
      
      locationData.addressComponents = addressComponents;
    }
    
    // Process opening hours if available
    if (rawData.opening_hours && rawData.opening_hours.weekday_text) {
      locationData.openingHours = rawData.opening_hours.weekday_text;
    }
    
    return locationData;
  }
}

// Export singleton instance
export const googleMapsDataConnector = new GoogleMapsDataConnector();