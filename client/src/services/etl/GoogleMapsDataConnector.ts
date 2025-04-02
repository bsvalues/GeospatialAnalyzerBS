/**
 * Google Maps Data Connector
 * 
 * This module handles data connections to the Google Maps API for geospatial
 * information. It implements the standard data connector interface
 * and provides specialized methods for retrieving geospatial data.
 */

import { DataConnector } from './DataConnector';

/**
 * GoogleMapsDataConnector class implements the DataConnector interface
 * for connecting to and retrieving data from the Google Maps API.
 */
export class GoogleMapsDataConnector implements DataConnector {
  private apiKey: string | null;
  
  /**
   * Constructor for the GoogleMapsDataConnector
   */
  constructor() {
    // The API key will be fetched from environment or securely stored
    this.apiKey = null;
  }
  
  /**
   * Get the name of this data source
   * @returns {string} The name of the data source
   */
  getSourceName(): string {
    return 'Google Maps API';
  }
  
  /**
   * Check if the Google Maps API is available and ready to use
   * @returns {Promise<boolean>} True if the API is available, false otherwise
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Use a lightweight endpoint to check API status
      const response = await fetch('/api/etl/check-google-maps-api', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Google Maps API check failed:', response.status);
        return false;
      }
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Error checking Google Maps API availability:', error);
      return false;
    }
  }
  
  /**
   * Geocode an address to get its coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<any>} Geocoding results
   */
  async geocodeAddress(address: string): Promise<any> {
    try {
      // Ensure API is available before making a request
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Google Maps API is not available');
      }
      
      const response = await fetch('/api/etl/google-maps/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to geocode address: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }
  
  /**
   * Get place details from Google Places API
   * @param {string} placeId - The Google Place ID
   * @returns {Promise<any>} Place details
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      // Ensure API is available before making a request
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Google Maps API is not available');
      }
      
      const response = await fetch(`/api/etl/google-maps/place/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get place details: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }
  
  /**
   * Get directions between two points
   * @param {object} params - Parameters for the directions request
   * @returns {Promise<any>} Directions data
   */
  async getDirections(params: { origin: string, destination: string, mode?: string }): Promise<any> {
    try {
      // Ensure API is available before making a request
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Google Maps API is not available');
      }
      
      const response = await fetch('/api/etl/google-maps/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get directions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }
  
  /**
   * Search for nearby places
   * @param {object} params - Parameters for the nearby search
   * @returns {Promise<any>} Nearby places data
   */
  async searchNearbyPlaces(params: { 
    location: { lat: number, lng: number }, 
    radius: number, 
    type?: string,
    keyword?: string
  }): Promise<any> {
    try {
      // Ensure API is available before making a request
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Google Maps API is not available');
      }
      
      const response = await fetch('/api/etl/google-maps/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search nearby places: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching nearby places:', error);
      throw error;
    }
  }
}

// Export a singleton instance of the connector
export const googleMapsDataConnector = new GoogleMapsDataConnector();