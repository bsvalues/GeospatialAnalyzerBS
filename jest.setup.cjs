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
jest.mock('leaflet', () => {
  // Create a proper prototype structure for L.Icon
  function IconMock(options) {
    this.options = options || {};
  }
  
  // Add methods to the Icon prototype
  IconMock.prototype = {
    createIcon: jest.fn(),
    createShadow: jest.fn()
  };
  
  // Setup Default icon constructor
  const DefaultIconConstructor = function() {
    this.options = {
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    };
  };
  
  // Setup Default icon prototype
  DefaultIconConstructor.prototype = {
    options: {
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    },
    mergeOptions: jest.fn(),
    createIcon: jest.fn(),
    createShadow: jest.fn()
  };
  
  // Assign the DefaultIcon constructor to Icon.Default
  IconMock.Default = DefaultIconConstructor;
  
  const L = {
    map: jest.fn().mockReturnValue({
      setView: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      invalidateSize: jest.fn(),
      getSize: jest.fn().mockReturnValue({ x: 500, y: 500 }),
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
    Icon: IconMock,
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
    // Add heatLayer method for leaflet.heat
    heatLayer: jest.fn().mockImplementation((points, options) => ({
      addTo: jest.fn().mockReturnThis(),
      setLatLngs: jest.fn(),
      setOptions: jest.fn(),
      redraw: jest.fn(),
    })),
    // Add MarkerClusterGroup for leaflet.markercluster
    markerClusterGroup: jest.fn().mockImplementation(() => ({
      addLayer: jest.fn(),
      addTo: jest.fn().mockReturnThis(),
      clearLayers: jest.fn(),
    })),
  };
  
  return L;
});

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
    invalidateSize: jest.fn(),
    getSize: jest.fn().mockReturnValue({ x: 500, y: 500 }),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
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

// Mock leaflet.heat
jest.mock('leaflet.heat', () => {
  // This is just an empty mock since leaflet.heat modifies L globally
  // The actual functionality is mocked in the L.heatLayer method above
});

// Mock leaflet.markercluster
jest.mock('leaflet.markercluster', () => {
  // This is just an empty mock since leaflet.markercluster modifies L globally
  // The actual functionality is mocked in the L.markerClusterGroup method above
});

// Mock chart.js
jest.mock('chart.js', () => {
  const Chart = jest.fn();
  Chart.register = jest.fn();
  
  return {
    Chart,
    registerables: [],
    LineElement: jest.fn(),
    LinearScale: jest.fn(),
    PointElement: jest.fn(),
    TimeScale: jest.fn(),
    Tooltip: jest.fn(),
    CategoryScale: jest.fn(),
  };
});

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => {
  return {
    Line: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('div', { 'data-testid': 'chart-line', ...props }, children);
    }),
    Bar: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('div', { 'data-testid': 'chart-bar', ...props }, children);
    }),
    Doughnut: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('div', { 'data-testid': 'chart-doughnut', ...props }, children);
    }),
  };
});

// Mock chartjs-adapter-date-fns
jest.mock('chartjs-adapter-date-fns', () => {
  // Empty mock - the adapter just registers with Chart.js
});

// Mock recharts
jest.mock('recharts', () => {
  const createComponent = (name) => 
    jest.fn().mockImplementation(({ children, ...props }) => 
      React.createElement('div', { 'data-testid': `recharts-${name}`, ...props }, children)
    );

  return {
    ResponsiveContainer: createComponent('responsive-container'),
    LineChart: createComponent('line-chart'),
    Line: createComponent('line'),
    XAxis: createComponent('x-axis'),
    YAxis: createComponent('y-axis'),
    CartesianGrid: createComponent('cartesian-grid'),
    Tooltip: createComponent('tooltip'),
    Legend: createComponent('legend'),
    BarChart: createComponent('bar-chart'),
    Bar: createComponent('bar'),
    PieChart: createComponent('pie-chart'),
    Pie: createComponent('pie'),
    Cell: createComponent('cell'),
    Area: createComponent('area'),
    AreaChart: createComponent('area-chart'),
  };
});

// We have created mock implementations directly in the file system
// No need to mock GoogleMapsDataConnector here anymore

// We will use the real AutoHideContext implementation

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});