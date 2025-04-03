#!/bin/bash

# Script to run specific tests for the Neighborhood Comparison features

# Build the application first
echo "Building the application..."
npm run build --if-present

# Run specific tests
echo "Running Neighborhood Score Card tests..."
npx jest NeighborhoodScoreCard.test.tsx --detectOpenHandles --config=jest.config.cjs

echo "Running Neighborhood Trend Graph tests..."
npx jest NeighborhoodTrendGraph.test.tsx --detectOpenHandles --config=jest.config.cjs

echo "Running Neighborhood Comparison Report Service tests..."
npx jest neighborhoodComparisonReportService.test.ts --detectOpenHandles --config=jest.config.cjs

echo "Tests completed."