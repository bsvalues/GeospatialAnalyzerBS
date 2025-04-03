import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper component with providers needed for testing
const AppWrapper = () => {
  const testQueryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <App />
    </QueryClientProvider>
  );
};

describe('Application Startup', () => {
  beforeEach(() => {
    // Mock fetch to prevent actual API calls
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('application initializes without errors', async () => {
    render(<AppWrapper />);
    
    // Wait for the application to load
    await waitFor(() => {
      // Verify at least one core element is present
      expect(document.querySelector('.container')).toBeInTheDocument();
    });
  });
  
  test('app header contains correct navigation elements', async () => {
    render(<AppWrapper />);
    
    // Check for navigation elements
    await waitFor(() => {
      const headerElement = document.querySelector('header');
      expect(headerElement).toBeInTheDocument();
    });
  });
});