#!/bin/bash

# Quick Deploy Script for Gatenjia
# Use this for quick deployments and restarts

set -e

echo "🚀 Quick Deploy - Gatenjia"

# Change to infra directory
cd "$(dirname "$0")/../infra" || exit 1

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "📦 Containers are running, restarting..."
    docker-compose restart
else
    echo "📦 Starting containers..."
    docker-compose up -d
fi

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check status
echo "✅ Deployment complete! Checking status..."
docker-compose ps

echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:4000"
echo "📊 Health:   http://localhost:4000/health"
