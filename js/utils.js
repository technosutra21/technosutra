/**
 * Techno Sutra AR - Utility Functions
 * Shared JavaScript utilities for the Techno Sutra AR project
 */

// Theme Management
const ThemeManager = {
    /**
     * Initialize theme based on user preference or saved setting
     */
    init() {
        const savedTheme = localStorage.getItem('technosutra-theme');
        if (savedTheme === 'light') {
            this.setLightMode();
        } else {
            this.setDarkMode();
        }
        
        // Update theme toggle button if it exists
        this.updateThemeToggleButton();
    },
    
    /**
     * Toggle between light and dark themes
     */
    toggle() {
        if (document.body.classList.contains('light-mode')) {
            this.setDarkMode();
        } else {
            this.setLightMode();
        }
        
        this.updateThemeToggleButton();
    },
    
    /**
     * Set light mode theme
     */
    setLightMode() {
        document.body.classList.add('light-mode');
        localStorage.setItem('technosutra-theme', 'light');
    },
    
    /**
     * Set dark mode theme
     */
    setDarkMode() {
        document.body.classList.remove('light-mode');
        localStorage.setItem('technosutra-theme', 'dark');
    },
    
    /**
     * Update theme toggle button icon if it exists
     */
    updateThemeToggleButton() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            const isLightMode = document.body.classList.contains('light-mode');
            themeToggle.innerHTML = isLightMode ? '☀️' : '🌙';
            themeToggle.setAttribute('data-tooltip', isLightMode ? 'Mudar para tema escuro' : 'Mudar para tema claro');
        }
    }
};

// Language Management
const LanguageManager = {
    /**
     * Initialize language based on user preference or saved setting
     */
    init() {
        const savedLang = localStorage.getItem('technosutra-lang') || 'pt';
        this.setLanguage(savedLang);
        this.updateLanguageToggleButton();
    },
    
    /**
     * Toggle between available languages
     */
    toggle() {
        const currentLang = localStorage.getItem('technosutra-lang') || 'pt';
        const newLang = currentLang === 'pt' ? 'en' : 'pt';
        this.setLanguage(newLang);
        this.updateLanguageToggleButton();
    },
    
    /**
     * Set the application language
     * @param {string} lang - Language code ('pt' or 'en')
     */
    setLanguage(lang) {
        localStorage.setItem('technosutra-lang', lang);
        
        // Update text elements with data-lang attribute
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (translations[key] && translations[key][lang]) {
                element.textContent = translations[key][lang];
                // Also handle placeholders
                if (element.placeholder !== undefined && translations[key][lang]) {
                    element.placeholder = translations[key][lang];
                }
            }
        });
        
        // Notify listeners (e.g., gallery) that language changed
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
    },
    
    /**
     * Update language toggle button if it exists
     */
    updateLanguageToggleButton() {
        const langToggle = document.querySelector('.language-toggle');
        if (langToggle) {
            const currentLang = localStorage.getItem('technosutra-lang') || 'pt';
            langToggle.innerHTML = `🌐 ${currentLang.toUpperCase()}`;
        }
    }
};

// Translations object
const translations = {
    'home': {
        'pt': 'Início',
        'en': 'Home'
    },
    'gallery': {
        'pt': 'Galeria',
        'en': 'Gallery'
    },
    'map': {
        'pt': 'Mapa',
        'en': 'Map'
    },
    'search_placeholder': {
        'pt': '🔍 Buscar por nome ou descrição...',
        'en': '🔍 Search by name or description...'
    },
    'ar': {
        'pt': 'Realidade Aumentada',
        'en': 'Augmented Reality'
    },
    'back': {
        'pt': '← Voltar',
        'en': '← Back'
    },
    'view_in_ar': {
        'pt': 'Ver em AR',
        'en': 'View in AR'
    },
    'loading': {
        'pt': 'Carregando...',
        'en': 'Loading...'
    },
    'offline_mode': {
        'pt': '⚫ MODO OFFLINE',
        'en': '⚫ OFFLINE MODE'
    },
    'system_cached': {
        'pt': '🟢 SISTEMA TOTALMENTE ARMAZENADO',
        'en': '🟢 SYSTEM FULLY CACHED'
    }
    // Add more translations as needed
};

