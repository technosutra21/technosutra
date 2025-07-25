/**
 * Unified Manager for Techno Sutra AR
 * Consolidates duplicate code and creates reusable modules
 */

// Wix Communication Manager
export class WixCommunicator {
    constructor() {
        this.isUpdating = false;
        this.currentChapter = 1;
        this.debounceTimer = null;
    }

    /**
     * Unified chapter update function
     * @param {number} chapterId - Chapter to update to
     */
    async updateChapter(chapterId) {
        if (this.isUpdating || chapterId === this.currentChapter) {
            return;
        }

        const validId = this.validateChapterId(chapterId);
        if (!validId) return;

        this.isUpdating = true;
        this.currentChapter = validId;

        try {
            // Update datasets
            await this.updateDatasets(validId);
            // Update 3D model
            this.updateModel3D(validId);
            // Send message to parent
            this.sendToParent({ type: 'chapterUpdate', chapterId: validId });
        } catch (error) {
            console.error('Chapter update failed:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    validateChapterId(id) {
        const chapterId = parseInt(id);
        return (chapterId >= 1 && chapterId <= 56) ? chapterId : null;
    }

    async updateDatasets(chapterId) {
        const datasets = ['#dataset5', '#dataset6'];
        const filters = {
            '#dataset5': { field: 'capitulo', collection: 'chapters' },
            '#dataset6': { field: 'chapter', collection: 'characters' }
        };

        for (const datasetId of datasets) {
            try {
                const filter = filters[datasetId];
                await $w(datasetId).setFilter(
                    wixData.filter().eq(filter.field, chapterId)
                );
            } catch (error) {
                console.error(`Error updating ${datasetId}:`, error);
            }
        }
    }

    updateModel3D(chapterId) {
        try {
            $w('#html1').postMessage({
                type: 'updateModel',
                chapterId: chapterId
            });
        } catch (error) {
            console.error('3D model update failed:', error);
        }
    }

    sendToParent(message) {
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(message, '*');
            }
        } catch (error) {
            console.error('Parent communication failed:', error);
        }
    }
}

// Navigation Controller
export class NavigationController {
    constructor(minChapter = 1, maxChapter = 56) {
        this.minChapter = minChapter;
        this.maxChapter = maxChapter;
        this.currentChapter = 1;
        this.isUpdating = false;
        this.debounceDelay = 300;
    }

    init() {
        this.setupEventListeners();
        this.updateButtonStates();
        this.updateChapterIndicator();
    }

    setupEventListeners() {
        // Previous button
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigatePrevious();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateNext();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.navigatePrevious();
            if (e.key === 'ArrowRight') this.navigateNext();
        });

        // External messages
        window.addEventListener('message', (event) => {
            this.handleExternalMessage(event);
        });
    }

    navigatePrevious() {
        if (this.currentChapter > this.minChapter) {
            this.setChapter(this.currentChapter - 1);
        }
    }

    navigateNext() {
        if (this.currentChapter < this.maxChapter) {
            this.setChapter(this.currentChapter + 1);
        }
    }

    setChapter(chapter) {
        const validChapter = Math.max(this.minChapter, Math.min(this.maxChapter, chapter));
        if (validChapter === this.currentChapter || this.isUpdating) return;

        this.currentChapter = validChapter;
        this.debounceUpdate();
    }

    debounceUpdate() {
        if (this.updateTimer) clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => {
            this.updateChapter();
        }, this.debounceDelay);
    }

    async updateChapter() {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            this.updateButtonStates();
            this.updateChapterIndicator();
            this.sendChapterUpdate();
        } finally {
            this.isUpdating = false;
        }
    }

    updateButtonStates() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentChapter <= this.minChapter;
            prevBtn.setAttribute('aria-label', `Ir para capítulo ${this.currentChapter - 1}`);
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentChapter >= this.maxChapter;
            nextBtn.setAttribute('aria-label', `Ir para capítulo ${this.currentChapter + 1}`);
        }
    }

    updateChapterIndicator() {
        const indicator = document.getElementById('chapterIndicator');
        if (indicator) {
            indicator.textContent = `${this.currentChapter}/${this.maxChapter}`;
            indicator.setAttribute('aria-label', `Capítulo atual: ${this.currentChapter} de ${this.maxChapter}`);
        }
    }

    sendChapterUpdate() {
        const message = {
            type: 'chapterUpdate',
            chapterId: this.currentChapter,
            timestamp: Date.now()
        };

        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(message, '*');
            }
        } catch (error) {
            console.error('Failed to send chapter update:', error);
        }
    }

    handleExternalMessage(event) {
        if (!event.data || typeof event.data !== 'object') return;

        if (event.data.type === 'navigateToChapter') {
            const targetChapter = parseInt(event.data.chapterId);
            if (targetChapter) {
                this.setChapter(targetChapter);
            }
        }
    }
}

