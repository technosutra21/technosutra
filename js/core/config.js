/**
 * Configuration Module for Techno Sutra AR
 * Centralized configuration management with modern ES6+ patterns
 * @module Config
 */

export class Config {
    static #instance = null;
    #config = null;
    #observers = new Set();

    constructor() {
        if (Config.#instance) {
            return Config.#instance;
        }
        Config.#instance = this;
        this.#initializeConfig();
    }

    /**
     * Initialize default configuration
     * @private
     */
    #initializeConfig() {
        this.#config = {
            // AR Settings
            ar: {
                scale: 2.0,
                modes: ['webxr', 'scene-viewer', 'quick-look'],
                placement: 'floor',
                autoRotate: true,
                rotationSpeed: '30deg'
            },
            
            // Model Settings
            models: {
                basePath: './',
                format: 'glb',
                totalCount: 56,
                loadTimeout: 5000,
                batchSize: 3
            },
            
            // Performance Settings
            performance: {
                enableLazyLoading: true,
                preloadCount: 3,
                cacheStrategy: 'network-first',
                maxCacheSize: 100 * 1024 * 1024, // 100MB
                enableMonitoring: process.env.NODE_ENV !== 'production'
            },
            
            // UI Settings
            ui: {
                theme: 'dark',
                animation: {
                    duration: 300,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                },
                gallery: {
                    initialLoadCount: 12,
                    loadMoreIncrement: 12
                }
            },
            
            // API Settings
            api: {
                baseUrl: window.location.origin,
                timeout: 10000,
                retryAttempts: 3
            },
            
            // Debug Settings
            debug: {
                enableLogging: process.env.NODE_ENV === 'development',
                logLevel: 'info',
                showPerformanceOverlay: false
            }
        };
    }

    /**
     * Load configuration from external source
     * @param {string} configPath - Path to configuration file
     * @returns {Promise<void>}
     */
    async loadConfig(configPath = '/config.json') {
        try {
            const response = await fetch(configPath, {
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Config load failed: ${response.status}`);
            }

            const externalConfig = await response.json();
            this.#mergeConfig(externalConfig);
            this.#notifyObservers('config-loaded', this.#config);
            
        } catch (error) {
            console.warn('[Config] Failed to load external config, using defaults:', error.message);
        }
    }

    /**
     * Merge external configuration with defaults
     * @param {Object} externalConfig - External configuration object
     * @private
     */
    #mergeConfig(externalConfig) {
        this.#config = this.#deepMerge(this.#config, externalConfig);
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     * @private
     */
    #deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.#isObject(source[key]) && this.#isObject(target[key])) {
                    result[key] = this.#deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * Check if value is an object
     * @param {*} value - Value to check
     * @returns {boolean}
     * @private
     */
    #isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * Get configuration value using dot notation
     * @param {string} path - Configuration path (e.g., 'ar.scale')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.#config;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }

        return current;
    }

    /**
     * Set configuration value using dot notation
     * @param {string} path - Configuration path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.#config;

        // Navigate to parent object
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        // Set the value
        current[lastKey] = value;
        
        // Notify observers
        this.#notifyObservers('config-changed', { path, value });
    }

    /**
     * Get entire configuration object
     * @returns {Object} Configuration object
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.#config));
    }

    /**
     * Subscribe to configuration changes
     * @param {Function} observer - Observer function
     * @returns {Function} Unsubscribe function
     */
    subscribe(observer) {
        this.#observers.add(observer);
        
        return () => {
            this.#observers.delete(observer);
        };
    }

    /**
     * Notify all observers of changes
     * @param {string} event - Event type
     * @param {*} data - Event data
     * @private
     */
    #notifyObservers(event, data) {
        this.#observers.forEach(observer => {
            try {
                observer(event, data);
            } catch (error) {
                console.error('[Config] Observer error:', error);
            }
        });
    }

    /**
     * Validate configuration
     * @param {Object} config - Configuration to validate
     * @returns {boolean} Is valid configuration
     */
    validate(config = this.#config) {
        const required = ['ar', 'models', 'performance', 'ui'];
        
        for (const key of required) {
            if (!(key in config)) {
                console.error(`[Config] Missing required configuration: ${key}`);
                return false;
            }
        }

        // Validate AR settings
        if (config.ar.scale <= 0) {
            console.error('[Config] AR scale must be positive');
            return false;
        }

        // Validate model settings
        if (config.models.totalCount <= 0) {
            console.error('[Config] Model count must be positive');
            return false;
        }

        return true;
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.#initializeConfig();
        this.#notifyObservers('config-reset', this.#config);
    }

    /**
     * Export configuration to JSON
     * @returns {string} JSON configuration
     */
    export() {
        return JSON.stringify(this.#config, null, 2);
    }

    /**
     * Import configuration from JSON
     * @param {string|Object} configData - JSON string or object
     */
    import(configData) {
        try {
            const config = typeof configData === 'string' 
                ? JSON.parse(configData) 
                : configData;
                
            if (this.validate(config)) {
                this.#config = config;
                this.#notifyObservers('config-imported', this.#config);
            } else {
                throw new Error('Invalid configuration');
            }
        } catch (error) {
            console.error('[Config] Import failed:', error);
            throw error;
        }
    }
}

// Create singleton instance
const config = new Config();

// Export singleton instance as default
export default config;

// Export specific configuration getters for convenience
export const getARConfig = () => config.get('ar');
export const getModelConfig = () => config.get('models');
export const getPerformanceConfig = () => config.get('performance');
export const getUIConfig = () => config.get('ui');
export const getDebugConfig = () => config.get('debug');
