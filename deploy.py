#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Techno Sutra AR - Production Deployment Script
Optimizes files and prepares for production deployment
"""

import os
import json
import shutil
import gzip
import hashlib
from pathlib import Path
from typing import List, Dict, Any
import re
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DeploymentOptimizer:
    """Production deployment optimizer"""
    
    def __init__(self, source_dir: str = ".", output_dir: str = "dist"):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.config = self.load_config()
        
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from config.json"""
        try:
            config_path = self.source_dir / "config.json"
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load config.json: {e}")
            return {}
    
    def create_output_directory(self):
        """Create output directory structure"""
        logger.info(f"Creating output directory: {self.output_dir}")
        
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir)
        
        self.output_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        subdirs = ['assets', 'characters', 'chapters', 'qr_codes']
        for subdir in subdirs:
            (self.output_dir / subdir).mkdir(exist_ok=True)
    
    def minify_html(self, content: str) -> str:
        """Minify HTML content"""
        # Remove comments
        content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
        
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content)
        content = re.sub(r'>\s+<', '><', content)
        
        # Remove whitespace around tags
        content = content.strip()
        
        return content
    
    def minify_css(self, content: str) -> str:
        """Minify CSS content"""
        # Remove comments
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content)
        content = re.sub(r';\s*}', '}', content)
        content = re.sub(r'{\s*', '{', content)
        content = re.sub(r';\s*', ';', content)
        
        return content.strip()
    
    def minify_js(self, content: str) -> str:
        """Basic JS minification"""
        # Remove single-line comments (but preserve URLs)
        content = re.sub(r'(?<!:)//.*$', '', content, flags=re.MULTILINE)
        
        # Remove multi-line comments
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content)
        
        return content.strip()
    
    def process_html_file(self, file_path: Path) -> str:
        """Process HTML file with minification and optimization"""
        logger.info(f"Processing HTML: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract and minify CSS
        css_pattern = r'<style>(.*?)</style>'
        def minify_css_match(match):
            css_content = self.minify_css(match.group(1))
            return f'<style>{css_content}</style>'
        
        content = re.sub(css_pattern, minify_css_match, content, flags=re.DOTALL)
        
        # Extract and minify JS
        js_pattern = r'<script(?!.*src=)(.*?)>(.*?)</script>'
        def minify_js_match(match):
            js_content = self.minify_js(match.group(2))
            return f'<script{match.group(1)}>{js_content}</script>'
        
        content = re.sub(js_pattern, minify_js_match, content, flags=re.DOTALL)
        
        # Minify HTML
        if self.config.get('build', {}).get('minify_html', True):
            content = self.minify_html(content)
        
        return content
    
    def generate_cache_manifest(self, files: List[Path]) -> Dict[str, str]:
        """Generate cache manifest with file hashes"""
        manifest = {}
        
        for file_path in files:
            if file_path.is_file():
                # Calculate file hash
                with open(file_path, 'rb') as f:
                    file_hash = hashlib.md5(f.read()).hexdigest()[:8]
                
                relative_path = file_path.relative_to(self.output_dir)
                manifest[str(relative_path)] = file_hash
        
        return manifest
    
    def update_service_worker(self):
        """Update service worker with current model list"""
        sw_path = self.output_dir / "sw.js"
        
        # Get list of GLB files
        glb_files = list(self.output_dir.glob("*.glb"))
        model_list = [f"/{f.name}" for f in glb_files]
        
        if sw_path.exists():
            with open(sw_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Update AVAILABLE_MODELS array
            pattern = r'const AVAILABLE_MODELS = \[(.*?)\];'
            replacement = f'const AVAILABLE_MODELS = {json.dumps(model_list)};'
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            
            # Update cache version
            import time
            cache_version = f"v{int(time.time())}"
            content = re.sub(
                r"const CACHE_NAME = '[^']*'",
                f"const CACHE_NAME = 'techno-sutra-ar-{cache_version}'",
                content
            )
            
            with open(sw_path, 'w', encoding='utf-8') as f:
                f.write(content)
    
    def compress_files(self):
        """Create gzipped versions of text files"""
        text_extensions = {'.html', '.css', '.js', '.json', '.txt', '.svg'}
        
        for file_path in self.output_dir.rglob('*'):
            if file_path.is_file() and file_path.suffix in text_extensions:
                try:
                    with open(file_path, 'rb') as f_in:
                        with gzip.open(f"{file_path}.gz", 'wb') as f_out:
                            shutil.copyfileobj(f_in, f_out)
                    
                    logger.info(f"Compressed: {file_path.name}")
                except Exception as e:
                    logger.error(f"Error compressing {file_path}: {e}")
    
    def copy_static_files(self):
        """Copy static files to output directory"""
        static_patterns = [
            "*.glb",
            "*.png", 
            "*.jpg", 
            "*.jpeg",
            "*.svg",
            "*.ico",
            "*.webp",
            "*.mp4",
            "*.json",
            "*.txt",
            "*.md"
        ]
        
        for pattern in static_patterns:
            for file_path in self.source_dir.glob(pattern):
                if file_path.is_file():
                    dest_path = self.output_dir / file_path.name
                    shutil.copy2(file_path, dest_path)
                    logger.info(f"Copied: {file_path.name}")
        
        # Copy directories
        directories = ["qr_codes", "chapters", "summaries", "teachers-resource"]
        for directory in directories:
            src_dir = self.source_dir / directory
            if src_dir.exists():
                dest_dir = self.output_dir / directory
                if dest_dir.exists():
                    shutil.rmtree(dest_dir)
                shutil.copytree(src_dir, dest_dir)
                logger.info(f"Copied directory: {directory}")
    
    def process_characters_data(self):
        """Process and optimize character data"""
        characters_src = self.source_dir / "characters"
        characters_dest = self.output_dir / "characters"
        
        if not characters_src.exists():
            return
        
        # Copy optimized results
        optimized_src = characters_src / "resultados_otimizados"
        if optimized_src.exists():
            optimized_dest = characters_dest / "resultados_otimizados"
            if optimized_dest.exists():
                shutil.rmtree(optimized_dest)
            shutil.copytree(optimized_src, optimized_dest)
        
        # Copy essential Python files
        essential_files = [
            "character_processor.py",
            "wix_integration.py",
            "personagens_wix.csv"
        ]
        
        for filename in essential_files:
            src_file = characters_src / filename
            if src_file.exists():
                dest_file = characters_dest / filename
                shutil.copy2(src_file, dest_file)
    
    def create_deployment_info(self):
        """Create deployment information file"""
        import datetime
        
        # Count models
        model_count = len(list(self.output_dir.glob("*.glb")))
        
        # Calculate total size
        total_size = sum(f.stat().st_size for f in self.output_dir.rglob('*') if f.is_file())
        
        deployment_info = {
            "build_date": datetime.datetime.now().isoformat(),
            "version": self.config.get("project", {}).get("version", "1.2.0"),
            "model_count": model_count,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "minified": True,
            "compressed": True,
            "security_headers": True
        }
        
        with open(self.output_dir / "deployment-info.json", 'w', encoding='utf-8') as f:
            json.dump(deployment_info, f, indent=2)
    
    def create_htaccess(self):
        """Create .htaccess file for Apache servers"""
        htaccess_content = """# Techno Sutra AR - Production Configuration

# Security Headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Content Security Policy
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://ajax.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; worker-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none';"

# HTTPS Redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Caching
<IfModule mod_expires.c>
    ExpiresActive On
    
    # GLB models - long cache
    ExpiresByType application/octet-stream "access plus 1 month"
    
    # Images
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    
    # CSS and JS
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
    
    # HTML
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# MIME Types
AddType application/octet-stream .glb
AddType text/cache-manifest .appcache
"""
        
        with open(self.output_dir / ".htaccess", 'w', encoding='utf-8') as f:
            f.write(htaccess_content)
    
    def deploy(self):
        """Main deployment function"""
        logger.info("Starting production deployment...")
        
        try:
            # Step 1: Create output directory
            self.create_output_directory()
            
            # Step 2: Process HTML files
            html_files = ['index.html', 'galeria.html']
            for html_file in html_files:
                src_path = self.source_dir / html_file
                if src_path.exists():
                    optimized_content = self.process_html_file(src_path)
                    dest_path = self.output_dir / html_file
                    with open(dest_path, 'w', encoding='utf-8') as f:
                        f.write(optimized_content)
            
            # Step 3: Process Service Worker
            sw_src = self.source_dir / "sw.js"
            if sw_src.exists():
                shutil.copy2(sw_src, self.output_dir / "sw.js")
            
            # Step 4: Copy static files
            self.copy_static_files()
            
            # Step 5: Process character data
            self.process_characters_data()
            
            # Step 6: Update service worker
            self.update_service_worker()
            
            # Step 7: Compress files
            if self.config.get('build', {}).get('compression', True):
                self.compress_files()
            
            # Step 8: Create deployment info
            self.create_deployment_info()
            
            # Step 9: Create .htaccess
            self.create_htaccess()
            
            logger.info(f"✅ Deployment completed successfully!")
            logger.info(f"📁 Output directory: {self.output_dir}")
            
            # Show summary
            self.show_deployment_summary()
            
        except Exception as e:
            logger.error(f"❌ Deployment failed: {e}")
            raise
    
    def show_deployment_summary(self):
        """Show deployment summary"""
        # Count files
        total_files = len(list(self.output_dir.rglob('*')))
        html_files = len(list(self.output_dir.glob('*.html')))
        glb_files = len(list(self.output_dir.glob('*.glb')))
        
        # Calculate sizes
        total_size = sum(f.stat().st_size for f in self.output_dir.rglob('*') if f.is_file())
        
        print("\n" + "="*50)
        print("📊 DEPLOYMENT SUMMARY")
        print("="*50)
        print(f"Total files: {total_files}")
        print(f"HTML files: {html_files}")
        print(f"3D models: {glb_files}")
        print(f"Total size: {total_size / (1024*1024):.2f} MB")
        print(f"Output: {self.output_dir}")
        print("="*50)
        print("🚀 Ready for production deployment!")
        print("\n📋 Next steps:")
        print("1. Upload files to your web server")
        print("2. Ensure HTTPS is enabled")
        print("3. Test AR functionality")
        print("4. Monitor performance")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Techno Sutra AR Deployment Script")
    parser.add_argument("--source", default=".", help="Source directory")
    parser.add_argument("--output", default="dist", help="Output directory")
    parser.add_argument("--no-compression", action="store_true", help="Skip file compression")
    
    args = parser.parse_args()
    
    optimizer = DeploymentOptimizer(args.source, args.output)
    
    if args.no_compression:
        optimizer.config.setdefault('build', {})['compression'] = False
    
    optimizer.deploy()

if __name__ == "__main__":
    main()
