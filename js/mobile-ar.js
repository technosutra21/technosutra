/**
 * Mobile AR Enhancement Module for Techno Sutra AR
 * Provides mobile-specific touch gestures, AR optimizations, and performance enhancements
 */

class MobileAREnhancer {
    constructor() {
        this.isMobile = this.detectMobileDevice();
        this.isIOS = this.detectIOSDevice();
        this.isAndroid = this.detectAndroidDevice();
        this.touchSupport = this.detectTouchSupport();
        this.connectionSpeed = this.detectConnectionSpeed();
        this.deviceMemory = this.detectDeviceMemory();
        this.isDataSaverMode = this.detectDataSaverMode();
        
        this.gestureState = {
            isGesturing: false,
            startTime: 0,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            initialDistance: 0,
            currentDistance: 0,
            rotation: 0,
            scale: 1
        };
        
        this.arOptimizations = {
            autoScale: true,
            qualityAdjustment: true,
            batteryAware: true,
            connectionAware: true
        };
        
        this.performanceMetrics = {
            frameRate: 60,
            memoryUsage: 0,
            loadTimes: [],
            renderTimes: []
        };
        
        this.init();
    }
    
    // Device Detection
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    detectIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    detectAndroidDevice() {
        return /Android/.test(navigator.userAgent);
    }
    
