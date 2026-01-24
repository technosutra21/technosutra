# Lighthouse Optimization Guide

This document outlines performance optimizations for Techno Sutra AR to achieve high Lighthouse scores.

## Current Optimizations

### 1. Service Worker Caching Strategy ✓
- **Cache-First**: Core assets (HTML, CSS, JS)
- **Stale-While-Revalidate**: External resources (fonts, CDN libraries)
- **Network-First with Cache Fallback**: API calls and dynamic content
- Pre-caches 56 GLB models (~300-800 MB) for complete offline access

### 2. Model Management ✓
- Removed USDZ pre-caching (automatic iOS conversion saves ~400 MB)
- GLB format compression via Draco encoding
- Lazy loading for gallery models
- Background update pattern for model cache

### 3. Asset Delivery
**CSS**:
- Main stylesheet: `/styles.css` (722 lines)
- Shared styles: `/css/shared.css`
- Critical CSS inlined in `<head>`
- Consider: CSS minification, unused selector removal

**JavaScript**:
- Model-Viewer 4.0 loaded via CDN (googleapis.com)
- Deferred script loading for non-critical JS
- Module imports for main.js, gallery.js, ar-experience.js
- Recommend: Code splitting, minification

**Fonts**:
- Google Fonts preconnected (dns-prefetch)
- Orbitron and Chakra Petch loaded from CDN
- `font-display: swap` (via `display=swap` parameter)

## Recommended Improvements

### Performance (LCP/FID/CLS)

**1. Largest Contentful Paint (LCP)**
- Add resource preloading in critical path:
  ```html
  <link rel="preload" href="/models/modelo1.glb" as="fetch">
  <link rel="preload" href="/js/main.js" as="script">
  ```
- Implement critical CSS preloading
- Defer model-viewer script with `async` attribute

**2. First Input Delay (FID) / Interaction to Next Paint (INP)**
- Debounce keyboard navigation handlers
- Use `requestIdleCallback` for non-critical tasks
- Split long JavaScript tasks

**3. Cumulative Layout Shift (CLS)**
- Fixed dimensions for model-viewer container (already done in AR.html)
- Reserve space for loading spinners
- Avoid dynamic content injection without layout shifts

### Network Optimization

**1. Compression**
- Enable gzip/brotli on server
- Minify CSS/JavaScript:
  ```bash
  npm run build  # Would use terser/cssnano
  ```

**2. HTTP/2 Server Push**
- Push critical fonts and CSS from server
- Reduce round-trip time

**3. Image Optimization**
- Use WebP with PNG fallback for icons
- Optimize SVG assets
- Lazy load non-critical images

### Code Optimization

**1. JavaScript**
```javascript
// ✗ Avoid global scope pollution
window.var = value;

// ✓ Use modules/closures
const config = { var: value };
export { config };
```

**2. CSS Specificity**
- Reduce cascade depth
- Remove unused selectors
- Use CSS variables for theming (already done with `:root`)

**3. Third-party Scripts**
- Load jsQR asynchronously
- Use service worker to cache external resources
- Implement timeout fallbacks

## Metrics to Monitor

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| LCP | < 2.5s | ? | Depends on model size/network |
| FID | < 100ms | ? | Keyboard nav should be fast |
| CLS | < 0.1 | ? | Fixed layout mostly stable |
| FCP | < 1.8s | ? | Startup gradient visible quickly |
| TTFB | < 0.6s | ? | Server-side optimization |

## Implementation Checklist

- [ ] Add CSS minification to build process
- [ ] Minify JavaScript files
- [ ] Implement critical CSS inline loading
- [ ] Add resource hints (preload/prefetch)
- [ ] Optimize model-viewer initialization
- [ ] Reduce long JavaScript tasks
- [ ] Implement image lazy loading
- [ ] Add server compression (gzip/brotli)
- [ ] Test Core Web Vitals via Lighthouse
- [ ] Monitor with Web Vitals API

## Testing Locally

```bash
# Start local server
python -m http.server 8000

# Run Lighthouse CLI (requires lighthouse npm package)
npx lighthouse http://localhost:8000 --view

# Or use Chrome DevTools
# DevTools > Lighthouse > Generate report
```

## Production Checklist

- [x] HTTPS enabled (required for Service Workers)
- [ ] Gzip compression enabled
- [ ] Security headers configured
- [ ] CORS policies reviewed
- [ ] Cache headers optimized
- [ ] CDN configured for assets
- [ ] Server-side rendering (optional for initial load)

## References

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance-scoring/)
- [Service Worker Best Practices](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Model-Viewer Performance](https://modelviewer.dev/performance.html)
