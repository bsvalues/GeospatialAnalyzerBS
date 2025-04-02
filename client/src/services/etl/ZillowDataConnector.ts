/**
 * Zillow Data Connector
 * 
 * This module handles data connections to the Zillow API for real estate
 * property information. It implements the standard data connector interface
 * and provides specialized methods for retrieving property data.
 */

import { DataConnector } from './DataConnector';

// Define the base URL for the Zillow API
const ZILLOW_API_BASE_URL = 'https://realty-in-us.p.rapidapi.com';

/**
 * ZillowDataConnector class implements the DataConnector interface
 * for connecting to and retrieving data from the Zillow API.
 */
export class ZillowDataConnector implements DataConnector {
  private apiKey: string | null;
  
  /**
   * Constructor for the ZillowDataConnector
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
    return 'Zillow API';
  }
  
  /**
   * Check if the Zillow API is available and ready to use
   * @returns {Promise<boolean>} True if the API is available, false otherwise
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Use a lightweight endpoint to check API status
      const response = await fetch('/api/etl/check-zillow-api', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Zillow API check failed:', response.status);
        return false;
      }
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Error checking Zillow API availability:', error);
      return false;
    }
  }
  
  /**
   * Search for properties matching the given criteria
   * @param {object} params - Search parameters
   * @returns {Promise<any>} Search results
   */
  async searchProperties(params: { location: string, [key: string]: any }): Promise<any> {
    try {
      // Ensure API is available before making a request
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Zillow API is not available');
      }
      
      const response = await fetch('/api/etl/zillow/properties/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search properties: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }
  
  /**
   * Get detailed information about a specific property
   * @param {string} propertyId - The ID of the property
   * @returns {Promise<any>} Property details
   */
  async getPropertyDetails(propertyId: string): Promise<any> {
    try {
      // Ensure API is available before making a request
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Zillow API is not available');
      }
      
      const response = await fetch(`/api/etl/zillow/properties/${propertyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get property details: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting property details:', error);
      throw error;
    }
  }
  
  /**
   * Get market trends for a specific area
   * @param {object} params - Parameters for the market trends request
   * @returns {Promise<any>} Market trends data
   */
  async getMarketTrends(params: { location: string, period?: string }): Promise<any> {
    try {
      // Ensure API is available before making a request
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Zillow API is not available');
      }
      
      const response = await fetch('/api/etl/zillow/market-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get market trends: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting market trends:', error);
      throw error;
    }
  }
}

// Export a singleton instance of the connector
export const zillowDataConnector = new ZillowDataConnector();