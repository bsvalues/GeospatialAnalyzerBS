#!/bin/bash

# Run Jest tests
if [ "$1" == "watch" ]; then
  NODE_OPTIONS=--experimental-vm-modules npx jest --watch
elif [ "$1" == "coverage" ]; then
  NODE_OPTIONS=--experimental-vm-modules npx jest --coverage
else
  NODE_OPTIONS=--experimental-vm-modules npx jest
fi