---
description: Repository Information Overview
alwaysApply: true
---

# Techno Sutra AR Information

## Summary
Techno Sutra AR is an immersive augmented reality experience that explores the 56 chapters of the Avatamsaka Sutra (Sutra Gandavyuha) through interactive 3D models. The project is implemented as a Progressive Web Application (PWA) with AR capabilities, allowing users to view 3D models representing different chapters and characters of the Sutra in a virtual gallery or in their real environment through their device's camera.

## Structure
- **/js/**: JavaScript files for frontend functionality, including AR experience controller
- **/css/**: Stylesheets for the application
- **/models/**: 3D models in GLB format for AR visualization
- **/models/usdz/**: 3D models in USDZ format for iOS devices
- **/qr_codes/**: QR codes for accessing AR models
- **/summaries/**: Chapter summaries in different formats and languages
- **/chapters/**: Chapter-specific content
- **/characters/**: Character information and data
- **/security/**: Security configuration and implementation files

## Language & Runtime
**Language**: JavaScript (ES6+), HTML5, CSS3, Python (for scripts)
**Version**: ES6+ for JavaScript, Python 3.x for scripts
**Build System**: Custom deployment script (deploy.py)
**Package Manager**: None (no package.json found)

## Dependencies
**Main Dependencies**:
- model-viewer (v4.0.0) - WebXR-based 3D model viewer
- WebXR API - For AR functionality
- Service Workers - For PWA offline capabilities

**External Resources**:
- Google Fonts (Orbitron, Chakra Petch)
- MapLibre GL (v3.6.2) - For map functionality
- jsQR (v1.4.0) - For QR code scanning

## Build & Installation
```bash
# Clone the repository
git clone https://github.com/seu-usuario/technosutra.git

# Navigate to project directory
cd technosutra

# For development server (Python)
python -m http.server 8000

# For HTTPS development server (required for AR)
python https_server.py

# For production deployment
python deploy.py
```

## PWA Configuration
**Manifest**: manifest.json defines app metadata, icons, and capabilities
**Service Worker**: sw.js implements caching strategies for offline functionality
**Cache Strategy**: 
- Core assets: Cache-first strategy
- Models: Cache-first with background updates
- External resources: Stale-while-revalidate
- API calls: Network-first with offline fallback

## AR Implementation
**Technology**: WebXR via model-viewer component
**Model Format**: GLB (all devices) and USDZ (iOS)
**Configuration**:
- Default scale: 2.0
- Camera orbit: 0deg 70deg 2.5m
- Field of view: 45deg
- Shadow intensity: 1
- Environment: neutral

## Deployment
**Process**: Custom Python deployment script (deploy.py)
**Optimization**:
- HTML/CSS/JS minification
- File compression (gzip)
- Cache optimization
- Security headers configuration
**Output**: Generates optimized files in 'dist' directory
**Server Requirements**: HTTPS required for AR functionality

## Security
**Content Security Policy**: Implemented with strict rules
**Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
**CORS Configuration**: Configured for allowed origins, methods, and headers