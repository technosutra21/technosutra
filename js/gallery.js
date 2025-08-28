/**
 * Techno Sutra AR - Gallery Controller
 * Manages the gallery functionality
 */

class GalleryController {
    /**
     * Initialize the gallery
     */
    constructor() {
        this.models = [];
        this.filteredModels = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.isLoading = true;
        
        // DOM elements
        this.elements = {
            galleryGrid: document.getElementById('gallery-grid'),
            searchInput: document.getElementById('search-input'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            loadingOverlay: document.getElementById('loading-overlay')
        };
    }
    
    /**
     * Initialize the gallery
     */
    async initialize() {
        try {
            // Load model data
            await this.loadModelData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initial render
            this.renderGallery();
            
            // Hide loading overlay
            this.hideLoading();
            
        } catch (error) {
            console.error('Gallery initialization error:', error);
            this.showError('Erro ao carregar a galeria');
        }
    }
    
    /**
     * Load model data from JSON file or API
     */
    async loadModelData() {
        try {
            // Available models based on actual GLB files (missing: 7, 8, 27, 43, 52)
            const availableModels = [
                1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
                21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 
                38, 39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 50, 51, 53, 54, 55, 56
            ];
            
            this.models = Array.from({ length: 56 }, (_, i) => {
                const modelNumber = i + 1;
                const isAvailable = availableModels.includes(modelNumber);
                
                return {
                    id: modelNumber,
                    title: `Capítulo ${modelNumber}`,
                    subtitle: `Avatamsaka Sutra - Parte ${modelNumber}`,
                    description: `Modelo 3D interativo representando o capítulo ${modelNumber} do Avatamsaka Sutra.`,
                    category: this.getRandomCategory(),
                    available: isAvailable,
                    modelPath: `./models/modelo${modelNumber}.glb`,
                    usdzPath: `./models/usdz_files/modelo${modelNumber}.usdz`,
                    thumbnail: `thumbnails/thumb${modelNumber}.jpg`
                };
            });
            
            this.filteredModels = [...this.models];
            
        } catch (error) {
            console.error('Error loading model data:', error);
            throw new Error('Failed to load model data');
        }
    }
    
    /**
     * Get a random category for sample data
     * @returns {string} - Random category
     */
    getRandomCategory() {
        const categories = ['mandala', 'buddha', 'bodhisattva', 'sutra'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    
    /**
     * Setup event listeners for gallery functionality
     */
    setupEventListeners() {
        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterModels();
            });
        }
        
        // Filter buttons
        if (this.elements.filterButtons) {
            this.elements.filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons
                    this.elements.filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to clicked button
                    button.classList.add('active');
                    
                    // Update filter
                    this.currentFilter = button.dataset.filter;
                    this.filterModels();
                });
            });
        }
        
        // Model viewer loading events
        document.addEventListener('model-viewer-loaded', (e) => {
            const modelId = e.detail.modelId;
            const modelCard = document.querySelector(`.model-card[data-model-id="${modelId}"]`);
            if (modelCard) {
                const loadingSpinner = modelCard.querySelector('.loading-spinner');
                if (loadingSpinner) {
                    loadingSpinner.classList.add('hidden');
                }
            }
        });
    }
    
    /**
     * Filter models based on current filter and search term
     */
    filterModels() {
        this.filteredModels = this.models.filter(model => {
            // Filter by category
            const categoryMatch = this.currentFilter === 'all' || model.category === this.currentFilter;
            
            // Filter by search term
            const searchMatch = this.searchTerm === '' || 
                model.title.toLowerCase().includes(this.searchTerm) || 
                model.subtitle.toLowerCase().includes(this.searchTerm) || 
                model.description.toLowerCase().includes(this.searchTerm);
            
            return categoryMatch && searchMatch;
        });
        
        this.renderGallery();
    }
    
    /**
     * Render the gallery with filtered models
     */
    renderGallery() {
        if (!this.elements.galleryGrid) return;
        
        // Clear gallery
        this.elements.galleryGrid.innerHTML = '';
        
        if (this.filteredModels.length === 0) {
            this.elements.galleryGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 8px;">Nenhum modelo encontrado</h3>
                    <p style="color: var(--text-muted);">Tente ajustar seus filtros ou termos de busca.</p>
                </div>
            `;
            return;
        }
        
        // Add model cards
        this.filteredModels.forEach(model => {
            const modelCard = document.createElement('div');
            modelCard.className = `model-card ${!model.available ? 'unavailable' : ''}`;
            modelCard.dataset.modelId = model.id;
            modelCard.dataset.category = model.category;
            
            modelCard.innerHTML = `
                <div class="model-header">
                    <div class="model-number">Capítulo ${model.id}</div>
                    <h3 class="model-title">${model.title}</h3>
                    <div class="model-subtitle">${model.subtitle}</div>
                </div>
                
                <div class="model-viewer-container">
                    ${model.available ? `
                        <model-viewer
                            src="${model.modelPath}"
                            ios-src="${model.usdzPath}"
                            alt="${model.title}"
                            camera-controls
                            auto-rotate
                            rotation-per-second="30deg"
                            loading="lazy"
                            reveal="interaction"
                            ar
                            ar-modes="webxr scene-viewer quick-look"
                            ar-scale="auto"
                            ar-placement="floor"
                            shadow-intensity="1"
                            environment-image="neutral"
                            exposure="1"
                            style="width: 100%; height: 100%;">
                            
                            <div class="loading-spinner"></div>
                        </model-viewer>
                    ` : `
                        <div class="unavailable-overlay">
                            <div class="unavailable-icon">🔒</div>
                            <div class="unavailable-text">Em breve</div>
                        </div>
                    `}
                </div>
                
                <div class="model-actions">
                    <a href="AR.html?model=${model.id}" class="action-btn primary" ${!model.available ? 'disabled' : ''}>
                        <span>📱</span>
                        <span>Ver em AR</span>
                    </a>
                    <button class="action-btn" onclick="shareModel(${model.id})" ${!model.available ? 'disabled' : ''}>
                        <span>🛞</span>
                        <span>Compartilhar</span>
                    </button>
                </div>
            `;
            
            this.elements.galleryGrid.appendChild(modelCard);
        });
        
        // Initialize model-viewer elements
        if (customElements.get('model-viewer')) {
            const modelViewers = document.querySelectorAll('model-viewer');
            modelViewers.forEach(viewer => {
                viewer.addEventListener('load', () => {
                    const modelCard = viewer.closest('.model-card');
                    if (modelCard) {
                        const modelId = modelCard.dataset.modelId;
                        document.dispatchEvent(new CustomEvent('model-viewer-loaded', {
                            detail: { modelId }
                        }));
                    }
                });
            });
        }
    }
    
    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.isLoading = false;
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.position = 'fixed';
        errorElement.style.top = '20px';
        errorElement.style.left = '50%';
        errorElement.style.transform = 'translateX(-50%)';
        errorElement.style.background = 'rgba(220, 38, 38, 0.9)';
        errorElement.style.color = 'white';
        errorElement.style.padding = '12px 24px';
        errorElement.style.borderRadius = '8px';
        errorElement.style.zIndex = '10000';
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(errorElement);
            }, 300);
        }, 5000);
    }
}

// Initialize gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new GalleryController();
    gallery.initialize();
    
    // Make the controller available globally for debugging
    window.gallery = gallery;
});

// Global function for sharing a model (for inline onclick handlers)
function shareModel(modelId) {
    if (navigator.share) {
        navigator.share({
            title: `Techno Sutra AR - Capítulo ${modelId}`,
            text: `Confira este modelo 3D do capítulo ${modelId} do Avatamsaka Sutra em realidade aumentada!`,
            url: `${window.location.origin}/AR.html?model=${modelId}`
        })
        .catch(error => console.log('Error sharing:', error));
    } else {
        // Fallback for browsers that don't support Web Share API
        const url = `${window.location.origin}/AR.html?model=${modelId}`;
        
        // Copy to clipboard
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Show toast
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '10000';
        toast.textContent = 'Link copiado para a área de transferência';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}