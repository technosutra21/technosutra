#!/usr/bin/env python3
"""
Simple HTTP server to serve the Techno Sutra gallery
Run this script and open http://localhost:8000 in your browser
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

def serve_gallery():
    # Change to the directory containing the gallery files
    gallery_dir = Path(__file__).parent
    os.chdir(gallery_dir)
    
    PORT = 8000
    Handler = http.server.SimpleHTTPRequestHandler
    
    # Add CORS headers
    class CORSRequestHandler(Handler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
    
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"Serving gallery at http://localhost:{PORT}")
        print(f"Open http://localhost:{PORT}/galeria_improved.html in your browser")
        print("Press Ctrl+C to stop the server")
        
        # Try to open the browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}/galeria_improved.html')
        except:
            pass
        
        httpd.serve_forever()

if __name__ == "__main__":
    serve_gallery()
