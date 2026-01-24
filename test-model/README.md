# Techno Sutra AR Debug & Test Environment

## Purpose
Isolated debugging environment for testing AR rendering on iOS Safari with low saturation/contrast issues.

## Quick Start

1. **Start HTTPS Server** (from project root):
```bash
python3 https_server.py
# or
python3 -m http.server 4443 --bind 0.0.0.0
```

2. **Access on iOS**:
   - Navigate to: `https://your-machine-ip:4443/test-model`
   - Accept self-signed certificate warning
   - Test models and AR rendering

3. **Desktop Testing** (for WebGL preview):
   - Open: `https://localhost:4443/test-model` in Chrome/Safari DevTools
   - Adjust sliders to find optimal settings
   - Note: Desktop colors ≠ iOS colors due to Quick Look tone mapping

## Features

### Debug Panel (Right Sidebar)
- **Texture Size Slider**: Controls `ar-usdz-max-texture-size` (512–4096px)
  - Default: 2048px (balance of quality vs conversion speed)
  - Larger = better quality but slower
  
- **Color Adjustments**:
  - Saturation Boost: Compensate for desaturated USDZ export
  - Contrast Boost: Brighten dark/muddy appearance
  - Exposure: Overall brightness adjustment

### Model Analysis
- Vertex/Triangle count
- Presence of vertex colors, normal maps, PBR
- AR support detection

### Testing Workflow
1. Load a model from the dropdown
2. Test on iOS Safari (tap "Launch AR")
3. Compare WebGL preview (desktop) vs Quick Look (iOS)
4. Adjust texture size and color settings
5. Copy debug info when reporting issues

## Root Causes (from USDZ_CONVERSION_RESEARCH.md)

### Why Colors Are Desaturated on iOS

| Issue | Cause | Severity | Fix |
|-------|-------|----------|-----|
| **Color Space Mismatch** | GLB (linear) → three.js (gamma-corrected) → USDZ (tone-mapped) → Quick Look (tone-mapped again) | HIGH | Use `ar-usdz-max-texture-size="2048"` ✓ |
| **Missing Vertex Normals** | GLB exported without "Normals" flag = faceted/dark | HIGH | Re-export from Blender with Normals enabled |
| **Lighting Environment** | WebGL ≠ Quick Look lighting models | MEDIUM | Cannot fully fix (iOS limitation) |
| **Texture Encoding** | sRGB → Linear → sRGB conversions compound | MEDIUM | Increase texture size ✓ |
| **three.js USDZExporter Limits** | Limited material support | LOW | Cannot fix (use Xcode Reality Converter) |

## Recommended Fixes (Priority Order)

### ✅ SOLUTION 1: Increase Texture Resolution (Quick Win)
Already applied in `AR.html`:
```html
<model-viewer ar-usdz-max-texture-size="2048" ...>
```
Expected improvement: 10-15% saturation boost

### ✅ SOLUTION 2: Fix Blender Export (Best ROI)
For next model export cycle:

**In Blender → Export → glTF Binary (.glb)**:
1. ✓ Check: **Export > Include > Normals**
2. ✓ Verify: Materials use **sRGB** color space (not Linear)
3. ✓ Apply: **Smooth shading** to all objects
4. ✓ Select: **glTF Binary** format

**Command-line (batch export)**:
```bash
blender -b modelo.blend -P export_glb.py \
  --output_format="GLTF_BINARY" \
  --include_normals=true
```

Expected improvement: 20-30% contrast and saturation

### 🔄 SOLUTION 3: Pre-Convert to USDZ (Best Quality)
For critical models only (slower, larger files):

1. Install Xcode (or use online converter)
2. Convert GLB → USDZ using Reality Converter
3. Specify in AR.html:
```html
<model-viewer
    src="models/modelo1.glb"
    ios-src="models/modelo1.usdz"
    ar-modes="quick-look webxr scene-viewer">
</model-viewer>
```

Expected improvement: 40-50% (best possible)

## Testing Checklist

- [ ] Load modelo1 on iOS Safari
- [ ] Tap "Launch AR" button
- [ ] Compare saturation vs desktop WebGL preview
- [ ] Test with `ar-usdz-max-texture-size="2048"` (current)
- [ ] Test with `ar-usdz-max-texture-size="4096"` (if device allows)
- [ ] Check debug panel for model properties (vertex normals present?)
- [ ] Copy debug info and compare across models

## Performance Notes

**Texture Size Impact**:
- 512px: Fastest conversion, visible loss of detail
- 1024px: Default, good balance
- 2048px: Recommended, minimal quality loss
- 4096px: Best quality, slower conversion on older devices

**File Size**: Larger textures = larger `.usdz` files (impacts download time)

## References

- Full technical analysis: [`USDZ_CONVERSION_RESEARCH.md`](../USDZ_CONVERSION_RESEARCH.md)
- model-viewer docs: https://modelviewer.dev/docs/index.html#attributes-ar
- three.js USDZExporter: https://threejs.org/docs/?q=usdz#examples/en/exporters/USDZExporter
- GitHub issue #3192: Color issues with USDZ export

## Next Steps

1. **Immediate**: Test with texture-size 2048 on iOS
2. **This week**: Re-export 1-2 critical models with Normals enabled
3. **Next sprint**: Consider Xcode Reality Converter for batch pre-conversion
4. **Long-term**: Monitor for three.js USDZExporter improvements

---

*Last updated: Jan 2026 - Research integrated from USDZ_CONVERSION_RESEARCH.md*
