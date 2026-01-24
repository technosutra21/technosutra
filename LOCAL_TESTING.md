# Local Testing Guide - Techno Sutra AR

Complete guide for testing Techno Sutra AR locally on your network with HTTPS support for Safari AR.

## Quick Start

### 1. Check Prerequisites
```bash
# Verify Python 3
python3 --version

# Verify certificates exist
ls -la cert.pem key.pem
```

### 2. Start Network Server
```bash
# Terminal 1: Start HTTPS server
python3 https_server_network.py

# Output shows:
# ✅ Server Status: RUNNING
# 🔐 HTTPS Endpoints:
#    • Local:    https://localhost:4443
#    • Network:  https://192.168.x.x:4443
```

### 3. Test in Browser
- Desktop: Visit `https://localhost:4443`
- Mobile: Visit `https://192.168.x.x:4443` (from same Wi-Fi)

---

## Certificate Setup

### Check Existing Certificates
```bash
# Files should exist in project root
ls -la cert.pem key.pem

# View certificate details
openssl x509 -in cert.pem -text -noout
```

### Generate New Certificates (if needed)
```bash
# Generate self-signed certificate for local testing
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"

# Or interactive version:
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
# When prompted: Common Name (CN) = localhost (or your IP)
```

---

## Testing Scenarios

### Scenario 1: Safari on iPhone

#### Setup
1. **Connect to Network**
   - Ensure iPhone is on same Wi-Fi as development machine
   - Get your machine's IP: `python3 -c "import socket; s = socket.socket(); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0])"`

2. **Start Server**
   ```bash
   python3 https_server_network.py
   # Shows: Network: https://192.168.x.x:4443
   ```

3. **Open Safari**
   - URL: `https://192.168.x.x:4443` (use actual IP)
   - Tap "Continue" when certificate warning appears
   - Wait for page to load

#### Testing AR
1. **Load Model**
   - Click on any model or use QR scanner
   - Wait for model to load (watch console logs)

2. **Activate AR**
   - Tap **"📲 Abrir em AR"** button
   - Or press **Space** key
   - Allow camera permissions

3. **Verify AR Works**
   - Model appears in camera view
   - Can rotate with touch
   - Quick Look AR session activates

#### Troubleshooting
| Issue | Solution |
|-------|----------|
| Certificate error | Tap "Continue" to accept self-signed cert |
| Camera not working | Check iOS settings → Safari → Camera |
| Model doesn't appear | Check console for "SW: Cached model" logs |
| Offline doesn't work | Load model once, clear cookies, reload offline |
| Black model | Check that model loads (GLB, not USDZ) |

---

### Scenario 2: Chrome on Android

#### Setup
1. **Connect to Network**
   - Ensure Android is on same Wi-Fi
   - Get server IP from your machine

2. **Start Server**
   ```bash
   python3 https_server_network.py
   ```

3. **Open Chrome**
   - URL: `https://192.168.x.x:4443`
   - Tap "ADVANCED" → "Proceed to..." for certificate warning
   - Wait for page to load

#### Testing AR
1. **Load Model**
   - Navigate to AR or scan QR code
   - Model loads into view

2. **Activate AR**
   - Tap **"📲 Abrir em AR"** button
   - Or press **Space** key
   - Allow camera and motion permissions

3. **Verify AR Works**
   - Model appears in camera view
   - Uses WebXR or Scene Viewer
   - Can tap/interact with model

#### Troubleshooting
| Issue | Solution |
|-------|----------|
| Certificate warning | Tap "ADVANCED" → "Proceed anyway" |
| Camera error | Check Android settings → Apps → Chrome → Permissions |
| AR not available | Ensure device supports ARCore |
| Performance lag | Close other apps, restart Chrome |

---

### Scenario 3: Desktop Chrome/Firefox

#### Setup
```bash
# Start server
python3 https_server_network.py

# Visit: https://localhost:4443
```

#### Testing Service Worker
```javascript
// Open DevTools Console (F12)

// Check Service Worker registration
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW Registrations:', regs);
  regs.forEach(r => console.log('Active:', r.active));
});

// Monitor caching progress
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('SW Message:', event.data);
});

// View cache contents
caches.keys().then(names => {
  console.log('Cache names:', names);
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        console.log(`${name}: ${keys.length} items`);
      });
    });
  });
});
```

#### Testing Offline
1. **Open DevTools** (F12)
2. **Application Tab**
   - Clear storage (or reload once for cache)
   - Models start caching
   - Watch console for progress
3. **DevTools Network Tab**
   - Throttle to "Offline"
   - Reload page
   - Should work offline!

---

## Console Monitoring

### Key Messages to Watch

**Service Worker Caching**:
```
SW: Installing service worker...
SW: Caching core assets
SW: Cached model [1/56]: /models/modelo1.glb
SW: Cached model [2/56]: /models/modelo2.glb
...
SW: Model caching complete: 56/56 models cached
```

**Model Loading**:
```
Loading model: /models/modelo1.glb
Model configured with AR scale 2x
Initialization completed in 234.56ms
```

**AR Status**:
```
AR session started
Model loaded
AR session ended
```

### Console Filtering

```javascript
// Filter by type in console
console.table([
  { feature: 'Models', status: '56 cached' },
  { feature: 'AR', status: 'supported' },
  { feature: 'Offline', status: 'ready' }
]);
```

---

## Network Debugging

### Check Server is Accessible

```bash
# From mobile device terminal or another machine:
curl -k https://192.168.x.x:4443 | head -20

# Or use telnet:
telnet 192.168.x.x 4443
```

### Monitor Network Traffic