// Model Manager
export class ModelManager {
    constructor() {
        this.loadedModels = new Set();
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    async loadModel(modelId) {
        const modelKey = `modelo${modelId}`;
        
        // Return cached promise if already loading
        if (this.loadingPromises.has(modelKey)) {
            return this.loadingPromises.get(modelKey);
        }

        // Return cached result if already loaded
        if (this.cache.has(modelKey)) {
            return this.cache.get(modelKey);
        }

        // Create loading promise
        const loadingPromise = this.performModelLoad(modelId);
        this.loadingPromises.set(modelKey, loadingPromise);

        try {
            const result = await loadingPromise;
            this.cache.set(modelKey, result);
            this.loadedModels.add(modelId);
            return result;
        } finally {
            this.loadingPromises.delete(modelKey);
        }
    }

    async performModelLoad(modelId) {
        const modelSrc = `modelo${modelId}.glb`;
        const usdzSrc = `usdz/modelo${modelId}.usdz`;

        try {
            // Check if model exists
            const exists = await this.checkModelExists(modelSrc);
            if (!exists) {
                throw new Error(`Model ${modelId} not found`);
            }

            return {
                glb: modelSrc,
                usdz: usdzSrc,
                id: modelId,
                loaded: true
            };
        } catch (error) {
            throw new Error(`Failed to load model ${modelId}: ${error.message}`);
        }
    }

    async checkModelExists(modelSrc, timeout = 5000) {
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

    getLoadedModels() {
        return Array.from(this.loadedModels);
    }

    clearCache() {
        this.cache.clear();
        this.loadedModels.clear();
        this.loadingPromises.clear();
    }
}

// Utility Functions
export class Utilities {
    static isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    static isAndroidDevice() {
        return /Android/.test(navigator.userAgent);
    }

    static isMobileDevice() {
        return this.isIOSDevice() || this.isAndroidDevice() || 
               /Mobi|Android/i.test(navigator.userAgent);
    }

    static async testARSupport() {
        const results = {
            webxr: false,
            sceneViewer: this.isAndroidDevice(),
            quickLook: this.isIOSDevice()
        };
        
        if (navigator.xr) {
            try {
                results.webxr = await Promise.race([
                    navigator.xr.isSessionSupported('immersive-ar'),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('WebXR timeout')), 3000)
                    )
                ]);
            } catch (e) {
                results.webxr = false;
            }
        }
        
        return {
            supported: results.webxr || results.sceneViewer || results.quickLook,
            ...results
        };
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Error Handler
export class ErrorHandler {
    static handleError(error, context = 'general', showToUser = true) {
        const errorId = Date.now().toString(36);
        
        // User-friendly messages
        const userMessages = {
            'model-load': 'Modelo não disponível. Tente outro capítulo.',
            'ar-support': 'Recurso AR não suportado neste dispositivo.',
            'camera': 'Câmera não disponível. Verifique permissões.',
            'network': 'Erro de conexão. Verifique sua internet.',
            'general': 'Algo deu errado. Tente novamente.'
        };

        const errorInfo = {
            id: errorId,
            message: userMessages[context] || userMessages.general,
            context,
            timestamp: new Date().toISOString()
        };

        if (showToUser) {
            this.showUserError(errorInfo.message);
        }

        return errorInfo;
    }

    static showUserError(message, duration = 5000) {
        // Create or update error display
        let errorEl = document.getElementById('error-display');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'error-display';
            errorEl.className = 'error-toast';
            errorEl.setAttribute('role', 'alert');
            errorEl.setAttribute('aria-live', 'polite');
            document.body.appendChild(errorEl);
        }

        errorEl.textContent = message;
        errorEl.classList.add('show');

        setTimeout(() => {
            errorEl.classList.remove('show');
        }, duration);
    }
}
