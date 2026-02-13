#!/bin/bash

echo "🗄️ Setting up databases..."

# Workspace Service
echo "📊 Running Workspace Service migrations..."
cd services/workspace-service
npx prisma migrate dev --name init
npx prisma generate
cd ../..

echo "✅ Database setup complete!"
