# Testing Guide Index

Complete reference for testing Techno Sutra AR locally on your network with HTTPS.

## 🚀 Quick Start (5 Minutes)

**Read This First:**
→ [TESTING_QUICK_START.md](TESTING_QUICK_START.md)

Quick steps to get AR working on iPhone/Android:
1. `./test-local.sh ip` → Get your local IP
2. `./test-local.sh network` → Start HTTPS server
3. Visit `https://IP:4443` on your mobile device
4. Test AR feature

## 📚 Complete Documentation

### For Testing
- **[TESTING_QUICK_START.md](TESTING_QUICK_START.md)** - 5-minute setup (START HERE!)
- **[LOCAL_TESTING.md](LOCAL_TESTING.md)** - Comprehensive guide (500+ lines)
  - All device scenarios (iOS, Android, Desktop)
  - Network debugging
  - Performance testing
  - Advanced troubleshooting

### For Development
- **[README.md](README.md)** - Project overview
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development setup & standards
- **[LIGHTHOUSE.md](LIGHTHOUSE.md)** - Performance optimization
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete change log

## 🛠 Testing Tools

### Helper Script: `./test-local.sh`

```bash
./test-local.sh help         # Show all commands
./test-local.sh network      # Start HTTPS network server ← USE THIS
./test-local.sh local        # Start HTTPS localhost only
./test-local.sh http         # Start HTTP dev server
./test-local.sh ip           # Show your network IP
./test-local.sh verify       # Verify implementation (24 checks)
./test-local.sh test         # Run tests (29 tests)
./test-local.sh lint         # Check code quality
./test-local.sh lint:fix     # Auto-fix code issues
./test-local.sh certs        # Show certificate info
```

### HTTPS Servers

**https_server_network.py** (network accessible)
```bash
python3 https_server_network.py
# Shows: https://192.168.x.x:4443 (accessible from network)
```

**https_server.py** (localhost only)
```bash
python3 https_server.py
# Shows: https://localhost:4443 (same machine only)
```

## 📋 Testing Scenarios

