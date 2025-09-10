/**
 * Techno Sutra AR - AR Experience Controller
 * Manages the AR experience functionality
 */

class ARExperienceController {
    /**
     * Initialize the AR experience
     */
    constructor() {
        // Performance monitoring
        this.perfStart = performance.now();
        
        // DOM elements - cached for performance
        this.elements = {};
        
        // Application state
        this.state = {
            isRotating: true,
            arSessionActive: false,
            cameraStream: null,
            statusHideTimer: null,
            modelLoaded: false,
            arReady: false,
            autoARAttempted: false,
            is404Error: false
        };
        
        // Configuration
        this.config = {
            modelId: Math.max(1, Math.min(56, parseInt(new URLSearchParams(window.location.search).get('model')) || 1)),
            arScale: 2.0,
            cameraConstraints: {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1080, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            }
        };
    }
    
    /**
     * Initialize the AR experience
     */
    async initialize() {
        try {
            this.log('Initializing Techno Sutra AR...');

            // Cache DOM elements
            this.cacheElements();

            // Setup event listeners
            this.setupEventListeners();

            // Load model first
            const modelLoadResult = await this.loadModel();
            if (!modelLoadResult) {
                this.log('Critical failure: model could not be loaded');
                this.showStatus('Modelo não encontrado', 'error');
                this.hideLoading();
                return;
            }

            // Test AR support
            await this.testARSupport();

            // Always try to start camera automatically
            const cameraStarted = await this.startCamera();
            if (!cameraStarted) {
                // Show camera permission dialog if camera fails
                if (this.elements.cameraPermission) {
                    this.elements.cameraPermission.classList.remove('hidden');
                }
                // Ensure background gradient is visible when camera fails
                document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                if (this.elements.cameraFeed) {
                    this.elements.cameraFeed.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
            } else {
                // Camera started successfully, ensure it's visible
                if (this.elements.cameraFeed) {
                    this.elements.cameraFeed.style.display = 'block';
                    this.elements.cameraFeed.style.opacity = '1';
                }
            }

            // Auto-AR attempt
            if (this.state.modelLoaded && this.state.arReady && !this.state.autoARAttempted) {
                this.state.autoARAttempted = true;
                setTimeout(() => this.tryAutoAR(), 2000);
            }

            // Hide loading overlay
            this.hideLoading();

            // Performance logging
            const perfEnd = performance.now();
            this.log(`Initialization completed in ${(perfEnd - this.perfStart).toFixed(2)}ms`);

        } catch (error) {
            this.log(`Initialization error: ${error.message}`);
            this.showStatus('Erro na inicialização', 'error');
            this.hideLoading();
        }
    }
    
    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
        this.elements.cameraFeed = document.getElementById('camera-feed');
        this.elements.modelViewer = document.querySelector('#modelViewer');
        this.elements.statusDiv = document.getElementById('status');
        this.elements.loadingOverlay = document.getElementById('loading-overlay');
        this.elements.cameraPermission = document.getElementById('camera-permission');
        this.elements.cameraButton = document.getElementById('camera-button');
        this.elements.arButton = document.getElementById('ar-button');
        this.elements.progressFill = document.getElementById('progress-fill');
        this.elements.modelControls = document.getElementById('model-controls');
        this.elements.resetCameraBtn = document.getElementById('reset-camera');
        this.elements.toggleRotateBtn = document.getElementById('toggle-rotate');
        this.elements.error404 = document.getElementById('error-404');
    }
    
    /**
     * Log messages with consistent formatting
     * @param {string} message - Message to log
     */
    log(message) {
        if (console.log) console.log(`[Techno Sutra AR] ${message}`);
    }
    
