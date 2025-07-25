/**
 * Main Application Module for Techno Sutra AR
 * Modern ES6+ application architecture with proper error handling and state management
 * @module TechnoSutraAR
 */

import logger from '../core/logger.js';
import config from '../core/config.js';
import { ModelViewer } from '../components/ModelViewer.js';
import { $, $$, waitForDOM, addEventListener, show, hide } from '../utils/dom.js';
import { retry, withTimeout, sleep } from '../utils/async.js';

const log = logger.createContext('TechnoSutraAR');

/**
 * Main application class for Techno Sutra AR
 */
export class TechnoSutraAR {
    #modelViewer = null;
    #currentModelId = 1;
    #isInitialized = false;
    #arSupported = false;
    #cameraStream = null;
    #elements = new Map();
    #eventCleanup = [];
    #statusTimer = null;

    constructor() {
        this.#initialize();
    }

    /**
     * Initialize the application
     * @private
     */
    async #initialize() {
        try {
            log.info('🚀 Initializing Techno Sutra AR...');

            await waitForDOM();
            await this.#loadConfiguration();
            await this.#setupElements();
            await this.#initializeModelViewer();
            await this.#setupEventListeners();
            await this.#checkARSupport();
            await this.#requestCameraAccess();
            await this.#loadInitialModel();

            this.#isInitialized = true;
            this.#hideLoading();

            log.info('✅ Techno Sutra AR initialized successfully');

        } catch (error) {
            log.error('❌ Failed to initialize application:', error);
            this.#showError('Falha na inicialização da aplicação');
        }
    }

    /**
     * Load configuration
     * @private
     */
    async #loadConfiguration() {
        try {
            await config.loadConfig();
            log.info('Configuration loaded');
        } catch (error) {
            log.warn('Using default configuration:', error.message);
        }
    }

    /**
     * Setup DOM elements
     * @private
     */
    async #setupElements() {
        const elementIds = [
            'modelViewer',
            'status',
            'loading-overlay',
            'camera-permission',
            'camera-button',
            'ar-button',
            'model-controls',
            'error-404'
        ];

        elementIds.forEach(id => {
            const element = $(`#${id}`);
            if (element) {
                this.#elements.set(id, element);
            } else {
                log.debug(`Optional element not found: ${id}`);
            }
        });

        // Verify critical elements
        const criticalElements = ['modelViewer'];
        const missing = criticalElements.filter(id => !this.#elements.has(id));
        
        if (missing.length > 0) {
            throw new Error(`Critical elements missing: ${missing.join(', ')}`);
        }
    }

    /**
     * Initialize model viewer component
     * @private
     */
    async #initializeModelViewer() {
        const modelViewerContainer = this.#elements.get('modelViewer');
        
        this.#modelViewer = new ModelViewer(modelViewerContainer, {
            scale: config.get('ar.scale'),
            autoRotate: config.get('ar.autoRotate'),
            enableAR: true,
            showControls: true
        });

        // Setup model viewer event listeners
        this.#eventCleanup.push(
            addEventListener(modelViewerContainer, 'model-loaded', this.#onModelLoaded.bind(this)),
            addEventListener(modelViewerContainer, 'model-error', this.#onModelError.bind(this)),
            addEventListener(modelViewerContainer, 'model-progress', this.#onModelProgress.bind(this)),
            addEventListener(modelViewerContainer, 'ar-status-change', this.#onARStatusChange.bind(this))
        );
    }

    /**
     * Setup application event listeners
     * @private
     */
    async #setupEventListeners() {
        // Camera permission button
        const cameraButton = this.#elements.get('camera-button');
        if (cameraButton) {
            this.#eventCleanup.push(
                addEventListener(cameraButton, 'click', this.#requestCameraAccess.bind(this))
            );
        }

        // Window events
        this.#eventCleanup.push(
            addEventListener(window, 'beforeunload', this.#cleanup.bind(this)),
            addEventListener(window, 'resize', this.#onWindowResize.bind(this)),
            addEventListener(document, 'visibilitychange', this.#onVisibilityChange.bind(this))
        );

        // Keyboard shortcuts
        this.#eventCleanup.push(
            addEventListener(document, 'keydown', this.#onKeyDown.bind(this))
        );
    }

    /**
     * Check AR support on device
     * @private
     */
    async #checkARSupport() {
        try {
            log.info('🔍 Checking AR support...');

            const arSupport = {
                webxr: false,
                sceneViewer: this.#isAndroidDevice(),
                quickLook: this.#isIOSDevice()
            };

            // Test WebXR support
            if (navigator.xr) {
                try {
                    arSupport.webxr = await withTimeout(
                        navigator.xr.isSessionSupported('immersive-ar'),
                        3000
                    );
                } catch (error) {
                    log.debug('WebXR test failed:', error.message);
                }
            }

            this.#arSupported = arSupport.webxr || arSupport.sceneViewer || arSupport.quickLook;

            if (this.#arSupported) {
                const modes = [];
                if (arSupport.webxr) modes.push('WebXR');
                if (arSupport.sceneViewer) modes.push('Scene Viewer');
                if (arSupport.quickLook) modes.push('Quick Look');
                
                log.info(`✅ AR supported via: ${modes.join(', ')}`);
            } else {
                log.warn('❌ AR not supported on this device');
            }

        } catch (error) {
            log.error('AR support check failed:', error);
            this.#arSupported = false;
        }
    }

    /**
     * Request camera access for AR
     * @private
     */
    async #requestCameraAccess() {
        if (this.#cameraStream) {
            log.debug('Camera already active');
            this.#hideCameraPermission();
            return;
        }

        try {
            log.info('📷 Requesting camera access...');

            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1080, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            };

            this.#cameraStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Setup camera feed
            await this.#setupCameraFeed();
            this.#hideCameraPermission();

            log.info('✅ Camera access granted');

        } catch (error) {
            log.error('❌ Camera access denied:', error.message);
            this.#handleCameraError(error);
        }
    }

    /**
     * Setup camera feed
     * @private
     */
    async #setupCameraFeed() {
        const cameraFeed = $('#camera-feed');
        if (!cameraFeed || !this.#cameraStream) return;

        cameraFeed.srcObject = this.#cameraStream;
        show(cameraFeed);

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Camera setup timeout')), 8000);

            cameraFeed.onloadedmetadata = async () => {
                try {
                    await cameraFeed.play();
                    clearTimeout(timer);
                    resolve();
                } catch (error) {
                    clearTimeout(timer);
                    reject(error);
                }
            };

            cameraFeed.onerror = () => {
                clearTimeout(timer);
                reject(new Error('Camera feed error'));
            };
        });
    }

    /**
     * Handle camera access errors
     * @param {Error} error - Camera error
     * @private
     */
    #handleCameraError(error) {
        // Hide camera feed and show gradient background
        const cameraFeed = $('#camera-feed');
        if (cameraFeed) {
            hide(cameraFeed);
        }

        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

        // Show appropriate error message
        if (error.name === 'NotAllowedError') {
            this.#showStatus('Acesso à câmera negado. AR limitado.', 'warn', 5000);
        } else if (error.name === 'NotFoundError') {
            this.#showStatus('Câmera não encontrada.', 'warn');
        } else {
            this.#showStatus('Erro na câmera. Usando modo 3D.', 'warn');
        }
    }

    /**
     * Load initial model based on URL parameters
     * @private
     */
    async #loadInitialModel() {
        const urlParams = new URLSearchParams(window.location.search);
        const modelParam = urlParams.get('model');
        
        if (modelParam) {
            const modelId = Math.max(1, Math.min(56, parseInt(modelParam) || 1));
            this.#currentModelId = modelId;
        }

        await this.loadModel(this.#currentModelId);
    }

    /**
     * Load a specific model
     * @param {string|number} modelId - Model identifier
     */
    async loadModel(modelId) {
        if (!this.#modelViewer || !this.#isInitialized) {
            log.warn('Application not initialized');
            return;
        }

        try {
            this.#currentModelId = modelId;
            
            // Update page title
            document.title = `Techno Sutra AR - Capítulo ${modelId}`;
            
            // Load model with retry logic
            await retry(
                () => this.#modelViewer.loadModel(modelId),
                {
                    maxAttempts: 3,
                    delay: 1000,
                    onRetry: (error, attempt) => {
                        log.warn(`Model load attempt ${attempt} failed:`, error.message);
                    }
                }
            );

        } catch (error) {
            log.error(`Failed to load model ${modelId}:`, error);
            
            // Show 404 error if model not found
            if (error.message.includes('not found')) {
                this.#show404Error();
            } else {
                this.#showError('Erro ao carregar modelo 3D');
            }
        }
    }

    /**
     * Start AR session
     */
    async startAR() {
        if (!this.#arSupported) {
            this.#showStatus('AR não suportado neste dispositivo', 'warn');
            return;
        }

        if (!this.#modelViewer?.isLoaded) {
            this.#showStatus('Aguarde o carregamento do modelo', 'warn');
            return;
        }

        try {
            await this.#modelViewer.startAR();
            log.ar('session-requested', { modelId: this.#currentModelId });
        } catch (error) {
            log.error('Failed to start AR session:', error);
            this.#showStatus('Erro ao iniciar AR', 'error');
        }
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} [type='info'] - Message type
     * @param {number} [duration=3000] - Display duration
     * @private
     */
    #showStatus(message, type = 'info', duration = 3000) {
        const statusElement = this.#elements.get('status');
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = `show ${type}`;

        // Clear existing timer
        if (this.#statusTimer) {
            clearTimeout(this.#statusTimer);
        }

        // Auto-hide after duration
        this.#statusTimer = setTimeout(() => {
            statusElement.classList.remove('show');
        }, duration);
    }

    /**
     * Show 404 error
     * @private
     */
    #show404Error() {
        const error404 = this.#elements.get('error-404');
        if (!error404) return;

        show(error404);

        // Auto-redirect to model 1 after 3 seconds
        setTimeout(() => {
            hide(error404);
            window.location.href = `${window.location.pathname}?model=1`;
        }, 3000);
    }

    /**
     * Show general error
     * @param {string} message - Error message
     * @private
     */
    #showError(message) {
        this.#showStatus(message, 'error', 5000);
    }

    /**
     * Hide loading overlay
     * @private
     */
    #hideLoading() {
        const loadingOverlay = this.#elements.get('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Hide camera permission overlay
     * @private
     */
    #hideCameraPermission() {
        const cameraPermission = this.#elements.get('camera-permission');
        if (cameraPermission) {
            hide(cameraPermission);
        }
    }

    /**
     * Event Handlers
     */

    #onModelLoaded(event) {
        const { modelId, duration } = event.detail;
        log.model(modelId, 'loaded', { duration });
        this.#showStatus(`Modelo ${modelId} carregado`, 'success', 2000);
    }

    #onModelError(event) {
        const { modelId, error } = event.detail;
        log.model(modelId, 'error', { error: error.message });
    }

    #onModelProgress(event) {
        const { progress } = event.detail;
        if (progress < 100) {
            log.debug(`Loading progress: ${progress.toFixed(0)}%`);
        }
    }

    #onARStatusChange(event) {
        const { status } = event.detail;
        
        switch (status) {
            case 'session-started':
                this.#showStatus('Sessão AR iniciada', 'success');
                break;
            case 'object-placed':
                this.#showStatus('Objeto posicionado em AR', 'success');
                break;
            case 'failed':
                this.#showStatus('Falha na sessão AR', 'error');
                break;
        }
    }

    #onWindowResize() {
        // Handle responsive layout adjustments
        log.debug('Window resized');
    }

    #onVisibilityChange() {
        if (document.hidden) {
            // Pause operations when tab is hidden
            log.debug('Application hidden');
        } else {
            // Resume operations when tab is visible
            log.debug('Application visible');
        }
    }

    #onKeyDown(event) {
        // Keyboard shortcuts
        if (event.altKey || event.ctrlKey || event.metaKey) return;

        switch (event.key) {
            case 'r':
            case 'R':
                if (this.#modelViewer) {
                    this.#modelViewer.resetCamera();
                }
                break;
            case ' ':
                event.preventDefault();
                if (this.#modelViewer) {
                    this.#modelViewer.toggleRotation();
                }
                break;
            case 'a':
            case 'A':
                this.startAR();
                break;
        }
    }

    /**
     * Utility Methods
     */

    #isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    #isAndroidDevice() {
        return /Android/.test(navigator.userAgent);
    }

    /**
     * Cleanup resources
     * @private
     */
    #cleanup() {
        log.info('Cleaning up application resources...');

        // Stop camera stream
        if (this.#cameraStream) {
            this.#cameraStream.getTracks().forEach(track => track.stop());
            this.#cameraStream = null;
        }

        // Clear timers
        if (this.#statusTimer) {
            clearTimeout(this.#statusTimer);
        }

        // Remove event listeners
        this.#eventCleanup.forEach(cleanup => cleanup());
        this.#eventCleanup = [];

        // Destroy model viewer
        if (this.#modelViewer) {
            this.#modelViewer.destroy();
        }
    }

    /**
     * Public API
     */

    /**
     * Get current model ID
     * @returns {string|number} Current model ID
     */
    get currentModelId() {
        return this.#currentModelId;
    }

    /**
     * Check if AR is supported
     * @returns {boolean} True if AR is supported
     */
    get isARSupported() {
        return this.#arSupported;
    }

    /**
     * Check if application is initialized
     * @returns {boolean} True if initialized
     */
    get isInitialized() {
        return this.#isInitialized;
    }

    /**
     * Get model viewer instance
     * @returns {ModelViewer|null} Model viewer instance
     */
    get modelViewer() {
        return this.#modelViewer;
    }

    /**
     * Destroy application
     */
    destroy() {
        this.#cleanup();
        this.#isInitialized = false;
        log.info('Application destroyed');
    }
}

// Create and export singleton instance
const app = new TechnoSutraAR();

// Export for debugging
if (typeof window !== 'undefined') {
    window.technoSutraAR = app;
}

export default app;
