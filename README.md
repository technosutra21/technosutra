# Techno Sutra AR

Immersive augmented reality experience exploring the 56 chapters of the Avatamsaka Sutra through interactive 3D models.

## Overview

Techno Sutra AR is a progressive web application (PWA) that bridges Buddhist tradition with modern technology. It enables users to explore the Gandavyuha Sutra through 56 interactive locations (Sudhana's journey), accessible via QR codes or direct navigation. Models are viewable in AR on supported devices and in a 3D gallery.

### Key Features

- **WebXR & Model-Viewer AR**: View 3D models in AR using Quick Look (iOS), WebXR (Android/Desktop)
- **Progressive Web App**: Works offline after initial load; installable on home screen
- **56 Interactive Models**: Pre-cached for offline access without internet
- **Bilingual**: Portuguese and English support
- **Responsive**: Optimized for mobile, tablet, and desktop
- **Performance Optimized**: Service Worker caching, lazy-loaded models, compression

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AR**: Google Model-Viewer 4.0.0, WebXR
- **3D Models**: GLB/USDZ format
- **Caching**: Service Workers, IndexedDB
- **Build**: Python deployment scripts

## Project Structure

```
/
├── AR.html              # AR experience
├── index.html           # Home/gallery hub
├── galeria.html         # 3D gallery
├── map.html             # Interactive pilgrimage map
├── offline.html         # Offline fallback
├── sw.js                # Service Worker
├── manifest.json        # PWA manifest
├── models/              # GLB 3D models (56 files)
├── js/                  # Application logic
├── css/                 # Stylesheets
├── qr_codes/            # QR code generation
├── chapters/            # Sutra chapter data
├── characters/          # Character/deity data
├── summaries/           # Chapter summaries
├── security/            # Security validation
├── legacy/              # Deprecated code
└── README.md
```

## Installation

### Development

```bash
git clone https://github.com/technosutra21/technosutra.git
cd technosutra

# Python HTTP server (any Python 3.x)
python -m http.server 8000

# Access via: http://localhost:8000
```

### Deployment

Use `deploy.py` or `deploy.ps1` for automated deployment to hosting.

## Usage

### Accessing AR
1. Scan QR code or navigate to `AR.html?model=N` (where N is 1-56)
2. Allow camera permission
3. Tap "📲 Abrir em AR" button or press Space
4. Place model in your environment

### Navigation
- **Arrow keys/A-D**: Cycle models
- **R**: Reset camera
- **Space**: Activate AR
- **Mouse/Touch**: Rotate model

## Model Management

Models are **automatically cached** via Service Worker on first visit:
- ~56 GLB files (~300-800MB total, depends on compression)
- Model-Viewer handles iOS USDZ conversion automatically
- Cache persistence: browser cache, no manual USDZ management needed

Monitor caching progress in browser console: `SW: Cached model [X/56]`

## Lighthouse Optimization

- Deferred JavaScript loading
- Lazy-loaded models
- CSS minification
- Compressed asset delivery
- Optimal CLS/LCP metrics for PWA

## Project Status

- **Models**: All 56 chapters covered
- **Offline**: Fully functional offline after caching
- **Platform Support**: iOS (Safari), Android (Chrome/Firefox), Desktop
- **Maintenance**: Actively maintained

## License

MIT - See LICENSE file

## Vision

Techno Sutra bridges the ancient wisdom of the Avatamsaka Sutra with contemporary technology, offering practitioners a modern gateway into Buddhist philosophy through immersive spatial experience.
