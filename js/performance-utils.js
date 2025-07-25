// Performance Utilities for Techno Sutra AR
// Comprehensive lazy loading, optimization, and caching utilities

class PerformanceManager {
    constructor() {
        this.intersectionObserver = null;
        this.imageObserver = null;
        this.modelObserver = null;
        this.loadedModels = new Set();
        this.loadedImages = new Set();
        this.modelQueue = [];
        this.batchSize = 3; // Load 3 models at a time
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupIntersectionObservers();
        this.setupResourceHints();
        this.preloadCriticalResources();
        this.optimizeImages();
        this.initLazyLoading();
    }

    // Setup intersection observers for lazy loading
    setupIntersectionObservers() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        // Observer for model-viewer elements
        this.modelObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadModel(entry.target);
                    this.modelObserver.unobserve(entry.target);
                }
            });
        }, options);

        // Observer for images
        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, options);

        // Generic lazy content observer
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, options);
    }

    // Setup resource hints for better loading
    setupResourceHints() {
        const head = document.head;

        // Preload model-viewer library
        this.addResourceHint('preload', 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js', 'script');
        
        // DNS prefetch for external resources
        this.addResourceHint('dns-prefetch', 'https://ajax.googleapis.com');
        this.addResourceHint('dns-prefetch', 'https://modelviewer.dev');
        
        // Preconnect to CDN
        this.addResourceHint('preconnect', 'https://ajax.googleapis.com', null, true);
    }

    addResourceHint(rel, href, as = null, crossorigin = false) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (as) link.as = as;
        if (crossorigin) link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    // Preload critical resources
    preloadCriticalResources() {
        // Preload first 3 models
        for (let i = 1; i <= 3; i++) {
            this.preloadModel(i);
        }
    }

    preloadModel(modelId) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `modelo${modelId}.glb`;
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    // Initialize lazy loading for existing elements
    initLazyLoading() {
        // Model viewers
        document.querySelectorAll('model-viewer[data-src]').forEach(modelViewer => {
            this.modelObserver.observe(modelViewer);
        });

        // Lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.imageObserver.observe(img);
        });

        // Lazy content
        document.querySelectorAll('.lazy-content').forEach(element => {
            this.intersectionObserver.observe(element);
        });
    }

    // Load model with optimization
    async loadModel(modelViewer) {
        const modelSrc = modelViewer.dataset.src;
        if (!modelSrc || this.loadedModels.has(modelSrc)) return;

        try {
            // Add to loading queue
            this.modelQueue.push({ element: modelViewer, src: modelSrc });
            
            if (!this.isLoading) {
                await this.processBatch();
            }
        } catch (error) {
            // Dev: console.error('Error loading model:', error);
            this.showModelError(modelViewer);
        }
    }

    // Process model loading in batches
    async processBatch() {
        if (this.isLoading || this.modelQueue.length === 0) return;
        
        this.isLoading = true;
        const batch = this.modelQueue.splice(0, this.batchSize);
        
        const loadPromises = batch.map(async ({ element, src }) => {
            try {
                // Check if model exists
                const exists = await this.checkModelExists(src);
                if (!exists) {
                    this.showModelError(element);
                    return;
                }

                // Show loading state
                this.showModelLoading(element);
                
                // Load model
                element.src = src;
                element.classList.add('model-viewer-lazy');
                
                // Wait for load
                await new Promise((resolve, reject) => {
                    const onLoad = () => {
                        element.removeEventListener('load', onLoad);
                        element.removeEventListener('error', onError);
                        element.classList.add('loaded');
                        this.loadedModels.add(src);
                        resolve();
                    };
                    
                    const onError = () => {
                        element.removeEventListener('load', onLoad);
                        element.removeEventListener('error', onError);
                        this.showModelError(element);
                        reject(new Error('Model load error'));
                    };
                    
                    element.addEventListener('load', onLoad);
                    element.addEventListener('error', onError);
                });
                
                this.hideModelLoading(element);
                
            } catch (error) {
                // Dev: console.error('Batch load error:', error);
                this.showModelError(element);
            }
        });

        await Promise.allSettled(loadPromises);
        
        this.isLoading = false;
        
        // Process next batch if queue has items
        if (this.modelQueue.length > 0) {
            setTimeout(() => this.processBatch(), 100);
        }
    }

    // Check if model exists
    async checkModelExists(src, timeout = 3000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(src, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'force-cache'
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    }

    // Show model loading state
    showModelLoading(element) {
        const container = element.closest('.model-viewer-container');
        if (container) {
            const placeholder = container.querySelector('.loading-placeholder');
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
        }
    }

    // Hide model loading state
    hideModelLoading(element) {
        const container = element.closest('.model-viewer-container');
        if (container) {
            const placeholder = container.querySelector('.loading-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        }
    }

    // Show model error state
    showModelError(element) {
        const container = element.closest('.model-viewer-container');
        if (container) {
            container.innerHTML = `
                <div class="unavailable-overlay">
                    <div class="unavailable-icon">⚠️</div>
                    <div class="unavailable-text">Modelo indisponível</div>
                </div>
            `;
        }
    }

    // Load image with WebP support
    loadImage(img) {
        const src = img.dataset.src;
        if (!src || this.loadedImages.has(src)) return;

        // Check WebP support and load appropriate format
        if (this.supportsWebP()) {
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            this.loadImageWithFallback(img, webpSrc, src);
        } else {
            this.loadImageDirect(img, src);
        }
    }

    // Load image with WebP fallback
    loadImageWithFallback(img, webpSrc, fallbackSrc) {
        const webpImg = new Image();
        webpImg.onload = () => {
            img.src = webpSrc;
            this.loadedImages.add(webpSrc);
        };
        webpImg.onerror = () => {
            this.loadImageDirect(img, fallbackSrc);
        };
        webpImg.src = webpSrc;
    }

    // Load image directly
    loadImageDirect(img, src) {
        img.onload = () => {
            img.classList.add('loaded');
            this.loadedImages.add(src);
        };
        img.onerror = () => {
            img.classList.add('error');
        };
        img.src = src;
    }

    // Check WebP support
    supportsWebP() {
        if (this._webpSupport !== undefined) return this._webpSupport;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this._webpSupport;
    }

    // Optimize images for responsive loading
    optimizeImages() {
        document.querySelectorAll('img[data-sizes]').forEach(img => {
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                img.sizes = img.dataset.sizes;
            }
        });
    }

    // Add new model to lazy loading
    observeModel(modelViewer) {
        if (this.modelObserver) {
            this.modelObserver.observe(modelViewer);
        }
    }

    // Add new image to lazy loading
    observeImage(img) {
        if (this.imageObserver) {
            this.imageObserver.observe(img);
        }
    }

    // Get loading statistics
    getStats() {
        return {
            modelsLoaded: this.loadedModels.size,
            imagesLoaded: this.loadedImages.size,
            queueSize: this.modelQueue.length,
            isLoading: this.isLoading
        };
    }

    // Clean up observers
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        if (this.modelObserver) {
            this.modelObserver.disconnect();
        }
    }
}

