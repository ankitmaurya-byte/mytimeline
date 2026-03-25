#!/bin/bash

# Timeline WebSocket Server Runner

echo "🚀 Starting Timeline Go WebSocket Server..."

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET environment variable is required"
    echo "Set it with: export JWT_SECRET='your-secret-key'"
    exit 1
fi

# Set default port if not set
if [ -z "$WS_PORT" ]; then
    export WS_PORT="8080"
fi

echo "📡 WebSocket server will run on port $WS_PORT"
echo "🔐 Using JWT secret: ${JWT_SECRET:0:10}..."

# Run the server
./websocket-server