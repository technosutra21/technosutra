/**
 * Configuration Manager Module
 * Centralized configuration management for Techno Sutra AR
 */

class ConfigManager {
    constructor() {
        this.config = null;
        this.loaded = false;
    }

    async init() {
        if (this.loaded) return this.config;
        
        try {
            const response = await fetch('./config.json');
            this.config = await response.json();
            this.loaded = true;
            return this.config;
        } catch (error) {
            console.error('Failed to load configuration:', error);
            this.config = this.getDefaultConfig();
            this.loaded = true;
            return this.config;
        }
    }

    getDefaultConfig() {
        return {
            models: {
                total_chapters: 56,
                model_prefix: "modelo",
                model_extension: ".glb",
                cache_duration_hours: 24,
                batch_detection_size: 8,
                detection_timeout_ms: 5000
            },
            ar: {
                default_scale: "2.0 2.0 2.0",
                camera_orbit: "0deg 70deg 2.5m",
                field_of_view: "45deg",
                min_camera_orbit: "auto auto 1.2m",
                max_camera_orbit: "auto auto 5m",
                rotation_speed: "30deg",
                shadow_intensity: "1",
                environment: "neutral"
            },
            ui: {
                theme: {
                    primary_color: "#7877c6",
                    background_dark: "#000000",
                    background_light: "#f8fafc",
                    text_primary: "#e5e7eb",
                    text_secondary: "#9ca3af",
                    border_color: "rgba(120, 119, 198, 0.1)"
                }
            },
            wix_integration: {
                collection_name: "Personagens",
                rate_limits: {
                    requests_per_minute: 500,
                    requests_per_site_minute: 100,
                    burst_limit_per_second: 10
                }
            }
        };
    }

    get(key) {
        return this.getNestedValue(this.config, key);
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    getTheme() {
        return this.get('ui.theme') || this.getDefaultConfig().ui.theme;
    }

    getModelConfig() {
        return this.get('models') || this.getDefaultConfig().models;
    }

    getARConfig() {
        return this.get('ar') || this.getDefaultConfig().ar;
    }

    getWixConfig() {
        return this.get('wix_integration') || this.getDefaultConfig().wix_integration;
    }

    getCacheConfig() {
        return this.get('cache') || {};
    }
}

// Export singleton instance
const configManager = new ConfigManager();
export default configManager;
