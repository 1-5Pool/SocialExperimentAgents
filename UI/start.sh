#!/bin/bash

echo "🚀 Starting Social Experiment UI..."
echo ""
echo "📋 Checking requirements..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

echo "✅ Python 3 found"

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "⚠️  Backend not detected on http://localhost:8000"
    echo "   Start it with: cd ../backend && bash deployment/run_local.sh"
    echo "   UI will work in demo mode without backend"
fi

echo ""
echo "🌐 Starting UI server..."
exec python3 serve.py