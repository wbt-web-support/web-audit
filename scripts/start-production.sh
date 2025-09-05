#!/bin/bash

# Production startup script for optimized web audit system
echo "🚀 Starting optimized web audit system..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start workers in background
echo "👷 Starting crawler workers..."
npm run workers &

# Start Next.js application
echo "🌐 Starting Next.js application..."
npm start

# Wait for background processes
wait