### Scenario 1: iPhone/Safari AR Testing
- Beginner: [TESTING_QUICK_START.md](TESTING_QUICK_START.md#scenario-1-test-ar-on-iphone)
- Advanced: [LOCAL_TESTING.md](LOCAL_TESTING.md#scenario-1-safari-on-iphone)

### Scenario 2: Android/Chrome AR Testing
- Beginner: [TESTING_QUICK_START.md](TESTING_QUICK_START.md#scenario-2-test-ar-on-android)
- Advanced: [LOCAL_TESTING.md](LOCAL_TESTING.md#scenario-2-chrome-on-android)

### Scenario 3: Offline Functionality Testing
- Beginner: [TESTING_QUICK_START.md](TESTING_QUICK_START.md#scenario-3-test-offline-functionality)
- Advanced: [LOCAL_TESTING.md](LOCAL_TESTING.md#scenario-3-desktop-chrome-firefox)

### Scenario 4: Code Quality Testing
- Beginner: [TESTING_QUICK_START.md](TESTING_QUICK_START.md#scenario-4-test-code-quality)
- Advanced: Run `./test-local.sh test lint verify`

## ✅ What Gets Tested

1. **iOS Texture Fix**
   - Models display correctly (no black textures)
   - GLB format only
   - USDZ auto-conversion

2. **Offline Support**
   - 56 models cached
   - Complete offline access
   - Progress logging

3. **AR Features**
   - iOS Quick Look
   - Android WebXR
   - Keyboard shortcuts

4. **Code Quality**
   - 29 tests (all passing)
   - ESLint validation
   - No USDZ references

## 🔧 Troubleshooting

Quick fixes: [TESTING_QUICK_START.md#troubleshooting](TESTING_QUICK_START.md#troubleshooting)

Detailed help: [LOCAL_TESTING.md#troubleshooting](LOCAL_TESTING.md#troubleshooting)

Common issues:
- **Certificate error** → Normal! Tap "Continue" (Safari) or "ADVANCED" (Chrome)
- **Can't find server** → Run `./test-local.sh ip` and use that IP
- **AR not working** → Must be HTTPS, not HTTP
- **Port already in use** → `lsof -i :4443` then `kill -9 <PID>`

## 📊 Testing Checklist

Before considering testing complete:

**Desktop**
- [ ] `npm test` passes (29 tests)
- [ ] `npm run lint` passes
- [ ] `./test-local.sh verify` passes (24 checks)
- [ ] https://localhost:4443 loads

**iOS**
- [ ] `./test-local.sh network` running
- [ ] https://IP:4443 accessible
- [ ] Model loads
- [ ] AR button visible
- [ ] AR session opens
- [ ] Model visible in camera
- [ ] Can rotate model
- [ ] Offline works (after cache)

**Android**
- [ ] Same as iOS above
- [ ] Uses WebXR or Scene Viewer

**Offline**
- [ ] Models cached (progress shows)
- [ ] DevTools offline mode works
- [ ] Page reloads in offline mode

## 🎯 Next Steps

1. **Read**: [TESTING_QUICK_START.md](TESTING_QUICK_START.md) (5 min)
2. **Run**: `./test-local.sh network`
3. **Test**: Visit on iPhone/Android
4. **Verify**: Check all items in testing checklist
5. **Deploy**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md#deployment-checklist)

## 📞 Getting Help

1. Check relevant troubleshooting section
2. Review console output (F12 in browser)
3. Check [LOCAL_TESTING.md](LOCAL_TESTING.md) for advanced debugging
4. Review [CONTRIBUTING.md](CONTRIBUTING.md) for development info

## 📈 Performance Testing

See [LIGHTHOUSE.md](LIGHTHOUSE.md) for:
- Performance metrics to monitor
- Optimization recommendations
- Lighthouse testing guide
- Core Web Vitals tracking

## 🔐 Certificate Information

Self-signed certificates already generated:
- `cert.pem` - Public certificate
- `key.pem` - Private key
- Valid for local testing
- Production: Use Let's Encrypt

View certificate info:
```bash
./test-local.sh certs
```

## 📱 Device Requirements

**iPhone/iPad**
- iOS 14.3+ (for AR)
- Safari (for Quick Look)
- HTTPS connection required

**Android**
- Android 7.0+
- Chrome or Firefox
- ARCore support
- HTTPS connection required

**Desktop**
- Chrome, Firefox, or Safari
- DevTools (F12) for debugging
- HTTP or HTTPS

## 🎬 Example Session

```bash
# Terminal 1:
$ ./test-local.sh ip
Output: https://192.168.1.100:4443

$ ./test-local.sh network
Output: ✅ Server Status: RUNNING

# iPhone Safari:
1. Visit: https://192.168.1.100:4443
2. Tap "Continue" for certificate
3. Click a model number
4. Watch console: SW: Cached model [1/56]...
5. Tap "📲 Abrir em AR"
6. Model appears in camera
7. ✓ Success!

# Back to Terminal 1:
Press Ctrl+C to stop

# Run full tests:
$ ./test-local.sh verify
Output: ✓ All implementation checks passed!

$ ./test-local.sh test
Output: ✓ 29 tests, all passing
```

## 📚 Full Documentation Map

```
Project Root
├── TESTING_INDEX.md ← You are here
├── TESTING_QUICK_START.md ← Start here
├── LOCAL_TESTING.md ← Complete guide
├── README.md
├── LIGHTHOUSE.md
├── CONTRIBUTING.md
├── IMPLEMENTATION_SUMMARY.md
├── test-local.sh ← Helper script
├── https_server_network.py ← Network server
└── https_server.py ← Localhost server
```

## ⚡ Most Common Commands

```bash
# Testing
./test-local.sh network      # Start server for network testing
./test-local.sh ip           # Get your local IP
./test-local.sh test         # Run all tests
./test-local.sh verify       # Verify implementation

# Development
npm test                      # Run tests (same as above)
npm run lint                  # Check code quality
npm run lint:fix              # Auto-fix code quality issues
npm run dev                   # Start HTTP dev server (port 8000)
```

## ✨ You're All Set!

Everything is configured and ready to test. 

Start with:
```bash
./test-local.sh network
```

Then visit on your iPhone/Android in Safari/Chrome:
```
https://192.168.x.x:4443
```

AR should work perfectly!

---

**Last Updated**: Jan 24, 2026
**Status**: ✅ All testing infrastructure ready
