/**
 * Modern ES6+ JavaScript for Techno Sutra AR
 * Converted from legacy function declarations to modern patterns
 */

// Constants and configuration
const CONFIG = {
    MAX_MODELS: 56,
    MIN_MODEL_ID: 1,
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    DEBOUNCE_DELAY: 300,
    AR_TIMEOUT: 5000,
    MODEL_TIMEOUT: 5000
};

// Utility functions with modern patterns
const utils = {
    /**
     * Device detection utilities
     */
    device: {
        isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: () => /Android/.test(navigator.userAgent),
        isMobile: () => /Mobi|Android/i.test(navigator.userAgent),
        isSafari: () => /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    },

    /**
     * Debounce function with modern syntax
     */
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    /**
     * Throttle function
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Validate model ID with proper range checking
     */
    validateModelId: (id) => {
        const modelId = parseInt(id);
        return (modelId >= CONFIG.MIN_MODEL_ID && modelId <= CONFIG.MAX_MODELS) ? modelId : null;
    },

    /**
     * Format bytes for display
     */
    formatBytes: (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }
};

// Modern Model Manager class
class ModelManager {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.loadedModels = new Set();
    }

    /**
     * Load model with caching and error handling
     */
    async loadModel(modelId) {
        const validId = utils.validateModelId(modelId);
        if (!validId) {
            throw new Error(`Invalid model ID: ${modelId}`);
        }

        const cacheKey = `model_${validId}`;
        
        // Return cached result
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Return existing promise if loading
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        // Create new loading promise
        const loadingPromise = this._performLoad(validId);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const result = await loadingPromise;
            this.cache.set(cacheKey, result);
            this.loadedModels.add(validId);
            return result;
        } catch (error) {
            this.cache.delete(cacheKey);
            throw error;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    /**
     * Private method to perform actual loading
     */
    async _performLoad(modelId) {
        const modelSrc = `modelo${modelId}.glb`;
        const usdzSrc = `usdz/modelo${modelId}.usdz`;

        try {
            const exists = await this._checkModelExists(modelSrc);
            if (!exists) {
                throw new Error(`Model ${modelId} not found`);
            }

            return {
                id: modelId,
                glb: modelSrc,
                usdz: usdzSrc,
                loaded: true,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Failed to load model ${modelId}: ${error.message}`);
        }
    }

    /**
     * Check if model exists using HEAD request
     */
    async _checkModelExists(modelSrc, timeout = CONFIG.MODEL_TIMEOUT) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(modelSrc, { 
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cached: this.cache.size,
            loaded: this.loadedModels.size,
            loading: this.loadingPromises.size
        };
    }

    /**
     * Clear cache with optional age filtering
     */
    clearCache(maxAge = CONFIG.CACHE_DURATION) {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > maxAge) {
                this.cache.delete(key);
            }
        }
    }
}

// Modern AR Manager class
class ARManager {
    constructor() {
        this.isSupported = false;
        this.capabilities = {
            webxr: false,
            sceneViewer: false,
            quickLook: false
        };
        this.session = null;
    }

    /**
     * Initialize AR capabilities
     */
    async initialize() {
        await this._detectCapabilities();
        this.isSupported = Object.values(this.capabilities).some(Boolean);
        return this.isSupported;
    }

    /**
     * Detect AR capabilities across platforms
     */
    async _detectCapabilities() {
        // WebXR detection
        if (navigator.xr) {
            try {
                this.capabilities.webxr = await Promise.race([
                    navigator.xr.isSessionSupported('immersive-ar'),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('WebXR timeout')), CONFIG.AR_TIMEOUT)
                    )
                ]);
            } catch (error) {
                this.capabilities.webxr = false;
            }
        }

        // Platform-specific capabilities
        this.capabilities.quickLook = utils.device.isIOS();
        this.capabilities.sceneViewer = utils.device.isAndroid();
    }

    /**
     * Get supported AR modes
     */
    getSupportedModes() {
        const modes = [];
        if (this.capabilities.webxr) modes.push('webxr');
        if (this.capabilities.sceneViewer) modes.push('scene-viewer');
        if (this.capabilities.quickLook) modes.push('quick-look');
        return modes;
    }

    /**
     * Get AR status for UI updates
     */
    getStatus() {
        return {
            supported: this.isSupported,
            capabilities: this.capabilities,
            modes: this.getSupportedModes()
        };
    }
}

// Modern Status Manager class
class StatusManager {
    constructor() {
        this.statusEl = document.getElementById('status');
        this.hideTimer = null;
    }

    /**
     * Show status message with modern async/await pattern
     */
    async show(message, type = 'info', duration = 3000) {
        if (!this.statusEl) return;

        // Clear existing timer
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
        }

        // Update status element
        this.statusEl.textContent = message;
        this.statusEl.className = `show ${type}`;

        // Auto-hide after duration
        this.hideTimer = setTimeout(() => {
            this.hide();
        }, duration);

        // Return promise that resolves when message is hidden
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    /**
     * Hide status message
     */
    hide() {
        if (this.statusEl) {
            this.statusEl.classList.remove('show');
        }
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    }

    /**
     * Show success message
     */
    success(message, duration = 2000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show error message
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show info message
     */
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Modern Camera Manager class
class CameraManager {
    constructor() {
        this.stream = null;
        this.videoEl = null;
        this.isActive = false;
    }

    /**
     * Initialize camera with modern constraints
     */
    async initialize() {
        this.videoEl = document.getElementById('camera-feed');
        if (!this.videoEl) {
            throw new Error('Camera video element not found');
        }
    }

    /**
     * Start camera with optimal settings
     */
    async start() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1080, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoEl.srcObject = this.stream;
            
            await new Promise((resolve, reject) => {
                this.videoEl.onloadedmetadata = resolve;
                this.videoEl.onerror = reject;
                setTimeout(reject, 8000); // 8 second timeout
            });

            await this.videoEl.play();
            this.isActive = true;
            
            return this._getCameraInfo();
        } catch (error) {
            this.isActive = false;
            throw new Error(`Camera initialization failed: ${error.message}`);
        }
    }

    /**
     * Stop camera and cleanup
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoEl) {
            this.videoEl.srcObject = null;
        }
        
        this.isActive = false;
    }

    /**
     * Get camera information
     */
    _getCameraInfo() {
        if (!this.stream) return null;
        
        const videoTracks = this.stream.getVideoTracks();
        if (videoTracks.length === 0) return null;
        
        const track = videoTracks[0];
        const settings = track.getSettings();
        
        return {
            label: track.label,
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            facingMode: settings.facingMode
        };
    }

    /**
     * Check camera permissions
     */
    async checkPermissions() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            return 'unknown';
        }
    }
}

// Modern App Controller class
class TechnoSutraAR {
    constructor() {
        this.modelManager = new ModelManager();
        this.arManager = new ARManager();
        this.statusManager = new StatusManager();
        this.cameraManager = new CameraManager();
        
        this.modelViewer = null;
        this.currentModelId = 1;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this._setupElements();
            await this._setupEventListeners();
            await this._loadInitialModel();
            await this._initializeAR();
            await this._initializeCamera();
            
            this.isInitialized = true;
            await this.statusManager.success('Aplicação inicializada com sucesso');
            
        } catch (error) {
            await this.statusManager.error(`Erro na inicialização: ${error.message}`);
            throw error;
        }
    }

    /**
     * Setup DOM elements
     */
    async _setupElements() {
        this.modelViewer = document.getElementById('modelViewer');
        if (!this.modelViewer) {
            throw new Error('Model viewer element not found');
        }

        // Wait for model-viewer to be defined
        await customElements.whenDefined('model-viewer');
    }

    /**
     * Setup event listeners with modern patterns
     */
    async _setupEventListeners() {
        // Model viewer events
        this.modelViewer.addEventListener('load', () => this._onModelLoad());
        this.modelViewer.addEventListener('error', (e) => this._onModelError(e));
        this.modelViewer.addEventListener('ar-status', (e) => this._onARStatus(e));
        
        // Control events
        const resetBtn = document.getElementById('reset-camera');
        const rotateBtn = document.getElementById('toggle-rotate');
        
        resetBtn?.addEventListener('click', () => this._resetCamera());
        rotateBtn?.addEventListener('click', () => this._toggleRotation());

        // Keyboard events
        document.addEventListener('keydown', (e) => this._handleKeyboard(e));
        
        // Window events
        window.addEventListener('beforeunload', () => this._cleanup());
    }

    /**
     * Load initial model from URL parameters
     */
    async _loadInitialModel() {
        const urlParams = new URLSearchParams(window.location.search);
        const modelId = utils.validateModelId(urlParams.get('model')) || 1;
        
        await this.loadModel(modelId);
    }

    /**
     * Initialize AR capabilities
     */
    async _initializeAR() {
        const supported = await this.arManager.initialize();
        const status = this.arManager.getStatus();
        
        const arButton = document.getElementById('ar-button');
        if (arButton) {
            if (supported) {
                arButton.disabled = false;
                arButton.innerHTML = '<span aria-hidden="true">📱</span><span>Ver em AR</span>';
                arButton.setAttribute('aria-label', 'Visualizar em Realidade Aumentada');
            } else {
                arButton.disabled = true;
                arButton.innerHTML = '<span aria-hidden="true">❌</span><span>AR indisponível</span>';
                arButton.setAttribute('aria-label', 'Realidade aumentada não suportada');
            }
        }
    }

    /**
     * Initialize camera manager
     */
    async _initializeCamera() {
        try {
            await this.cameraManager.initialize();
        } catch (error) {
            console.warn('Camera initialization failed:', error.message);
        }
    }

    /**
     * Load model with modern async/await
     */
    async loadModel(modelId) {
        try {
            const modelData = await this.modelManager.loadModel(modelId);
            
            this.modelViewer.src = modelData.glb;
            this.modelViewer.setAttribute('ios-src', modelData.usdz);
            
            this.currentModelId = modelData.id;
            
            return modelData;
        } catch (error) {
            if (error.message.includes('not found')) {
                this._show404Error();
            } else {
                await this.statusManager.error('Erro ao carregar modelo');
            }
            throw error;
        }
    }

    /**
     * Event handlers with modern patterns
     */
    _onModelLoad() {
        this.statusManager.success('Modelo carregado');
        this._showControls();
    }

    _onModelError(event) {
        this.statusManager.error('Erro no modelo 3D');
    }

    _onARStatus(event) {
        const status = event.detail?.status;
        switch(status) {
            case 'session-started':
                this.statusManager.info('Sessão AR iniciada');
                break;
            case 'object-placed':
                this.statusManager.success('Objeto posicionado');
                break;
            case 'failed':
                this.statusManager.error('AR falhou');
                break;
        }
    }

    _resetCamera() {
        this.modelViewer.resetTurntableRotation?.();
        this.modelViewer.jumpCameraToGoal?.();
        this.statusManager.success('Câmera resetada', 1500);
    }

    _toggleRotation() {
        const rotateBtn = document.getElementById('toggle-rotate');
        const isRotating = this.modelViewer.hasAttribute('auto-rotate');
        
        if (isRotating) {
            this.modelViewer.removeAttribute('auto-rotate');
            rotateBtn.textContent = '▶️';
            rotateBtn.setAttribute('aria-label', 'Iniciar rotação');
        } else {
            this.modelViewer.setAttribute('auto-rotate', '');
            rotateBtn.textContent = '⏸️';
            rotateBtn.setAttribute('aria-label', 'Parar rotação');
        }
    }

    _handleKeyboard(event) {
        switch(event.key) {
            case 'Escape':
                // Exit fullscreen or AR
                break;
            case 'r':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this._resetCamera();
                }
                break;
        }
    }

    _show404Error() {
        const error404 = document.getElementById('error-404');
        if (error404) {
            error404.classList.remove('hidden');
            setTimeout(() => {
                window.location.href = `${window.location.pathname}?model=1`;
            }, 3000);
        }
    }

    _showControls() {
        const controls = document.getElementById('model-controls');
        if (controls) {
            controls.classList.add('show');
        }
    }

    _cleanup() {
        this.cameraManager.stop();
        this.modelManager.clearCache();
    }

    /**
     * Public API methods
     */
    async switchModel(modelId) {
        if (!this.isInitialized) {
            throw new Error('App not initialized');
        }
        return this.loadModel(modelId);
    }

    getStats() {
        return {
            model: this.currentModelId,
            cache: this.modelManager.getCacheStats(),
            ar: this.arManager.getStatus(),
            camera: this.cameraManager.isActive
        };
    }
}

// Export for module usage
export { TechnoSutraAR, ModelManager, ARManager, StatusManager, CameraManager, utils };

// Auto-initialize if not using modules
if (typeof module === 'undefined' && typeof window !== 'undefined') {
    window.TechnoSutraAR = TechnoSutraAR;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new TechnoSutraAR();
            window.app.init().catch(console.error);
        });
    } else {
        window.app = new TechnoSutraAR();
        window.app.init().catch(console.error);
    }
}
