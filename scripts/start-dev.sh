#!/bin/bash

# Development startup script for optimized web audit system
echo "🚀 Starting development environment..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start both Next.js and workers concurrently
echo "👷 Starting development server with workers..."
npm run dev:workers
