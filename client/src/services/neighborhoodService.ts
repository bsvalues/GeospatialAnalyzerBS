import { Property } from '@/shared/types';

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
    if (!property) {
      throw new Error('Property is required');
    }
    
    // Use property ID as cache key
    const cacheKey = `property_${property.id}`;
    
    // Return cached data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // For demo purposes, add a slight delay
    await this.simulateNetworkDelay();
    
    // Generate unique neighborhood name based on property location
    const neighborhoodName = property.coordinates 
      ? `${this.getNeighborhoodNameFromCoordinates(property.coordinates)}`
      : 'West Richland';
    
    // Get mock neighborhood data
    const data = this.getMockNeighborhoodData();
    data.name = neighborhoodName;
    
    // Cache the response
    this.cache.set(cacheKey, data);
    
    return data;
  }
  
  /**
   * Search for neighborhoods by parameters
   * @param params Search parameters
   * @returns A promise that resolves to an array of neighborhood data
   */
  async searchNeighborhoods(params: NeighborhoodSearchParams): Promise<NeighborhoodData[]> {
    // Simulate network delay
    await this.simulateNetworkDelay();
    
    // Generate mock neighborhoods based on search parameters
    const neighborhoods: NeighborhoodData[] = [];
    
    // Simulate 3-5 neighborhoods
    const count = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < count; i++) {
      const data = this.getMockNeighborhoodData();
      data.name = this.getRandomNeighborhoodName(i);
      neighborhoods.push(data);
    }
    
    return neighborhoods;
  }
  
  /**
   * Get walkability score for a location
   * @param lat Latitude
   * @param lng Longitude
   * @returns A promise that resolves to a walkability score
   */
  async getWalkabilityScore(lat: number, lng: number): Promise<number> {
    // Simulate network delay
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
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
    }
  }
  
  private async simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  }
  
  private getNeighborhoodNameFromCoordinates(coordinates: [number, number]): string {
    // This would typically use reverse geocoding
    // For demo purposes, create a name based on coordinates
    const [lat, lng] = coordinates;
    const latPrefix = lat >= 0 ? 'North' : 'South';
    const lngPrefix = lng >= 0 ? 'East' : 'West';
    
    // Benton County neighborhoods
    const names = [
      'Richland Heights',
      'Kennewick Grove',
      'West Pasco',
      'Benton City',
      'Prosser Valley',
      'Finley District',
      'Highland Springs',
      'Columbia Point',
      'Badger Mountain',
      'South Richland'
    ];
    
    // Select a name deterministically based on coordinates
    const nameIndex = Math.abs(Math.floor((lat * lng * 1000) % names.length));
    return names[nameIndex];
  }
  
  private getRandomNeighborhoodName(index: number): string {
    const names = [
      'Richland Heights',
      'Kennewick Grove',
      'West Pasco',
      'Benton City',
      'Prosser Valley',
      'Finley District',
      'Highland Springs',
      'Columbia Point',
      'Badger Mountain',
      'South Richland',
      'North Richland',
      'Horn Rapids',
      'West Richland',
      'Queensgate',
      'Southridge'
    ];
    
    return names[index % names.length];
  }
  
  private getMockNeighborhoodData(): NeighborhoodData {
    return {
      name: 'Richland Heights',
      overview: {
        description: 'A family-friendly neighborhood with quiet streets, well-maintained parks, and excellent schools. Close to shopping centers and restaurants.',
        type: 'Residential',
        ratings: {
          overall: 4.2,
          safety: 4.5,
          schools: 4.3,
          amenities: 3.8,
          costOfLiving: 3.4,
          outdoorActivities: 4.6
        }
      },
      demographics: {
        population: 12485,
        medianAge: 37.5,
        households: 4930,
        homeownership: 0.78,
        medianIncome: '$89,500',
        education: {
          highSchool: 0.96,
          bachelors: 0.42,
          graduate: 0.18
        }
      },
      housing: {
        medianHomeValue: '$375,000',
        medianRent: '$1,750',
        valueChange: {
          oneYear: 0.08,
          fiveYear: 0.31
        },
        propertyTypes: {
          singleFamily: 0.72,
          condo: 0.08,
          townhouse: 0.12,
          apartment: 0.08
        }
      },
      amenities: {
        groceryStores: [
          { name: 'Yoke\'s Fresh Market', distance: 0.8 },
          { name: 'Fred Meyer', distance: 1.5 },
          { name: 'Albertsons', distance: 2.3 }
        ],
        restaurants: [
          { name: 'Porter\'s Real BBQ', distance: 0.7 },
          { name: 'Olive Garden', distance: 1.2 },
          { name: 'Bonefish Grill', distance: 1.8 },
          { name: 'Red Robin', distance: 2.0 }
        ],
        parks: [
          { name: 'Leslie Groves Park', distance: 0.5 },
          { name: 'Howard Amon Park', distance: 1.1 },
          { name: 'Columbia Point Golf Course', distance: 2.2 }
        ],
        schools: [
          { name: 'Lewis & Clark Elementary', distance: 0.6, rating: 8.5 },
          { name: 'Hanford High School', distance: 1.9, rating: 9.0 },
          { name: 'Enterprise Middle School', distance: 1.1, rating: 7.8 }
        ]
      },
      marketTrends: {
        avgDaysOnMarket: 22,
        listToSaleRatio: 0.98,
        pricePerSqFt: {
          current: 195,
          lastYear: 175,
          change: 0.114
        },
        inventoryLevel: 'Low',
        competitiveIndex: 'High'
      }
    };
  }
}

export const neighborhoodService = new NeighborhoodService();