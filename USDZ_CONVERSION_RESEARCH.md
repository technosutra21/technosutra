# Deep Technical Research: GLB-to-USDZ Conversion in model-viewer

## Executive Summary

When `<model-viewer>` encounters `ar-modes="quick-look"` without an explicit `ios-src` attribute, it **automatically converts your GLB file to USDZ on-the-fly** using **three.js's USDZExporter**. This conversion is where saturation and contrast issues originate.

---

## The Automatic Conversion Pipeline

### How it Works

1. **GLB Loading**: model-viewer loads your GLB file into a three.js scene using GLTFLoader
2. **Material Processing**: three.js creates Material objects from glTF PBR (glTF 2.0 metallic-roughness)
3. **USDZ Export**: When AR is activated on iOS, USDZExporter traverses the scene and exports to USD format
4. **Asset Packaging**: The USD file is zipped with all textures into a .usdz archive
5. **Quick Look Launch**: iOS Safari receives the USDZ and opens it in AR Quick Look

**Key Configuration Option**:
From AR.html (line 281):
```html
<button slot="ar-button" class="btn ar-btn">📲 Abrir em AR</button>
```

This triggers **automatic USDZ generation** because no `ios-src` attribute is specified.

---

## Why Saturation & Contrast Are Lost

### 1. **Color Space Mismatch (PRIMARY CAUSE)**

**The Problem:**
- **Blender/3D tools** work in **linear color space**
- **GLB files** store colors in **linear space** (device-independent)
- **three.js renderer** expects **sRGB textures** (applies gamma correction in shaders)
- **USDZExporter** reads from three.js's **already-rendered buffer** (tone-mapped, gamma-corrected)
- **Quick Look** applies additional tone-mapping/lighting context

**Result**: Multiple gamma corrections = desaturated, muddy colors

### 2. **Material Conversion Limitations**

The three.js USDZExporter has **limited support** for glTF 2.0 features:

| Feature | GLB Support | USDZ Export | Issue |
|---------|-------------|------------|-------|
| PBR Metallic-Roughness | ✓ Full | ⚠️ Partial | Limited shading models; texture baking required |
| Vertex Normals | ✓ | ✓ | **Missing normals = faceted/dark appearance** |
| Emission/Emissive | ✓ | ⚠️ Baked only | Not properly converted |
| Normal Maps | ✓ | ⚠️ Converted | May produce artifacts |
| Clearcoat/Variants | ✓ | ✗ | Not supported in USDZ |
| Vertex Colors | ✓ | ⚠️ Limited | Poor handling in USD |

### 3. **Lighting Environment Difference**

- **model-viewer** (WebGL): Uses environment lighting from IBL, custom lighting
- **Quick Look** (USDZ): Uses Apple's predefined lighting environment
- **Different lighting math**: Three.js uses deferred/forward shading; USD uses different light computations

### 4. **Texture Encoding Issues**

- GLB textures are **sRGB** (for display)
- USDZExporter extracts raw pixel data and re-encodes
- **sRGB → Linear → sRGB conversions** can compound color shifts
- Texture **max resolution** is limited (default 1024px, configurable)

### 5. **Geometry/Normal Issues**

From GitHub discussion #3192 on model-viewer, @elalish noted:

> "Notice the Android example is faceted? It sounds like USDZ doesn't support faceted, so you're getting weird behavior... export your GLB with **vertex normals**, which anything like Blender should be perfectly capable of."

**The Fix Applied by Users**:
```javascript
geometry.toNonIndexed();
geometry.computeVertexNormals();
```

Missing smooth normals cause:
- Flat/faceted appearance
- Dark shading
- Loss of perceived saturation (less specular highlights)

---

## Why This Happens: The Technical Pipeline

```
GLB File (linear color space)
    ↓
three.js GLTFLoader (loads as linear)
    ↓
three.js Material/Texture (with gamma correction in shaders)
    ↓
WebGL Renderer (outputs tone-mapped, sRGB frame buffer)
    ↓
USDZExporter reads from THREE.Scene (with rendered materials)
    ↓
Material conversion to USD spec:
    - Extracts color data (already gamma-corrected)
    - Converts to USD material parameters
    - Bakes textures where necessary
    ↓
USDZ File created (zip of USD + textures)
    ↓
iOS Quick Look (applies its own lighting/tone-mapping)
    ↓
Final Result: Under-saturated, low-contrast image
```

---

## Solutions & Mitigations

### **SOLUTION 1: Pre-Convert to USDZ (Most Reliable)**

Instead of relying on automatic conversion:
1. **Use Xcode's Reality Converter** or **Apple Xcode** to convert GLB → USDZ
   - This preserves materials better than three.js USDZExporter
   - Gives you direct control over material export

2. In AR.html, specify the USDZ:
```html
<model-viewer
    src="models/modelo1.glb"
    ios-src="models/modelo1.usdz"
    ar
    ar-modes="quick-look webxr scene-viewer">
</model-viewer>
```

**Pros**: Direct Apple conversion, proper PBR handling  
**Cons**: Manual process for each model, ~2x file size (56 models = 56 USDZ files)

---

### **SOLUTION 2: Fix Source GLB Files (Recommended)**

Ensure vertex normals are **always included** and color space is correct:

