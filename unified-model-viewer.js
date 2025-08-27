/**
 * Unified Model Viewer Component for Techno Sutra AR
 * Supports both Gallery and AR modes with automatic device detection
 * Handles GLB and USDZ files with proper path resolution
 */

class UnifiedModelViewer {
    constructor(options = {}) {
        this.options = {
            containerId: 'model-viewer-container',
            modelBasePath: './models/',
            usdzBasePath: './models/usdz/',
            mode: 'gallery', // 'gallery' or 'ar'
            autoRotate: true,
            cameraControls: true,
            arEnabled: true,
            ...options
        };
        
        this.currentModelId = null;
        this.modelViewer = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        this.loadModelViewerScript();
        this.setupDeviceDetection();
        this.createContainer();
    }
    
    loadModelViewerScript() {
        if (!document.querySelector('script[src*="model-viewer"]')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
            script.defer = true;
            document.head.appendChild(script);
        }
    }
    
    setupDeviceDetection() {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isMobile = this.isIOS || this.isAndroid;
        this.supportsAR = this.isIOS || (this.isAndroid && 'xr' in navigator);
    }
    
    createContainer() {
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            console.error(`Container with id "${this.options.containerId}" not found`);
            return;
        }
        
        this.container = container;
        this.isInitialized = true;
    }
    
    /**
     * Load a 3D model by ID
     * @param {number|string} modelId - The model ID (e.g., 1, 2, 3...)
     * @param {Object} config - Additional configuration options
     */
    loadModel(modelId, config = {}) {
        if (!this.isInitialized) {
            console.error('UnifiedModelViewer not initialized');
            return;
        }
        
        this.currentModelId = modelId;
        const modelConfig = {
            title: `Modelo ${modelId}`,
            alt: `Modelo 3D - Capítulo ${modelId}`,
            ...config
        };
        
        this.createModelViewer(modelConfig);
    }
    
    createModelViewer(config) {
        // Clear existing model viewer
        if (this.modelViewer) {
            this.modelViewer.remove();
        }
        
        // Create new model-viewer element
        this.modelViewer = document.createElement('model-viewer');
        
        // Set basic attributes
        this.setBasicAttributes(config);
        
        // Set model sources
        this.setModelSources();
        
        // Set mode-specific attributes
        if (this.options.mode === 'ar') {
            this.setARAttributes();
        } else {
            this.setGalleryAttributes();
        }
        
        // Add event listeners
        this.addEventListeners();
        
        // Add to container
        this.container.appendChild(this.modelViewer);
        
        // Add custom elements if needed
        this.addCustomElements();
    }
    
    setBasicAttributes(config) {
        const attributes = {
            'alt': config.alt || `Modelo 3D - ${this.currentModelId}`,
            'loading': 'lazy',
            'reveal': 'auto',
            'tone-mapping': 'neutral',
            'field-of-view': '45deg',
            'style': 'width: 100%; height: 100%; background-color: transparent; --poster-color: transparent;'
        };
        
        if (this.options.cameraControls) {
            attributes['camera-controls'] = '';
        }
        
        if (this.options.autoRotate) {
            attributes['auto-rotate'] = '';
            attributes['rotation-per-second'] = '15deg';
        }
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (value === '') {
                this.modelViewer.setAttribute(key, '');
            } else {
                this.modelViewer.setAttribute(key, value);
            }
        });
    }
    
    setModelSources() {
        const glbPath = `${this.options.modelBasePath}modelo${this.currentModelId}.glb`;
        const usdzPath = `${this.options.usdzBasePath}modelo${this.currentModelId}.usdz`;
        
        this.modelViewer.setAttribute('src', glbPath);
        
        // Set iOS-specific USDZ source for AR Quick Look
        if (this.isIOS && this.options.arEnabled) {
            this.modelViewer.setAttribute('ios-src', usdzPath);
        }
    }
    
    setARAttributes() {
        if (!this.options.arEnabled) return;
        
        const arAttributes = {
            'ar': '',
            'ar-modes': 'quick-look webxr scene-viewer',
            'ar-scale': 'auto',
            'ar-placement': 'floor',
            'touch-action': 'pan-y',
            'min-camera-orbit': 'auto 0deg auto',
            'max-camera-orbit': 'auto 180deg auto'
        };
        
        Object.entries(arAttributes).forEach(([key, value]) => {
            if (value === '') {
                this.modelViewer.setAttribute(key, '');
            } else {
                this.modelViewer.setAttribute(key, value);
            }
        });
    }
    
    setGalleryAttributes() {
        const galleryAttributes = {
            'camera-orbit': '0deg 70deg 2.5m',
            'min-camera-orbit': 'auto auto 1.2m',
            'max-camera-orbit': 'auto auto 5m',
            'environment-image': 'neutral',
            'shadow-intensity': '0.5',
            'scale': '1.0 1.0 1.0'
        };
        
        Object.entries(galleryAttributes).forEach(([key, value]) => {
            this.modelViewer.setAttribute(key, value);
        });
    }
    
    addEventListeners() {
        this.modelViewer.addEventListener('load', () => {
            console.log(`Model ${this.currentModelId} loaded successfully`);
            this.onModelLoad();
        });
        
        this.modelViewer.addEventListener('error', (event) => {
            console.error(`Error loading model ${this.currentModelId}:`, event);
            this.onModelError(event);
        });
        
        this.modelViewer.addEventListener('progress', (event) => {
            this.onModelProgress(event);
        });
        
        if (this.options.mode === 'ar') {
            this.modelViewer.addEventListener('ar-status', (event) => {
                this.onARStatusChange(event);
            });
        }
    }
    
    addCustomElements() {
        if (this.options.mode === 'ar') {
            this.addARButton();
            this.addProgressBar();
            this.addARPrompt();
        }
    }
    
    addARButton() {
        const arButton = document.createElement('button');
        arButton.setAttribute('slot', 'ar-button');
        arButton.className = 'ar-button';
        arButton.innerHTML = `
            <span>🛞</span>
            <span>Ver em AR</span>
        `;
        this.modelViewer.appendChild(arButton);
    }
    
    addProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.setAttribute('slot', 'progress-bar');
        progressContainer.style.cssText = `
            position: absolute; 
            bottom: 20px; 
            left: 50%; 
            transform: translateX(-50%); 
            width: 200px; 
            height: 4px; 
            background: rgba(255, 255, 255, 0.2); 
            border-radius: 2px; 
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.id = 'progress-fill';
        progressFill.style.cssText = `
            height: 100%; 
            background: linear-gradient(90deg, #4285f4, #34a853); 
            border-radius: 2px; 
            width: 0%; 
            transition: width 0.3s ease;
        `;
        
        progressContainer.appendChild(progressFill);
        this.modelViewer.appendChild(progressContainer);
    }
    
    addARPrompt() {
        const arPrompt = document.createElement('div');
        arPrompt.setAttribute('slot', 'ar-prompt');
        arPrompt.style.cssText = `
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            background: rgba(0, 0, 0, 0.85); 
            color: white; 
            padding: 24px 32px; 
            border-radius: 16px; 
            text-align: center; 
            z-index: 200; 
            backdrop-filter: blur(10px);
        `;
        
        arPrompt.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 12px;">📱</div>
            <div style="font-size: 16px; font-weight: 500;">Mova o dispositivo para encontrar uma superfície</div>
        `;
        
        this.modelViewer.appendChild(arPrompt);
    }
    
    // Event handlers
    onModelLoad() {
        // Override in implementation
        if (this.options.onLoad) {
            this.options.onLoad(this.currentModelId);
        }
    }
    
    onModelError(event) {
        // Override in implementation
        if (this.options.onError) {
            this.options.onError(this.currentModelId, event);
        }
    }
    
    onModelProgress(event) {
        const progressFill = this.modelViewer.querySelector('#progress-fill');
        if (progressFill && event.detail.totalProgress) {
            progressFill.style.width = `${event.detail.totalProgress * 100}%`;
        }
        
        if (this.options.onProgress) {
            this.options.onProgress(this.currentModelId, event.detail.totalProgress);
        }
    }
    
    onARStatusChange(event) {
        if (this.options.onARStatusChange) {
            this.options.onARStatusChange(event.detail.status);
        }
    }
    
    // Public methods
    resetCamera() {
        if (this.modelViewer) {
            this.modelViewer.resetTurntableRotation();
            this.modelViewer.jumpCameraToGoal();
        }
    }
    
    toggleAutoRotate() {
        if (this.modelViewer) {
            const isRotating = this.modelViewer.hasAttribute('auto-rotate');
            if (isRotating) {
                this.modelViewer.removeAttribute('auto-rotate');
            } else {
                this.modelViewer.setAttribute('auto-rotate', '');
            }
            return !isRotating;
        }
        return false;
    }
    
    enterAR() {
        if (this.modelViewer && this.supportsAR) {
            this.modelViewer.activateAR();
        }
    }
    
    exitAR() {
        if (this.modelViewer) {
            // AR exit is handled by the browser/system
            console.log('AR exit requested');
        }
    }
    
    downloadModel() {
        if (!this.currentModelId) return;
        
        const modelFile = `${this.options.modelBasePath}modelo${this.currentModelId}.glb`;
        const fileName = `modelo_${this.currentModelId}.glb`;
        
        fetch(modelFile)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Error downloading model:', error);
            });
    }
    
    // Utility methods
    static createGalleryCard(modelId, chapterData, options = {}) {
        const cardOptions = {
            showARButton: true,
            showDownloadButton: true,
            showAboutButton: true,
            ...options
        };
        
        const card = document.createElement('div');
        card.className = 'model-card';
        card.dataset.modelId = modelId;
        
        card.innerHTML = `
            <div class="model-header">
                <div class="model-number">Capítulo ${modelId}</div>
                <div class="model-title">${chapterData.name || `Modelo ${modelId}`}</div>
                <div class="model-subtitle">${chapterData.title || ''}</div>
                <div class="model-meta">
                    <span class="model-occupation">${chapterData.occupation || ''}</span>
                    <span class="model-location">${chapterData.location || ''}</span>
                </div>
            </div>
            <div class="model-viewer-container" id="model-viewer-${modelId}">
                <!-- Model viewer will be inserted here -->
            </div>
            <div class="model-actions">
                ${cardOptions.showARButton ? `<button class="action-btn primary" onclick="openInAR(${modelId})">Ver em AR</button>` : ''}
                ${cardOptions.showAboutButton ? `<button class="action-btn" onclick="viewFullscreen(${modelId})">About</button>` : ''}
                ${cardOptions.showDownloadButton ? `<button class="action-btn" onclick="downloadModel(${modelId})">Download</button>` : ''}
            </div>
        `;
        
        return card;
    }
    
    destroy() {
        if (this.modelViewer) {
            this.modelViewer.remove();
            this.modelViewer = null;
        }
        this.currentModelId = null;
        this.isInitialized = false;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedModelViewer;
} else {
    window.UnifiedModelViewer = UnifiedModelViewer;
}