**On macOS/Linux**:
```bash
# Monitor HTTPS connections
sudo tcpdump -i any -n 'port 4443'

# Or simpler:
lsof -i :4443
```

**On server terminal**:
```bash
# Server logs show all requests
# Watch for:
# - 📦 Model requests (GLB files)
# - ⚙️ Configuration (sw.js, manifest.json)
# - 📄 Page loads
```

---

## Performance Testing

### Measure Model Download Time

```javascript
// In browser console:
const start = performance.now();
fetch('/models/modelo1.glb')
  .then(r => r.arrayBuffer())
  .then(() => {
    const time = performance.now() - start;
    console.log(`Downloaded in ${time.toFixed(0)}ms`);
  });
```

### Monitor Service Worker Cache Size

```javascript
// In browser console:
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    for (const key of keys) {
      const response = await cache.match(key);
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  console.log(`Total cache: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

getCacheSize();
```

### Lighthouse Score

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Test local server
lighthouse https://localhost:4443 --view --disable-storage-reset
```

---

## Troubleshooting

### Server Won't Start

**Error**: `Address already in use`
```bash
# Find process using port 4443
lsof -i :4443

# Kill the process
kill -9 <PID>

# Or use different port
# Edit https_server_network.py and change PORT = 4444
```

**Error**: `SSL: CERTIFICATE_VERIFY_FAILED`
```bash
# Regenerate certificates
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Models Not Loading

**Check console for errors**:
- Open DevTools (F12)
- Go to Console tab
- Look for red error messages

**Verify model paths**:
```javascript
// In console:
for (let i = 1; i <= 5; i++) {
  fetch(`/models/modelo${i}.glb`)
    .then(r => r.ok ? console.log(`✓ modelo${i}`) : console.log(`✗ modelo${i}`))
    .catch(e => console.log(`✗ modelo${i}:`, e));
}
```

### Service Worker Not Registering

```javascript
// In console:
navigator.serviceWorker.register('/sw.js')
  .then(r => console.log('✓ Registered:', r))
  .catch(e => console.log('✗ Error:', e));

// Check registration
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registrations:', regs);
  regs.forEach(r => {
    console.log('Scope:', r.scope);
    console.log('Active:', r.active);
    console.log('Installing:', r.installing);
  });
});
```

### AR Not Working

**iOS Safari**:
- Ensure HTTPS (required for AR)
- Check camera permissions
- Verify model-viewer CDN is accessible
- Safari must be foreground app

**Android Chrome**:
- Ensure WebXR enabled
- Check camera permissions
- Verify ARCore is installed
- Clear Chrome cache if issues persist

---

## Advanced Testing

### Simulate Network Conditions

**Chrome DevTools**:
1. Open DevTools (F12)
2. Open Network tab
3. Throttle dropdown:
   - Fast 3G
   - Slow 3G
   - Offline
4. Reload page

**Test offline AR**:
1. Cache all models once (online)
2. Set throttle to Offline
3. Navigate to AR
4. Should work fully offline

### Test on Different Browsers

| Browser | Platform | AR Support | Notes |
|---------|----------|-----------|-------|
| Safari | iOS 14+ | Quick Look | Native AR support |
| Chrome | Android 8+ | WebXR/Sceneviewer | Requires ARCore |
| Firefox | Android | Scene Viewer | Via model-viewer |
| Chrome | Desktop | Emulated | DevTools XR simulator |
| Safari | macOS | No AR | Model preview only |

### Memory Profiling

```javascript
// In console:
console.memory;

// Measure before/after AR
const before = performance.memory;
// Activate AR...
const after = performance.memory;
console.log('Memory used:', (after.usedJSHeapSize - before.usedJSHeapSize) / 1024 / 1024, 'MB');
```

---

## Network Setup Tips

### Find Your Machine's IP

**macOS/Linux**:
```bash
# Method 1: Python (most reliable)
python3 -c "import socket; s = socket.socket(); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()"

# Method 2: ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# Method 3: hostname
hostname -I
```

**Windows**:
```bash
ipconfig

# Look for IPv4 Address (e.g., 192.168.x.x)
```

### Router Configuration (Optional)

For accessing from outside your local network:
1. Port forward 4443 to your machine
2. Get public IP: `curl ifconfig.me`
3. Mobile device uses public IP
4. Requires valid HTTPS certificate for production

---

## Production Deployment

### Generate Valid Certificate

```bash
# Using Let's Encrypt (free, production-ready)
certbot certonly --standalone -d yourdomain.com

# Then update server to use:
# cert.pem = /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# key.pem = /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Deploy to Production Server

```bash
# Build process (future)
npm run build

# Deploy to hosting
# git push origin main
# CI/CD handles deployment

# Monitor health
# npm run lighthouse  # Weekly audits
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start local server | `python3 https_server_network.py` |
| Start HTTPS (localhost only) | `npm run serve` |
| Run tests | `npm test` |
| Check code quality | `npm run lint` |
| Generate certs | `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes` |
| Find machine IP | `python3 -c "import socket; s = socket.socket(); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0])"` |
| Clear service worker | DevTools → Application → Service Workers → Unregister |
| Clear cache | DevTools → Application → Storage → Clear Site Data |
| Simulate offline | DevTools → Network → Offline |
| Test lighthouse | `lighthouse https://localhost:4443 --view` |

---

## Support

**Issues?**
1. Check console (F12)
2. Review troubleshooting section above
3. Check CONTRIBUTING.md for development setup
4. Verify certificates exist and are valid

**Questions about AR?**
- See README.md for overview
- Check ar-experience.js comments
- Review IMPLEMENTATION_SUMMARY.md

---

**Last Updated**: Jan 24, 2026
**Status**: Ready for local testing
