# Quick Start - Local Testing

Test Techno Sutra AR on your network with Safari, Chrome, or Firefox.

## 5-Minute Setup

### Step 1: Get Your Network IP
```bash
./test-local.sh ip
```
Output:
```
✓ Your Local Network IP:
   https://192.168.1.100:4443
```

### Step 2: Start HTTPS Server
```bash
./test-local.sh network
```
Server output:
```
✅ Server Status: RUNNING

🔐 HTTPS Endpoints:
   • Local:    https://localhost:4443
   • Network:  https://192.168.1.100:4443

📱 Testing on iOS/Safari:
   1. Connect iOS to same Wi-Fi network
   2. Visit: https://192.168.1.100:4443
   3. Tap 'Allow' for certificate
   4. Navigate to AR experience
```

### Step 3: Open on Your Device

**iPhone/iPad (Safari)**:
1. Connect to same Wi-Fi as your computer
2. Open Safari
3. Visit: `https://192.168.1.100:4443` (use actual IP from Step 1)
4. Tap "Continue" for certificate warning
5. Wait for page to load

**Android (Chrome)**:
1. Connect to same Wi-Fi
2. Open Chrome
3. Visit: `https://192.168.1.100:4443`
4. Tap "ADVANCED" → "Proceed anyway" for certificate
5. Wait for page to load

**Desktop (Chrome/Firefox)**:
1. Visit: `https://localhost:4443`
2. Ignore certificate warning
3. Page loads immediately

### Step 4: Test AR

On any device:
1. **Click model** or use QR scanner to load
2. **Watch console** (DevTools) for:
   ```
   SW: Cached model [1/56]: /models/modelo1.glb
   SW: Cached model [2/56]: /models/modelo2.glb
   ...
   ```
3. **Tap "📲 Abrir em AR"** or press **Space key**
4. **Allow camera** permissions
5. **Model appears** in your camera view
6. **Rotate** with touch/mouse
7. **Done!** You're testing AR

---

## Testing Checklist

### ✓ Basic Functionality
- [ ] Page loads (check for 200 status in DevTools Network tab)
- [ ] Models display in list
- [ ] Can navigate between models
- [ ] QR scanner works (if testing)

### ✓ Service Worker / Offline
- [ ] Open DevTools (F12)
- [ ] Go to **Application** → **Service Workers**
- [ ] Should show: `/sw.js (registered)`
- [ ] Check console for caching progress:
  ```
  SW: Cached model [1/56]
  SW: Cached model [2/56]
  ...
  ```
- [ ] After first load, set Network to **Offline**
- [ ] Reload page
- [ ] Should work completely offline!

### ✓ AR Features (iPhone)
- [ ] Model loads when you tap it
- [ ] "📲 Abrir em AR" button visible
- [ ] Tapping button opens Quick Look AR
- [ ] Camera shows real environment
- [ ] Model appears in camera view
- [ ] Can rotate model with fingers
- [ ] Exit AR with "Done" button

### ✓ AR Features (Android)
- [ ] Model loads when you tap it
- [ ] "📲 Abrir em AR" button visible
- [ ] Tapping button opens WebXR/Scene Viewer
- [ ] Camera shows real environment
- [ ] Model appears in camera view
- [ ] Can rotate model
- [ ] Exit AR properly

### ✓ Desktop Testing
- [ ] Model loads in viewer
- [ ] Can rotate with mouse
- [ ] Auto-rotate animation works
- [ ] DevTools console shows no errors
- [ ] Network tab shows GLB files (not USDZ)

---

## Helper Commands

```bash
# Show help
./test-local.sh help

# Get your network IP
./test-local.sh ip

# Start HTTPS network server (Safari/Chrome on network)
./test-local.sh network

# Start HTTPS localhost only (same machine)
./test-local.sh local

# Start simple HTTP server (no AR features)
./test-local.sh http

# Run all tests (verify implementation)
./test-local.sh test

# Check code quality
./test-local.sh lint

# Verify implementation changes
./test-local.sh verify

# Show certificate info
./test-local.sh certs
```

---

## DevTools Console - What to Look For

### Service Worker Registration
```javascript
// Paste in console:
navigator.serviceWorker.getRegistrations().then(r => 
  console.log('SW:', r[0]?.active ? '✓ Active' : '✗ Inactive')
);
// Output: SW: ✓ Active
```

### Model Caching Progress
```
SW: Installing service worker...
SW: Caching core assets
SW: Cached model [1/56]: /models/modelo1.glb
SW: Cached model [2/56]: /models/modelo2.glb
...
SW: Model caching complete: 56/56 models cached
```

### AR Status
```
Initializing Techno Sutra AR...
Model loading: /models/modelo1.glb
Model configured with AR scale 2x
Initialization completed in 123.45ms
AR session started
Modelo 1 carregado
```

