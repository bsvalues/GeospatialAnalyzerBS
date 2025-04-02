#!/bin/bash

# Script to run only the core functionality tests
# These tests are essential for verifying that the application's
# critical components are working correctly.

echo "Running core functionality tests..."
NODE_OPTIONS=--experimental-vm-modules npx jest client/src/__tests__/core/ --detectOpenHandles --verbose

echo "Core tests completed."