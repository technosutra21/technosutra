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
        this.displayedModels = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.isLoading = true;
        this.modelsPerPage = 12;
        this.currentPage = 1;
        
        // Language state
        this.currentLang = (localStorage.getItem('technosutra-lang') || 'pt');
        
        // Enhanced DOM elements
        this.elements = {
            galleryGrid: document.getElementById('gallery-grid'),
            searchInput: document.getElementById('search-input'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            loadingOverlay: document.getElementById('loading-overlay'),
            progressBar: document.getElementById('gallery-progress-bar'),
            showMoreBtn: null // Will be created dynamically
        };

        // React to language changes
        window.addEventListener('language-changed', async (e) => {
            this.currentLang = e.detail?.lang || this.getCurrentLang();
            await this.loadModelData();
            this.filterModels();
        });

        // Animation and interaction state
        this.animationState = {
            loadedModels: 0,
            totalModels: 56,
            isAnimating: false,
            intersectionObserver: null
        };
    }

    /**
     * Get current language (persisted by utils.js LanguageManager)
     */
    getCurrentLang() {
        return localStorage.getItem('technosutra-lang') || this.currentLang || 'pt';
    }

    /**
     * Small helper for i18n of static labels used in gallery.js
     */
    t(key) {
        const lang = this.getCurrentLang();
        const dict = {
            chapter: { pt: 'Capítulo', en: 'Chapter' },
            part: { pt: 'Parte', en: 'Part' },
            view_in_ar: { pt: 'Ver em AR', en: 'View in AR' },
            view_more: { pt: 'Ver Mais', en: 'View More' },
            share: { pt: 'Compartilhar', en: 'Share' },
            coming_soon: { pt: 'Em breve', en: 'Coming soon' },
            no_results_title: { pt: 'Nenhum modelo encontrado', en: 'No models found' },
            no_results_hint: { pt: 'Tente ajustar seus filtros ou termos de busca.', en: 'Try adjusting your filters or search terms.' },
            gallery_load_error: { pt: 'Erro ao carregar a galeria', en: 'Error loading gallery' },
            model_description_prefix: { pt: 'Modelo 3D interativo representando o kalyanamitra', en: 'Interactive 3D model representing kalyanamitra' },
            of_avatamsaka: { pt: 'do Avatamsaka Sutra.', en: 'of the Avatamsaka Sutra.' }
        };
        return (dict[key] && dict[key][lang]) || (dict[key] && dict[key]['pt']) || key;
    }
    
    /**
     * Initialize the gallery with enhanced animations
     */
    async initialize() {
        try {
            // Initialize enhanced features
            this.initializeEnhancedFeatures();
            
            // Load model data with progress tracking
            await this.loadModelData();
            
            // Setup event listeners including new animations
            this.setupEventListeners();
            
            // Update progress: Setup complete
            this.updateProgressBar(90);
            
            // Initial render with staggered animations
            this.renderGallery();
            
            // Update progress: Rendering complete
            this.updateProgressBar(95);
            
            // Hide loading overlay with enhanced animation
            this.hideLoading();
            
        } catch (error) {
            console.error('Gallery initialization error:', error);
            this.showError(this.t('gallery_load_error'));
        }
    }

    /**
     * Initialize enhanced features like intersection observer and progress tracking
     */
    initializeEnhancedFeatures() {
        // Setup intersection observer for scroll animations
        this.setupIntersectionObserver();
        
        // Initialize progress bar animation
        this.updateProgressBar(0);
        
        // Removed 3D tilt effects for better performance and user experience
    }

    /**
     * Setup intersection observer for scroll animations
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.animationState.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        setTimeout(() => {
                            entry.target.style.transform = 'translateY(0)';
                            entry.target.style.opacity = '1';
                        }, Math.random() * 200);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });
        }
    }

    /**
     * Update progress bar with smooth animation
     */
    updateProgressBar(percentage) {
        if (this.elements.progressBar) {
            const progressFill = document.getElementById('gallery-progress-bar-fill');
            if (progressFill) {
                progressFill.style.height = `${Math.min(percentage, 100)}%`;
                
                if (percentage >= 100) {
                    setTimeout(() => {
                        this.elements.progressBar.classList.remove('loading');
                        this.elements.progressBar.classList.add('completed');
                        // Hide progress bar after a delay
                        setTimeout(() => {
                            this.elements.progressBar.style.opacity = '0';
                        }, 1000);
                    }, 500);
                }
            }
        }
    }
    
    /**
     * Load model data from CSV file or fallback to generated data
     */
    async loadModelData() {
        try {
            // Update progress: Starting data load
            this.updateProgressBar(10);
            
            // Try to load characters data from CSV
            let charactersData = await this.loadCharactersData();
            
            // Update progress: CSV loaded
            this.updateProgressBar(30);
            
            // Available models based on actual GLB files (missing: 8, 27, 52)
            const unavailableModels = [52];
            const availableModels = Array.from({ length: 56 }, (_, i) => i + 1)
                .filter(id => !unavailableModels.includes(id));
            
            this.models = Array.from({ length: 56 }, (_, i) => {
                const modelNumber = i + 1;
                const isAvailable = availableModels.includes(modelNumber);
                const characterData = charactersData.find(c => c.capitulo == modelNumber);
                
                return {
                    id: modelNumber,
                    title: characterData ? characterData.Nome : `${this.t('chapter')} ${modelNumber}`,
                    subtitle: characterData ? characterData.Ensinamento : `Avatamsaka Sutra - ${this.t('part')} ${modelNumber}`,
                    description: characterData ? characterData['Desc. Personagem'] : `${this.t('model_description_prefix')} ${modelNumber} ${this.t('of_avatamsaka')}`,
                    category: this.getDeterministicCategory(modelNumber),
                    available: isAvailable,
                    modelPath: `./models/modelo${modelNumber}.glb`,
                    usdzPath: `./models/usdz/modelo${modelNumber}.usdz`,
                    characterData: characterData || {}
                };
            });
            
            // Update progress: Models processed
            this.updateProgressBar(60);
            
            this.filteredModels = [...this.models];
            this.updateDisplayedModels();
            
            // Update progress: Gallery data ready
            this.updateProgressBar(80);
            
        } catch (error) {
            console.error('Error loading model data:', error);
            // Create fallback data if CSV loading fails
            await this.loadFallbackData();
        }
    }

    /**
     * Load characters data from CSV file
     */
    async loadCharactersData() {
        try {
            const lang = this.getCurrentLang();
            const csvPath = lang === 'en' ? './summaries/characters_en.csv' : './summaries/characters.csv';
            const response = await fetch(csvPath);
            if (!response.ok) {
                // If EN fails, fallback to PT
                if (lang === 'en') {
                    const fallback = await fetch('./summaries/characters.csv');
                    if (fallback.ok) {
                        const csvText = await fallback.text();
                        return this.parseCSV(csvText);
                    }
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.warn('Could not load characters CSV:', error);
            return [];
        }
    }

    /**
     * Parse CSV text into array of objects
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim()) {
                const values = this.parseCSVLine(line);
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    data.push(row);
                }
            }
        }
        
        return data;
    }

    /**
     * Parse a single CSV line considering quoted values
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    /**
     * Load fallback data when CSV is not available
     */
    async loadFallbackData() {
        const unavailableModels = [8, 27, 52];
        const availableModels = Array.from({ length: 56 }, (_, i) => i + 1)
            .filter(id => !unavailableModels.includes(id));
        
        this.models = Array.from({ length: 56 }, (_, i) => {
            const modelNumber = i + 1;
            const isAvailable = availableModels.includes(modelNumber);
            
            return {
                id: modelNumber,
                title: `${this.t('chapter')} ${modelNumber}`,
                subtitle: `Avatamsaka Sutra - ${this.t('part')} ${modelNumber}`,
                description: `${this.t('model_description_prefix')} ${modelNumber} ${this.t('of_avatamsaka')}`,
                category: this.getDeterministicCategory(modelNumber),
                available: isAvailable,
                modelPath: `./models/modelo${modelNumber}.glb`,
                usdzPath: `./models/usdz/modelo${modelNumber}.usdz`,
                characterData: {}
            };
        });
        
        this.filteredModels = [...this.models];
        this.updateDisplayedModels();
    }
    
    /**
     * Get a deterministic category based on model number to avoid random behavior
     * @param {number} modelNumber - Model number
     * @returns {string} - Deterministic category
     */
    getDeterministicCategory(modelNumber) {
        const categories = ['mandala', 'buddha', 'bodhisattva', 'sutra'];
        return categories[(modelNumber - 1) % categories.length];
    }
    
    /**
     * Setup event listeners for enhanced gallery functionality
     */
    setupEventListeners() {
        // Enhanced search input with clear button
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterModels();
                this.updateSearchClearButton();
            });

            // Search clear button
            const searchClear = document.getElementById('search-clear');
            if (searchClear) {
                searchClear.addEventListener('click', () => {
                    this.elements.searchInput.value = '';
                    this.searchTerm = '';
                    this.filterModels();
                    this.updateSearchClearButton();
                    this.elements.searchInput.focus();
                });
            }
        }
        
        // Enhanced filter buttons
        if (this.elements.filterButtons) {
            this.elements.filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons
                    this.elements.filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to clicked button with animation
                    button.classList.add('active');
                    
                    // Update filter
                    this.currentFilter = button.dataset.filter;
                    this.filterModels();
                });
            });
        }
        
        // Scroll progress indicator
        window.addEventListener('scroll', this.updateScrollProgress.bind(this));
        
        // Intersection observer for performance
        this.setupPerformanceOptimizations();
        
        // Model viewer loading events
        document.addEventListener('model-viewer-loaded', (e) => {
            const modelId = e.detail.modelId;
            const modelCard = document.querySelector(`.model-card[data-model-id="${modelId}"]`);
            if (modelCard) {
                const loadingSpinner = modelCard.querySelector('.loading-spinner');
                if (loadingSpinner) {
                    loadingSpinner.classList.add('hidden');
                }
                
                // Update progress
                this.animationState.loadedModels++;
                this.updateProgressBar((this.animationState.loadedModels / this.animationState.totalModels) * 100);
            }
        });
    }

    /**
     * Update search clear button visibility
     */
    updateSearchClearButton() {
        const searchClear = document.getElementById('search-clear');
        if (searchClear) {
            if (this.elements.searchInput.value.length > 0) {
                searchClear.style.display = 'flex';
            } else {
                searchClear.style.display = 'none';
            }
        }
    }

    /**
     * Update scroll progress indicator
     */
    updateScrollProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = (scrollTop / scrollHeight) * 100;
        
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    /**
     * Setup performance optimizations
     */
    setupPerformanceOptimizations() {
        // Throttled scroll handler
        let scrollTimer = null;
        window.addEventListener('scroll', () => {
            if (scrollTimer) return;
            scrollTimer = setTimeout(() => {
                scrollTimer = null;
                this.updateScrollProgress();
            }, 16); // ~60fps
        });

        // Reduce motion for accessibility
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-normal', 'none');
            document.documentElement.style.setProperty('--transition-fast', 'none');
            document.documentElement.style.setProperty('--transition-slow', 'none');
        }
    }
    
    /**
     * Filter models based on current filter and search term with enhanced stats
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
        
        // Update filter counts and stats
        this.updateFilterCounts();
        this.updateGalleryStats();
        
        // Reset pagination when filtering
        this.currentPage = 1;
        this.updateDisplayedModels();
        this.renderGallery();
    }

    /**
     * Update filter button counts
     */
    updateFilterCounts() {
        const categories = ['all', 'bodhisattva', 'buddha', 'kalyanamitras'];
        
        categories.forEach(category => {
            const count = category === 'all' 
                ? this.models.length
                : this.models.filter(model => model.category === category).length;
                
            const countElement = document.getElementById(`filter-${category}-count`);
            if (countElement) {
                countElement.textContent = count;
                
                // Animate count update
                countElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    countElement.style.transform = 'scale(1)';
                }, 150);
            }
        });
    }

    
    /**
     * Update gallery statistics display
     */
    updateGalleryStats() {
        // Total models
        const totalElement = document.getElementById('total-models');
        if (totalElement) {
            totalElement.textContent = this.models.length;
        }

        // Available models
        const availableElement = document.getElementById('available-models');
        if (availableElement) {
            const availableCount = this.models.filter(model => model.available).length;
            availableElement.textContent = availableCount;
        }

        // Filtered models
        const filteredElement = document.getElementById('filtered-models');
        if (filteredElement) {
            filteredElement.textContent = this.filteredModels.length;
            
            // Animate the filtered count with color change
            filteredElement.style.color = '#7877c6';
            setTimeout(() => {
                filteredElement.style.color = '';
            }, 1000);
        }
    }

    /**
     * Update displayed models based on pagination
     */
    updateDisplayedModels() {
        const startIndex = 0;
        const endIndex = this.currentPage * this.modelsPerPage;
        this.displayedModels = this.filteredModels.slice(startIndex, endIndex);
    }
    
    /**
     * Render the gallery with enhanced staggered animations
     */
    renderGallery() {
        if (!this.elements.galleryGrid) return;
        
        // Clear gallery
        this.elements.galleryGrid.innerHTML = '';
        
        if (this.filteredModels.length === 0) {
            const noResultsTitle = this.t('no_results_title');
            const noResultsHint = this.t('no_results_hint');
            this.elements.galleryGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 8px;">${noResultsTitle}</h3>
                    <p style="color: var(--text-muted);">${noResultsHint}</p>
                </div>
            `;
            this.hideShowMoreButton();
            return;
        }
        
        // Add model cards for displayed models with staggered animation
        this.displayedModels.forEach((model, index) => {
            const modelCard = document.createElement('div');
            modelCard.className = `model-card ${!model.available ? 'unavailable' : ''}`;
            modelCard.dataset.modelId = model.id;
            modelCard.dataset.category = model.category;
            
            modelCard.innerHTML = `
                <div class="model-header">
                    <div class="model-number">${this.t('chapter')} ${model.id}</div>
                    <h3 class="model-title">${model.title}</h3>
                    <div class="model-subtitle">${model.subtitle}</div>
                </div>
                
                <div class="model-viewer-container">
                    ${model.available ? `
                        <model-viewer
                            src="${model.modelPath}"
                            ios-src="${model.usdzPath}"
                            alt="${model.title}"
                            ar
                            ar-modes="webxr scene-viewer quick-look"
                            ar-scale="auto"
                            ar-placement="floor"
                            camera-controls
                            auto-rotate
                            style="width: 100%; height: 100%;">
                            
                            <div class="loading-spinner"></div>
                        </model-viewer>
                    ` : `
                        <div class="unavailable-overlay">
                            <div class="unavailable-icon">🔒</div>
                            <div class="unavailable-text">${this.t('coming_soon')}</div>
                        </div>
                    `}
                </div>
                
                <div class="model-actions">
                    <button class="action-btn primary ar-button" onclick="activateModelAR(this, ${model.id}, event)" ${!model.available ? 'disabled' : ''}>
                        <span>🥽</span>
                        <span>${this.t('view_in_ar')}</span>
                    </button>
                    <button class="action-btn info-btn" onclick="showModelInfo(${model.id})" ${!model.available ? 'disabled' : ''}>
                        <span>⁜</span>
                        <span>${this.t('view_more')}</span>
                    </button>
                    <button class="action-btn" onclick="shareModel(${model.id})" ${!model.available ? 'disabled' : ''}>
                        <span>🛞</span>
                        <span>${this.t('share')}</span>
                    </button>
                </div>
            `;
            
            // Apply initial animation state
            modelCard.style.opacity = '0';
            modelCard.style.transform = 'translateY(10px)';
            modelCard.style.transition = 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)';
            
            this.elements.galleryGrid.appendChild(modelCard);
            
            // Stagger animations
            setTimeout(() => {
                modelCard.style.opacity = '1';
                modelCard.style.transform = 'translateY(0)';
                
                // Setup intersection observer for scroll animations
                if (this.animationState.intersectionObserver) {
                    this.animationState.intersectionObserver.observe(modelCard);
                }
            }, index * 100);
        });
        
        // Initialize model-viewer elements after custom element is ready
        this.initializeModelViewers();

        // Handle "Show More" button
        this.handleShowMoreButton();
    }

    /**
     * Initialize model-viewer elements after ensuring the custom element is ready
     */
    async initializeModelViewers() {
        // Wait for model-viewer custom element to be registered
        if (!customElements.get('model-viewer')) {
            // Wait a bit more for the script to load and register
            await new Promise(resolve => {
                const checkElement = () => {
                    if (customElements.get('model-viewer')) {
                        resolve();
                    } else {
                        setTimeout(checkElement, 100);
                    }
                };
                checkElement();
            });
        }

        // Now initialize the model viewers
        const modelViewers = document.querySelectorAll('model-viewer');
        modelViewers.forEach(viewer => {
            viewer.addEventListener('load', () => {
                const modelCard = viewer.closest('.model-card');
                if (modelCard) {
                    const modelId = modelCard.dataset.modelId;
                    const loadingSpinner = modelCard.querySelector('.loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.classList.add('hidden');
                    }
                    document.dispatchEvent(new CustomEvent('model-viewer-loaded', {
                        detail: { modelId }
                    }));
                }
            });

            viewer.addEventListener('error', (event) => {
                console.error('Model viewer error:', event);
                const modelCard = viewer.closest('.model-card');
                if (modelCard) {
                    const modelId = modelCard.dataset.modelId;
                    console.error(`Error loading model ${modelId}:`, event.detail);
                }
            });
        });
    }

    /**
     * Handle show more button visibility and functionality
     */
    handleShowMoreButton() {
        const hasMoreModels = this.displayedModels.length < this.filteredModels.length;
        
        if (hasMoreModels) {
            this.showShowMoreButton();
        } else {
            this.hideShowMoreButton();
        }
    }

    /**
     * Show the "Show More" button
     */
    showShowMoreButton() {
        let showMoreContainer = document.getElementById('show-more-container');
        
        if (!showMoreContainer) {
            showMoreContainer = document.createElement('div');
            showMoreContainer.id = 'show-more-container';
            showMoreContainer.style.cssText = `
                display: flex;
                justify-content: center;
                padding: 40px 20px;
                margin-top: 20px;
            `;
            
            const showMoreBtn = document.createElement('button');
            showMoreBtn.className = 'show-more-btn';
            showMoreBtn.style.cssText = `
                background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
                color: white;
                border: none;
                border-radius: 25px;
                padding: 12px 30px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 255, 149, 0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            showMoreBtn.textContent = this.t('view_more');
            
            showMoreBtn.addEventListener('mouseover', () => {
                showMoreBtn.style.transform = 'translateY(-2px)';
                showMoreBtn.style.boxShadow = '0 6px 20px rgba(0, 255, 149, 0.4)';
            });
            
            showMoreBtn.addEventListener('mouseout', () => {
                showMoreBtn.style.transform = 'translateY(0)';
                showMoreBtn.style.boxShadow = '0 4px 15px rgba(0, 255, 149, 0.3)';
            });
            
            showMoreBtn.addEventListener('click', () => {
                this.loadMoreModels();
            });
            
            showMoreContainer.appendChild(showMoreBtn);
            
            // Insert after gallery grid
            const galleryContainer = this.elements.galleryGrid.parentNode;
            galleryContainer.insertBefore(showMoreContainer, this.elements.galleryGrid.nextSibling);
            
            this.elements.showMoreBtn = showMoreBtn;
        }
        
        showMoreContainer.style.display = 'flex';
    }

    /**
     * Hide the "Show More" button
     */
    hideShowMoreButton() {
        const showMoreContainer = document.getElementById('show-more-container');
        if (showMoreContainer) {
            showMoreContainer.style.display = 'none';
        }
    }

    /**
     * Load more models when "Show More" is clicked
     */
    loadMoreModels() {
        this.currentPage++;
        this.updateDisplayedModels();
        this.renderGallery();
        
        // Smooth scroll to new content
        setTimeout(() => {
            const newCards = document.querySelectorAll('.model-card');
            if (newCards.length > 0) {
                const lastOldIndex = (this.currentPage - 1) * this.modelsPerPage - 1;
                if (newCards[lastOldIndex]) {
                    newCards[lastOldIndex].scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }
            }
        }, 100);
    }
    
    /**
     * Hide loading overlay with enhanced animation
     */
    hideLoading() {
        this.isLoading = false;
        
        // Complete progress bar
        this.updateProgressBar(100);
        
        // Hide loading overlay with fade out
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.opacity = '0';
            this.elements.loadingOverlay.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                this.elements.loadingOverlay.classList.add('hidden');
            }, 500);
        }
        
        // Animate in the main content
        document.body.classList.add('loaded');
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

