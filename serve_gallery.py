#!/usr/bin/env python3
"""
Secure HTTP server to serve the Techno Sutra gallery
Enhanced with security features for production use
Run this script and open http://localhost:8000 in your browser
"""

import http.server
import socketserver
import os
import webbrowser
import time
import json
from pathlib import Path
from datetime import datetime

def serve_gallery():
    # Change to the directory containing the gallery files
    gallery_dir = Path(__file__).parent
    os.chdir(gallery_dir)
    
    PORT = 8000
    
    # Enhanced request handler with security features
    class SecureGalleryHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            self.rate_limit_cache = {}
            super().__init__(*args, **kwargs)
        
        def check_rate_limit(self, client_ip):
            """Basic rate limiting for development"""
            current_time = time.time()
            window_start = current_time - 60  # 1 minute window
            
            if client_ip not in self.rate_limit_cache:
                self.rate_limit_cache[client_ip] = []
            
            # Clean old entries
            self.rate_limit_cache[client_ip] = [
                timestamp for timestamp in self.rate_limit_cache[client_ip] 
                if timestamp > window_start
            ]
            
            # Check limit (100 requests per minute for development)
            if len(self.rate_limit_cache[client_ip]) >= 100:
                return False
            
            self.rate_limit_cache[client_ip].append(current_time)
            return True
        
        def validate_path(self, path):
            """Validate requested path"""
            # Check for directory traversal
            if ".." in path or "\\" in path:
                return False
            
            # Check for allowed file types
            allowed_extensions = ['.html', '.css', '.js', '.glb', '.usdz', '.json', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.txt', '.md']
            if "." in path:
                ext = os.path.splitext(path)[1].lower()
                if ext and ext not in allowed_extensions:
                    return False
            
            return True
        
        def add_security_headers(self):
            """Add security headers"""
            # Basic security headers for development
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'SAMEORIGIN')
            self.send_header('X-XSS-Protection', '1; mode=block')
            self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
            
            # CORS headers (relaxed for development)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            
            # Cache control
            if self.path.endswith(('.css', '.js', '.glb', '.usdz')):
                self.send_header('Cache-Control', 'public, max-age=86400')
            else:
                self.send_header('Cache-Control', 'no-cache')
        
        def log_access(self, message):
            """Log access attempts"""
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            client_ip = self.client_address[0]
            user_agent = self.headers.get('User-Agent', 'Unknown')
            
            log_entry = f"[{timestamp}] {client_ip} - {message} - {self.path} - {user_agent}"
            print(log_entry)
            
            # Log to file in development
            try:
                os.makedirs('logs', exist_ok=True)
                with open('logs/access.log', 'a', encoding='utf-8') as f:
                    f.write(f"{log_entry}\n")
            except:
                pass
        
        def do_GET(self):
            """Handle GET requests with security checks"""
            client_ip = self.client_address[0]
            
            # Rate limiting
            if not self.check_rate_limit(client_ip):
                self.log_access("RATE_LIMITED")
                self.send_error(429, "Too Many Requests")
                return
            
            # Path validation
            if not self.validate_path(self.path):
                self.log_access("INVALID_PATH")
                self.send_error(403, "Forbidden")
                return
            
            # Log model access
            if self.path.endswith(('.glb', '.usdz')):
                self.log_access("MODEL_ACCESS")
            else:
                self.log_access("ACCESS")
            
            # Process request
            super().do_GET()
        
        def do_HEAD(self):
            """Handle HEAD requests with security checks"""
            client_ip = self.client_address[0]
            
            # Rate limiting
            if not self.check_rate_limit(client_ip):
                self.log_access("RATE_LIMITED")
                self.send_error(429, "Too Many Requests")
                return
            
            # Path validation
            if not self.validate_path(self.path):
                self.log_access("INVALID_PATH")
                self.send_error(403, "Forbidden")
                return
            
            self.log_access("HEAD_ACCESS")
            super().do_HEAD()
        
        def end_headers(self):
            """Add security headers to all responses"""
            self.add_security_headers()
            super().end_headers()
        
        def send_error(self, code, message=None):
            """Send error with security considerations"""
            # Generic error messages
            safe_messages = {
                400: "Bad Request",
                403: "Forbidden",
                404: "Not Found",
                429: "Too Many Requests",
                500: "Internal Server Error"
            }
            safe_message = safe_messages.get(code, "Error")
            super().send_error(code, safe_message)
    
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    with socketserver.TCPServer(("", PORT), SecureGalleryHandler) as httpd:
        print("[SECURE] Techno Sutra AR - Secure Development Server")
        print("=" * 50)
        print(f"[WEB] Server URL: http://localhost:{PORT}")
        print(f"[DIR] Serving from: {os.getcwd()}")
        print(f"[SEC] Security features:")
        print("   - Rate limiting (100 req/min)")
        print("   - Path validation")
        print("   - Security headers")
        print("   - Access logging")
        print("   - File type restrictions")
        print()
        print("[PAGES] Available pages:")
        print(f"   Gallery: http://localhost:{PORT}/galeria.html")
        print(f"   AR View: http://localhost:{PORT}/index.html")
        print(f"   Security Test: http://localhost:{PORT}/index.html?security-test=true")
        print()
        print("[LOG] Logs: logs/access.log")
        print("[CTRL] Press Ctrl+C to stop")
        print()
        
        # Try to open the browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}/galeria.html')
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[STOP] Server stopped by user")

if __name__ == "__main__":
    serve_gallery()
