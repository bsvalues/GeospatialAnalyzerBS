/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
    '^@components/(.*)$': '<rootDir>/client/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/client/src/lib/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/node_modules/jest-transform-stub',
    // Mock leaflet image imports
    'leaflet/dist/images/.*': '<rootDir>/node_modules/jest-transform-stub'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        ...require('./tsconfig.json').compilerOptions,
        jsx: 'react-jsx', // Override the preserve setting
        isolatedModules: true,
        esModuleInterop: true
      }, 
      // Skip type checking for faster performance
      diagnostics: false,
      // Important for JSX/TSX
      jsx: 'react-jsx',
    }],
    // Add babel-jest for handling ES modules
    '^.+\\.js$': 'babel-jest',
    '^.+\\.css$': '<rootDir>/node_modules/jest-transform-stub',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/node_modules/jest-transform-stub',
  },
  transformIgnorePatterns: [
    // Include specific node_modules that use ESM
    '/node_modules/(?!(wouter|@esm-bundle|leaflet|react-leaflet|@leaflet|@react-leaflet)/)' 
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    '!client/src/**/*.d.ts',
  ],
  // Set reasonable timeouts to prevent test hanging
  testTimeout: 5000,
  // Improve performance with these settings
  maxWorkers: 1, // Run tests in series to avoid memory issues
  bail: true, // Stop immediately on first error
  verbose: true,
  // Disable cache to prevent stale results
  cache: false
};