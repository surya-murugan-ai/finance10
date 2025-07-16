#!/bin/bash

# QRT Closure Platform - Deployment Script
# This script handles deployment with build optimization

echo "🚀 Starting QRT Closure Platform deployment..."

# Set environment variables
export NODE_ENV=production
export VITE_NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build the application with optimizations
echo "📦 Building application..."
npm run build --silent

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📊 Build stats:"
    ls -lh dist/
    echo "📁 Client assets:"
    ls -lh dist/public/
    
    # Start the production server
    echo "🌟 Starting production server..."
    cd dist && node index.js
else
    echo "❌ Build failed! Falling back to development mode..."
    npm run dev
fi