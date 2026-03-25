#!/bin/bash

# Jest Test Setup Script
echo "🧪 Setting up Jest testing environment..."

# Install dependencies
echo "📦 Installing test dependencies..."
npm install --save-dev ts-jest

# Remove problematic SWC dependency if it exists
echo "🗑️ Removing problematic SWC dependency..."
npm uninstall @swc/jest @swc/core

# Clear Jest cache
echo "🧹 Clearing Jest cache..."
npx jest --clearCache

# Run a simple test to verify setup
echo "✅ Running configuration test..."
npm run test -- __tests__/config.test.ts

echo "🎉 Jest setup complete!"
echo ""
echo "Available test commands:"
echo "  npm test                    # Run all tests"
echo "  npm run test:watch         # Watch mode"
echo "  npm run test:coverage      # With coverage"
echo "  npm run test:debug         # Debug mode"
echo "  npm run test:verbose       # Verbose output"
echo ""
echo "If you encounter any issues, try:"
echo "  npm run test:clear-cache   # Clear Jest cache"
echo "  npm run test:debug         # Run in debug mode"







