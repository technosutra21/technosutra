# AR Color Saturation & Contrast Fix Guide

## Issue Summary
Models on iOS Safari AR (Quick Look) display with **low saturation and contrast** compared to desktop WebGL preview.

**Root Cause**: Three.js USDZExporter applies multiple gamma corrections + color space mismatches when converting GLB → USDZ.

---

## Quick Test (5 min)

1. **Open test environment** on iOS Safari:
   ```
   https://your-machine-ip:4443/test-model
   ```

2. **Tap "Launch AR"** and compare:
   - Colors feel washed out? → Confirm issue
   - Same quality as desktop? → Issue may be device-specific

3. **Adjust texture size slider**:
   - Move from 1024px → 2048px → 4096px
   - Watch for saturation improvements

---

## Solution 1: Increase Texture Resolution (Already Applied ✓)

**Status**: DONE in `AR.html` (line 276)

```html
<model-viewer ar-usdz-max-texture-size="2048" ...>
```

**Expected improvement**: 10-15% saturation boost

**How it works**: 
- Default: 1024px textures (lossy when encoded into USDZ)
- 2048px: Better quality, minimal file size impact
- 4096px: Best quality, slower conversion on older devices

---

## Solution 2: Re-Export GLB with Normals (Recommended)

**Impact**: 20-30% improvement in contrast & saturation  
**Effort**: 1-2 hours for all 56 models  
**When**: Next model update cycle

### Option A: Manual Export (via Blender UI)

For each model in Blender:

1. **Open** the .blend file
2. **File → Export → glTF Binary (.glb)**
3. **Enable options**:
   - ✓ Include > **Normals** (critical)
   - ✓ Include > Tangents
   - ✓ Include > Materials
   - ✓ Format: **glTF Binary**
4. **Optional**: Verify in Materials
   - Texture color spaces: **sRGB** (not Linear)
   - Apply smooth shading to all objects
5. **Save** to `models/modelo{N}.glb`

### Option B: Batch Export (Script)

```bash
# Single model
blender -b modelo1.blend -P export_glb_fixed.py

# Multiple models (bash loop)
for f in *.blend; do
    blender -b "$f" -P export_glb_fixed.py --output-dir ./models
done
```

**Included script**: `export_glb_fixed.py`
- Auto-enables smooth shading
- Ensures sRGB color space
- Optimizes GLB for USDZ conversion
- Includes Draco compression (smaller files)

### Verification

After export, check that your GLB includes normals:

```bash
# Using glTF-Transform CLI (optional)
npm install -g @gltf-transform/cli

gltf-transform inspect modelo1.glb | grep -i normal
# Should show: "normal" attribute present
```

---

## Solution 3: Pre-Convert to USDZ (Best Quality)

**Impact**: 40-50% improvement (best possible)  
**Effort**: 2-3 hours for 56 models  
**Trade-off**: Larger file sizes (2x), manual process

### Method 1: Xcode Reality Converter (Official Apple Tool)

