/**
 * GoogleMapsDataConnector Core Test
 * 
 * Tests the basic functionality of the GoogleMapsDataConnector, checking if
 * it can properly initialize and verify availability.
 */
import { googleMapsDataConnector } from '../../services/etl/GoogleMapsDataConnector';

// Mock fetch for testing
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, message: 'API is available' }),
  })
);

describe('GoogleMapsDataConnector', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });
  
  test('should be instantiated with correct configuration', () => {
    expect(googleMapsDataConnector).toBeDefined();
    expect(googleMapsDataConnector.getSourceName()).toBe('Google Maps API');
  });
  
  test('should check API availability', async () => {
    const isAvailable = await googleMapsDataConnector.checkAvailability();
    
    expect(isAvailable).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
  
  test('should handle API failure gracefully', async () => {
    // Mock fetch to simulate API failure
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'API error' }),
      })
    );
    
    const isAvailable = await googleMapsDataConnector.checkAvailability();
    
    expect(isAvailable).toBe(false);
  });
});