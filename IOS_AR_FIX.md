# iOS AR Quick Look Fix - USDZ Implementation

## Problem
iOS AR Quick Look was showing "MODEL INDISPONÍVEL" (Model Unavailable) error in AR.html when users tried to view models in AR.

## Root Causes
1. **Model-viewer's GLB-to-USDZ conversion** - Auto-conversion had compatibility issues with iOS Quick Look
2. **CORS issues** - GLB files loaded from GitHub Pages had missing CORS headers for USDZ conversion
3. **Missing USDZ metadata** - JavaScript-generated USDZ files lacked proper iOS AR Quick Look format
4. **Path inconsistencies** - model-viewer was not properly handling ios-src attribute

## Solutions Implemented

### 1. Pre-generated USDZ Files
- GitHub Actions workflow (`glb-to-usdz-ios-test.yml`) converts all GLB models to proper iOS-compatible USDZ format
- Files stored in `/models/usdz/` locally and published to GitHub Pages at:
  ```
  https://technosutra21.github.io/test-ios/models/modeloN.usdz
  ```
- USDZ files include proper ZIP archive structure with USD metadata

### 2. Dual Model Loading Strategy
**AR.html**:
- Detects iOS/non-iOS
- iOS users: Auto-redirects to `ios-ar.html`
- Web users: Load GLB with auto-conversion fallback

**ios-ar.html** (NEW - iOS-optimized):
- Dedicated iOS AR viewer
- Loads USDZ directly from GitHub Pages
- Simple, minimal UI optimized for touch
- Uses model-viewer's native Quick Look integration

### 3. Updated AR.html
```javascript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
    const params = new URLSearchParams(location.search);
    const model = params.get('model') || '1';
    window.location.href = `ios-ar.html?model=${model}`;
}
```

## Files Modified/Created

### Modified:
- `AR.html` - Added iOS detection and redirect logic
- `.github/workflows/glb-to-usdz-ios-test.yml` - Workflow generates USDZ files

### Created:
- `ios-ar.html` - Optimized iOS AR viewer using pre-generated USDZ files

## Usage

### For Users
1. iOS: Navigate to `AR.html?model=N` → auto-redirects to `ios-ar.html?model=N`
2. Web: `AR.html?model=N` → loads GLB with model-viewer
3. Direct iOS link: `ios-ar.html?model=N`

### For Developers
1. USDZ files are auto-generated in CI/CD when GLB files are pushed
2. They're deployed to GitHub Pages in `/test-ios/models/`
3. CORS is handled by GitHub Pages serving the files

## USDZ Conversion Process

The workflow creates valid USDZ files by:
1. Reading GLB file as binary
2. Creating ZIP archive with proper structure:
   ```
   [Content_Types].xml  (metadata)
   root.usda            (USD root layer)
   models/modeloN.glb   (embedded GLB)
   ```
3. Validating ZIP integrity before deployment
4. Converting all 56 models in parallel

## CORS Headers
GitHub Pages automatically provides correct CORS headers for all served files, enabling iOS Quick Look to access USDZ models.

## Testing

### On iPhone/iPad:
1. Open Safari
2. Navigate to: `https://technosutra21.github.io/AR.html?model=1`
3. Tap "📲 Abrir em AR"
4. Verify model appears in AR Quick Look (not "MODEL INDISPONÍVEL")

### Web Testing:
1. Open in desktop browser
2. Model loads as GLB with model-viewer
3. Can see 3D model and rotate

## Fallback Strategy
If USDZ loading fails on iOS:
- Error handler catches the failure
- Falls back to GLB loading
- User can still view model but AR may not work as well

## Performance Notes
- USDZ files are optimized with texture size limits
- Parallel processing in CI/CD reduces conversion time
- Pre-generated files eliminate runtime conversion overhead

## Future Improvements
- Consider hosting USDZ files separately with CDN for faster delivery
- Add model preview thumbnails
- Implement model caching strategies
- Monitor AR Quick Look compatibility with iOS updates
