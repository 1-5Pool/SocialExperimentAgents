#!/bin/bash

echo "=========================================="
echo "Multi-Agent Social Dynamics Lab"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if Letta server is running (optional)
echo ""
echo "Checking for Letta server..."
if curl -s http://localhost:8283/health > /dev/null; then
    echo "✅ Letta server detected at http://localhost:8283"
    echo "   Using real LLM agents"
else
    echo "⚠️  No Letta server found"
    echo "   Using mock agents (demo mode)"
    echo ""
    echo "   To use real LLM agents, run:"
    echo "   docker run -p 8283:8283 -e OPENAI_API_KEY=\$OPENAI_API_KEY letta/letta:latest"
fi

echo ""
echo "Starting application..."
echo "=========================================="
echo ""

# Run the application
python backend.py