# Contributing to Techno Sutra AR

## Development Setup

```bash
# Clone the repository
git clone https://github.com/technosutra21/technosutra.git
cd technosutra

# Install dependencies
npm install

# Start development server
npm run dev
# Visit: http://localhost:8000
```

## Code Standards

### Linting
```bash
# Check code quality
npm run lint

# Auto-fix issues
npm run lint:fix
```

ESLint configuration enforces:
- Modern ES2021 JavaScript
- No unused variables
- Strict equality checks
- 120-character line limit
- Single quotes
- Semicolons required

### Testing
```bash
# Run all tests
npm test

# Tests verify:
# - 56 models (1-56 range)
# - Service Worker caching
# - AR functionality
# - Offline support
# - No USDZ file references
```

## Making Changes

### 1. Model-Viewer Assets
- Use **GLB format only** (no USDZ pre-caching)
- model-viewer handles iOS conversion automatically
- Compression: Consider Draco encoding for GLB files
- Path format: `/models/modelo{1-56}.glb`

### 2. Service Worker
- Keep cache strategy in `sw.js`
- Don't add new USDZ references
- Test offline functionality after changes
- Progress logging uses: `console.log('SW: Cached model [X/56]')`

### 3. AR Experience
- Core file: `js/ar-experience.js`
- Model loading: `loadModel()` method
- Navigation: Keyboard shortcuts (arrows/A-D/R/Space)
- AR activation: `activateAR()` method

### 4. Documentation
- Update README.md for user-facing changes
- Update LIGHTHOUSE.md for performance changes
- Document breaking changes in IMPLEMENTATION_SUMMARY.md
- Keep docs concise, avoid AI-generated text

## Branching Strategy

```
main (production, stable)
├── develop (integration branch)
│   ├── feature/model-improvements
│   ├── feature/performance-optimization
│   └── fix/ios-ar-support
```

## Before Submitting PR

1. Run tests: `npm test` (all 29 must pass)
2. Lint code: `npm run lint` (fix issues)
3. Test locally: `npm run dev` (verify functionality)
4. Test offline: Check Service Worker in DevTools
5. Verify implementation: `./verify-implementation.sh`

## Commit Messages

Format:
```
[TYPE] Brief description (under 50 chars)

Longer explanation (if needed)

- Bullet point 1
- Bullet point 2
```

Types:
- `[feat]` - New feature
- `[fix]` - Bug fix
- `[docs]` - Documentation
- `[style]` - Code style (no functional change)
- `[test]` - Test addition/modification
- `[perf]` - Performance improvement
- `[refactor]` - Code restructure

Example:
```
[fix] Remove ios-src attribute for automatic iOS conversion

- Removed ios-src from AR.html
- Updated ar-experience.js to use GLB only
- Service Worker now caches GLB instead of USDZ
- Saves ~803 MB of storage

Fixes #42
```

## Testing AR Functionality

### Local Testing
```bash
# Start server with HTTPS (required for WebXR)
npm run serve
# Then: https://localhost:8000
```

### Device Testing
1. **iOS (Safari)**
   - Open site on iPhone/iPad
   - Tap "📲 Abrir em AR" or press Space
   - Uses Quick Look (automatic)

2. **Android (Chrome/Firefox)**
   - Open site on Android phone
   - Tap "📲 Abrir em AR" or press Space
   - Uses WebXR or Scene Viewer

3. **Desktop Testing**
   - Chrome/Firefox with WebXR emulation
   - DevTools can simulate AR environment

## Performance Considerations

### Model Caching
- All 56 models cached on first visit (~300-800 MB)
- Subsequent loads from cache
- Background updates for model changes
- Monitor console: `SW: Cached model [X/56]`

### Asset Size
- GLB files should be compressed (Draco)
- Keep total cache under 1GB
- Use lazy loading for non-critical assets

### Lighthouse Scores
Target metrics:
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

See `LIGHTHOUSE.md` for optimization guide.

## Reporting Issues

Include:
1. Device type (iOS/Android/Desktop)
2. Browser/OS version
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (DevTools)

Example:
```
**Device**: iPhone 14 Pro, iOS 17
**Browser**: Safari
**Issue**: Model appears black in AR

**Steps**:
1. Open app on iPhone
2. Navigate to Model 5
3. Tap AR button
4. Model texture is black

**Expected**: Model should render with proper textures
**Actual**: Model appears as solid black
```

## File Structure Reference

```
technosutra/
├── AR.html                    # AR experience page
├── index.html                 # Home/hub page
├── galeria.html               # 3D gallery
├── map.html                   # Interactive map
├── offline.html               # Offline fallback
├── sw.js                      # Service Worker
├── manifest.json              # PWA manifest
│
├── models/                    # GLB 3D models
│   ├── modelo1.glb
│   ├── modelo2.glb
│   └── ...modelo56.glb
│
├── js/                        # JavaScript
│   ├── main.js                # Home page logic
│   ├── ar-experience.js       # AR controller
│   ├── gallery.js             # Gallery logic
│   ├── model-viewer-integration.js
│   └── qr-scanner.js
│
├── css/                       # Stylesheets
│   ├── shared.css
│   └── main.css
│
├── tests/                     # Test suites
│   ├── ar-experience.test.js
│   └── service-worker.test.js
│
├── .github/workflows/         # CI/CD
│   ├── test.yml
│   └── lighthouse.yml
│
├── legacy/                    # Archived code
│
├── README.md                  # User documentation
├── LIGHTHOUSE.md              # Performance guide
├── CONTRIBUTING.md            # This file
└── package.json               # npm configuration
```

## Security Notes

- No USDZ file paths in code
- Model IDs validated (1-56)
- Service Worker cache whitelisted
- No unsafe DOM manipulation
- Input validation on all user data

## Questions?

- Check existing issues on GitHub
- Review IMPLEMENTATION_SUMMARY.md for context
- Consult LIGHTHOUSE.md for performance questions

---

**Last Updated**: Jan 24, 2026
**Version**: 1.0.0
