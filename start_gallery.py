#!/usr/bin/env python3
"""Start the gallery with dynamic model discovery."""
import subprocess
import sys
import http.server
import socketserver
from pathlib import Path

def main():
    """Generate models list and start HTTP server."""
    print("🔍 Scanning for available models...")
    
    # Generate models.json
    result = subprocess.run([sys.executable, "generate_models_list.py"], 
                          capture_output=False)
    
    if result.returncode != 0:
        print("❌ Failed to generate models list")
        sys.exit(1)
    
    print()
    print("✓ Models list generated successfully")
    print()
    print("🚀 Starting HTTP server on port 8000...")
    print("   Open: http://localhost:8000/galeria.html")
    print()
    print("   Press Ctrl+C to stop the server")
    print()
    
    # Start HTTP server
    PORT = 8000
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
        sys.exit(0)

if __name__ == "__main__":
    main()