---

## Troubleshooting

### Certificate Error
**Error**: "Your connection is not secure" (Safari) or "NET::ERR_CERT_AUTHORITY_INVALID" (Chrome)

**Solution**: This is normal for self-signed certificates!
- Safari: Tap "Continue"
- Chrome: Tap "ADVANCED" then "Proceed to..."
- For production, use valid certificate (Let's Encrypt)

### Server Won't Start
**Error**: "Address already in use"

**Solution**:
```bash
# Find what's using port 4443
lsof -i :4443

# Kill it
kill -9 <PID>

# Or try different port (edit https_server_network.py)
```

### Models Don't Load
**Check**:
1. Console shows errors (F12)
2. Network tab shows failed requests
3. Model files exist: `ls models/modelo*.glb`
4. Check file permissions

**Solution**:
```bash
# Verify models exist
ls models/modelo1.glb models/modelo56.glb

# Check permissions
chmod 644 models/modelo*.glb
```

### AR Not Working
**iOS**:
- Must be HTTPS (http won't work)
- Safari must be in foreground
- Check: Settings → Safari → Camera/Microphone enabled
- Check console for errors

**Android**:
- ARCore must be installed
- App permissions: Camera, Motion (sensors)
- Try Chrome instead of Firefox
- Restart Chrome if issues persist

### Can't Connect from Mobile Device
**Check**:
1. Both on same Wi-Fi network
2. Get correct IP: `./test-local.sh ip`
3. Use HTTPS, not HTTP
4. Firewall not blocking port 4443

**Firewall (macOS)**:
```bash
# Allow Python to accept connections
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
```

### Service Worker Not Registering
**Check Console**:
```javascript
navigator.serviceWorker.register('/sw.js')
  .then(r => console.log('✓ Registered'))
  .catch(e => console.log('✗ Error:', e));
```

**Solution**:
- Must be HTTPS (or localhost)
- Reload page
- Check console for CORS errors
- Clear browser cache and cookies

---

## Performance Notes

### First Load
- Takes ~30-60 seconds to cache 56 models
- Watch console for progress
- After first load, everything loads instantly

### Subsequent Loads
- Models load from cache instantly
- Offline mode works perfectly
- AR features respond quickly

### Network Speeds
- Fast Wi-Fi: 30-60 seconds to cache
- 4G/5G mobile: 2-5 minutes to cache
- Slow connections: 10+ minutes

---

## What's Being Tested

✅ **iOS Texture Fix**
- Models display correctly (no black textures)
- GLB format only (no USDZ)
- Automatic iOS conversion via model-viewer

✅ **Offline Support**
- 56 models pre-cached
- Works completely offline
- Progress visible in console

✅ **AR Features**
- iOS Quick Look support
- Android WebXR/Scene Viewer
- Keyboard shortcuts (Space for AR, Arrows for nav)

✅ **Code Quality**
- 29 tests, all passing
- ESLint checks
- Service Worker validated
- Model configuration verified

---

## Next Steps (After Testing)

1. **If all works**: Ready for production!
   ```bash
   # Final verification
   npm test        # Should pass all 29 tests
   npm run lint    # Should have no errors
   ```

2. **If issues found**: Check troubleshooting above

3. **For production deployment**:
   - Enable HTTPS with valid certificate (Let's Encrypt)
   - Delete USDZ files: `rm -rf models/usdz/`
   - Enable gzip compression on server
   - Set proper cache headers
   - Deploy to production server

---

## Example Testing Session

```bash
# 1. Get IP
./test-local.sh ip
# Output: https://192.168.1.100:4443

# 2. Start server
./test-local.sh network
# Shows: Server running on port 4443

# 3. On iPhone:
# - Open Safari
# - Visit: https://192.168.1.100:4443
# - Accept certificate
# - Tap a model
# - Watch console: "SW: Cached model [1/56]..."
# - Tap "📲 Abrir em AR"
# - Model appears in camera!

# 4. Test offline:
# - Stay in app
# - Put phone in Airplane Mode
# - Models still load from cache
# - AR still works!

# 5. On desktop:
./test-local.sh verify
# Shows: ✓ All implementation checks passed

# 6. Verify tests:
./test-local.sh test
# Shows: 29 tests, all passing
```

---

## Support

**Questions about testing?** See `LOCAL_TESTING.md` for detailed guide.

**Issues with AR?** Check `CONTRIBUTING.md` for development info.

**Need help?** Review console output and check troubleshooting section above.

---

**Ready to test?**
```bash
./test-local.sh network
```

Then visit the IP shown on your iPhone/Android in Safari/Chrome. AR should work!

---

**Last Updated**: Jan 24, 2026
**Status**: ✅ Ready for testing
