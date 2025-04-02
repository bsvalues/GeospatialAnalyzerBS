import React from 'react';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import { MemoryRouter } from 'react-router-dom';

// Mock any components that might cause issues in tests
jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="mock-toaster">Toaster</div>,
}));

// Mock any context providers if needed
jest.mock('../contexts/MapAccessibilityContext', () => ({
  MapAccessibilityProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../contexts/PropertyFilterContext', () => ({
  PropertyFilterProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../contexts/AutoHideContext', () => ({
  AutoHideProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../contexts/TourContext', () => ({
  TourProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the routes we want to test
jest.mock('@/pages/income-test', () => () => <div data-testid="income-test-page">Income Test Page</div>);
jest.mock('@/pages/home', () => () => <div data-testid="home-page">Home Page</div>);

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    // The test passes if the render doesn't throw
  });
  
  test('renders home page by default', () => {
    // We need to create our own Router with a specific initial entry
    // since App uses wouter which doesn't easily work with MemoryRouter
    window.history.pushState({}, 'Home', '/');
    
    render(<App />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
  
  test('navigates to income-test page', () => {
    // Set the URL to /income-test
    window.history.pushState({}, 'Income Test', '/income-test');
    
    render(<App />);
    expect(screen.getByTestId('income-test-page')).toBeInTheDocument();
  });
});