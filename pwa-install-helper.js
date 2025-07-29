// PWA Installation Helper - Ensures Complete Offline Functionality
// This script manages PWA installation and triggers complete offline caching

class PWAInstallHelper {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.offlineCachingComplete = false;
        this.init();
    }

    init() {
        // Listen for PWA installation events
        this.setupInstallationHandlers();
        
        // Listen for service worker messages
        this.setupServiceWorkerCommunication();
        
        // Check if already installed
        this.checkInstallationStatus();
        
        // Setup install button if present
        this.setupInstallButton();
    }

    setupInstallationHandlers() {
        // Capture the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('💡 PWA install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', (e) => {
            console.log('🎉 PWA installed successfully!');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showOfflineCachingNotification();
            
            // Trigger complete offline caching
            this.triggerCompleteOfflineCaching();
        });
    }

    setupServiceWorkerCommunication() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, message } = event.data;
                
                switch (type) {
                    case 'OFFLINE_READY':
                        console.log('✅ Complete offline caching finished!');
                        this.offlineCachingComplete = true;
                        this.showOfflineReadyNotification(message);
                        break;
                        
                    case 'COMPLETE_CACHE_FINISHED':
                        console.log('📦 Manual offline caching completed');
                        this.showCacheCompleteNotification(event.data);
                        break;
                }
            });
        }
    }

    checkInstallationStatus() {
        // Check if running in standalone mode (installed as PWA)
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            console.log('📱 Running as installed PWA');
            this.isInstalled = true;
            this.hideInstallButton();
            
            // Trigger complete offline caching if not already done
            setTimeout(() => {
                if (!this.offlineCachingComplete) {
                    this.triggerCompleteOfflineCaching();
                }
            }, 2000);
        }
    }

    setupInstallButton() {
        const installButton = document.getElementById('installPWA') || 
                             document.querySelector('.install-btn') ||
                             document.querySelector('[data-install-pwa]');
        
        if (installButton) {
            installButton.addEventListener('click', () => {
                this.promptInstall();
            });
        }
    }

    async promptInstall() {
        if (this.deferredPrompt) {
            try {
                // Show the install prompt
                this.deferredPrompt.prompt();
                
                // Wait for the user's response
                const choiceResult = await this.deferredPrompt.userChoice;
                
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ User accepted PWA installation');
                    
                    // Show preparing notification
                    this.showPreparingOfflineNotification();
                } else {
                    console.log('❌ User dismissed PWA installation');
                }
                
                // Reset the deferred prompt
                this.deferredPrompt = null;
                
            } catch (error) {
                console.error('❌ Error during PWA installation:', error);
            }
        } else {
            console.log('💡 PWA installation prompt not available');
            
            // Manual installation instructions
            this.showManualInstallInstructions();
        }
    }

    triggerCompleteOfflineCaching() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            console.log('🚀 Triggering complete offline caching...');
            
            // Send message to service worker to start complete caching
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                const { type, success, message } = event.data;
                if (type === 'COMPLETE_CACHE_FINISHED') {
                    console.log(`📦 Complete caching finished: ${success ? 'Success' : 'Partial'}`);
                    this.showCacheCompleteNotification({ success, message });
                }
            };
            
            navigator.serviceWorker.controller.postMessage({
                type: 'FORCE_COMPLETE_CACHE'
            }, [messageChannel.port2]);
        }
    }

    showInstallButton() {
        const installButton = document.getElementById('installPWA') || 
                             document.querySelector('.install-btn');
        
        if (installButton) {
            installButton.style.display = 'inline-flex';
            installButton.style.opacity = '1';
        }
    }

    hideInstallButton() {
        const installButton = document.getElementById('installPWA') || 
                             document.querySelector('.install-btn');
        
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    showPreparingOfflineNotification() {
        this.showNotification(
            '🚀 Preparing Offline Experience',
            'Downloading content for complete offline functionality...',
            'info',
            0 // Don't auto-hide
        );
    }

    showOfflineCachingNotification() {
        this.showNotification(
            '📦 Downloading Content',
            'Caching all models and resources for offline use. This may take a few minutes...',
            'info',
            10000
        );
    }

    showOfflineReadyNotification(message) {
        this.showNotification(
            '✅ Offline Ready!',
            message || 'App is now fully functional offline with all content cached!',
            'success',
            8000
        );
    }

    showCacheCompleteNotification({ success, message }) {
        this.showNotification(
            success ? '✅ Caching Complete' : '⚠️ Caching Partial',
            message || (success ? 'All content cached successfully!' : 'Some content failed to cache'),
            success ? 'success' : 'warning',
            6000
        );
    }

    showManualInstallInstructions() {
        const instructions = this.getManualInstallInstructions();
        this.showNotification(
            '📱 Install App',
            instructions,
            'info',
            15000
        );
    }

    getManualInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS) {
            return 'Tap the Share button in Safari, then "Add to Home Screen" to install the app.';
        } else if (isAndroid) {
            return 'Tap the menu button in your browser and select "Add to Home Screen" or "Install App".';
        } else {
            return 'Look for an install icon in your browser\'s address bar, or check the browser menu for "Install App" option.';
        }
    }

    showNotification(title, message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `pwa-notification pwa-notification-${type}`;
        notification.innerHTML = `
            <div class="pwa-notification-header">
                <strong>${title}</strong>
                <button class="pwa-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="pwa-notification-message">${message}</div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            border: 2px solid ${this.getNotificationColor(type)};
            border-radius: 12px;
            padding: 16px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .pwa-notification-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .pwa-notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .pwa-notification-message {
                font-size: 14px;
                line-height: 1.4;
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideIn 0.3s ease-out reverse';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    getNotificationColor(type) {
        const colors = {
            info: '#00f4ff',
            success: '#00ff88',
            warning: '#ffaa00',
            error: '#ff4444'
        };
        return colors[type] || colors.info;
    }

    // Public method to manually trigger complete caching
    forceCompleteOfflineCaching() {
        console.log('🔄 Manually triggering complete offline caching...');
        this.showPreparingOfflineNotification();
        this.triggerCompleteOfflineCaching();
    }

    // Public method to check cache status
    async getCacheStatus() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                
                messageChannel.port1.onmessage = (event) => {
                    if (event.data.type === 'CACHE_STATS') {
                        resolve(event.data.data);
                    }
                };
                
                navigator.serviceWorker.controller.postMessage({
                    type: 'GET_CACHE_STATS'
                }, [messageChannel.port2]);
            });
        }
        return {};
    }
}

// Initialize PWA Install Helper when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaInstallHelper = new PWAInstallHelper();
    });
} else {
    window.pwaInstallHelper = new PWAInstallHelper();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAInstallHelper;
}
