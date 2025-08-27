# Unified Model Viewer for Techno Sutra AR

This document explains how to use the unified model viewer system that has been implemented for the Techno Sutra AR project.

## Overview

The unified model viewer system provides a consistent way to display 3D models across both the gallery and AR experiences. It automatically handles:

- GLB and USDZ file loading with proper paths
- Device detection (iOS/Android/Desktop)
- AR capabilities detection
- Progressive loading and error handling
- Consistent styling and behavior

## File Structure

```
/models/
├── modelo1.glb
├── modelo2.glb
├── ...
├── modelo56.glb
└── usdz/
    ├── modelo1.usdz
    ├── modelo2.usdz
    ├── ...
    └── modelo56.usdz
```

## Core Files

1. **unified-model-viewer.js** - Complete class-based implementation
2. **model-viewer-integration.js** - Simple integration functions
3. **model-viewer-example.html** - Usage examples

## Quick Start

### 1. Include the Integration Script

Add to your HTML head:

```html
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"></script>
<script src="model-viewer-integration.js"></script>
```

### 2. Gallery Mode

Create a container and initialize:

```html
<div class="model-viewer-container" id="my-model-viewer"></div>

<script>
// Initialize gallery model viewer
initGalleryModelViewer('my-model-viewer', 1, {
    name: "Samantabhadra",
    title: "O Bodhisattva da Ação Universal"
});
</script>
```

### 3. AR Mode

Create a full-screen container:

```html
<div id="ar-container" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;"></div>

<script>
// Initialize AR model viewer
initARModelViewer('ar-container', 1, {
    onLoad: (modelId) => console.log(`Model ${modelId} loaded`),
    onARStatusChange: (status) => console.log('AR status:', status)
});
</script>
```

### 4. Complete Gallery Card

```javascript
// Create a complete gallery card
const chapterData = {
    name: "Manjushri",
    title: "O Bodhisattva da Sabedoria",
    occupation: "Bodhisattva",
    location: "Monte Wutai"
};

const card = createGalleryCard(2, chapterData, true, {
    onLoad: (modelId) => console.log(`Card model ${modelId} loaded`)
});

document.getElementById('gallery-container').appendChild(card);
```

## API Reference

### initGalleryModelViewer(containerId, modelId, chapterData, options)

Initialize a model viewer for gallery display.

**Parameters:**
- `containerId` (string) - ID of container element
- `modelId` (number) - Model ID (1-56)
- `chapterData` (object) - Chapter information
- `options` (object) - Additional options

**Returns:** model-viewer element

### initARModelViewer(containerId, modelId, options)

Initialize a model viewer for AR display.

**Parameters:**
- `containerId` (string) - ID of container element
- `modelId` (number) - Model ID (1-56)
- `options` (object) - Configuration options

**Returns:** model-viewer element

### createGalleryCard(modelId, chapterData, isAvailable, options)

Create a complete gallery card with model viewer.

**Parameters:**
- `modelId` (number) - Model ID
- `chapterData` (object) - Chapter information
- `isAvailable` (boolean) - Whether model is available
- `options` (object) - Additional options

**Returns:** DOM element (div.model-card)

### downloadModelFile(modelId)

Download a model file.

**Parameters:**
- `modelId` (number) - Model ID to download

**Returns:** Promise

## Configuration

The system uses these default paths:

```javascript
const MODEL_VIEWER_CONFIG = {
    modelBasePath: './models/',
    usdzBasePath: './models/usdz/',
    modelViewerVersion: '4.0.0'
};
```

## Event Handling

### Gallery Mode Events

```javascript
initGalleryModelViewer('container', 1, chapterData, {
    onLoad: (modelId) => {
        console.log(`Model ${modelId} loaded successfully`);
    },
    onError: (modelId, error) => {
        console.error(`Error loading model ${modelId}:`, error);
    }
});
```

### AR Mode Events

```javascript
initARModelViewer('container', 1, {
    onLoad: (modelId) => {
        console.log(`AR model ${modelId} loaded`);
    },
    onProgress: (modelId, progress) => {
        console.log(`Loading progress: ${Math.round(progress * 100)}%`);
    },
    onARStatusChange: (status) => {
        console.log('AR status changed:', status);
    }
});
```

## Device Support

The system automatically detects:

- **iOS devices** - Uses USDZ files for AR Quick Look
- **Android devices** - Uses WebXR and Scene Viewer
- **Desktop** - Standard model-viewer with camera controls

## Performance Optimization

- Models are loaded lazily by default
- Progressive loading with progress indicators
- PWA caching support for offline access
- Automatic device-specific optimizations

## Styling

The system includes default CSS classes:

- `.model-card` - Gallery card container
- `.model-viewer-container` - Model viewer container
- `.ar-button` - AR activation button
- `.action-btn` - Action buttons

## Error Handling

The system handles common errors:

- Model file not found (404)
- Network connectivity issues
- AR capability detection
- Device compatibility

## Migration from Old System

### Before (galeria.html)
```html
<model-viewer src="modelo1.glb" ...>
```

### After
```html
<model-viewer src="models/modelo1.glb" ios-src="models/usdz/modelo1.usdz" ...>
```

Or use the integration functions:
```javascript
initGalleryModelViewer('container', 1, chapterData);
```

## Examples

See `model-viewer-example.html` for complete working examples of:

1. Gallery mode integration
2. AR mode integration  
3. Complete gallery cards
4. Manual model-viewer creation
5. Event handling
6. Error management

## Browser Support

- Chrome 88+ (Android WebXR)
- Safari 14+ (iOS AR Quick Look)
- Firefox 90+ (basic model viewing)
- Edge 88+ (basic model viewing)

## Troubleshooting

### Model not loading
1. Check file paths in browser network tab
2. Verify GLB/USDZ files exist in correct directories
3. Check console for error messages

### AR not working
1. Verify device supports AR (iOS 12+ or Android with ARCore)
2. Check HTTPS requirement for WebXR
3. Ensure USDZ files are properly generated

### Performance issues
1. Enable lazy loading
2. Use appropriate model file sizes
3. Implement progressive loading
4. Cache models with service worker

## Support

For issues or questions about the unified model viewer system, check:

1. Browser console for error messages
2. Network tab for failed requests
3. Model file integrity
4. Device AR capabilities