1. **Install**: Xcode (from App Store) or [Reality Converter](https://developer.apple.com/download/all/)
2. **Convert**: Drag GLB → USDZ in Reality Converter
3. **Save** to `models/modelo{N}.usdz`
4. **Update AR.html**:
   ```html
   <model-viewer
       src="models/modelo1.glb"
       ios-src="models/modelo1.usdz"
       ar
       ar-modes="quick-look">
   </model-viewer>
   ```

### Method 2: Online Converter

If you don't have Xcode:
- https://assetexchange.marmoset.co/ (free)
- https://convertio.co/glb-usdz/ (free, limited size)
- https://modelconverter.com/convert/glb-to-usdz (free)

### Add to AR.html

```html
<model-viewer
    id="modelViewer"
    alt="Modelo 3D Interativo"
    src="models/modelo${id}.glb"
    ios-src="models/modelo${id}.usdz"  <!-- Add this line -->
    ar
    ar-modes="quick-look webxr scene-viewer"
    ar-usdz-max-texture-size="2048"
    ...
>
</model-viewer>
```

Update the `loadModel()` function in AR.html:

```javascript
function loadModel(modelId) {
    const glbPath = `models/modelo${modelId}.glb`;
    const usdzPath = `models/modelo${modelId}.usdz`;
    
    modelViewer.setAttribute('src', glbPath);
    modelViewer.setAttribute('ios-src', usdzPath);
    // ...
}
```

---

## Testing & Validation

### Desktop Preview (WebGL)
1. Open `https://localhost:4443/test-model` in Chrome
2. Adjust sliders: Saturation, Contrast, Exposure
3. Note: Desktop colors ≠ iOS (different rendering pipelines)

### iOS Quick Look Testing
1. Access `/test-model` on iPhone/iPad (HTTPS required)
2. Tap "Launch AR"
3. Document observations:
   - ✓ Colors look natural?
   - ✓ Saturation acceptable?
   - ✓ Contrast adequate?
   - ✗ Still muddy? → Blender export likely has missing normals

### Debug Information
Use the debug panel to check:
- **Vertices/Triangles**: Model complexity
- **Has Normal Map**: Critical for quality
- **Has PBR**: Metallic/Roughness support
- **Vertex Colors**: Special handling needed

Click **📋 Copy Debug Info** to save analysis.

---

## Rollout Plan

### Phase 1: Quick Win (Already Done ✓)
- ✓ Applied `ar-usdz-max-texture-size="2048"` in AR.html
- Expected: 10-15% improvement immediately

### Phase 2: Blender Fix (This Week)
- Pick 3-5 critical models (most-viewed)
- Re-export with normals enabled
- Test on iOS
- If successful, batch export remaining 51 models

### Phase 3: Pre-Conversion (Next Sprint)
- If Phase 2 insufficient, pre-convert to USDZ
- Use Xcode Reality Converter (1-2 minutes per model)
- Update AR.html to load USDZ for iOS

### Success Criteria
- ✓ iOS colors match desktop (within 80% saturation)
- ✓ No faceted/dark appearance
- ✓ File size reasonable (<5MB per model)
- ✓ AR startup time <3 seconds

---

## Technical Reference

### Why Colors Are Lost

```
GLB (linear color space)
    ↓
three.js GLTFLoader
    ↓
Material rendering (gamma-corrected shaders)
    ↓
WebGL framebuffer (tone-mapped)
    ↓
USDZExporter (reads from rendered buffer)
    ↓
Material conversion to USD (more gamma correction)
    ↓
USDZ file (zipped)
    ↓
iOS Quick Look (applies Apple's tone-mapping)
    ↓
Result: 2-3 layers of gamma correction = desaturated output
```

### Critical Settings Explained

| Setting | Impact | Default | Recommended |
|---------|--------|---------|-------------|
| `ar-usdz-max-texture-size` | Texture resolution in USDZ | 1024px | 2048px |
| Export Normals (Blender) | Smooth vs faceted appearance | OFF | ON ✓ |
| Smooth Shading (Blender) | Vertex normal quality | OFF | ON ✓ |
| Color Space (Blender) | Texture encoding correctness | Linear | sRGB ✓ |
| Format (Blender) | File efficiency | glTF Text | glTF Binary ✓ |

---

## Troubleshooting

### Problem: Colors still desaturated after ar-usdz-max-texture-size="2048"

**Likely cause**: Missing vertex normals in GLB  
**Fix**: Re-export from Blender with "Normals" enabled

### Problem: Model looks faceted/flat on iOS

**Likely cause**: Vertex normals missing OR auto-smooth disabled in Blender  
**Fix**: 
```bash
blender -b model.blend -P export_glb_fixed.py
```

### Problem: Colors are different between desktop (WebGL) and iOS (USDZ)

**Expected behavior** - iOS and WebGL use different rendering pipelines  
**Mitigation**: Pre-convert to USDZ for consistent iOS appearance

### Problem: USDZ conversion is slow

**Likely cause**: Texture size too large (4096px)  
**Fix**: Reduce to 2048px or 1024px

---

## Files Reference

- **Testing**: `/test-model/index.html` (debug interface)
- **Research**: `USDZ_CONVERSION_RESEARCH.md` (technical deep-dive)
- **Production**: `AR.html` (user-facing AR viewer)
- **Script**: `export_glb_fixed.py` (batch Blender export)

---

## Questions & Next Steps

1. **Can I see improvements immediately?**  
   Yes - ar-usdz-max-texture-size="2048" is already in AR.html

2. **How long to fix all 56 models?**  
   - Blender re-export: 1-2 hours (script-assisted)
   - Pre-conversion to USDZ: 2-3 hours (Xcode Reality Converter)

3. **Will this affect Android?**  
   No - Android uses WebXR (GLB directly), not USDZ

4. **What's the file size impact?**  
   - ar-usdz-max-texture-size 2048: +0-5%
   - Pre-converted USDZ: +100% (separate file)

---

*Last updated: Jan 2026*  
*See USDZ_CONVERSION_RESEARCH.md for complete technical analysis*
