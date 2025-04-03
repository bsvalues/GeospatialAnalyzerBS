/**
 * Basic Application Test
 * 
 * This test verifies that core components render without crashing.
 * These are simple smoke tests that check basic rendering capability.
 */

import React from 'react';
import { renderWithProviders, setupFetchMock, resetAllMocks } from './utils/test-utils';

// Import components to test
import Header from '../components/Header';
import Welcome from '../components/Welcome';

describe('Basic Component Rendering', () => {
  beforeAll(() => {
    // Suppress console errors during test runs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock fetch for all tests
    setupFetchMock([]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resetAllMocks();
  });

  test('Header component renders without crashing', () => {
    // Mock props required by the Header component
    const mockProps = {
      taxYear: '2025',
      onTaxYearChange: jest.fn(),
    };
    
    try {
      const { container } = renderWithProviders(<Header {...mockProps} />);
      // Just test that something rendered
      expect(container).toBeTruthy();
    } catch (error) {
      fail('Header component failed to render: ' + error);
    }
  });

  test('Welcome component renders without crashing', () => {
    try {
      const { container } = renderWithProviders(<Welcome />);
      // Just test that something rendered
      expect(container).toBeTruthy();
    } catch (error) {
      fail('Welcome component failed to render: ' + error);
    }
  });
});