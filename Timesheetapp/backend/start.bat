#!/bin/bash
# Kill any existing node processes on port 3001
netstat -ano | findstr :3001 | for /f "tokens=5" %a in ('more') do taskkill /pid %a /f

# Start the server
echo "Starting backend server..."
node src/server.js
