#!/bin/bash

# Deployment script for Next.js backend
echo "Starting deployment..."

# Clean up any existing build artifacts
rm -rf .next
rm -rf node_modules

# Install dependencies without dev dependencies for production
npm ci --only=production

# Install only essential dev dependencies
npm install --save-dev typescript @next/eslint-plugin-next eslint-config-next

# Remove @types/react if it gets installed
npm uninstall @types/react 2>/dev/null || true

# Build the project
echo "Building Next.js project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful! Deployment complete."
else
    echo "Build failed! Check the logs above."
    exit 1
fi
