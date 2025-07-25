/**
 * Model Manager Module
 * Handles 3D model loading, caching, and management for Techno Sutra AR
 */

import Utilities from './utilities.js';
import configManager from './config-manager.js';
import errorHandler from './error-handler.js';

export class ModelManager {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.availableModels = new Set();
        this.config = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        this.config = await configManager.init();
        await this.detectAvailableModels();
        this.initialized = true;
    }

    async detectAvailableModels() {
        try {
            const modelConfig = configManager.getModelConfig();
            const { total_chapters, batch_detection_size, detection_timeout_ms } = modelConfig;
            
            // Show progress
            Utilities.showStatus('Detectando modelos disponíveis...', 'info', 0);
            
            // Batch detection for better performance
            const batches = this.createBatches(
                Array.from({ length: total_chapters }, (_, i) => i + 1),
                batch_detection_size
            );
            
            let detected = 0;
            for (const batch of batches) {
                const results = await Promise.allSettled(
                    batch.map(chapter => this.checkModelWithTimeout(chapter, detection_timeout_ms))
                );
                
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        this.availableModels.add(batch[index]);
                        detected++;
                    }
                });
                
                // Update progress
                const progress = Math.round((detected / total_chapters) * 100);
                Utilities.showStatus(`Detectados ${detected}/${total_chapters} modelos (${progress}%)`, 'info', 0);
                
                // Small delay between batches to prevent overwhelming
                await Utilities.delay(100);
            }
            
            // Cache the results
            this.cacheAvailableModels();
            
            Utilities.showStatus(`${detected} modelos disponíveis`, 'success', 2000);
            
        } catch (error) {
            errorHandler.logError(error, 'Model detection');
            Utilities.showStatus('Erro na detecção de modelos', 'error', 3000);
        }
    }

    async checkModelWithTimeout(chapterNumber, timeout) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => resolve(false), timeout);
            
            try {
                const exists = await Utilities.checkModelExists(chapterNumber);
                clearTimeout(timeoutId);
                resolve(exists);
            } catch {
                clearTimeout(timeoutId);
                resolve(false);
            }
        });
    }

    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    cacheAvailableModels() {
        const cacheKey = configManager.get('cache.local_storage.model_list_key') || 'technosutra_available_models';
        const cacheData = {
            models: Array.from(this.availableModels),
            timestamp: Date.now(),
            version: configManager.get('project.version') || '1.0.0'
        };
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache available models:', error);
        }
    }

    loadCachedAvailableModels() {
        const cacheKey = configManager.get('cache.local_storage.model_list_key') || 'technosutra_available_models';
        const cacheHours = configManager.get('models.cache_duration_hours') || 24;
        
        try {
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return false;
            
            const data = JSON.parse(cached);
            const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
            
            if (ageHours < cacheHours && data.version === configManager.get('project.version')) {
                this.availableModels = new Set(data.models);
                return true;
            }
        } catch (error) {
            console.warn('Failed to load cached models:', error);
        }
        
        return false;
    }

    isModelAvailable(chapterNumber) {
        return this.availableModels.has(chapterNumber);
    }

    getAvailableModels() {
        return Array.from(this.availableModels).sort((a, b) => a - b);
    }

    async loadModel(chapterNumber, onProgress = null) {
        if (!Utilities.validateChapterNumber(chapterNumber)) {
            throw new Error(`Invalid chapter number: ${chapterNumber}`);
        }

        // Check if already loading
        if (this.loadingPromises.has(chapterNumber)) {
            return this.loadingPromises.get(chapterNumber);
        }

        // Check cache first
        if (this.cache.has(chapterNumber)) {
            return this.cache.get(chapterNumber);
        }

        // Check if model is available
        if (!this.isModelAvailable(chapterNumber)) {
            throw new Error(`Model for chapter ${chapterNumber} is not available`);
        }

        const loadPromise = this.performModelLoad(chapterNumber, onProgress);
        this.loadingPromises.set(chapterNumber, loadPromise);

        try {
            const result = await loadPromise;
            this.cache.set(chapterNumber, result);
            return result;
        } finally {
            this.loadingPromises.delete(chapterNumber);
        }
    }

    async performModelLoad(chapterNumber, onProgress) {
        const modelPath = Utilities.getModelPath(chapterNumber);
        
        try {
            if (onProgress) {
                onProgress({ chapter: chapterNumber, status: 'loading', progress: 0 });
            }

            const response = await fetch(modelPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load model: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (onProgress) {
                onProgress({ chapter: chapterNumber, status: 'loaded', progress: 100 });
            }

            return {
                url,
                blob,
                size: blob.size,
                type: blob.type,
                chapter: chapterNumber,
                loadedAt: Date.now()
            };

        } catch (error) {
            if (onProgress) {
                onProgress({ chapter: chapterNumber, status: 'error', error: error.message });
            }
            errorHandler.showModelError(chapterNumber, error);
            throw error;
        }
    }

    async preloadModels(chapterNumbers, onProgress = null) {
        const toLoad = chapterNumbers.filter(chapter => 
            !this.cache.has(chapter) && this.isModelAvailable(chapter)
        );

        if (toLoad.length === 0) return [];

        const results = [];
        let loaded = 0;

        for (const chapter of toLoad) {
            try {
                const model = await this.loadModel(chapter, (progress) => {
                    if (onProgress) {
                        onProgress({
                            ...progress,
                            totalModels: toLoad.length,
                            loadedModels: loaded,
                            overallProgress: Math.round((loaded / toLoad.length) * 100)
                        });
                    }
                });
                
                results.push({ chapter, model, success: true });
                loaded++;
                
            } catch (error) {
                results.push({ chapter, error: error.message, success: false });
                errorHandler.logError(error, `Preload model ${chapter}`);
            }
        }

        return results;
    }

    getModelInfo(chapterNumber) {
        const cached = this.cache.get(chapterNumber);
        if (!cached) return null;

        return {
            chapter: chapterNumber,
            size: Utilities.formatFileSize(cached.size),
            loadedAt: new Date(cached.loadedAt).toLocaleString(),
            available: this.isModelAvailable(chapterNumber),
            cached: true
        };
    }

    clearCache() {
        // Revoke object URLs to free memory
        for (const [chapter, model] of this.cache) {
            if (model.url) {
                URL.revokeObjectURL(model.url);
            }
        }
        
        this.cache.clear();
        this.loadingPromises.clear();
    }

    getCacheStats() {
        const totalSize = Array.from(this.cache.values())
            .reduce((sum, model) => sum + (model.size || 0), 0);
        
        return {
            cachedModels: this.cache.size,
            totalSize: Utilities.formatFileSize(totalSize),
            availableModels: this.availableModels.size,
            loadingPromises: this.loadingPromises.size
        };
    }

    getNextAvailableChapter(currentChapter, direction = 1) {
        const available = this.getAvailableModels();
        const currentIndex = available.indexOf(currentChapter);
        
        if (currentIndex === -1) {
            return available[0] || null;
        }
        
        const nextIndex = currentIndex + direction;
        
        if (nextIndex < 0) {
            return available[available.length - 1];
        }
        
        if (nextIndex >= available.length) {
            return available[0];
        }
        
        return available[nextIndex];
    }

    getPreviousAvailableChapter(currentChapter) {
        return this.getNextAvailableChapter(currentChapter, -1);
    }
}

// Export singleton instance
const modelManager = new ModelManager();
export default modelManager;
