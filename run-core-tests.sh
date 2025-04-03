#!/bin/bash

# Script to run only the core/lightweight tests for the application
# These tests are designed to run quickly and verify basic functionality

# Make the script executable (in case it's not already)
chmod +x run-tests.sh

echo "Running core application tests..."

# Run the basic/core tests
echo "Testing basic application structure..."
npx jest ApplicationStructure.test.ts --verbose --config=jest.config.cjs --detectOpenHandles

echo "Testing Application startup..."
npx jest AppStartup.test.tsx --verbose --config=jest.config.cjs --detectOpenHandles

echo "Testing basic component rendering..."
npx jest Basic.test.tsx --verbose --config=jest.config.cjs --detectOpenHandles

echo "Core tests completed."