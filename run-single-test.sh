#!/bin/bash

# This script runs a single test file
# Usage: ./run-single-test.sh path/to/test.test.tsx

if [ -z "$1" ]; then
  echo "Usage: ./run-single-test.sh path/to/test.test.tsx"
  exit 1
fi

TEST_FILE=$1

echo "Running test: $TEST_FILE"
NODE_OPTIONS=--experimental-vm-modules npx jest $TEST_FILE --no-cache --detectOpenHandles

echo "Test completed."