#!/bin/bash

echo "Starting SupplyChainLens Backend..."

# Change to backend directory
cd /app/backend

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "Error: dist directory not found. Building backend..."
    npm run build
fi

# Check if dist/index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "Error: dist/index.js not found. Building backend..."
    npm run build
fi

echo "Starting Node.js application..."
node dist/index.js
