import { Property } from '@/shared/types';

// Types
export interface NeighborhoodData {
  name: string;
  overview: {
    description: string;
    type: string;
    ratings: {
      overall: number;
      safety: number;
      schools: number;
      amenities: number;
      costOfLiving: number;
      outdoorActivities: number;
    };
  };
  demographics: {
    population: number;
    medianAge: number;
    households: number;
    homeownership: number;
    medianIncome: string;
    education: {
      highSchool: number;
      bachelors: number;
      graduate: number;
    };
  };
  housing: {
    medianHomeValue: string;
    medianRent: string;
    valueChange: {
      oneYear: number;
      fiveYear: number;
    };
    propertyTypes: {
      singleFamily: number;
      condo: number;
      townhouse: number;
      apartment: number;
    };
  };
  amenities: {
    groceryStores: Array<{ name: string; distance: number }>;
    restaurants: Array<{ name: string; distance: number }>;
    parks: Array<{ name: string; distance: number }>;
    schools: Array<{ name: string; distance: number; rating: number }>;
  };
  marketTrends: {
    avgDaysOnMarket: number;
    listToSaleRatio: number;
    pricePerSqFt: {
      current: number;
      lastYear: number;
      change: number;
    };
    inventoryLevel: string;
    competitiveIndex: string;
  };
}

export interface NeighborhoodSearchParams {
  lat?: number;
  lng?: number;
  zip?: string;
  city?: string;
  state?: string;
  address?: string;
}

class NeighborhoodService {
  private cache: Map<string, NeighborhoodData> = new Map();

  /**
   * Get neighborhood data for a given property
   * @param property The property to retrieve neighborhood data for
   * @returns A promise that resolves to neighborhood data
   */
  async getNeighborhoodData(property: Property): Promise<NeighborhoodData> {
    // Create a cache key based on property coordinates or address
    const cacheKey = property.coordinates 
      ? `${property.coordinates[0]},${property.coordinates[1]}` 
      : property.address;
    
    // Check if data is already in cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Fetch neighborhood data (this would be an API call in production)
    // For now, we'll return mock data
    const data = await this.fetchNeighborhoodData(property);
    
    // Cache the result
    this.cache.set(cacheKey, data);
    
    return data;
  }

  /**
   * Search for neighborhoods by parameters
   * @param params Search parameters
   * @returns A promise that resolves to an array of neighborhood data
   */
  async searchNeighborhoods(params: NeighborhoodSearchParams): Promise<NeighborhoodData[]> {
    // This would be an API call in production
    // For now, we'll return mock data
    await this.simulateNetworkDelay();
    
    return [this.getMockNeighborhoodData()];
  }

  /**
   * Get walkability score for a location
   * @param lat Latitude
   * @param lng Longitude
   * @returns A promise that resolves to a walkability score
   */
  async getWalkabilityScore(lat: number, lng: number): Promise<number> {
    // This would be an API call in production
    await this.simulateNetworkDelay();
    
    // Return a random score between 50 and 95
    return Math.floor(Math.random() * 45) + 50;
  }

  /**
   * Clear the neighborhood data cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove a specific item from the cache
   * @param cacheKey The cache key to remove
   */
  invalidateCache(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  // Private helper methods
  private async fetchNeighborhoodData(property: Property): Promise<NeighborhoodData> {
    // Simulate network delay
    await this.simulateNetworkDelay();
    
    // In a real app, this would make an API call to fetch data
    // For now, return mock data
    return this.getMockNeighborhoodData();
  }

  private async simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 800));
  }

  private getMockNeighborhoodData(): NeighborhoodData {
    return {
      name: 'West Richland',
      overview: {
        description: 'A residential neighborhood in Benton County known for its family-friendly atmosphere and proximity to natural attractions.',
        type: 'Suburban',
        ratings: {
          overall: 86,
          safety: 91,
          schools: 83,
          amenities: 72,
          costOfLiving: 77,
          outdoorActivities: 88
        }
      },
      demographics: {
        population: 15750,
        medianAge: 37.2,
        households: 5430,
        homeownership: 71.3,
        medianIncome: '$76,500',
        education: {
          highSchool: 94.2,
          bachelors: 37.6,
          graduate: 12.3
        }
      },
      housing: {
        medianHomeValue: '$345,000',
        medianRent: '$1,450',
        valueChange: {
          oneYear: 7.2,
          fiveYear: 32.8
        },
        propertyTypes: {
          singleFamily: 82.4,
          condo: 6.7,
          townhouse: 8.9,
          apartment: 2.0
        }
      },
      amenities: {
        groceryStores: [
          { name: 'Yoke\'s Fresh Market', distance: 0.8 },
          { name: 'Walmart Supercenter', distance: 2.1 }
        ],
        restaurants: [
          { name: 'Atomic Ale Brewpub', distance: 1.2 },
          { name: 'Foodies Brick and Mortar', distance: 1.5 },
          { name: 'Dovetail Joint', distance: 1.7 }
        ],
        parks: [
          { name: 'Flat Top Park', distance: 0.4 },
          { name: 'South Highlands Park', distance: 1.0 },
          { name: 'Yakima River Greenway', distance: 2.4 }
        ],
        schools: [
          { name: 'William Wiley Elementary', distance: 0.6, rating: 8 },
          { name: 'Enterprise Middle School', distance: 1.3, rating: 7 },
          { name: 'Richland High School', distance: 3.2, rating: 8 }
        ]
      },
      marketTrends: {
        avgDaysOnMarket: 18,
        listToSaleRatio: 98.5,
        pricePerSqFt: {
          current: 183,
          lastYear: 168,
          change: 8.9
        },
        inventoryLevel: 'Low',
        competitiveIndex: 'High'
      }
    };
  }
}

// Create and export a singleton instance
export const neighborhoodService = new NeighborhoodService();

export default neighborhoodService;