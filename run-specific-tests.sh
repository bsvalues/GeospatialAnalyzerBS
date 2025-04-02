#!/bin/bash

# Script to run specific tests for the Income Approach Grouping feature

# Build the application first
echo "Building the application..."
npm run build --if-present

# Make script executable
chmod +x run-tests.sh

# Run specific tests
echo "Running Income Approach tests..."
npx jest IncomeApproach.test.ts --detectOpenHandles

echo "Running Income Test Page UI tests..."
npx jest IncomeTestPage.test.tsx --detectOpenHandles

echo "Running App Startup tests..."
npx jest AppStartup.test.tsx --detectOpenHandles

echo "Tests completed."