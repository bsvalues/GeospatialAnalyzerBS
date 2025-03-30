#!/bin/bash

# Usage: ./run-single-test.sh <test-file-path>
# Example: ./run-single-test.sh client/src/__tests__/MapPanel.test.tsx

if [ -z "$1" ]; then
  echo "Error: Please provide a test file path"
  echo "Usage: ./run-single-test.sh <test-file-path>"
  echo "Example: ./run-single-test.sh client/src/__tests__/MapPanel.test.tsx"
  exit 1
fi

# Run the specified test file with Jest
NODE_OPTIONS=--experimental-vm-modules npx jest "$1" --verbose