/**
 * ModelViewer Component for Techno Sutra AR
 * Modern ES6+ class for managing 3D model viewing and AR functionality
 * @module ModelViewer
 */

import logger from '../core/logger.js';
import config from '../core/config.js';
import { $, createElement, addEventListener, dispatchEvent } from '../utils/dom.js';
import { withTimeout, retry, createAbortController } from '../utils/async.js';

const log = logger.createContext('ModelViewer');

/**
 * ModelViewer class for managing 3D models and AR sessions
 */
export class ModelViewer {
    #element = null;
    #modelViewerElement = null;
    #modelId = null;
    #isLoaded = false;
    #isLoading = false;
    #arSessionActive = false;
    #loadingTimeout = null;
    #abortController = null;
    #eventCleanup = [];
    #config = {};

    constructor(containerId, options = {}) {
        this.#config = {
            scale: config.get('ar.scale', 2.0),
            timeout: config.get('models.loadTimeout', 5000),
            autoRotate: config.get('ar.autoRotate', true),
            enableAR: true,
            showControls: true,
            ...options
        };

        this.#initialize(containerId);
    }

    /**
     * Initialize the model viewer
     * @param {string} containerId - Container element ID
     * @private
     */
    #initialize(containerId) {
        this.#element = $(containerId);
        if (!this.#element) {
            throw new Error(`ModelViewer container not found: ${containerId}`);
        }

        this.#createModelViewerElement();
        this.#setupEventListeners();
        
        log.info(`ModelViewer initialized for container: ${containerId}`);
    }

    /**
     * Create the model-viewer element
     * @private
     */
    #createModelViewerElement() {
        this.#modelViewerElement = createElement('model-viewer', {
            camera_controls: '',
            'touch-action': 'pan-y',
            ar: this.#config.enableAR ? '' : null,
            'ar-modes': 'webxr scene-viewer quick-look',
            'ar-scale': 'fixed',
            'ar-placement': 'floor',
            'auto-rotate': this.#config.autoRotate ? '' : null,
            'rotation-per-second': '30deg',
            loading: 'eager',
            reveal: 'auto',
            'skybox-image': 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.jpg',
            'skybox-height': '2m',
            style: `background-color: transparent; --ar-scale: ${this.#config.scale};`,
            alt: 'Modelo 3D Interativo do Avatamsaka Sutra'
        });

        // Add AR button if enabled
        if (this.#config.enableAR) {
            this.#createARButton();
        }

        // Add progress bar
        this.#createProgressBar();

        // Add controls if enabled
        if (this.#config.showControls) {
            this.#createControls();
        }

        this.#element.appendChild(this.#modelViewerElement);
    }

    /**
     * Create AR button
     * @private
     */
    #createARButton() {
        const arButton = createElement('button', {
            slot: 'ar-button',
            className: 'ar-button',
            'aria-label': 'Visualizar modelo em realidade aumentada'
        }, 
            createElement('span', { className: 'ar-icon', 'aria-hidden': 'true' }, '📱'),
            createElement('span', { className: 'ar-text' }, 'Ver em AR')
        );

        this.#modelViewerElement.appendChild(arButton);
    }

    /**
     * Create progress bar
     * @private
     */
    #createProgressBar() {
        const progressBar = createElement('div', {
            slot: 'progress-bar',
            className: 'progress-bar',
            role: 'progressbar',
            'aria-label': 'Progresso do carregamento do modelo'
        },
            createElement('div', { className: 'progress-bar-fill' })
        );

        this.#modelViewerElement.appendChild(progressBar);
    }

    /**
     * Create model controls
     * @private
     */
    #createControls() {
        const controls = createElement('div', {
            className: 'model-controls'
        },
            createElement('button', {
                className: 'control-button',
                'aria-label': 'Resetar posição da câmera',
                onClick: () => this.resetCamera()
            }, '🔄'),
            createElement('button', {
                className: 'control-button',
                'aria-label': 'Alternar rotação automática',
                onClick: () => this.toggleRotation()
            }, '⏸️')
        );

        this.#element.appendChild(controls);
    }

    /**
     * Setup event listeners
     * @private
     */
    #setupEventListeners() {
        // Model load events
        this.#eventCleanup.push(
            addEventListener(this.#modelViewerElement, 'load', this.#onModelLoad.bind(this)),
            addEventListener(this.#modelViewerElement, 'error', this.#onModelError.bind(this)),
            addEventListener(this.#modelViewerElement, 'progress', this.#onModelProgress.bind(this))
        );

        // AR events
        this.#eventCleanup.push(
            addEventListener(this.#modelViewerElement, 'ar-status', this.#onARStatusChange.bind(this))
        );

        // Camera events
        this.#eventCleanup.push(
            addEventListener(this.#modelViewerElement, 'camera-change', this.#onCameraChange.bind(this))
        );
    }

    /**
     * Load a 3D model
     * @param {string|number} modelId - Model identifier
     * @returns {Promise<void>}
     */
    async loadModel(modelId) {
        if (this.#isLoading) {
            log.warn(`Model loading already in progress`);
            return;
        }

        this.#modelId = modelId;
        this.#isLoading = true;
        this.#isLoaded = false;

        // Cancel any existing load operation
        if (this.#abortController) {
            this.#abortController.abort();
        }

        this.#abortController = createAbortController(this.#config.timeout);

        try {
            log.info(`Loading model: ${modelId}`);
            
            // Check if model exists
            const modelPath = `modelo${modelId}.glb`;
            const usdzPath = `modelo${modelId}.usdz`;
            
            await this.#checkModelExists(modelPath);
            
            // Set model source
            this.#modelViewerElement.src = modelPath;
            
            // Check for USDZ version for iOS
            if (await this.#checkModelExists(usdzPath, false)) {
                this.#modelViewerElement.setAttribute('ios-src', usdzPath);
                log.debug(`USDZ version found: ${usdzPath}`);
            }

            // Update AR button state
            this.#updateARButton('loading');
            
            // Dispatch loading event
            dispatchEvent(this.#element, 'model-loading', { modelId });
            
            // Wait for load with timeout
            await withTimeout(
                this.#waitForLoad(),
                this.#config.timeout,
                `Model load timeout: ${modelPath}`
            );

        } catch (error) {
            this.#isLoading = false;
            log.error(`Failed to load model ${modelId}:`, error.message);
            
            // Show error state
            this.#showError(error.message);
            
            // Dispatch error event
            dispatchEvent(this.#element, 'model-error', { modelId, error });
            
            throw error;
        }
    }

    /**
     * Check if model file exists
     * @param {string} modelPath - Path to model file
     * @param {boolean} [throwOnError=true] - Whether to throw on error
     * @returns {Promise<boolean>}
     * @private
     */
    async #checkModelExists(modelPath, throwOnError = true) {
        try {
            const response = await fetch(modelPath, {
                method: 'HEAD',
                signal: this.#abortController?.signal,
                cache: 'force-cache'
            });

            if (!response.ok && throwOnError) {
                throw new Error(`Model not found: ${modelPath}`);
            }

            return response.ok;
        } catch (error) {
            if (throwOnError) {
                throw error;
            }
            return false;
        }
    }

    /**
     * Wait for model to load
     * @returns {Promise<void>}
     * @private
     */
    #waitForLoad() {
        return new Promise((resolve, reject) => {
            if (this.#isLoaded) {
                resolve();
                return;
            }

            const cleanup = () => {
                clearTimeout(this.#loadingTimeout);
            };

            this.#loadingTimeout = setTimeout(() => {
                cleanup();
                reject(new Error('Model load timeout'));
            }, this.#config.timeout);

            const onLoad = () => {
                cleanup();
                resolve();
            };

            const onError = (event) => {
                cleanup();
                reject(new Error(event.detail || 'Model load error'));
            };

            // Use one-time event listeners
            this.#modelViewerElement.addEventListener('load', onLoad, { once: true });
            this.#modelViewerElement.addEventListener('error', onError, { once: true });
        });
    }

    /**
     * Handle model load event
     * @param {Event} event - Load event
     * @private
     */
    #onModelLoad(event) {
        this.#isLoading = false;
        this.#isLoaded = true;
        
        log.info(`Model loaded successfully: ${this.#modelId}`);
        
        // Update AR button state
        this.#updateARButton('ready');
        
        // Show controls
        this.#showControls();
        
        // Dispatch loaded event
        dispatchEvent(this.#element, 'model-loaded', { 
            modelId: this.#modelId,
            duration: performance.now() 
        });
    }

    /**
     * Handle model error event
     * @param {Event} event - Error event
     * @private
     */
    #onModelError(event) {
        this.#isLoading = false;
        this.#isLoaded = false;
        
        const error = event.detail || 'Unknown model error';
        log.error(`Model error: ${error}`);
        
        this.#showError(error);
        this.#updateARButton('error');
    }

    /**
     * Handle model progress event
     * @param {Event} event - Progress event
     * @private
     */
    #onModelProgress(event) {
        if (event.detail && typeof event.detail.totalProgress === 'number') {
            const progress = event.detail.totalProgress * 100;
            this.#updateProgress(progress);
            
            dispatchEvent(this.#element, 'model-progress', { 
                modelId: this.#modelId,
                progress 
            });
        }
    }

    /**
     * Handle AR status change
     * @param {Event} event - AR status event
     * @private
     */
    #onARStatusChange(event) {
        const status = event.detail.status;
        this.#arSessionActive = status === 'session-started';
        
        log.ar(status, { modelId: this.#modelId });
        
        dispatchEvent(this.#element, 'ar-status-change', { 
            modelId: this.#modelId,
            status 
        });
    }

    /**
     * Handle camera change
     * @param {Event} event - Camera change event
     * @private
     */
    #onCameraChange(event) {
        dispatchEvent(this.#element, 'camera-change', { 
            modelId: this.#modelId,
            camera: event.detail 
        });
    }

    /**
     * Update AR button state
     * @param {string} state - Button state (loading, ready, error)
     * @private
     */
    #updateARButton(state) {
        const arButton = this.#element.querySelector('.ar-button');
        if (!arButton) return;

        const icon = arButton.querySelector('.ar-icon');
        const text = arButton.querySelector('.ar-text');

        switch (state) {
            case 'loading':
                arButton.disabled = true;
                if (icon) icon.textContent = '⏳';
                if (text) text.textContent = 'Carregando...';
                break;
            case 'ready':
                arButton.disabled = false;
                if (icon) icon.textContent = '📱';
                if (text) text.textContent = 'Ver em AR';
                break;
            case 'error':
                arButton.disabled = true;
                if (icon) icon.textContent = '❌';
                if (text) text.textContent = 'AR indisponível';
                break;
        }
    }

    /**
     * Update progress bar
     * @param {number} progress - Progress percentage (0-100)
     * @private
     */
    #updateProgress(progress) {
        const progressFill = this.#element.querySelector('.progress-bar-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
            
            if (progress < 100) {
                progressFill.classList.add('loading');
            } else {
                progressFill.classList.remove('loading');
            }
        }
    }

    /**
     * Show controls
     * @private
     */
    #showControls() {
        const controls = this.#element.querySelector('.model-controls');
        if (controls) {
            controls.classList.add('show');
        }
    }

    /**
     * Show error state
     * @param {string} message - Error message
     * @private
     */
    #showError(message) {
        const errorOverlay = createElement('div', {
            className: 'error-overlay'
        },
            createElement('div', { className: 'error-icon' }, '⚠️'),
            createElement('div', { className: 'error-message' }, message)
        );

        this.#element.appendChild(errorOverlay);
    }

    /**
     * Reset camera position
     */
    resetCamera() {
        if (this.#modelViewerElement && this.#isLoaded) {
            this.#modelViewerElement.resetTurntableRotation();
            log.debug('Camera position reset');
        }
    }

    /**
     * Toggle auto rotation
     */
    toggleRotation() {
        if (!this.#modelViewerElement) return;

        const isRotating = this.#modelViewerElement.hasAttribute('auto-rotate');
        
        if (isRotating) {
            this.#modelViewerElement.removeAttribute('auto-rotate');
        } else {
            this.#modelViewerElement.setAttribute('auto-rotate', '');
        }

        // Update button icon
        const button = this.#element.querySelector('.control-button[aria-label*="rotação"]');
        if (button) {
            button.textContent = isRotating ? '▶️' : '⏸️';
        }

        log.debug(`Auto rotation ${isRotating ? 'disabled' : 'enabled'}`);
    }

    /**
     * Start AR session
     * @returns {Promise<void>}
     */
    async startAR() {
        if (!this.#isLoaded) {
            throw new Error('Model not loaded');
        }

        try {
            await this.#modelViewerElement.activateAR();
            log.ar('session-start', { modelId: this.#modelId });
        } catch (error) {
            log.error('Failed to start AR session:', error.message);
            throw error;
        }
    }

    /**
     * Get model bounds
     * @returns {Object|null} Model bounds
     */
    getModelBounds() {
        if (!this.#isLoaded) return null;
        
        return this.#modelViewerElement.getDimensions();
    }

    /**
     * Set model scale
     * @param {number} scale - Scale factor
     */
    setScale(scale) {
        if (this.#modelViewerElement) {
            this.#modelViewerElement.style.setProperty('--ar-scale', scale);
            this.#config.scale = scale;
        }
    }

    /**
     * Get current model ID
     * @returns {string|number|null} Current model ID
     */
    get modelId() {
        return this.#modelId;
    }

    /**
     * Check if model is loaded
     * @returns {boolean} True if model is loaded
     */
    get isLoaded() {
        return this.#isLoaded;
    }

    /**
     * Check if model is loading
     * @returns {boolean} True if model is loading
     */
    get isLoading() {
        return this.#isLoading;
    }

    /**
     * Check if AR session is active
     * @returns {boolean} True if AR session is active
     */
    get isARActive() {
        return this.#arSessionActive;
    }

    /**
     * Destroy the model viewer and cleanup resources
     */
    destroy() {
        // Cancel any pending operations
        if (this.#abortController) {
            this.#abortController.abort();
        }

        // Clear timeouts
        if (this.#loadingTimeout) {
            clearTimeout(this.#loadingTimeout);
        }

        // Remove event listeners
        this.#eventCleanup.forEach(cleanup => cleanup());
        this.#eventCleanup = [];

        // Remove elements
        if (this.#element) {
            this.#element.innerHTML = '';
        }

        // Reset state
        this.#isLoaded = false;
        this.#isLoading = false;
        this.#arSessionActive = false;
        this.#modelId = null;

        log.info('ModelViewer destroyed');
    }
}

export default ModelViewer;
