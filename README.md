# GeospatialAnalyzerBS

A sophisticated GIS-based property appraisal platform for Benton County, Washington, delivering advanced geospatial analytics with interactive neighborhood comparison capabilities and USPAP-compliant export functionality.

## Stack
- React with TypeScript
- Leaflet/React Leaflet for geospatial mapping
- Responsive mobile-friendly design
- Comprehensive test suite
- CI/CD integration
- Performance monitoring tools
- Advanced regression modeling
- Demographic analysis capabilities
- Interactive neighborhood comparison features

## Development Setup

### Installation
```bash
npm install
```

### Starting the Application
```bash
npm run dev
```

### Running Tests
```bash
# Run all tests
npm test

# Run core tests (ApplicationStructure, AppStartup, Basic)
bash ./run-core-tests.sh

# Run specific test files
npm test -- client/src/__tests__/Basic.test.tsx
```

## Test Infrastructure

The project has a comprehensive test infrastructure with the following components:

### Core Tests
- **ApplicationStructure.test.ts**: Verifies critical files, component exports, and core routes
- **AppStartup.test.tsx**: Confirms the application renders without crashing
- **Basic.test.tsx**: Validates basic component rendering

### Test Utilities
- `client/src/__tests__/utils/test-utils.tsx`: Common utilities for testing React components

### Mocks
- `client/src/__tests__/mocks/componentMocks.tsx`: Mock implementations of components
- `jest.setup.cjs`: Jest setup file with mock implementations of services and contexts

## Development Plan

The project follows a test-driven development approach. See `docs/test-driven-development-plan.md` for details.

## Features

### Current Features
- Basic application structure with React and TypeScript
- Core components and context providers
- Geospatial mapping capabilities with Leaflet

### Planned Features
- Enhanced ETL data pipelines
- Interactive neighborhood comparison
- Advanced valuation algorithms
- Property comparison tools
- USPAP-compliant export
- Spatial analysis
- Time series visualization

## Project Structure

```
├── client
│   └── src
│       ├── components    # React components
│       ├── contexts      # Context providers
│       ├── hooks         # Custom React hooks
│       ├── lib           # Utility libraries
│       ├── pages         # Page components
│       ├── services      # Service modules
│       └── utils         # Utility functions
├── server                # Backend services
└── shared                # Shared code between client and server
```

## License

Proprietary