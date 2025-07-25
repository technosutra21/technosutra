# Techno Sutra AR - Agent Guide

## Project Overview
AR gallery showcasing 56 Avatamsaka Sutra chapters through interactive 3D models. Main entry points: `index.html` (AR viewer) and `galeria.html` (gallery).

## Commands
- **Local server**: `python serve_gallery.py` or `start_gallery.bat` (serves on localhost:8000)
- **Character processing**: `python characters/character_processor.py` 
- **Wix integration**: `python characters/wix_integration.py`
- **GLB to USDZ**: `python glb_to_usdz.py` or `Convert-GLB-to-USDZ.ps1`

## Architecture
- **Frontend**: HTML5 + CSS + vanilla JS with model-viewer library (WebXR/AR)
- **3D Models**: GLB format (`modelo1.glb` to `modelo56.glb`)
- **Character Data**: Python processing pipeline (`characters/` → structured profiles)
- **Service Worker**: `sw.js` for offline caching and PWA functionality
- **Configuration**: Centralized in `config.json` (AR settings, API endpoints, UI themes)

## Code Style
- **Naming**: Portuguese for UI/content, English for code internals
- **Files**: kebab-case HTML/CSS, snake_case Python, camelCase JS variables
- **Models**: `modelo{number}.glb` format (1-56)
- **AR Settings**: Defined in config.json, scale 2.0x default
- **Security**: CSP headers, input validation for model parameters
- **Progressive**: Service worker caching, offline-first approach
