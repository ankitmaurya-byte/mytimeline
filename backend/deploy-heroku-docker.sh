#!/bin/bash

# Heroku Docker Deployment Script for Timeline Backend
# This script automates the Heroku Docker deployment process

set -e  # Exit on error

echo "🚀 Starting Heroku Docker deployment for Timeline Backend..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   Visit: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged into Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "📝 Please log in to Heroku..."
    heroku login
fi

# Get app name from user or use default
if [ -z "$1" ]; then
    read -p "Enter your Heroku app name (or press Enter for auto-generated): " APP_NAME
else
    APP_NAME="$1"
fi

# Create Heroku app if it doesn't exist
if [ -n "$APP_NAME" ]; then
    echo "🏗️  Creating Heroku app: $APP_NAME"
    heroku apps:create "$APP_NAME" || echo "App might already exist, continuing..."
    HEROKU_APP="$APP_NAME"
else
    echo "🏗️  Creating Heroku app with auto-generated name..."
    HEROKU_APP=$(heroku apps:create --json | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    echo "📱 Created app: $HEROKU_APP"
fi

# Set stack to container for Docker deployment
echo "🐳 Setting Heroku stack to container..."
heroku stack:set container -a "$HEROKU_APP"

# Set environment variables
echo "🔧 Setting up environment variables..."
echo "⚠️  You'll need to set these environment variables in Heroku dashboard or via CLI:"
echo "   - MONGO_URI"
echo "   - JWT_SECRET"
echo "   - JWT_REFRESH_SECRET"
echo "   - SESSION_SECRET"
echo ""
read -p "Do you want to set these now? (y/n): " SET_ENV

if [[ $SET_ENV =~ ^[Yy]$ ]]; then
    read -p "Enter MONGO_URI: " MONGO_URI
    read -p "Enter JWT_SECRET (min 32 chars): " JWT_SECRET
    read -p "Enter JWT_REFRESH_SECRET: " JWT_REFRESH_SECRET
    read -p "Enter SESSION_SECRET: " SESSION_SECRET
    
    heroku config:set MONGO_URI="$MONGO_URI" -a "$HEROKU_APP"
    heroku config:set JWT_SECRET="$JWT_SECRET" -a "$HEROKU_APP"
    heroku config:set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" -a "$HEROKU_APP"
    heroku config:set SESSION_SECRET="$SESSION_SECRET" -a "$HEROKU_APP"
    heroku config:set NODE_ENV=production -a "$HEROKU_APP"
    heroku config:set NEXT_TELEMETRY_DISABLED=1 -a "$HEROKU_APP"
fi

# Login to Heroku Container Registry
echo "🔐 Logging into Heroku Container Registry..."
heroku container:login

# Build and push Docker image
echo "🔨 Building and pushing Docker image..."
heroku container:push web -a "$HEROKU_APP"

# Release the image
echo "🚀 Releasing the application..."
heroku container:release web -a "$HEROKU_APP"

# Open the app
echo "✅ Deployment complete!"
echo "🌐 Your app is available at: https://$HEROKU_APP.herokuapp.com"
echo "📊 View logs: heroku logs --tail -a $HEROKU_APP"
echo "⚙️  Manage app: heroku dashboard -a $HEROKU_APP"

read -p "Open app in browser? (y/n): " OPEN_APP
if [[ $OPEN_APP =~ ^[Yy]$ ]]; then
    heroku open -a "$HEROKU_APP"
fi
