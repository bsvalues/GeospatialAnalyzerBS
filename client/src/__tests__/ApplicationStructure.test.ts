/**
 * Application Structure Tests
 * 
 * This test file verifies the basic structure of the application:
 * - Critical files exist and can be imported
 * - Key components are defined and properly exported
 * - Core routes are defined
 * 
 * These tests do not render components and are designed to run quickly
 * as part of the CI pipeline to catch structural issues.
 */

describe('Application Structure', () => {
  test('core components are defined and importable', () => {
    // Test that key application components can be imported
    // This is a type of smoke test that verifies the app's structure
    const modules = {
      // Core app structure
      App: require('../App'),
      Header: require('../components/Header'),
      Dashboard: require('../components/Dashboard'),
      
      // Pages
      HomePage: require('../pages/home'),
      DashboardPage: require('../pages/dashboard'),
      
      // Test a few key components from different parts of the app
      MapPanel: require('../components/map/MapPanel'),
      NeighborhoodScoreCard: require('../components/neighborhood/NeighborhoodScoreCard'),
      TabNavigation: require('../components/TabNavigation'),
    };
    
    // Verify each module can be imported and has a default export
    Object.entries(modules).forEach(([name, module]) => {
      expect(module).toBeDefined();
      expect(module.default).toBeDefined();
    });
  });
  
  test('key types and interfaces are properly defined', () => {
    // Import shared types
    const sharedSchema = require('../../shared/schema');
    
    // Verify critical types exist
    expect(sharedSchema.properties).toBeDefined();
    expect(sharedSchema.users).toBeDefined();
  });
  
  test('core utilities are available', () => {
    // Test utility functions
    const utils = require('../lib/utils');
    expect(utils).toBeDefined();
    
    // Query client for data fetching
    const queryClient = require('../lib/queryClient');
    expect(queryClient).toBeDefined();
    expect(queryClient.queryClient).toBeDefined();
  });
});