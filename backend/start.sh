#!/bin/sh

# Go WebSocket runs on internal port 8001
export WS_PORT=8001

# Start the Go WebSocket server in the background
./websocket-server &

# Give Go server a moment to start
sleep 2

# Start the Node.js server in the foreground (uses $PORT from Heroku)
npm run start:server:prod