// CSS styles for the unified model viewer
const unifiedModelViewerCSS = `
    .model-viewer-container {
        position: relative;
        width: 100%;
        height: 280px;
        border-radius: 12px;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(120, 119, 198, 0.08);
    }
    
    .ar-button {
        background: linear-gradient(135deg, rgba(120, 119, 198, 0.2) 0%, rgba(120, 119, 198, 0.1) 100%);
        border: 1px solid rgba(120, 119, 198, 0.4);
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
        letter-spacing: 0.025em;
    }
    
    .ar-button:hover {
        background: linear-gradient(135deg, rgba(120, 119, 198, 0.3) 0%, rgba(120, 119, 198, 0.2) 100%);
        box-shadow: 0 6px 25px rgba(120, 119, 198, 0.2);
        transform: translateY(-2px);
    }
    
    .model-card {
        background: rgba(15, 15, 15, 0.8);
        border-radius: 16px;
        padding: 24px;
        border: 1px solid rgba(120, 119, 198, 0.1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .model-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
        border-color: rgba(120, 119, 198, 0.3);
    }
    
    .model-header {
        text-align: center;
        margin-bottom: 16px;
    }
    
    .model-number {
        font-size: 0.9rem;
        font-weight: 400;
        color: #7877c6;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.8;
    }
    
    .model-title {
        font-size: 1.1rem;
        font-weight: 400;
        color: #f3f4f6;
        line-height: 1.4;
        margin-bottom: 8px;
    }
    
    .model-subtitle {
        font-size: 0.9rem;
        font-weight: 300;
        color: #9ca3af;
        line-height: 1.3;
        margin-bottom: 12px;
        font-style: italic;
    }
    
    .model-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 20px;
    }
    
    .model-occupation {
        font-size: 0.8rem;
        color: #7877c6;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .model-location {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 300;
    }
    
    .model-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
    }
    
    .action-btn {
        background: rgba(15, 15, 15, 0.8);
        border: 1px solid rgba(120, 119, 198, 0.2);
        color: #e5e7eb;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 400;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
        letter-spacing: 0.025em;
    }
    
    .action-btn:hover {
        background: rgba(120, 119, 198, 0.1);
        border-color: rgba(120, 119, 198, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(120, 119, 198, 0.1);
    }
    
    .action-btn.primary {
        background: linear-gradient(135deg, rgba(120, 119, 198, 0.2) 0%, rgba(120, 119, 198, 0.1) 100%);
        border-color: rgba(120, 119, 198, 0.4);
        color: #ffffff;
    }
    
    .action-btn.primary:hover {
        background: linear-gradient(135deg, rgba(120, 119, 198, 0.3) 0%, rgba(120, 119, 198, 0.2) 100%);
        box-shadow: 0 6px 25px rgba(120, 119, 198, 0.2);
    }
`;

// Inject CSS if not already present
if (!document.querySelector('#unified-model-viewer-css')) {
    const style = document.createElement('style');
    style.id = 'unified-model-viewer-css';
    style.textContent = unifiedModelViewerCSS;
    document.head.appendChild(style);
}