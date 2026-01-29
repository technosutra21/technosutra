#!/bin/bash
# Start gallery with dynamic model discovery

echo "🔍 Scanning for available models..."
python3 generate_models_list.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Models list generated successfully"
    echo ""
    echo "🚀 Starting HTTP server on port 8000..."
    echo "   Open: http://localhost:8000/galeria.html"
    echo ""
    python3 -m http.server 8000
else
    echo "❌ Failed to generate models list"
    exit 1
fi
