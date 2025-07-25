/**
 * Service Worker Manager for Techno Sutra AR
 * Modern service worker management with proper error handling and lifecycle management
 * @module ServiceWorkerManager
 */

import logger from '../core/logger.js';

const log = logger.createContext('ServiceWorker');

/**
 * Service Worker Manager class
 */
export class ServiceWorkerManager {
    #registration = null;
    #isSupported = false;
    #updateAvailable = false;
    #eventListeners = new Map();

    constructor() {
        this.#isSupported = 'serviceWorker' in navigator;
        
        if (this.#isSupported) {
            this.#initialize();
        } else {
            log.warn('Service Worker not supported in this browser');
        }
    }

    /**
     * Initialize service worker
     * @private
     */
    async #initialize() {
        try {
            log.info('Registering service worker...');
            
            // Register service worker
            this.#registration = await navigator.serviceWorker.register('/sw-modern.js', {
                scope: '/'
            });

            // Setup event listeners
            this.#setupEventListeners();
            
            // Check for updates
            await this.#checkForUpdates();
            
            log.info('✅ Service worker registered successfully');

        } catch (error) {
            log.error('❌ Service worker registration failed:', error);
        }
    }

    /**
     * Setup service worker event listeners
     * @private
     */
    #setupEventListeners() {
        if (!this.#registration) return;

        // Listen for service worker state changes
        this.#registration.addEventListener('updatefound', () => {
            log.info('Service worker update found');
            this.#handleUpdateFound();
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.#handleMessage(event.data);
        });

        // Listen for controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            log.info('Service worker controller changed');
            this.#emit('controller-change');
        });
    }

    /**
     * Handle service worker update found
     * @private
     */
    #handleUpdateFound() {
        const newWorker = this.#registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                log.info('New service worker installed, update available');
                this.#updateAvailable = true;
                this.#emit('update-available');
            }
        });
    }

    /**
     * Handle service worker messages
     * @param {*} data - Message data
     * @private
     */
    #handleMessage(data) {
        if (!data || typeof data !== 'object') return;

        switch (data.type) {
            case 'CACHE_UPDATED':
                log.info('Cache updated:', data.payload);
                this.#emit('cache-updated', data.payload);
                break;
                
            case 'OFFLINE_READY':
                log.info('Application ready for offline use');
                this.#emit('offline-ready');
                break;
                
            case 'SYNC_COMPLETE':
                log.info('Background sync completed');
                this.#emit('sync-complete', data.payload);
                break;
                
            default:
                log.debug('Unknown service worker message:', data);
        }
    }

    /**
     * Check for service worker updates
     * @private
     */
    async #checkForUpdates() {
        if (!this.#registration) return;

        try {
            await this.#registration.update();
            log.debug('Checked for service worker updates');
        } catch (error) {
            log.warn('Failed to check for updates:', error);
        }
    }

    /**
     * Apply pending update
     */
    async applyUpdate() {
        if (!this.#updateAvailable || !this.#registration) {
            log.warn('No update available to apply');
            return false;
        }

        try {
            const waitingWorker = this.#registration.waiting;
            
            if (waitingWorker) {
                // Tell the waiting service worker to skip waiting
                waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                
                // Wait for controller change
                await new Promise((resolve) => {
                    const handleControllerChange = () => {
                        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
                        resolve();
                    };
                    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
                });

                log.info('✅ Service worker update applied');
                this.#updateAvailable = false;
                this.#emit('update-applied');
                
                return true;
            }
        } catch (error) {
            log.error('Failed to apply update:', error);
        }

        return false;
    }

    /**
     * Send message to service worker
     * @param {Object} message - Message to send
     * @returns {Promise<*>} Response from service worker
     */
    async sendMessage(message) {
        if (!navigator.serviceWorker.controller) {
            throw new Error('No service worker controller available');
        }

        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data);
                }
            };

            navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
        });
    }

    /**
     * Cache specific resource
     * @param {string} url - URL to cache
     * @returns {Promise<boolean>} Success status
     */
    async cacheResource(url) {
        try {
            await this.sendMessage({
                type: 'CACHE_RESOURCE',
                url
            });
            
            log.info(`Resource cached: ${url}`);
            return true;
        } catch (error) {
            log.error(`Failed to cache resource ${url}:`, error);
            return false;
        }
    }

    /**
     * Pre-cache model
     * @param {string|number} modelId - Model identifier
     * @returns {Promise<boolean>} Success status
     */
    async cacheModel(modelId) {
        const modelUrl = `/modelo${modelId}.glb`;
        return this.cacheResource(modelUrl);
    }

    /**
     * Get cache information
     * @returns {Promise<Object>} Cache information
     */
    async getCacheInfo() {
        try {
            const response = await this.sendMessage({
                type: 'GET_CACHE_INFO'
            });
            
            return response;
        } catch (error) {
            log.error('Failed to get cache info:', error);
            return null;
        }
    }

    /**
     * Clear cache
     * @param {string} [cacheName] - Specific cache to clear
     * @returns {Promise<boolean>} Success status
     */
    async clearCache(cacheName = null) {
        try {
            await this.sendMessage({
                type: 'CLEAR_CACHE',
                cacheName
            });
            
            log.info(cacheName ? `Cache cleared: ${cacheName}` : 'All caches cleared');
            return true;
        } catch (error) {
            log.error('Failed to clear cache:', error);
            return false;
        }
    }

    /**
     * Check if resource is cached
     * @param {string} url - URL to check
     * @returns {Promise<boolean>} True if cached
     */
    async isResourceCached(url) {
        try {
            const response = await this.sendMessage({
                type: 'IS_CACHED',
                url
            });
            
            return response.cached;
        } catch (error) {
            log.debug(`Failed to check cache status for ${url}:`, error);
            return false;
        }
    }

    /**
     * Get offline status
     * @returns {boolean} True if offline
     */
    get isOffline() {
        return !navigator.onLine;
    }

    /**
     * Check if service worker is supported
     * @returns {boolean} True if supported
     */
    get isSupported() {
        return this.#isSupported;
    }

    /**
     * Check if service worker is registered
     * @returns {boolean} True if registered
     */
    get isRegistered() {
        return this.#registration !== null;
    }

    /**
     * Check if update is available
     * @returns {boolean} True if update available
     */
    get isUpdateAvailable() {
        return this.#updateAvailable;
    }

    /**
     * Get registration object
     * @returns {ServiceWorkerRegistration|null} Registration object
     */
    get registration() {
        return this.#registration;
    }

    /**
     * Event listener management
     */

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener
     */
    addEventListener(event, listener) {
        if (!this.#eventListeners.has(event)) {
            this.#eventListeners.set(event, new Set());
        }
        this.#eventListeners.get(event).add(listener);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener
     */
    removeEventListener(event, listener) {
        const listeners = this.#eventListeners.get(event);
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this.#eventListeners.delete(event);
            }
        }
    }

    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {*} [data] - Event data
     * @private
     */
    #emit(event, data = null) {
        const listeners = this.#eventListeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    log.error(`Event listener error for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Unregister service worker
     */
    async unregister() {
        if (!this.#registration) {
            log.warn('No service worker registered');
            return false;
        }

        try {
            const result = await this.#registration.unregister();
            
            if (result) {
                log.info('Service worker unregistered successfully');
                this.#registration = null;
                this.#updateAvailable = false;
                this.#eventListeners.clear();
            }
            
            return result;
        } catch (error) {
            log.error('Failed to unregister service worker:', error);
            return false;
        }
    }

    /**
     * Get service worker status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            supported: this.#isSupported,
            registered: this.isRegistered,
            updateAvailable: this.#updateAvailable,
            offline: this.isOffline,
            controller: navigator.serviceWorker.controller !== null,
            state: this.#registration?.active?.state || 'unknown'
        };
    }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Export singleton
export default serviceWorkerManager;

// Convenience functions
export const cacheModel = (modelId) => serviceWorkerManager.cacheModel(modelId);
export const isResourceCached = (url) => serviceWorkerManager.isResourceCached(url);
export const applyUpdate = () => serviceWorkerManager.applyUpdate();
export const getStatus = () => serviceWorkerManager.getStatus();