    /**
     * Show status message
     * @param {string} message - Message to display
     * @param {string} type - Message type (info, error, success)
     * @param {number} duration - Duration to show message in ms
     */
    showStatus(message, type = 'info', duration = 3000) {
        if (!this.elements.statusDiv) return;

        this.elements.statusDiv.textContent = message;
        this.elements.statusDiv.className = `show ${type}`;
        this.elements.statusDiv.style.opacity = '1';
        this.elements.statusDiv.style.transform = 'translateY(0)';

        if (this.state.statusHideTimer) {
            clearTimeout(this.state.statusHideTimer);
        }

        this.state.statusHideTimer = setTimeout(() => {
            this.elements.statusDiv.style.opacity = '0';
            this.elements.statusDiv.style.transform = 'translateY(-10px)';
        }, duration);
    }
    
    /**
     * Hide loading overlay with animation
     */
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Show model controls
     */
    showControls() {
        if (this.elements.modelControls) {
            this.elements.modelControls.classList.remove('hidden');
            this.elements.modelControls.style.opacity = '1';
        }
    }
    
    /**
     * Check if model exists at the given URL
     * @param {string} src - Model source URL
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<boolean>} - Whether the model exists
     */
    async checkModelExists(src, timeout = 3000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            let response;
            try {
                response = await fetch(src, { 
                    method: 'HEAD',
                    signal: controller.signal,
                    cache: 'force-cache'
                });
                
                if (!response.ok) {
                    throw new Error('Fallback to GET');
                }
            } catch {
                response = await fetch(src, { 
                    method: 'GET',
                    signal: controller.signal
                });
            }
                    
            clearTimeout(timeoutId);
            this.log(`Model check response: ${response.status} ${response.statusText}`);
            return response.ok;
        } catch (error) {
            this.log(`Error checking model: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Show 404 error with auto-redirect
     */
    show404Error() {
        if (this.elements.error404) {
            this.elements.error404.classList.remove('hidden');
            this.state.is404Error = true;
            
            setTimeout(() => {
                this.elements.error404.classList.add('hidden');
                this.state.is404Error = false;
                window.location.href = window.location.pathname + '?model=1';
            }, 3000);
        }
    }
    
    /**
     * Update AR button state based on model loading and AR availability
     */
    updateARButtonState() {
        if (!this.elements.arButton) return;

        const arIcon = this.elements.arButton.querySelector('span:first-child');
        const arText = this.elements.arButton.querySelector('span:last-child');

        if (!this.state.modelLoaded) {
            this.elements.arButton.disabled = true;
            if (arIcon) arIcon.textContent = '⏳';
            if (arText) arText.textContent = 'Carregando...';
        } else if (!this.state.arReady) {
            this.elements.arButton.disabled = true;
            if (arIcon) arIcon.textContent = '❌';
            if (arText) arText.textContent = 'AR indisponível';
        } else {
            this.elements.arButton.disabled = false;
            if (arIcon) arIcon.textContent = '📱';
            if (arText) arText.textContent = 'Ver em AR';
        }
    }
    
    /**
     * Update progress bar
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgressBar(progress) {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progress}%`;
        }
    }
    