// Progressive loading for gallery
class GalleryLoader {
    constructor(performanceManager) {
        this.performanceManager = performanceManager;
        this.galleryContainer = document.querySelector('.gallery-grid');
        this.loadedCount = 0;
        this.totalModels = 56;
        this.visibleCount = 12; // Initially load 12 models
        this.loadMoreButton = null;
        this.init();
    }

    init() {
        this.createLoadMoreButton();
        this.loadInitialModels();
    }

    loadInitialModels() {
        this.loadModels(1, this.visibleCount);
    }

    loadModels(start, count) {
        for (let i = start; i <= Math.min(start + count - 1, this.totalModels); i++) {
            this.createModelCard(i);
        }
        this.loadedCount = Math.min(start + count - 1, this.totalModels);
        this.updateLoadMoreButton();
    }

    createModelCard(modelId) {
        const card = document.createElement('div');
        card.className = 'model-card lazy-content';
        card.innerHTML = `
            <div class="model-header">
                <div class="model-number">Capítulo ${modelId}</div>
                <div class="model-title">Avatamsaka Sutra</div>
                <div class="model-subtitle">Capítulo ${modelId}</div>
            </div>
            <div class="model-viewer-container">
                <div class="loading-placeholder skeleton">
                    <div class="loading-spinner"></div>
                </div>
                <model-viewer
                    data-src="modelo${modelId}.glb"
                    alt="Modelo 3D - Capítulo ${modelId}"
                    camera-controls
                    touch-action="pan-y"
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    auto-rotate
                    loading="lazy"
                    class="model-viewer-lazy">
                </model-viewer>
            </div>
            <div class="model-actions">
                <a href="index.html?model=${modelId}" class="action-btn primary">
                    <span>🚀</span>
                    <span>Ver em AR</span>
                </a>
                <button class="action-btn" onclick="shareModel(${modelId})">
                    <span>📤</span>
                    <span>Compartilhar</span>
                </button>
            </div>
        `;

        this.galleryContainer.appendChild(card);
        
        // Observe for lazy loading
        const modelViewer = card.querySelector('model-viewer');
        this.performanceManager.observeModel(modelViewer);
        this.performanceManager.intersectionObserver.observe(card);
    }

    createLoadMoreButton() {
        if (this.loadMoreButton) return;
        
        this.loadMoreButton = document.createElement('div');
        this.loadMoreButton.className = 'load-more-container';
        this.loadMoreButton.innerHTML = `
            <button class="action-btn primary load-more-btn" onclick="galleryLoader.loadMore()">
                <span>📚</span>
                <span>Carregar mais modelos</span>
            </button>
        `;
        
        this.galleryContainer.parentNode.insertBefore(
            this.loadMoreButton, 
            this.galleryContainer.nextSibling
        );
    }

    loadMore() {
        const nextStart = this.loadedCount + 1;
        const nextCount = Math.min(12, this.totalModels - this.loadedCount);
        
        if (nextCount > 0) {
            this.loadModels(nextStart, nextCount);
        }
    }

    updateLoadMoreButton() {
        if (!this.loadMoreButton) return;
        
        const button = this.loadMoreButton.querySelector('.load-more-btn');
        const remaining = this.totalModels - this.loadedCount;
        
        if (remaining <= 0) {
            this.loadMoreButton.style.display = 'none';
        } else {
            button.querySelector('span:last-child').textContent = 
                `Carregar mais modelos (${remaining} restantes)`;
        }
    }
}

// Initialize performance manager
let performanceManager;
let galleryLoader;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformance);
} else {
    initPerformance();
}

function initPerformance() {
    performanceManager = new PerformanceManager();
    
    // Initialize gallery loader if on gallery page
    if (document.querySelector('.gallery-grid')) {
        galleryLoader = new GalleryLoader(performanceManager);
    }
}

// Utility functions for sharing and interaction
function shareModel(modelId) {
    if (navigator.share) {
        navigator.share({
            title: `Techno Sutra AR - Capítulo ${modelId}`,
            text: `Explore o Capítulo ${modelId} do Avatamsaka Sutra em realidade aumentada`,
            url: `${window.location.origin}/index.html?model=${modelId}`
        });
    } else {
        // Fallback to clipboard
        const url = `${window.location.origin}/index.html?model=${modelId}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copiado para a área de transferência!');
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceManager, GalleryLoader };
}
