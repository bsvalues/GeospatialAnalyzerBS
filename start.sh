#!/bin/bash
export PATH="/mnt/nixmodules/nix/store/wfxq6w9bkp5dcfr8yb6789b0w7128gnb-nodejs-20.18.1/bin:$PATH"
echo "Starting server with Node.js at: $(which node)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
npm run dev