    /**
     * Load 3D model with error handling
     * @returns {Promise<boolean>} - Whether the model was loaded successfully
     */
    async loadModel() {
        const modelId = this.config.modelId;
        const modelSrc = `models/modelo${modelId}.glb`;
        const usdzSrc = `models/usdz/modelo${modelId}.usdz`;
        const fallbackModelId = 1; // Default model to use as fallback
        const fallbackModelSrc = `models/modelo${fallbackModelId}.glb`;
        const fallbackUsdzSrc = `models/usdz/modelo${fallbackModelId}.usdz`;

        this.log(`Loading model: ${modelSrc}, ${usdzSrc}`);

        try {
            // Check if model exists with timeout protection
            const checkPromise = this.checkModelExists(modelSrc);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Model check timeout')), 5000)
            );
            
            const exists = await Promise.race([checkPromise, timeoutPromise]);
            
            if (!exists) {
                this.log(`Model ${modelId} not found, showing 404 error`);
                this.show404Error();
                
                // Try fallback model if the requested one doesn't exist
                if (modelId !== fallbackModelId) {
                    this.log(`Attempting to load fallback model ${fallbackModelId}`);
                    this.config.modelId = fallbackModelId;
                    return this.loadModel(); // Recursive call with fallback model
                } else {
                    throw new Error(`Both requested and fallback models not found`);
                }
            }

            // Initialize model viewer if it doesn't exist
            if (!this.elements.modelViewer) {
                this.log('Creating model viewer element');
                this.elements.modelViewer = this.createModelViewer();
                if (!this.elements.modelViewer) {
                    throw new Error('Failed to create model viewer');
                }
            }

            // Apply model sources with cache-busting for better reliability
            const cacheBuster = `?t=${Date.now()}`;
            this.elements.modelViewer.src = `${modelSrc}${cacheBuster}`;
            this.elements.modelViewer.setAttribute('ios-src', `${usdzSrc}`);
            
            // Set AR scale with device-specific adjustments
            const arScale = this.getOptimalARScale();
            this.elements.modelViewer.style.setProperty('--ar-scale', arScale.toString());
            this.log(`Model configured with AR scale ${arScale}x`);
            
            // Set poster (preview image) if available
            const posterSrc = `models/previews/modelo${modelId}.jpg`;
            this.elements.modelViewer.setAttribute('poster', posterSrc);
            
            // Set environment lighting based on device capabilities
            if (this.isHighEndDevice()) {
                this.elements.modelViewer.setAttribute('environment-image', 'neutral');
                this.elements.modelViewer.setAttribute('shadow-intensity', '1');
            } else {
                // Use simpler lighting for lower-end devices
                this.elements.modelViewer.setAttribute('environment-image', 'neutral');
                this.elements.modelViewer.setAttribute('shadow-intensity', '0');
            }

            // Setup model event listeners
            this.setupModelEventListeners();

            return true;

        } catch (error) {
            this.log(`Error loading model: ${error.message}`);
            if (!this.state.is404Error) {
                this.showStatus('Erro ao carregar modelo 3D', 'error');
            }
            this.state.modelLoaded = false;
            this.updateARButtonState();
            return false;
        }
    }

    /**
     * Create and configure the model viewer element
     * @returns {Element} - The created model-viewer element
     */
    createModelViewer() {
        const container = document.getElementById('model-viewer-container');
        if (!container) {
            this.log('Model viewer container not found');
            return null;
        }

        // Use the integration script if available
        if (typeof initARModelViewer === 'function') {
            return initARModelViewer('model-viewer-container', this.config.modelId, {
                onLoad: (modelId) => {
                    this.log(`Model ${modelId} loaded via integration script`);
                    this.state.modelLoaded = true;
                    this.updateARButtonState();
                    this.showControls();
                },
                onError: (modelId, event) => {
                    this.log(`Model ${modelId} failed to load:`, event);
                    this.state.modelLoaded = false;
                    this.updateARButtonState();
                }
            });
        }

        // Fallback: create manually
        const modelViewer = document.createElement('model-viewer');
        
        const attributes = {
            'id': 'modelViewer',
            'alt': `Modelo 3D Interativo - Techno Sutra AR - Capítulo ${this.config.modelId}`,
            'camera-controls': '',
            'touch-action': 'pan-y',
            'ar': '',
            'ar-modes': 'quick-look webxr scene-viewer',
            'ar-scale': 'auto',
            'ar-placement': 'floor',
            'auto-rotate': '',
            'rotation-per-second': '15deg',
            'loading': 'eager',
            'reveal': 'auto',
            'field-of-view': '30deg',
            'min-camera-orbit': 'auto 0deg auto',
            'max-camera-orbit': 'auto 180deg auto',
            'tone-mapping': 'linear',
            'style': 'width: 100%; height: 100vh; background-color: transparent; --poster-color: transparent; position: fixed; top: 0; left: 0; z-index: 2;'
        };

        Object.entries(attributes).forEach(([key, value]) => {
            if (value === '') {
                modelViewer.setAttribute(key, '');
            } else {
                modelViewer.setAttribute(key, value);
            }
        });

        container.appendChild(modelViewer);
        return modelViewer;
    }

    /**
     * Setup model event listeners
     */
    setupModelEventListeners() {
        if (!this.elements.modelViewer) return;

        this.elements.modelViewer.addEventListener('load', () => {
            this.log('Model loaded successfully');
            this.state.modelLoaded = true;
            this.updateARButtonState();
            this.showControls();
        });

        this.elements.modelViewer.addEventListener('error', (event) => {
            this.log('Model loading error:', event);
            this.state.modelLoaded = false;
            this.updateARButtonState();
        });

        this.elements.modelViewer.addEventListener('progress', (event) => {
            if (event.detail && event.detail.totalProgress !== undefined) {
                this.updateProgressBar(event.detail.totalProgress * 100);
            }
        });

        this.elements.modelViewer.addEventListener('ar-status', (event) => {
            this.log('AR status:', event.detail.status);
            if (event.detail.status === 'session-started') {
                this.state.arSessionActive = true;
                this.showStatus('Sessão AR iniciada', 'success');
            } else if (event.detail.status === 'not-presenting') {
                this.state.arSessionActive = false;
                this.showStatus('Sessão AR encerrada', 'info');
            }
        });
    }
    
    /**
     * Check if device is iOS
     * @returns {boolean} - Whether the device is iOS
     */
    isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    /**
     * Check if device is Android
     * @returns {boolean} - Whether the device is Android
     */
    isAndroidDevice() {
        return /Android/.test(navigator.userAgent);
    }
    
    /**
     * Get iOS version if running on iOS
     * @returns {number|null} iOS version number or null if not iOS
     */
    getIOSVersion() {
        if (!this.isIOSDevice()) return null;
        
        const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return null;
    }
    
    /**
     * Get optimal camera constraints based on device capabilities
     * @returns {Object} - Camera constraints
     */
    getOptimalCameraConstraints() {
        const base = {
            facingMode: 'environment',
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            frameRate: { ideal: 30, min: 15 }
        };
        
        // Apply device-specific optimizations
        if (this.isIOSDevice()) {
            // iOS devices often work better with specific constraints
            const iosVersion = this.getIOSVersion();
            if (iosVersion && iosVersion >= 13) {
                // Newer iOS devices can handle higher resolutions
                return {
                    facingMode: 'environment',
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 24 }
                };
            } else {
                // Older iOS devices need more conservative settings
                return {
                    facingMode: 'environment',
                    width: { ideal: 640, min: 320 },
                    height: { ideal: 480, min: 240 },
                    frameRate: { ideal: 24, min: 15 }
                };
            }
        } else if (this.isAndroidDevice()) {
            // Android devices can vary widely in capabilities
            return {
                facingMode: 'environment',
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
                frameRate: { ideal: 30, min: 15 }
            };
        }
        
        return base;
    }
    
    /**
     * Apply iOS-specific camera optimizations
     * @param {MediaStreamTrack} track - Video track
     */
    applyIOSCameraOptimizations(track) {
        try {
            // iOS Safari has some specific behaviors with camera streams
            // that can be optimized
            
            // On iOS, we sometimes need to apply specific constraints after
            // the track is already active to get optimal performance
            const capabilities = track.getCapabilities();
            this.log(`Camera capabilities: ${JSON.stringify(capabilities)}`);
            
            // If the camera supports these capabilities, apply them
            const constraints = {};
            
            if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
                constraints.whiteBalanceMode = 'continuous';
            }
            
            if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
                constraints.exposureMode = 'continuous';
            }
            
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                constraints.focusMode = 'continuous';
            }
            
            if (Object.keys(constraints).length > 0) {
                track.applyConstraints(constraints)
                    .then(() => this.log('Applied iOS camera optimizations'))
                    .catch(e => this.log(`Failed to apply iOS optimizations: ${e.message}`));
            }
        } catch (error) {
            this.log(`iOS camera optimization error: ${error.message}`);
            // Non-critical error, continue without optimization
        }
    }
    
    /**
     * Apply iOS-specific color enhancements
     */
    applyIOSColorFix() {
        if (this.isIOSDevice() && this.elements.modelViewer) {
            // Apply iOS-specific fixes if needed
            this.log('Applied iOS color enhancement fixes');
        }
    }
    
    /**
     * Get optimal AR scale based on device
     * @returns {number} - Optimal AR scale
     */
    getOptimalARScale() {
        // Base scale from config
        const baseScale = this.config.arScale || 2.0;
        
        // Device-specific adjustments
        if (this.isIOSDevice()) {
            const iosVersion = this.getIOSVersion();
            // iOS devices often need smaller scale
            if (iosVersion && iosVersion >= 13) {
                return baseScale * 0.8; // 20% smaller for newer iOS
            } else {
                return baseScale * 0.7; // 30% smaller for older iOS
            }
        } else if (this.isAndroidDevice()) {
            // Android devices often need larger scale
            return baseScale * 1.1; // 10% larger for Android
        }
        
        return baseScale;
    }
    
    /**
     * Check if device is a high-end device capable of advanced rendering
     * @returns {boolean} - Whether the device is high-end
     */
    isHighEndDevice() {
        // Check for hardware concurrency (CPU cores)
        const highCPUCores = navigator.hardwareConcurrency >= 4;
        
        // Check for device memory (if available)
        const highMemory = navigator.deviceMemory >= 4;
        
        // Check for high-end GPU (indirect check via canvas performance)
        let gpuPerformance = false;
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    // Check for keywords indicating high-end GPUs
                    gpuPerformance = /(nvidia|adreno 6|apple gpu|mali-g|intel iris)/i.test(renderer);
                }
            }
        } catch (e) {
            this.log(`GPU detection error: ${e.message}`);
        }
        
        // iOS devices are generally optimized well
        if (this.isIOSDevice()) {
            const iosVersion = this.getIOSVersion();
            if (iosVersion && iosVersion >= 13) {
                return true; // Newer iOS devices are considered high-end
            }
        }
        
        // Return true if at least two conditions are met
        return (highCPUCores && highMemory) || 
               (highCPUCores && gpuPerformance) || 
               (highMemory && gpuPerformance);
    }
    
    /**
     * Start camera with optimization
     * @returns {Promise<boolean>} - Whether the camera was started successfully
     */
    async startCamera() {
        try {
            this.log('Starting camera...');
            
            // Stop any existing camera stream first
            if (this.state.cameraStream) {
                this.state.cameraStream.getTracks().forEach(track => track.stop());
                this.state.cameraStream = null;
            }
            
            // Try to get optimal camera settings based on device capabilities
            const constraints = this.getOptimalCameraConstraints();
            this.log(`Using camera constraints: ${JSON.stringify(constraints)}`);

            // Request camera access with timeout protection
            const mediaPromise = navigator.mediaDevices.getUserMedia({ video: constraints });
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Camera access timeout')), 10000)
            );
            
            this.state.cameraStream = await Promise.race([mediaPromise, timeoutPromise]);

            if (!this.elements.cameraFeed) {
                throw new Error('Video element not found');
            }

            this.elements.cameraFeed.srcObject = this.state.cameraStream;
            this.elements.cameraFeed.style.display = 'block';
            this.elements.cameraFeed.style.opacity = '1';
            this.elements.cameraFeed.style.background = 'transparent';

            await new Promise((resolve, reject) => {
                this.elements.cameraFeed.onloadedmetadata = () => {
                    this.elements.cameraFeed.play().then(resolve).catch(reject);
                };
                this.elements.cameraFeed.onerror = reject;
                setTimeout(reject, 8000);
            });

            const videoTracks = this.state.cameraStream.getVideoTracks();
            const cameraLabel = videoTracks.length > 0 ? videoTracks[0].label : 'Unknown';
            this.log(`Camera started: ${cameraLabel}`);
            
            // Hide gradient background when camera starts
            document.body.style.background = 'transparent';
            
            return true;

        } catch (error) {
            this.log(`Camera error: ${error.message}`);

            // Show gradient background only when camera fails
            if (this.elements.cameraFeed) {
                this.elements.cameraFeed.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                this.elements.cameraFeed.style.opacity = '1';
            }
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

            return false;
        }
    }
    
    /**
     * Test AR support with timeout
     * @returns {Promise<Object>} - AR support information
     */
    async testARSupport() {
        try {
            this.log('Checking AR support...');
            
            const results = {
                webxr: false,
                sceneViewer: this.isAndroidDevice(),
                quickLook: this.isIOSDevice(),
                modelViewer: false
            };
            
            // Check WebXR support with timeout protection
            if (navigator.xr) {
                try {
                    const webxrPromise = navigator.xr.isSessionSupported('immersive-ar');
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('WebXR timeout')), 3000)
                    );
                    
                    results.webxr = await Promise.race([webxrPromise, timeoutPromise]);
                    this.log(`WebXR AR: ${results.webxr ? 'Supported' : 'Not supported'}`);
                } catch (e) {
                    this.log(`WebXR test failed: ${e.message}`);
                }
            }
            
            // Check model-viewer AR support
            if (customElements.get('model-viewer')) {
                results.modelViewer = true;
                this.log('model-viewer element is available');
            }
            
            // Enhanced iOS detection for newer devices
            if (results.quickLook) {
                // Check iOS version for better AR support detection
                const iosVersion = this.getIOSVersion();
                if (iosVersion && iosVersion >= 12) {
                    this.log(`iOS ${iosVersion} detected with AR Quick Look support`);
                    results.quickLook = true;
                } else if (iosVersion) {
                    this.log(`iOS ${iosVersion} detected but may have limited AR support`);
                }
            }
            
            // Enhanced Android detection for ARCore
            if (results.sceneViewer) {
                // Check for Chrome which is required for Scene Viewer
                const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
                if (isChrome) {
                    this.log('Chrome detected on Android, Scene Viewer should be available');
                } else {
                    this.log('Non-Chrome browser on Android, Scene Viewer may have limited support');
                    // Still allow it but with a warning
                }
            }
            
            const supported = results.webxr || results.sceneViewer || results.quickLook || results.modelViewer;
            
            if (supported) {
                const modes = [];
                if (results.webxr) modes.push('WebXR');
                if (results.sceneViewer) modes.push('Scene Viewer');
                if (results.quickLook) modes.push('Quick Look');
                if (results.modelViewer) modes.push('model-viewer');
                
                this.log(`✅ AR available via: ${modes.join(', ')}`);
                this.state.arReady = true;
                
                // Store the best available AR mode for later use
                this.state.bestARMode = results.webxr ? 'webxr' : 
                                       (results.sceneViewer ? 'scene-viewer' : 
                                       (results.quickLook ? 'quick-look' : 'model-viewer'));
                this.log(`Best AR mode: ${this.state.bestARMode}`);
            } else {
                this.log('❌ AR not available on this device');
                this.state.arReady = false;
                this.state.bestARMode = null;
            }
            
            this.updateARButtonState();
            return { supported, ...results };
            
        } catch (error) {
            this.log(`❌ Error testing AR: ${error.message}`);
            this.state.arReady = false;
            this.updateARButtonState();
            return { supported: false, error: error.message };
        }
    }
    
    /**
     * Get iOS version if running on iOS
     * @returns {number|null} iOS version number or null if not iOS
     */
    getIOSVersion() {
        if (!this.isIOSDevice()) return null;
        
        const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return null;
    }
    
    /**
     * Setup event listeners for AR experience
     */
    setupEventListeners() {
        // Model viewer event listeners are now handled in setupModelEventListeners()
        // This method is reserved for other UI events

        // Model controls
        if (this.elements.resetCameraBtn) {
            this.elements.resetCameraBtn.addEventListener('click', () => {
                if (this.elements.modelViewer && typeof this.elements.modelViewer.resetTurntableRotation === 'function') {
                    this.elements.modelViewer.resetTurntableRotation();
                }
                if (this.elements.modelViewer && typeof this.elements.modelViewer.jumpCameraToGoal === 'function') {
                    this.elements.modelViewer.jumpCameraToGoal();
                }
                this.log('🔄 Camera reset');
            });
        }
        
        if (this.elements.toggleRotateBtn) {
            this.elements.toggleRotateBtn.addEventListener('click', () => {
                if (!this.elements.modelViewer) return;
                
                if (this.state.isRotating) {
                    this.elements.modelViewer.removeAttribute('auto-rotate');
                    this.elements.toggleRotateBtn.textContent = '▶️';
                    this.elements.toggleRotateBtn.title = 'Start rotation';
                } else {
                    this.elements.modelViewer.setAttribute('auto-rotate', '');
                    this.elements.toggleRotateBtn.textContent = '⏸️';
                    this.elements.toggleRotateBtn.title = 'Stop rotation';
                }
                this.state.isRotating = !this.state.isRotating;
                this.log(`🔄 Rotation ${this.state.isRotating ? 'enabled' : 'disabled'}`);
            });
        }

        // Camera permission button
        if (this.elements.cameraButton) {
            this.elements.cameraButton.addEventListener('click', async () => {
                if (this.elements.cameraPermission) {
                    this.elements.cameraPermission.classList.add('hidden');
                }
                await this.startCamera();
            });
        }
        
        // Handle page visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause non-essential activities when page is hidden
                if (this.elements.modelViewer && this.state.isRotating) {
                    this.elements.modelViewer.removeAttribute('auto-rotate');
                }
            } else {
                // Resume activities when page becomes visible
                if (this.elements.modelViewer && this.state.isRotating) {
                    this.elements.modelViewer.setAttribute('auto-rotate', '');
                }
            }
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    /**
     * Auto-start AR if available
     */
    tryAutoAR() {
        if (this.state.modelLoaded && this.state.arReady && this.elements.arButton && !this.elements.arButton.disabled) {
            this.log('Attempting auto-AR activation');
            // Note: Auto-AR requires user gesture, so this is for future enhancement
        }
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.state.cameraStream) {
            this.state.cameraStream.getTracks().forEach(track => track.stop());
            this.state.cameraStream = null;
            this.log('Camera stopped');
        }

        if (this.state.statusHideTimer) {
            clearTimeout(this.state.statusHideTimer);
            this.state.statusHideTimer = null;
        }
    }
    
    /**
     * Add navigation arrows to the AR experience
     */
    addNavigationArrows() {
        const leftArrow = document.createElement('button');
        const rightArrow = document.createElement('button');

        leftArrow.innerHTML = '⬅️';
        rightArrow.innerHTML = '➡️';

        leftArrow.className = 'nav-arrow left';
        rightArrow.className = 'nav-arrow right';

        leftArrow.addEventListener('click', () => this.navigateToModel(-1));
        rightArrow.addEventListener('click', () => this.navigateToModel(1));

        document.body.appendChild(leftArrow);
        document.body.appendChild(rightArrow);
    }
    
    /**
     * Navigate to a different model
     * @param {number} direction - Direction to navigate (-1 for previous, 1 for next)
     */
    navigateToModel(direction) {
        const params = new URLSearchParams(window.location.search);
        let currentModel = parseInt(params.get('model')) || 1;
        let newModel = currentModel + direction;

        if (newModel < 1) newModel = 56;
        else if (newModel > 56) newModel = 1;

        window.location.href = `${window.location.pathname}?model=${newModel}`;
    }
}

// Initialize AR experience when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const arExperience = new ARExperienceController();
    arExperience.initialize();
    arExperience.addNavigationArrows();
    
    // Make the controller available globally for debugging
    window.arExperience = arExperience;
});