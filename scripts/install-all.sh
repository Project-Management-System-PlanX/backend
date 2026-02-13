#!/bin/bash

echo "🚀 Installing TeamUp Backend Dependencies..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install workspace dependencies
echo "📦 Installing workspace dependencies..."
npm run install:all

echo "✅ All dependencies installed successfully!"
