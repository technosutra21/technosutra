# Icon Requirements for Techno Sutra AR

## Required Icon Sizes

To complete the PWA setup, you need to create the following icon files from your existing `icon.png`:

### PWA Icons
- `icon-72x72.png` (72×72)
- `icon-96x96.png` (96×96)
- `icon-128x128.png` (128×128)
- `icon-144x144.png` (144×144)
- `icon-152x152.png` (152×152)
- `icon-192x192.png` (192×192) ⭐ **Required**
- `icon-384x384.png` (384×384)
- `icon-512x512.png` (512×512) ⭐ **Required**
- `icon-512x512-maskable.png` (512×512 with safe zone for maskable)

### Quick Generation Methods

#### Option 1: Using Online Tools
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your `icon.png`
3. Download the generated icons
4. Rename them according to the list above

#### Option 2: Using Command Line (ImageMagick)
```bash
# Install ImageMagick first
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt install imagemagick

# Generate all sizes
magick icon.png -resize 72x72 icon-72x72.png
magick icon.png -resize 96x96 icon-96x96.png
magick icon.png -resize 128x128 icon-128x128.png
magick icon.png -resize 144x144 icon-144x144.png
magick icon.png -resize 152x152 icon-152x152.png
magick icon.png -resize 192x192 icon-192x192.png
magick icon.png -resize 384x384 icon-384x384.png
magick icon.png -resize 512x512 icon-512x512.png
magick icon.png -resize 512x512 icon-512x512-maskable.png
```

#### Option 3: Manual Creation
Use any image editor (GIMP, Photoshop, etc.) to resize your icon to each required size.

### Maskable Icon Notes
The `icon-512x512-maskable.png` should have important content within a 80% safe zone (40px padding on all sides for 512px icon) to ensure it displays correctly when masked by the OS.

## Additional Recommended Files

### Screenshots for App Stores
- `screenshot1.png` (1280×720) - Desktop/tablet view
- `screenshot2.png` (750×1334) - Mobile view

### Favicon
- `favicon.ico` (multiple sizes: 16×16, 32×32, 48×48)

## Testing Your Icons

After adding the icons:
1. Test PWA installation on mobile
2. Check app icons appear correctly
3. Verify maskable icons work properly
4. Test in both light and dark themes

The current setup will work with just the existing `icon.png`, but having proper sizes will greatly improve the user experience!