// Global function for activating AR (for inline onclick handlers)
function activateModelAR(button, modelId, event) {
    if (event) event.preventDefault();
    const modelCard = button.closest('.model-card');
    const modelViewer = modelCard.querySelector('model-viewer');
    
    if (modelViewer && modelViewer.canActivateAR) {
        modelViewer.activateAR().catch(error => {
            console.error('AR activation failed:', error);
            window.location.href = `AR.html?model=${modelId}`;
        });
    } else {
        console.log('AR not supported on this device/browser');
        window.location.href = `AR.html?model=${modelId}`;
    }
}

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

// Global function for showing model info modal (for inline onclick handlers)
function showModelInfo(modelId) {
    const gallery = window.gallery;
    if (!gallery) return;
    
    const model = gallery.models.find(m => m.id === modelId);
    if (!model) return;
    
    const characterData = model.characterData || {};
    
    // Create full-screen modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.98);
        display: flex;
        z-index: 10000;
        backdrop-filter: blur(20px);
        opacity: 0;
        animation: modalFadeIn 0.4s ease-out forwards;
    `;
    
    // Create full-screen modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content-fullscreen';
    modalContent.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, 
            rgba(5, 5, 5, 0.98) 0%, 
            rgba(15, 15, 20, 0.98) 30%, 
            rgba(10, 10, 15, 0.98) 70%, 
            rgba(5, 5, 5, 0.98) 100%);
        overflow-y: auto;
        position: relative;
        transform: translateY(50px);
        animation: modalSlideIn 0.5s ease-out forwards;
        scroll-behavior: smooth;
    `;
    
    // Add CSS animations
    if (!document.getElementById('modal-animations')) {
        const style = document.createElement('style');
        style.id = 'modal-animations';
        style.textContent = `
            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalSlideIn {
                from { transform: translateY(50px); }
                to { transform: translateY(0); }
            }
            @keyframes sectionSlideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(30px); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
            }
            .modal-section {
                animation: sectionSlideIn 0.6s ease-out forwards;
            }
            .modal-section:nth-child(1) { animation-delay: 0.1s; }
            .modal-section:nth-child(2) { animation-delay: 0.2s; }
            .modal-section:nth-child(3) { animation-delay: 0.3s; }
            .modal-section:nth-child(4) { animation-delay: 0.4s; }
            .modal-section:nth-child(5) { animation-delay: 0.5s; }
            .modal-section:nth-child(6) { animation-delay: 0.6s; }
            .floating-particles {
                position: absolute;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: -1;
            }
            .floating-particles::before,
            .floating-particles::after {
                content: '';
                position: absolute;
                width: 200px;
                height: 200px;
                background: radial-gradient(circle, rgba(120, 119, 198, 0.1) 0%, transparent 70%);
                border-radius: 50%;
                animation: floatParticles 20s infinite linear;
            }
            .floating-particles::before {
                top: 10%;
                left: 10%;
                animation-delay: 0s;
            }
            .floating-particles::after {
                top: 60%;
                right: 15%;
                animation-delay: 10s;
                background: radial-gradient(circle, rgba(157, 0, 255, 0.08) 0%, transparent 70%);
            }
            @keyframes floatParticles {
                0% { transform: translate(0, 0) rotate(0deg); }
                33% { transform: translate(30px, -30px) rotate(120deg); }
                66% { transform: translate(-20px, 20px) rotate(240deg); }
                100% { transform: translate(0, 0) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    modalContent.innerHTML = `
        <div class="floating-particles"></div>
        
        <!-- Header Section -->
        <div class="modal-header-fullscreen" style="
            padding: 40px 40px 60px;
            background: linear-gradient(135deg, rgba(120, 119, 198, 0.15) 0%, rgba(157, 0, 255, 0.1) 100%);
            border-bottom: 1px solid rgba(120, 119, 198, 0.2);
            position: relative;
            text-align: center;
        ">
            <button class="modal-close-fullscreen" style="
                position: absolute;
                top: 25px;
                right: 25px;
                background: rgba(120, 119, 198, 0.3);
                border: 2px solid rgba(120, 119, 198, 0.6);
                color: #ffffff;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 20px;
                font-weight: bold;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                z-index: 1001;
            " onclick="this.closest('.modal-overlay').remove()">
                ✕
            </button>
            
            <div style="
                font-size: 1.2rem;
                color: #7877c6;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                font-weight: 600;
                opacity: 0.9;
            ">Capítulo ${model.id}</div>
            
            <h1 style="
                color: #ffffff;
                font-size: clamp(2.5rem, 6vw, 4rem);
                font-weight: 300;
                margin-bottom: 15px;
                line-height: 1.2;
                background: linear-gradient(135deg, #ffffff 0%, #7877c6 50%, #ffffff 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 0 30px rgba(120, 119, 198, 0.3);
            ">${model.title}</h1>
            
            ${characterData.Ocupação ? `<div style="
                color: #b8b9d4;
                font-size: 1.3rem;
                font-style: italic;
                font-weight: 300;
                margin-bottom: 20px;
                opacity: 0.8;
            ">${characterData.Ocupação}</div>` : ''}
            
            <div style="
                width: 100px;
                height: 2px;
                background: linear-gradient(90deg, transparent, #7877c6, transparent);
                margin: 30px auto 0;
                border-radius: 1px;
            "></div>
        </div>
        
        <!-- Content Body -->
        <div class="modal-body-fullscreen" style="
            padding: 60px 40px;
            max-width: 1200px;
            margin: 0 auto;
        ">
            ${characterData.Ensinamento ? `
                <div class="info-section modal-section" style="
                    margin-bottom: 50px;
                    padding: 40px;
                    background: rgba(15, 15, 15, 0.6);
                    border: 1px solid rgba(120, 119, 198, 0.2);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, rgba(120, 119, 198, 0.05) 0%, transparent 50%);
                        pointer-events: none;
                    "></div>
                    <h2 style="
                        color: #7877c6;
                        font-size: 1.8rem;
                        font-weight: 600;
                        margin-bottom: 25px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        position: relative;
                    "><span style="font-size: 2rem;">🧘</span> Ensinamento Principal</h2>
                    <p style="
                        color: #e5e7eb;
                        line-height: 1.8;
                        font-size: 1.1rem;
                        text-align: justify;
                        position: relative;
                        font-weight: 300;
                    ">${characterData.Ensinamento}</p>
                </div>
            ` : ''}
            
            ${characterData['Desc. Personagem'] ? `
                <div class="info-section modal-section" style="
                    margin-bottom: 50px;
                    padding: 40px;
                    background: rgba(15, 15, 15, 0.6);
                    border: 1px solid rgba(120, 119, 198, 0.2);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, rgba(157, 0, 255, 0.05) 0%, transparent 50%);
                        pointer-events: none;
                    "></div>
                    <h2 style="
                        color: #7877c6;
                        font-size: 1.8rem;
                        font-weight: 600;
                        margin-bottom: 25px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        position: relative;
                    "><span style="font-size: 2rem;">👤</span> Descrição do Personagem</h2>
                    <p style="
                        color: #e5e7eb;
                        line-height: 1.8;
                        font-size: 1.1rem;
                        text-align: justify;
                        position: relative;
                        font-weight: 300;
                    ">${characterData['Desc. Personagem']}</p>
                </div>
            ` : ''}
            
            ${characterData.Significado ? `
                <div class="info-section modal-section" style="
                    margin-bottom: 50px;
                    padding: 40px;
                    background: rgba(15, 15, 15, 0.6);
                    border: 1px solid rgba(120, 119, 198, 0.2);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, rgba(120, 119, 198, 0.05) 0%, transparent 50%);
                        pointer-events: none;
                    "></div>
                    <h2 style="
                        color: #7877c6;
                        font-size: 1.8rem;
                        font-weight: 600;
                        margin-bottom: 25px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        position: relative;
                    "><span style="font-size: 2rem;">💫</span> Significado</h2>
                    <p style="
                        color: #e5e7eb;
                        line-height: 1.8;
                        font-size: 1.1rem;
                        text-align: justify;
                        position: relative;
                        font-weight: 300;
                    ">${characterData.Significado}</p>
                </div>
            ` : ''}
            
            ${characterData.Local ? `
                <div class="info-section modal-section" style="
                    margin-bottom: 50px;
                    padding: 40px;
                    background: rgba(15, 15, 15, 0.6);
                    border: 1px solid rgba(120, 119, 198, 0.2);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, rgba(157, 0, 255, 0.05) 0%, transparent 50%);
                        pointer-events: none;
                    "></div>
                    <h2 style="
                        color: #7877c6;
                        font-size: 1.8rem;
                        font-weight: 600;
                        margin-bottom: 25px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        position: relative;
                    "><span style="font-size: 2rem;">📍</span> Local</h2>
                    <p style="
                        color: #e5e7eb;
                        line-height: 1.8;
                        font-size: 1.1rem;
                        text-align: justify;
                        position: relative;
                        font-weight: 300;
                    ">${characterData.Local}</p>
                </div>
            ` : ''}
            
            ${characterData['Resumo do Cap. (84000.co)'] ? `
                <div class="info-section modal-section" style="
                    margin-bottom: 50px;
                    padding: 40px;
                    background: rgba(15, 15, 15, 0.6);
                    border: 1px solid rgba(120, 119, 198, 0.2);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, rgba(120, 119, 198, 0.05) 0%, transparent 50%);
                        pointer-events: none;
                    "></div>
                    <h2 style="
                        color: #7877c6;
                        font-size: 1.8rem;
                        font-weight: 600;
                        margin-bottom: 25px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        position: relative;
                    "><span style="font-size: 2rem;">📚</span> Resumo do Capítulo</h2>
                    <p style="
                        color: #e5e7eb;
                        line-height: 1.8;
                        font-size: 1.1rem;
                        text-align: justify;
                        position: relative;
                        font-weight: 300;
                    ">${characterData['Resumo do Cap. (84000.co)']}</p>
                </div>
            ` : ''}
        </div>
        
        <!-- Action Buttons -->
        <div class="modal-actions-fullscreen" style="
            padding: 40px;
            background: rgba(5, 5, 5, 0.8);
            border-top: 1px solid rgba(120, 119, 198, 0.2);
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            backdrop-filter: blur(10px);
        ">
            <button type="button" class="modal-action-btn-fullscreen" onclick="activateModelAR(this, ${model.id}, event)" style="
                background: linear-gradient(135deg, #7877c6, #9d00ff);
                color: white;
                text-decoration: none;
                border: none;
                border-radius: 15px;
                padding: 18px 36px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 8px 25px rgba(120, 119, 198, 0.4);
                backdrop-filter: blur(10px);
                min-width: 160px;
                justify-content: center;
            " ${!model.available ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                <span style="font-size: 1.3rem;">📱</span>
                <span>Ver em AR</span>
            </button>
            
            <button class="modal-action-btn-fullscreen" onclick="shareModel(${model.id})" style="
                background: rgba(120, 119, 198, 0.3);
                color: #ffffff;
                border: 2px solid rgba(120, 119, 198, 0.6);
                border-radius: 15px;
                padding: 18px 36px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                backdrop-filter: blur(10px);
                min-width: 160px;
                justify-content: center;
            " ${!model.available ? 'disabled' : ''}>
                <span style="font-size: 1.3rem;">🛞</span>
                <span>Compartilhar</span>
            </button>
        </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    
    // Enhanced button hover effects
    const actionButtons = modalContent.querySelectorAll('.modal-action-btn-fullscreen');
    actionButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-3px) scale(1.05)';
            if (button.style.background.includes('linear-gradient')) {
                button.style.boxShadow = '0 12px 35px rgba(120, 119, 198, 0.6)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
            if (button.style.background.includes('linear-gradient')) {
                button.style.boxShadow = '0 8px 25px rgba(120, 119, 198, 0.4)';
            }
        });
    });
    
    // Enhanced close button hover effect
    const closeBtn = modalContent.querySelector('.modal-close-fullscreen');
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 99, 99, 0.8)';
        closeBtn.style.borderColor = 'rgba(255, 99, 99, 1)';
        closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(120, 119, 198, 0.3)';
        closeBtn.style.borderColor = 'rgba(120, 119, 198, 0.6)';
        closeBtn.style.transform = 'scale(1) rotate(0deg)';
    });
    
    // Close modal function
    const closeModal = () => {
        modalOverlay.style.animation = 'modalFadeIn 0.3s ease-in reverse';
        modalContent.style.animation = 'modalSlideIn 0.3s ease-in reverse';
        
        setTimeout(() => {
            modalOverlay.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    };
    
    // Close modal when clicking outside (on the overlay)
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Update close button to use enhanced close
    closeBtn.onclick = closeModal;
}