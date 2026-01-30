/**
 * Model Viewer Integration Script
 * Easy integration for both Gallery and AR modes
 */

// Global configuration
const MODEL_VIEWER_CONFIG = {
    modelBasePath: './models/',
    modelViewerVersion: '4.0.0'
};

/**
 * Initialize model viewer for gallery mode
 * @param {string} containerId - Container element ID
 * @param {number} modelId - Model ID to load
 * @param {Object} chapterData - Chapter information
 * @param {Object} options - Additional options
 */
function initGalleryModelViewer(containerId, modelId, chapterData = {}, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return null;
    }

    // Create model-viewer element
    const modelViewer = document.createElement('model-viewer');
    
    // Set basic attributes
    const attributes = {
        'src': `${MODEL_VIEWER_CONFIG.modelBasePath}modelo${modelId}.glb`,
        'alt': `Modelo 3D - ${chapterData.name || `Capítulo ${modelId}`}: ${chapterData.title || ''}`,
        'camera-controls': '',
        'loading': 'lazy',
        'shadow-intensity': '0.5',
        'scale': '2.0 2.0 2.0',
        'min-camera-orbit': 'auto auto 1.2m',
        'max-camera-orbit': 'auto auto 5m',
        'camera-orbit': '0deg 70deg 2.5m',
        'field-of-view': '45deg',
        'orientation': '0 0 -90',
        'style': 'width: 100%; height: 100%; background-color: transparent; --poster-color: transparent;'
    };

    // Apply attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === '') {
            modelViewer.setAttribute(key, '');
        } else {
            modelViewer.setAttribute(key, value);
        }
    });

    // Add event listeners
    modelViewer.addEventListener('load', () => {
        console.log(`Gallery model ${modelId} loaded successfully`);
        if (options.onLoad) options.onLoad(modelId);
    });

    modelViewer.addEventListener('error', (event) => {
        console.error(`Error loading gallery model ${modelId}:`, event);
        
        // Add fallback behavior for model loading errors
        const container = modelViewer.parentElement;
        if (container) {
            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = 'model-error';
            errorElement.innerHTML = `
                <div class="error-icon">⚠️</div>
                <div class="error-message">Erro ao carregar modelo 3D</div>
                <button class="retry-button">Tentar novamente</button>
            `;
            
            // Style the error element
            errorElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                z-index: 10;
                text-align: center;
                padding: 20px;
            `;
            
            // Add retry functionality
            const retryButton = errorElement.querySelector('.retry-button');
            if (retryButton) {
                retryButton.style.cssText = `
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    color: white;
                    padding: 8px 16px;
                    margin-top: 16px;
                    border-radius: 4px;
                    cursor: pointer;
                `;
                retryButton.addEventListener('click', () => {
                    container.removeChild(errorElement);
                    // Reload the model
                    modelViewer.src = `${MODEL_VIEWER_CONFIG.modelBasePath}modelo${modelId}.glb?t=${Date.now()}`;
                });
            }
            
            container.appendChild(errorElement);
        }
        
        if (options.onError) options.onError(modelId, event);
    });

    // Add to container
    container.appendChild(modelViewer);
    
    return modelViewer;
}

/**
 * Initialize model viewer for AR mode
 * @param {string} containerId - Container element ID
 * @param {number} modelId - Model ID to load
 * @param {Object} options - Additional options
 */
function initARModelViewer(containerId, modelId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return null;
    }

    // Create model-viewer element
    const modelViewer = document.createElement('model-viewer');
    
    // Set AR-specific attributes
    const attributes = {
        'src': `${MODEL_VIEWER_CONFIG.modelBasePath}modelo${modelId}.glb`,
        'alt': `Modelo 3D Interativo - Techno Sutra AR - Capítulo ${modelId}`,
        'camera-controls': '',
        'touch-action': 'pan-y',
        'ar': '',
        'ar-modes': 'quick-look webxr scene-viewer',
        'ar-scale': 'auto',
        'ar-placement': 'floor',
        'rotation-per-second': '15deg',
        'loading': 'eager',
        'reveal': 'auto',
        'field-of-view': '30deg',
        'min-camera-orbit': 'auto 0deg auto',
        'max-camera-orbit': 'auto 180deg auto',
        'tone-mapping': 'linear',
        'orientation': '0deg 0deg -90deg',
        'style': 'width: 100%; height: 100vh; background-color: transparent; --poster-color: transparent; position: fixed; top: 0; left: 0; z-index: 2;'
    };

    // Apply attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === '') {
            modelViewer.setAttribute(key, '');
        } else {
            modelViewer.setAttribute(key, value);
        }
    });

    // Add AR button with improved styling and accessibility
    const arButton = document.createElement('button');
    arButton.setAttribute('slot', 'ar-button');
    arButton.className = 'ar-button';
    arButton.id = 'ar-button';
    arButton.setAttribute('aria-label', 'Visualizar em Realidade Aumentada');
    arButton.innerHTML = `
        <span class="ar-icon">📱</span>
        <span class="ar-text">Ver em AR</span>
    `;
    
    // Add button styles if not already in CSS
    const buttonStyle = document.createElement('style');
    buttonStyle.textContent = `
        .ar-button {
            background-color: rgba(0, 0, 0, 0.7);
            border: 2px solid white;
            border-radius: 4px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 8px 16px;
            font-weight: 500;
            backdrop-filter: blur(4px);
            transition: all 0.3s ease;
        }
        .ar-button:hover {
            background-color: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
        }
        .ar-button:active {
            background-color: rgba(255, 255, 255, 0.3);
        }
        .ar-icon {
            font-size: 1.2em;
        }
    `;
    document.head.appendChild(buttonStyle);
    
    modelViewer.appendChild(arButton);

    // Add progress bar
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
    modelViewer.appendChild(progressContainer);

    // Add AR prompt
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
    
    modelViewer.appendChild(arPrompt);

    // Add event listeners
    modelViewer.addEventListener('load', () => {
        console.log(`AR model ${modelId} loaded successfully`);
        if (options.onLoad) options.onLoad(modelId);
    });

    modelViewer.addEventListener('error', (event) => {
        console.error(`Error loading AR model ${modelId}:`, event);
        if (options.onError) options.onError(modelId, event);
    });

    modelViewer.addEventListener('progress', (event) => {
        const progressFill = modelViewer.querySelector('#progress-fill');
        if (progressFill && event.detail.totalProgress) {
            progressFill.style.width = `${event.detail.totalProgress * 100}%`;
        }
        if (options.onProgress) options.onProgress(modelId, event.detail.totalProgress);
    });

    modelViewer.addEventListener('ar-status', (event) => {
        console.log('AR status:', event.detail.status);
        if (options.onARStatusChange) options.onARStatusChange(event.detail.status);
    });

    // Add to container
    container.appendChild(modelViewer);
    
    return modelViewer;
}

/**
 * Create a complete gallery card with model viewer
 * @param {number} modelId - Model ID
 * @param {Object} chapterData - Chapter information
 * @param {boolean} isAvailable - Whether the model is available
 * @param {Object} options - Additional options
 */
function createGalleryCard(modelId, chapterData, isAvailable = true, options = {}) {
    const card = document.createElement('div');
    card.className = `model-card ${!isAvailable ? 'unavailable' : ''}`;
    card.dataset.chapterId = modelId;

    card.innerHTML = `
        <div class="model-header">
            <div class="model-number tooltip" data-tooltip="Posição no Avatamsaka Sutra">Capítulo ${modelId}</div>
            <div class="model-title tooltip" data-tooltip="Nome do professor espiritual">${chapterData.name || `Modelo ${modelId}`}</div>
            <div class="model-subtitle tooltip" data-tooltip="Significado e características">${chapterData.title || ''}</div>
            <div class="model-meta">
                <span class="model-occupation tooltip" data-tooltip="Ocupação ou tipo">${chapterData.occupation || ''}</span>
                <span class="model-location tooltip" data-tooltip="Local de ensino">${chapterData.location || ''}</span>
            </div>
        </div>
        <div class="model-viewer-container" id="model-viewer-container-${modelId}">
            ${isAvailable ? '' : `
                <div class="unavailable-overlay">
                    <div class="unavailable-icon">⏳</div>
                    <div class="unavailable-text">Almost there...</div>
                </div>
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                </div>
            `}
        </div>
        <div class="model-actions">
            ${isAvailable ? `
                <button class="action-btn primary" onclick="openInAR(${modelId})">
                    Ver em AR
                </button>
                <button class="action-btn" onclick="viewFullscreen(${modelId})">
                    ⌖ About
                </button>
                <button class="action-btn" onclick="downloadModel(${modelId})">
                    ⌖ Download
                </button>
            ` : `
                <button class="action-btn" disabled>
                    ⌖ Em Breve
                </button>
            `}
        </div>
    `;

    // Initialize model viewer if available
    if (isAvailable) {
        // Wait for DOM to be ready
        setTimeout(() => {
            initGalleryModelViewer(`model-viewer-container-${modelId}`, modelId, chapterData, options);
        }, 100);
    }

    return card;
}

/**
 * Download model function with updated paths
 * @param {number} modelId - Model ID to download
 */
async function downloadModelFile(modelId) {
    const modelFile = `${MODEL_VIEWER_CONFIG.modelBasePath}modelo${modelId}.glb`;
    const fileName = `modelo_${modelId}.glb`;
    
    try {
        console.log('📥 Starting download for:', modelFile);
        
        // Check if model exists in cache (PWA)
        if ('caches' in window) {
            const cache = await caches.open('techno-sutra-models-v2.0.0');
            const cachedResponse = await cache.match(modelFile);
            
            if (cachedResponse) {
                console.log('📦 Using cached model for download');
                const blob = await cachedResponse.blob();
                downloadBlob(blob, fileName);
                return;
            }
        }
        
        // Fetch from network if not cached
        const response = await fetch(modelFile);
        if (!response.ok) throw new Error(`Model not found: ${response.status}`);
        
        const blob = await response.blob();
        downloadBlob(blob, fileName);
        
    } catch (error) {
        console.error('Error downloading model:', error);
        alert('Erro ao baixar o modelo. Tente novamente.');
    }
}

/**
 * Helper function to download blob
 * @param {Blob} blob - File blob
 * @param {string} fileName - File name
 */
function downloadBlob(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Check if model exists
 * @param {string} modelPath - Path to model file
 * @returns {Promise<boolean>} - Whether model exists
 */
async function checkModelExists(modelPath) {
    try {
        const response = await fetch(modelPath, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Error checking model existence:', error);
        return false;
    }
}

/**
 * Load model-viewer script if not already loaded
 */
function ensureModelViewerScript() {
    if (!document.querySelector('script[src*="model-viewer"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = `https://ajax.googleapis.com/ajax/libs/model-viewer/${MODEL_VIEWER_CONFIG.modelViewerVersion}/model-viewer.min.js`;
        script.defer = true;
        document.head.appendChild(script);
        
        // Also add preload link for better performance
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.href = script.src;
        preload.as = 'script';
        preload.crossOrigin = 'anonymous';
        document.head.appendChild(preload);
    }
}

// Auto-initialize script loading
ensureModelViewerScript();

// Export functions for global use
window.initGalleryModelViewer = initGalleryModelViewer;
window.initARModelViewer = initARModelViewer;
window.createGalleryCard = createGalleryCard;
window.downloadModelFile = downloadModelFile;
window.checkModelExists = checkModelExists;
window.MODEL_VIEWER_CONFIG = MODEL_VIEWER_CONFIG;