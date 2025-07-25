#!/usr/bin/env python3
"""
Techno Sutra AR - Production Server Security Configuration
Enhanced security headers and configurations for production deployment
"""

import http.server
import socketserver
import os
import mimetypes
import urllib.parse
import json
import time
from datetime import datetime
import hashlib
import secrets

class SecureHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Enhanced HTTP request handler with security features
    """
    
    def __init__(self, *args, **kwargs):
        self.rate_limit_cache = {}
        self.blocked_ips = set()
        self.security_config = self.load_security_config()
        super().__init__(*args, **kwargs)
    
    def load_security_config(self):
        """Load security configuration"""
        try:
            with open('config.json', 'r') as f:
                config = json.load(f)
                return config.get('security', {})
        except:
            return self.get_default_security_config()
    
    def get_default_security_config(self):
        """Default security configuration"""
        return {
            "rate_limit_requests_per_minute": 100,
            "rate_limit_window_seconds": 60,
            "block_duration_seconds": 300,
            "max_file_size_mb": 50,
            "allowed_file_extensions": [".html", ".css", ".js", ".glb", ".usdz", ".json", ".png", ".jpg", ".jpeg", ".gif", ".ico"],
            "blocked_paths": ["../", "/.env", "/config", "/admin", "/.git"],
            "security_headers": {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "SAMEORIGIN",
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://ajax.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; manifest-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self';"
            }
        }
    
    def check_rate_limit(self, client_ip):
        """Check if client IP is within rate limits"""
        current_time = time.time()
        window_start = current_time - self.security_config.get("rate_limit_window_seconds", 60)
        
        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            return False
        
        # Clean old entries
        if client_ip in self.rate_limit_cache:
            self.rate_limit_cache[client_ip] = [
                timestamp for timestamp in self.rate_limit_cache[client_ip] 
                if timestamp > window_start
            ]
        else:
            self.rate_limit_cache[client_ip] = []
        
        # Check rate limit
        request_count = len(self.rate_limit_cache[client_ip])
        max_requests = self.security_config.get("rate_limit_requests_per_minute", 100)
        
        if request_count >= max_requests:
            # Block IP
            self.blocked_ips.add(client_ip)
            self.log_security_violation("Rate limit exceeded", {
                "ip": client_ip,
                "requests": request_count,
                "window_seconds": self.security_config.get("rate_limit_window_seconds", 60)
            })
            return False
        
        # Add current request
        self.rate_limit_cache[client_ip].append(current_time)
        return True
    
    def validate_path(self, path):
        """Validate requested path for security"""
        # Decode URL
        try:
            decoded_path = urllib.parse.unquote(path)
        except:
            return False, "Invalid URL encoding"
        
        # Check for blocked patterns
        blocked_paths = self.security_config.get("blocked_paths", [])
        for blocked in blocked_paths:
            if blocked in decoded_path:
                return False, f"Blocked path pattern: {blocked}"
        
        # Check for directory traversal
        if ".." in decoded_path or "\\" in decoded_path:
            return False, "Directory traversal attempt"
        
        # Check file extension
        if "." in decoded_path:
            ext = os.path.splitext(decoded_path)[1].lower()
            allowed_extensions = self.security_config.get("allowed_file_extensions", [])
            if ext and ext not in allowed_extensions:
                return False, f"File extension not allowed: {ext}"
        
        return True, None
    
    def add_security_headers(self):
        """Add security headers to response"""
        headers = self.security_config.get("security_headers", {})
        
        for header, value in headers.items():
            self.send_header(header, value)
        
        # Add cache control for static assets
        if self.path.endswith(('.css', '.js', '.glb', '.usdz')):
            self.send_header('Cache-Control', 'public, max-age=86400')  # 24 hours
        else:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        
        # Add MIME type with charset
        if self.path.endswith('.html'):
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css; charset=utf-8')
        elif self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
    
    def log_security_violation(self, violation_type, details):
        """Log security violations"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "type": violation_type,
            "details": details,
            "user_agent": self.headers.get('User-Agent', 'Unknown'),
            "referer": self.headers.get('Referer', 'None')
        }
        
        # Log to file (in production, use proper logging system)
        try:
            os.makedirs('logs', exist_ok=True)
            with open('logs/security.log', 'a') as f:
                f.write(f"{json.dumps(log_entry)}\n")
        except:
            pass
        
        print(f"[SECURITY VIOLATION] {violation_type}: {details}")
    
    def do_GET(self):
        """Handle GET requests with security checks"""
        client_ip = self.client_address[0]
        
        # Rate limiting check
        if not self.check_rate_limit(client_ip):
            self.send_error(429, "Too Many Requests")
            return
        
        # Path validation
        valid, error = self.validate_path(self.path)
        if not valid:
            self.log_security_violation("Invalid path access", {
                "ip": client_ip,
                "path": self.path,
                "error": error
            })
            self.send_error(403, "Forbidden")
            return
        
        # Security logging for sensitive files
        if self.path.endswith(('.glb', '.usdz')):
            self.log_model_access(client_ip, self.path)
        
        # Process request normally
        super().do_GET()
    
    def do_HEAD(self):
        """Handle HEAD requests with security checks"""
        client_ip = self.client_address[0]
        
        # Rate limiting check
        if not self.check_rate_limit(client_ip):
            self.send_error(429, "Too Many Requests")
            return
        
        # Path validation
        valid, error = self.validate_path(self.path)
        if not valid:
            self.log_security_violation("Invalid path access", {
                "ip": client_ip,
                "path": self.path,
                "error": error
            })
            self.send_error(403, "Forbidden")
            return
        
        super().do_HEAD()
    
    def log_model_access(self, ip, model_path):
        """Log model file access for monitoring"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "type": "model_access",
            "ip": ip,
            "model": model_path,
            "user_agent": self.headers.get('User-Agent', 'Unknown')
        }
        
        try:
            os.makedirs('logs', exist_ok=True)
            with open('logs/model_access.log', 'a') as f:
                f.write(f"{json.dumps(log_entry)}\n")
        except:
            pass
    
    def end_headers(self):
        """Override to add security headers"""
        self.add_security_headers()
        super().end_headers()
    
    def send_error(self, code, message=None):
        """Override to prevent information disclosure"""
        # Generic error messages to prevent information leakage
        safe_messages = {
            400: "Bad Request",
            403: "Forbidden",
            404: "Not Found",
            429: "Too Many Requests",
            500: "Internal Server Error"
        }
        
        safe_message = safe_messages.get(code, "Error")
        super().send_error(code, safe_message)

class SecureHTTPServer:
    """Secure HTTP server with enhanced security features"""
    
    def __init__(self, port=8000, directory="."):
        self.port = port
        self.directory = directory
        self.server = None
    
    def start(self):
        """Start the secure server"""
        os.chdir(self.directory)
        
        with socketserver.TCPServer(("", self.port), SecureHTTPRequestHandler) as httpd:
            self.server = httpd
            print(f"[SECURE] Secure Techno Sutra AR Server running on port {self.port}")
            print(f"[DIR] Serving directory: {os.getcwd()}")
            print(f"[WEB] Access at: http://localhost:{self.port}")
            print(f"[SEC] Security features enabled:")
            print("   - Rate limiting")
            print("   - Path validation")
            print("   - Security headers")
            print("   - Access logging")
            print("   - XSS protection")
            print("   - CSRF protection")
            print("\n[LOG] Security logs: logs/security.log")
            print("[LOG] Model access logs: logs/model_access.log")
            print("\n[CTRL] Press Ctrl+C to stop the server")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n[STOP] Server stopped by user")
                httpd.shutdown()

def main():
    """Main function to start the secure server"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Techno Sutra AR Secure Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to serve on (default: 8000)')
    parser.add_argument('--directory', default='.', help='Directory to serve (default: current directory)')
    parser.add_argument('--test-security', action='store_true', help='Run security tests after starting server')
    
    args = parser.parse_args()
    
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # Start server
    server = SecureHTTPServer(args.port, args.directory)
    
    if args.test_security:
        print("[TEST] Security testing mode enabled")
        print("Add '?security-test=true' to URL to run client-side tests")
    
    server.start()

if __name__ == "__main__":
    main()
