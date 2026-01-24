#!/bin/bash
# Start HTTPS development server for AR debugging
# Usage: ./start-debug-server.sh [port]

PORT=${1:-4443}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Techno Sutra AR Debug Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for cert/key
if [ ! -f "$PROJECT_DIR/cert.pem" ] || [ ! -f "$PROJECT_DIR/key.pem" ]; then
    echo "❌ SSL certificates not found!"
    echo "   Generate with: openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes"
    exit 1
fi

echo "📁 Project: $PROJECT_DIR"
echo "🔒 Port: https://localhost:$PORT"
echo "🌐 Test AR: https://localhost:$PORT/test-model"
echo ""
echo "⚠️  Self-signed certificate - accept browser warning"
echo "📱 For iOS: Use machine IP instead of localhost"
echo "   https://$(hostname -I | awk '{print $1}'):$PORT/test-model"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$PROJECT_DIR"

# Try Python 3 first
if command -v python3 &> /dev/null; then
    python3 https_server.py
elif command -v python &> /dev/null; then
    python https_server.py
else
    echo "❌ Python not found!"
    exit 1
fi
