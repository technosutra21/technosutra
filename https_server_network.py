#!/usr/bin/env python3
"""
Techno Sutra AR - Network HTTPS Server for Local Testing
Enables Safari AR testing on local network with self-signed HTTPS
"""

import http.server
import ssl
import os
import sys
import socket
import json
from pathlib import Path

# Configuration
HOST = '0.0.0.0'  # Listen on all network interfaces
PORT = 4443
CERT_FILE = 'cert.pem'
KEY_FILE = 'key.pem'

def get_local_ip():
    """Get local network IP address"""
    try:
        # Connect to a public DNS server (doesn't actually connect)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def print_welcome_banner():
    """Print server information"""
    local_ip = get_local_ip()
    print("\n" + "=" * 70)
    print("  Techno Sutra AR - Network HTTPS Testing Server")
    print("=" * 70)
    print()
    print("✅ Server Status: RUNNING")
    print()
    print("🔐 HTTPS Endpoints:")
    print(f"   • Local:    https://localhost:{PORT}")
    print(f"   • Network:  https://{local_ip}:{PORT}")
    print()
    print("📱 Testing on iOS/Safari:")
    print(f"   1. Connect iOS to same Wi-Fi network")
    print(f"   2. Visit: https://{local_ip}:{PORT}")
    print(f"   3. Tap 'Allow' for certificate (self-signed OK for local testing)")
    print(f"   4. Navigate to AR experience")
    print(f"   5. Tap '📲 Abrir em AR' or press Space")
    print()
    print("🤖 Testing on Android/Chrome:")
    print(f"   1. Connect Android to same Wi-Fi network")
    print(f"   2. Visit: https://{local_ip}:{PORT}")
    print(f"   3. Ignore certificate warning (proceed anyway)")
    print(f"   4. Navigate to AR experience")
    print(f"   5. Tap '📲 Abrir em AR' or press Space")
    print()
    print("💻 Desktop Testing:")
    print(f"   1. Visit: https://localhost:{PORT}")
    print(f"   2. Ignore certificate warning")
    print(f"   3. Open DevTools (F12) → Application → Service Workers")
    print()
    print("📊 Developer Console:")
    print("   • Monitor: SW: Cached model [X/56]")
    print("   • Test offline: DevTools → Application → Clear storage → Reload")
    print()
    print("🛑 Stop Server: Press Ctrl+C")
    print("=" * 70 + "\n")

def check_certificates():
    """Verify SSL certificates exist"""
    if not os.path.exists(CERT_FILE) or not os.path.exists(KEY_FILE):
        print("⚠️  SSL certificates not found!")
        print()
        print("Generate certificates with:")
        print("  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes")
        print()
        sys.exit(1)

def create_router_handler():
    """Create custom request handler with routing"""
    class TechnoSutraHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # Add CORS headers for AR model access
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            # Cache control for models
            if self.path.endswith('.glb'):
                self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            elif self.path.endswith('.js') or self.path.endswith('.css'):
                self.send_header('Cache-Control', 'public, max-age=3600')
            else:
                self.send_header('Cache-Control', 'no-cache, must-revalidate')
            # Security headers
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'SAMEORIGIN')
            super().end_headers()

        def do_OPTIONS(self):
            """Handle CORS preflight"""
            self.send_response(200)
            self.end_headers()

        def log_message(self, format, *args):
            """Custom logging"""
            # Log model caching
            if 'modelo' in self.path and '.glb' in self.path:
                print(f"  📦 {args[0]} {self.path}")
            # Log SW and JS
            elif 'sw.js' in self.path or 'manifest.json' in self.path:
                print(f"  ⚙️  {args[0]} {self.path}")
            # Log other requests
            elif self.path not in ['/', ''] and 'GET' in format:
                print(f"  📄 {args[0]} {self.path}")

    return TechnoSutraHandler

def main():
    """Start the HTTPS server"""
    # Verify certificates
    check_certificates()
    
    # Change to project directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create server
    handler = create_router_handler()
    httpd = http.server.HTTPServer((HOST, PORT), handler)
    
    # Configure SSL/TLS
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    # Print welcome banner
    print_welcome_banner()
    
    # Start server
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down server...")
        httpd.server_close()
        print("✓ Server stopped\n")

if __name__ == '__main__':
    main()