// PWA Installation
const PWAInstaller = {
    deferredPrompt: null,
    
    /**
     * Initialize PWA installation features
     */
    init() {
        // Store the install prompt for later use
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
            this.deferredPrompt = null;
            console.log('PWA was installed');
        });
        
        // Check if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running as PWA');
        }
    },
    
    /**
     * Show the install button
     */
    showInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn && this.deferredPrompt) {
            installBtn.classList.remove('hidden');
        }
    },
    
    /**
     * Hide the install button
     */
    hideInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.classList.add('hidden');
        }
    },
    
    /**
     * Trigger the installation prompt
     */
    promptInstall() {
        if (!this.deferredPrompt) {
            console.log('No installation prompt available');
            return;
        }
        
        // Show the installation prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        this.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            this.deferredPrompt = null;
        });
    }
};

// Offline Status Management
const OfflineManager = {
    /**
     * Initialize offline status detection
     */
    init() {
        this.updateOfflineStatus();
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.updateOfflineStatus());
        window.addEventListener('offline', () => this.updateOfflineStatus());
        
        // Check if service worker is controlling the page
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            this.checkCacheStatus();
        }
    },
    
    /**
     * Update the offline status indicator
     */
    updateOfflineStatus() {
        const offlineHeader = document.getElementById('offline-header');
        if (!offlineHeader) return;
        
        const isOffline = !navigator.onLine;
        
        if (isOffline) {
            const currentLang = localStorage.getItem('technosutra-lang') || 'pt';
            offlineHeader.textContent = translations['offline_mode'][currentLang];
            offlineHeader.classList.add('show');
        } else {
            offlineHeader.classList.remove('show');
        }
    },
    
    /**
     * Check if all required assets are cached
     */
    checkCacheStatus() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'is-fully-cached' });
            
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data.action === 'is-fully-cached-reply' && event.data.isFullyCached) {
                    const offlineHeader = document.getElementById('offline-header');
                    if (offlineHeader) {
                        const currentLang = localStorage.getItem('technosutra-lang') || 'pt';
                        offlineHeader.textContent = translations['system_cached'][currentLang];
                        offlineHeader.classList.add('show');
                    }
                }
            });
        }
    }
};

// UI Utilities
const UIUtils = {
    /**
     * Scroll to top of the page with smooth animation
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },
    
    /**
     * Share the current page
     */
    sharePage() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            })
            .catch(error => console.log('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            this.copyToClipboard(window.location.href);
            this.showToast('Link copiado para a área de transferência');
        }
    },
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    },
    
    /**
     * Show a toast message
     * @param {string} message - Message to display
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, duration = 3000) {
        let toast = document.getElementById('toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = 'rgba(0, 0, 0, 0.8)';
            toast.style.color = 'white';
            toast.style.padding = '12px 24px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '10000';
            toast.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, duration);
    }
};

// Performance Monitoring
const PerformanceMonitor = {
    startTime: null,
    
    /**
     * Start performance monitoring
     */
    start() {
        this.startTime = performance.now();
    },
    
    /**
     * End performance monitoring and log results
     * @param {string} label - Label for the performance measurement
     */
    end(label = 'Operation') {
        if (!this.startTime) return;
        
        const endTime = performance.now();
        const duration = endTime - this.startTime;
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
        
        this.startTime = null;
    }
};

// Initialize utilities when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    LanguageManager.init();
    PWAInstaller.init();
    OfflineManager.init();
});

// Export utilities for use in other scripts
window.ThemeManager = ThemeManager;
window.LanguageManager = LanguageManager;
window.PWAInstaller = PWAInstaller;
window.OfflineManager = OfflineManager;
window.UIUtils = UIUtils;
window.PerformanceMonitor = PerformanceMonitor;

// Global function for theme toggling (for inline onclick handlers)
function toggleTheme() {
    ThemeManager.toggle();
}

// Global function for language toggling (for inline onclick handlers)
function toggleLanguage() {
    LanguageManager.toggle();
}

// Global function for scrolling to top (for inline onclick handlers)
function scrollToTop() {
    UIUtils.scrollToTop();
}

// Global function for sharing (for inline onclick handlers)
function shareGallery() {
    UIUtils.sharePage();
}