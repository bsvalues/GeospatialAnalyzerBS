// Import Jest DOM extensions
import '@testing-library/jest-dom';
import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';

// Make Jest globals available in all test files
globalThis.jest = jest;
globalThis.describe = describe;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.test = test;
globalThis.expect = expect;

// Mock the global fetch API
global.fetch = jest.fn();

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock Leaflet since it relies on browser APIs
jest.mock('leaflet', () => ({
  map: jest.fn().mockReturnValue({
    setView: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  }),
  tileLayer: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  }),
  marker: jest.fn().mockReturnValue({
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    setLatLng: jest.fn(),
  }),
  icon: jest.fn(),
  CRS: {
    EPSG3857: {}
  },
  latLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
  latLngBounds: jest.fn().mockImplementation((sw, ne) => ({ 
    getSouthWest: () => sw,
    getNorthEast: () => ne,
    getCenter: () => ({ lat: (sw.lat + ne.lat) / 2, lng: (sw.lng + ne.lng) / 2 }),
  })),
  divIcon: jest.fn().mockReturnValue({}),
  point: jest.fn().mockImplementation((x, y) => ({ x, y })),
}));

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});