**In Blender (Export GLB)**:
1. File → Export → glTF Binary (.glb)
2. Check: **Export > Include > Normals** ✓
3. **Color Space**: Ensure materials use **sRGB** textures (not linear)
4. **Export > Format**: Choose **glTF Binary** (not Text)

**Command-line (if using Blender headless)**:
```bash
blender -b model.blend -P export_glb.py --output_format="GLTF_BINARY"
```

**Key Settings**:
- Vertex Normals: **Enabled**
- Smooth shading: Applied to all objects
- Textures: **sRGB** color space for diffuse/emissive
- Metallic/Roughness: PBR-compliant

---

### **SOLUTION 3: Post-Process in three.js (Advanced)**

Modify material properties BEFORE USDZ export (from model-viewer source):

```javascript
scene.traverse(child => {
    if (child.isMesh && child.material) {
        const mat = child.material;
        
        // Boost saturation
        if (mat.map) {
            mat.color.multiplyScalar(1.2); // +20% brightness
        }
        
        // Ensure normals
        if (child.geometry.attributes.normal === undefined) {
            child.geometry.computeVertexNormals();
        }
        
        // Increase metallic/roughness contrast
        if (mat.metalnessMap) mat.metalness = 1.0;
        if (mat.roughnessMap) mat.roughness = Math.min(mat.roughness * 0.8, 1.0);
    }
});
```

**Limitation**: Requires modifying model-viewer internals; not supported by default

---

### **SOLUTION 4: Use `ar-usdz-max-texture-size` Attribute**

In AR.html, you can control texture resolution:

```html
<model-viewer
    src="models/modelo1.glb"
    ar
    ar-usdz-max-texture-size="2048"
    ar-modes="quick-look">
</model-viewer>
```

**Default**: 1024px  
**Better**: 2048px (if original textures are high-res)  
**Note**: Larger = better quality but slower conversion & larger file size

---

### **SOLUTION 5: Adjust Lighting in model-viewer**

Control the environment/lighting to compensate:

```html
<model-viewer
    src="models/modelo1.glb"
    environment-image="path/to/environment.hdr"
    exposure="1.5"
    shadow-intensity="0.5">
</model-viewer>
```

This affects **web preview** but **NOT the USDZ export** (export reads raw scene data).

---

## Immediate Actions for Your Project

### Step 1: Check Your GLB Files
```bash
# Verify vertex normals are present
# (Use tools like glTF-Transform or Babylon.js Sandbox to inspect)
```

### Step 2: Test the `ar-usdz-max-texture-size` Attribute
```html
<!-- In AR.html, line 268-279, modify: -->
<model-viewer
    id="modelViewer"
    alt="Modelo 3D Interativo"
    ar
    ar-placement="floor"
    ar-modes="quick-look webxr scene-viewer"
    ar-usdz-max-texture-size="2048"  <!-- ADD THIS -->
    xr-environment
    camera-controls 
    touch-action="pan-y"
    ar-scale="auto"
    auto-rotate
    reveal="auto">
</model-viewer>
```

### Step 3: Check Blender Export Settings
For next export cycle, verify in Blender:
- ✓ Export > Include > Normals
- ✓ Color > sRGB (not Linear)
- ✓ Smooth shading on all objects

### Step 4: Monitor the Progress Event
```javascript
modelViewer.addEventListener('progress', (event) => {
    if (event.detail.reason === 'usdz-conversion') {
        console.log('USDZ Conversion Progress:', event.detail.totalProgress);
    }
});
```

---

## Technical Limitations (Cannot Be Fixed)

1. **USDZ format constraints**: Limited material support (no clearcoat, no advanced shaders)
2. **iOS lighting model**: Different from WebGL; colors will never match exactly
3. **three.js USDZExporter**: Limited implementation vs. Apple's official tools
4. **Real-time conversion**: Cannot compete with pre-processing in Xcode

---

## References

- [model-viewer Documentation - AR Attributes](https://modelviewer.dev/docs/index.html#attributes-ar)
- [three.js USDZExporter](https://threejs.org/docs/index.html?q=usdz#examples/en/exporters/USDZExporter)
- [GitHub Discussion #3192: Color Issues with USDZ Export](https://github.com/google/model-viewer/discussions/3192)
- [Blender Color Space Issues](https://devtalk.blender.org/t/big-color-problem-color-is-never-reliable-is-there-a-possible-solution/13804)
- [Stack Overflow: USDZ Export Color Problems](https://stackoverflow.com/questions/71803431/3d-artwork-that-is-exported-as-usdz-has-different-colors)
- [USDZ Format Specification](https://graphics.pixar.com/usd/docs/Usdz-File-Format-Specification.html)

---

## Summary Table: Root Causes

| Cause | Impact | Severity | Fixability |
|-------|--------|----------|-----------|
| Color Space Mismatch | Desaturation | **HIGH** | Medium (pre-convert GLB) |
| Missing Vertex Normals | Dark/Faceted | **HIGH** | High (Blender setting) |
| three.js USDZExporter Limitations | Material Loss | **MEDIUM** | Low (hardware limitation) |
| Lighting Environment Difference | Color Cast | **MEDIUM** | Low (iOS limitation) |
| Texture Encoding Issues | Color Shifts | **MEDIUM** | Medium (increase texture size) |
| Apple's Tone-Mapping | Final Color Adjustment | **MEDIUM** | Cannot fix |