    detectTouchSupport() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    detectConnectionSpeed() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }
    
    detectDeviceMemory() {
        return navigator.deviceMemory || 4; // Default to 4GB if not available
    }
    
    detectDataSaverMode() {
        if (navigator.connection) {
            return navigator.connection.saveData || 
                   navigator.connection.effectiveType === 'slow-2g' || 
                   navigator.connection.effectiveType === '2g';
        }
        return this.deviceMemory < 2;
    }
    
    // Initialization
    init() {
        if (!this.isMobile) return;
        
        this.log('Initializing Mobile AR Enhancer');
        this.setupViewportFixes();
        this.setupTouchGestures();
        this.setupAROptimizations();
        this.setupPerformanceMonitoring();
        this.setupBatteryOptimizations();
        this.setupHapticFeedback();
        
        this.log(`Device: ${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Other Mobile'}`);
        this.log(`Memory: ${this.deviceMemory}GB, Data Saver: ${this.isDataSaverMode}`);
        this.log(`Connection: ${this.connectionSpeed?.effectiveType || 'Unknown'}`);
    }
    
    // Viewport and iOS Safari Fixes
    setupViewportFixes() {
        // Fix iOS Safari viewport height issues
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Fix for iOS Safari bottom bar
            if (this.isIOS) {
                document.documentElement.style.setProperty(
                    '--real-vh', 
                    `${window.innerHeight}px`
                );
            }
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        });
        
        // Prevent zoom on iOS
        if (this.isIOS) {
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // Prevent pull-to-refresh on mobile
        document.body.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && window.scrollY === 0) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && window.scrollY === 0) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // Enhanced Touch Gestures for Model Interaction
    setupTouchGestures() {
        if (!this.touchSupport) return;
        
        const modelViewers = document.querySelectorAll('model-viewer');
        
        modelViewers.forEach(viewer => {
            this.addTouchGesturesToViewer(viewer);
        });
        
        // Setup global gesture observers
        this.setupGlobalGestureHandlers();
    }
    
    addTouchGesturesToViewer(viewer) {
        let gestureState = {
            isActive: false,
            startTime: 0,
            touches: [],
            initialDistance: 0,
            initialRotation: 0,
            lastTap: 0,
            tapCount: 0
        };
        
        // Touch start
        viewer.addEventListener('touchstart', (e) => {
            gestureState.isActive = true;
            gestureState.startTime = Date.now();
            gestureState.touches = Array.from(e.touches);
            
            if (e.touches.length === 2) {
                // Two-finger gesture
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                gestureState.initialDistance = this.getDistance(touch1, touch2);
                gestureState.initialRotation = this.getRotation(touch1, touch2);
                
                // Prevent default to handle custom pinch/rotate
                e.preventDefault();
            } else if (e.touches.length === 1) {
                // Single finger tap/drag
                const now = Date.now();
                const touch = e.touches[0];
                
                // Double tap detection
                if (now - gestureState.lastTap < 300) {
                    gestureState.tapCount++;
                    if (gestureState.tapCount === 2) {
                        this.handleDoubleTap(viewer, touch);
                        gestureState.tapCount = 0;
                    }
                } else {
                    gestureState.tapCount = 1;
                }
                gestureState.lastTap = now;
            }
        }, { passive: false });
        
        // Touch move
        viewer.addEventListener('touchmove', (e) => {
            if (!gestureState.isActive) return;
            
            if (e.touches.length === 2) {
                // Handle pinch-to-zoom and rotate
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const currentDistance = this.getDistance(touch1, touch2);
                const currentRotation = this.getRotation(touch1, touch2);
                
                // Calculate scale factor
                const scaleFactor = currentDistance / gestureState.initialDistance;
                const rotationDelta = currentRotation - gestureState.initialRotation;
                
                this.handlePinchZoom(viewer, scaleFactor);
                this.handleRotateGesture(viewer, rotationDelta);
                
                e.preventDefault();
            } else if (e.touches.length === 1) {
                // Handle single finger pan
                const touch = e.touches[0];
                const startTouch = gestureState.touches[0];
                
                if (startTouch) {
                    const deltaX = touch.clientX - startTouch.clientX;
                    const deltaY = touch.clientY - startTouch.clientY;
                    
                    this.handlePanGesture(viewer, deltaX, deltaY);
                }
            }
        }, { passive: false });
        
        // Touch end
        viewer.addEventListener('touchend', (e) => {
            if (!gestureState.isActive) return;
            
            const duration = Date.now() - gestureState.startTime;
            
            // Handle tap gestures
            if (duration < 200 && e.changedTouches.length === 1) {
                const touch = e.changedTouches[0];
                this.handleTap(viewer, touch);
            }
            
            // Reset gesture state if no more touches
            if (e.touches.length === 0) {
                gestureState.isActive = false;
                gestureState.touches = [];
            }
            
            // Provide haptic feedback
            this.provideHapticFeedback('light');
        }, { passive: true });
    }
    
    // Gesture Utility Functions
    getDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getRotation(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }
    
    // Gesture Handlers
    handleTap(viewer, touch) {
        this.log('Single tap detected');
        // Could trigger model interactions, hotspots, etc.
        this.provideHapticFeedback('light');
    }
    
    handleDoubleTap(viewer, touch) {
        this.log('Double tap detected - resetting camera');
        
        // Reset camera to default position
        if (viewer.getCameraOrbit) {
            viewer.cameraOrbit = '0deg 70deg 2.5m';
        }
        
        // Reset field of view
        if (viewer.getFieldOfView) {
            viewer.fieldOfView = '45deg';
        }
        
        this.provideHapticFeedback('medium');
    }
    
    handlePinchZoom(viewer, scaleFactor) {
        if (!viewer.getCameraOrbit) return;
        
        // Get current camera orbit
        const currentOrbit = viewer.getCameraOrbit();
        const currentRadius = parseFloat(currentOrbit.radius.replace('m', ''));
        
        // Apply zoom with limits
        const minRadius = 1.0;
        const maxRadius = 5.0;
        const newRadius = Math.max(minRadius, Math.min(maxRadius, currentRadius / scaleFactor));
        
        // Update camera orbit
        viewer.cameraOrbit = `${currentOrbit.theta} ${currentOrbit.phi} ${newRadius}m`;
        
        this.log(`Pinch zoom: scale=${scaleFactor.toFixed(2)}, radius=${newRadius.toFixed(2)}m`);
    }
    
    handleRotateGesture(viewer, rotationDelta) {
        // Two-finger rotation - could adjust model rotation
        if (Math.abs(rotationDelta) > 5) { // Threshold to prevent accidental rotation
            this.log(`Rotate gesture: ${rotationDelta.toFixed(1)}°`);
            // Could implement custom rotation logic here
        }
    }
    
    handlePanGesture(viewer, deltaX, deltaY) {
        if (!viewer.getCameraOrbit) return;
        
        // Convert pixel movement to camera orbit changes
        const sensitivity = 0.5;
        const thetaDelta = deltaX * sensitivity;
        const phiDelta = -deltaY * sensitivity;
        
        const currentOrbit = viewer.getCameraOrbit();
        const newTheta = parseFloat(currentOrbit.theta.replace('deg', '')) + thetaDelta;
        const newPhi = Math.max(0, Math.min(180, parseFloat(currentOrbit.phi.replace('deg', '')) + phiDelta));
        
        viewer.cameraOrbit = `${newTheta}deg ${newPhi}deg ${currentOrbit.radius}`;
    }
    
    // AR-Specific Optimizations
    setupAROptimizations() {
        const modelViewers = document.querySelectorAll('model-viewer');
        
        modelViewers.forEach(viewer => {
            this.optimizeViewerForMobile(viewer);
        });
        
        // Setup AR event listeners
        this.setupAREventListeners();
    }
    
    optimizeViewerForMobile(viewer) {
        // Mobile-specific model-viewer optimizations
        const optimizations = {
            // Reduce quality for better performance
            'exposure': this.isDataSaverMode ? '0.8' : '1.0',
            'shadow-intensity': this.deviceMemory < 3 ? '0.3' : '0.8',
            'shadow-softness': this.deviceMemory < 3 ? '0.5' : '1.0',
            
            // Optimize for mobile performance
            'interaction-policy': 'allow-when-focused',
            'loading': this.isDataSaverMode ? 'lazy' : 'eager',
            'reveal': this.isDataSaverMode ? 'interaction' : 'auto',
            
            // Mobile-friendly rotation
            'rotation-per-second': this.isDataSaverMode ? '10deg' : '15deg',
            
            // AR-specific optimizations
            '--ar-scale': this.getOptimalARScale(),
            '--min-camera-orbit': 'auto auto 1.0m',
            '--max-camera-orbit': 'auto auto 4.0m'
        };
        
        Object.entries(optimizations).forEach(([key, value]) => {
            if (key.startsWith('--')) {
                viewer.style.setProperty(key, value);
            } else {
                viewer.setAttribute(key, value);
            }
        });
        
        // iOS-specific optimizations
        if (this.isIOS) {
            viewer.setAttribute('ios-src', viewer.getAttribute('src')?.replace('.glb', '.usdz') || '');
        }
        
        this.log(`Optimized model viewer for mobile device (Memory: ${this.deviceMemory}GB)`);
    }
    
    getOptimalARScale() {
        // Calculate optimal AR scale based on device capabilities
        if (this.deviceMemory <= 2) {
            return '1.5'; // Conservative scale for low-memory devices
        } else if (this.deviceMemory <= 4) {
            return '1.8'; // Standard mobile scale
        } else {
            return '2.0'; // Full scale for high-end devices
        }
    }
    
    setupAREventListeners() {
        const modelViewers = document.querySelectorAll('model-viewer');
        
        modelViewers.forEach(viewer => {
            viewer.addEventListener('ar-status', (event) => {
                this.handleARStatusChange(viewer, event.detail.status);
            });
            
            viewer.addEventListener('load', () => {
                this.handleModelLoad(viewer);
            });
            
            viewer.addEventListener('error', (event) => {
                this.handleModelError(viewer, event.detail);
            });
        });
    }
    
    handleARStatusChange(viewer, status) {
        this.log(`AR Status: ${status}`);
        
        switch (status) {
            case 'session-started':
                this.onARSessionStart(viewer);
                break;
            case 'object-placed':
                this.onARObjectPlaced(viewer);
                break;
            case 'failed':
                this.onARSessionFailed(viewer);
                break;
            case 'not-presenting':
                this.onARSessionEnd(viewer);
                break;
        }
    }
    
    onARSessionStart(viewer) {
        this.log('AR session started');
        this.provideHapticFeedback('heavy');
        
        // Optimize for AR session
        if (this.arOptimizations.batteryAware) {
            this.reduceBatteryUsage();
        }
        
        // Show AR-specific UI
        this.showARInstructions();
    }
    
    onARObjectPlaced(viewer) {
        this.log('AR object placed');
        this.provideHapticFeedback('medium');
        
        // Hide placement instructions
        this.hideARInstructions();
    }
    
    onARSessionFailed(viewer) {
        this.log('AR session failed');
        this.provideHapticFeedback('error');
        
        // Show fallback options
        this.showARFallback();
    }
    
    onARSessionEnd(viewer) {
        this.log('AR session ended');
        
        // Restore normal optimizations
        this.restoreNormalMode();
    }
    
    // Performance Monitoring
    setupPerformanceMonitoring() {
        if (!this.isMobile) return;
        
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Monitor memory usage
        this.monitorMemoryUsage();
        
        // Monitor network performance
        this.monitorNetworkPerformance();
    }
    
    monitorFrameRate() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFrameRate = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.performanceMetrics.frameRate = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                
                // Adjust quality based on frame rate
                if (this.performanceMetrics.frameRate < 20) {
                    this.reduceQuality();
                } else if (this.performanceMetrics.frameRate > 45) {
                    this.increaseQuality();
                }
            }
            
            requestAnimationFrame(measureFrameRate);
        };
        
        requestAnimationFrame(measureFrameRate);
    }
    
    monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
                
                // Trigger cleanup if memory usage is high
                if (this.performanceMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB threshold
                    this.performMemoryCleanup();
                }
            }, 5000);
        }
    }
    
    monitorNetworkPerformance() {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.connectionSpeed = this.detectConnectionSpeed();
                this.adjustForConnectionSpeed();
            });
        }
    }
    
    // Battery Optimizations
    setupBatteryOptimizations() {
        if (!this.isMobile) return;
        
        // Page visibility API for battery saving
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.enterPowerSaveMode();
            } else {
                this.exitPowerSaveMode();
            }
        });
        
        // Battery API (where available)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.handleBatteryStatus(battery);
                
                battery.addEventListener('levelchange', () => {
                    this.handleBatteryStatus(battery);
                });
            });
        }
    }
    
    handleBatteryStatus(battery) {
        const batteryLevel = battery.level;
        const isCharging = battery.charging;
        
        this.log(`Battery: ${Math.round(batteryLevel * 100)}%, Charging: ${isCharging}`);
        
        // Adjust performance based on battery level
        if (batteryLevel < 0.2 && !isCharging) {
            this.enterLowPowerMode();
        } else if (batteryLevel > 0.5 || isCharging) {
            this.exitLowPowerMode();
        }
    }
    
    enterPowerSaveMode() {
        this.log('Entering power save mode');
        
        // Pause animations
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            if (viewer.autoRotate) {
                viewer.setAttribute('data-was-rotating', 'true');
                viewer.autoRotate = false;
            }
        });
    }
    
    exitPowerSaveMode() {
        this.log('Exiting power save mode');
        
        // Resume animations
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            if (viewer.getAttribute('data-was-rotating') === 'true') {
                viewer.autoRotate = true;
                viewer.removeAttribute('data-was-rotating');
            }
        });
    }
    
    enterLowPowerMode() {
        this.log('Entering low power mode');
        this.reduceQuality();
        this.reduceBatteryUsage();
    }
    
    exitLowPowerMode() {
        this.log('Exiting low power mode');
        this.restoreNormalMode();
    }
    
    // Haptic Feedback
    setupHapticFeedback() {
        this.hapticAvailable = 'vibrate' in navigator;
        this.log(`Haptic feedback: ${this.hapticAvailable ? 'Available' : 'Not available'}`);
    }
    
    provideHapticFeedback(type = 'light') {
        if (!this.hapticAvailable) return;
        
        const patterns = {
            light: [10],
            medium: [50],
            heavy: [100],
            success: [50, 50, 50],
            error: [100, 50, 100, 50, 100],
            notification: [200, 100, 200]
        };
        
        const pattern = patterns[type] || patterns.light;
        navigator.vibrate(pattern);
    }
    
    // Quality Management
    reduceQuality() {
        this.log('Reducing quality for better performance');
        
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            viewer.style.setProperty('--shadow-intensity', '0.2');
            viewer.style.setProperty('--shadow-softness', '0.3');
            viewer.setAttribute('rotation-per-second', '5deg');
        });
    }
    
    increaseQuality() {
        this.log('Increasing quality');
        
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            viewer.style.setProperty('--shadow-intensity', '0.8');
            viewer.style.setProperty('--shadow-softness', '1.0');
            viewer.setAttribute('rotation-per-second', '15deg');
        });
    }
    
    reduceBatteryUsage() {
        this.log('Reducing battery usage');
        
        // Reduce frame rate
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            viewer.setAttribute('rotation-per-second', '5deg');
        });
        
        // Disable auto-rotate if battery is low
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.15) {
                    modelViewers.forEach(viewer => {
                        viewer.autoRotate = false;
                    });
                }
            });
        }
    }
    
    restoreNormalMode() {
        this.log('Restoring normal mode');
        
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            this.optimizeViewerForMobile(viewer);
        });
    }
    
    // Performance Cleanup
    performMemoryCleanup() {
        this.log('Performing memory cleanup');
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear unused model viewer resources
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            if (!this.isViewerVisible(viewer)) {
                viewer.setAttribute('loading', 'lazy');
            }
        });
    }
    
    isViewerVisible(viewer) {
        const rect = viewer.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }
    
    adjustForConnectionSpeed() {
        if (!this.connectionSpeed) return;
        
        const slowConnections = ['slow-2g', '2g', '3g'];
        const isSlow = slowConnections.includes(this.connectionSpeed.effectiveType);
        
        this.log(`Adjusting for connection speed: ${this.connectionSpeed.effectiveType}`);
        
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            if (isSlow) {
                viewer.setAttribute('loading', 'lazy');
                viewer.setAttribute('reveal', 'interaction');
            } else {
                viewer.setAttribute('loading', 'eager');
                viewer.setAttribute('reveal', 'auto');
            }
        });
    }
    
    // UI Helper Methods
    showARInstructions() {
        const instructions = document.querySelector('.ar-prompt-official');
        if (instructions) {
            instructions.style.display = 'block';
        }
    }
    
    hideARInstructions() {
        const instructions = document.querySelector('.ar-prompt-official');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }
    
    showARFallback() {
        // Show alternative viewing options when AR fails
        this.log('Showing AR fallback options');
    }
    
    handleModelLoad(viewer) {
        const loadTime = performance.now();
        this.performanceMetrics.loadTimes.push(loadTime);
        this.log(`Model loaded in ${loadTime.toFixed(2)}ms`);
    }
    
    handleModelError(viewer, error) {
        this.log(`Model error: ${error}`);
        this.provideHapticFeedback('error');
    }
    
    // Utility Methods
    log(message) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[MobileAR] ${message}`);
        }
    }
    
    // Public API
    updateViewerOptimizations(viewer) {
        this.optimizeViewerForMobile(viewer);
    }
    
    triggerHapticFeedback(type) {
        this.provideHapticFeedback(type);
    }
    
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isIOS: this.isIOS,
            isAndroid: this.isAndroid,
            touchSupport: this.touchSupport,
            deviceMemory: this.deviceMemory,
            connectionSpeed: this.connectionSpeed,
            isDataSaverMode: this.isDataSaverMode
        };
    }
}

// Initialize mobile AR enhancer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileAREnhancer = new MobileAREnhancer();
    });
} else {
    window.mobileAREnhancer = new MobileAREnhancer();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileAREnhancer;
}
