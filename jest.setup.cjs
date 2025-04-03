// Import Jest DOM extensions
require('@testing-library/jest-dom');

// Import React for JSX
const React = require('react');
global.React = React;

// Jest globals are already available in the test environment

// Mock the global fetch API
global.fetch = jest.fn();

// Polyfill TextEncoder and TextDecoder
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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

// Mock intro.js-react
jest.mock('intro.js-react', () => ({
  Steps: jest.fn().mockImplementation(() => {
    return {
      render: () => null
    };
  }),
}));

// Mock CSS imports
jest.mock('intro.js/introjs.css', () => {});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('div', props, children);
    }),
    h1: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('h1', props, children);
    }),
    h2: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('h2', props, children);
    }),
    h3: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('h3', props, children);
    }),
    p: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('p', props, children);
    }),
    path: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('path', props, children);
    }),
  },
  AnimatePresence: jest.fn().mockImplementation(({ children }) => {
    return React.createElement(React.Fragment, null, children);
  }),
}));

// Mock shadcn components
jest.mock('@/components/ui/button', () => ({
  Button: jest.fn().mockImplementation(({ children, ...props }) => {
    return React.createElement('button', props, children);
  }),
}));

// Mock wouter
jest.mock('wouter', () => ({
  Link: jest.fn().mockImplementation(({ children, ...props }) => {
    return React.createElement('a', props, children);
  }),
  useLocation: jest.fn().mockReturnValue(["/", jest.fn()]),
  useRoute: jest.fn().mockReturnValue([false, {}]),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  // Create a generic mock for any icon component
  const createIconMock = (name) => jest.fn().mockImplementation(
    (props) => React.createElement('span', { 
      'data-testid': `icon-${name}`, 
      ...props 
    })
  );
  
  // Return an object with common icons
  return {
    MapIcon: createIconMock('map'),
    ArrowRight: createIconMock('arrow-right'),
    ChevronDown: createIconMock('chevron-down'),
    ChevronRight: createIconMock('chevron-right'),
    ChartBarIcon: createIconMock('chart-bar'),
    Layers: createIconMock('layers'),
    Building: createIconMock('building'),
    TrendingUp: createIconMock('trending-up'),
    Workflow: createIconMock('workflow'),
    FileText: createIconMock('file-text'),
    Database: createIconMock('database'),
    Calculator: createIconMock('calculator'),
    Home: createIconMock('home'),
    Settings: createIconMock('settings'),
    User: createIconMock('user'),
    Search: createIconMock('search'),
    Download: createIconMock('download'),
    Upload: createIconMock('upload'),
    Filter: createIconMock('filter'),
    Bell: createIconMock('bell'),
    Calendar: createIconMock('calendar'),
    CreditCard: createIconMock('credit-card'),
    LogOut: createIconMock('log-out'),
    HelpCircle: createIconMock('help-circle'),
    X: createIconMock('x'),
  };
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

// Mock react-leaflet modules 
jest.mock('react-leaflet', () => ({
  MapContainer: jest.fn().mockImplementation(({ children }) => {
    return React.createElement('div', null, children);
  }),
  TileLayer: jest.fn().mockImplementation(() => {
    return React.createElement('div');
  }),
  ZoomControl: jest.fn().mockImplementation(() => {
    return React.createElement('div');
  }),
  LayersControl: {
    BaseLayer: jest.fn().mockImplementation(({ children }) => {
      return React.createElement('div', null, children);
    }),
    Overlay: jest.fn().mockImplementation(({ children }) => {
      return React.createElement('div', null, children);
    }),
  },
  useMapEvents: jest.fn(),
  Marker: jest.fn().mockImplementation(() => {
    return React.createElement('div');
  }),
  Popup: jest.fn().mockImplementation(({ children }) => {
    return React.createElement('div', null, children);
  }),
  useMap: jest.fn().mockReturnValue({
    setView: jest.fn(),
    getZoom: jest.fn().mockReturnValue(10),
    getBounds: jest.fn().mockReturnValue({
      getNorthEast: jest.fn().mockReturnValue({ lat: 37.0, lng: -122.0 }),
      getSouthWest: jest.fn().mockReturnValue({ lat: 36.0, lng: -123.0 }),
    }),
  }),
}));

// Mock @react-leaflet/core
jest.mock('@react-leaflet/core', () => ({
  createControlHook: jest.fn(),
  createElementHook: jest.fn(),
  createLayerHook: jest.fn(),
  createControlComponent: jest.fn().mockReturnValue(() => {
    return React.createElement('div');
  }),
  createLayerComponent: jest.fn().mockReturnValue(() => {
    return React.createElement('div');
  }),
}));

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});