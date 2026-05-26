#!/bin/bash

# 🚀 TeamUp - Exact Reproducible Start Script
# This script replicates exactly how I (the AI) started your environment.

echo "--- 🔍 STEP 1: PORT CHECK ---"
echo "Checking if ports 3000 (Frontend), 3002 (Workspace), 3005 (Meeting) are free..."
lsof -i :3000,3002,3005

echo ""
echo "--- 📦 STEP 2: START BACKEND ---"
echo "Starting Workspace and Meeting services concurrently..."
# Run backend in the background so we can start frontend in the same terminal
npm run dev:all &
BACKEND_PID=$!

# Give backend a moment to initialize
sleep 2

echo ""
echo "--- 🖥️ STEP 3: START FRONTEND ---"
echo "Starting Next.js Dev Server..."
cd ../frontend
npm run dev

# Stop backend when frontend is stopped
trap "kill $BACKEND_PID" EXIT
