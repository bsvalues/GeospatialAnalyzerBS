#!/bin/bash

# This script runs a single test file with a shorter timeout
# Usage: ./run-quick-test.sh path/to/test.test.tsx

if [ -z "$1" ]; then
  echo "Usage: ./run-quick-test.sh path/to/test.test.tsx"
  exit 1
fi

TEST_FILE=$1

echo "Running quick test: $TEST_FILE"
NODE_OPTIONS="--max-old-space-size=512 --experimental-vm-modules" npx jest $TEST_FILE --no-cache --testTimeout=5000 --forceExit

echo "Test completed."