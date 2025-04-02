/**
 * ZillowDataConnector Core Test
 * 
 * Tests the basic functionality of the ZillowDataConnector, checking if
 * it can properly initialize and verify availability.
 */
import { zillowDataConnector } from '../../services/etl/ZillowDataConnector';

// Mock fetch for testing
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, message: 'API is available' }),
  })
);

describe('ZillowDataConnector', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });
  
  test('should be instantiated with correct configuration', () => {
    expect(zillowDataConnector).toBeDefined();
    expect(zillowDataConnector.getSourceName()).toBe('Zillow API');
  });
  
  test('should check API availability', async () => {
    const isAvailable = await zillowDataConnector.checkAvailability();
    
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
    
    const isAvailable = await zillowDataConnector.checkAvailability();
    
    expect(isAvailable).toBe(false);
  });
});