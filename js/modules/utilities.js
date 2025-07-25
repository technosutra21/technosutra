/**
 * Utilities Module
 * Common utility functions for Techno Sutra AR
 */

export class Utilities {
    static isDeviceSupported() {
        return this.isWebXRSupported() || this.isARQuickLookSupported();
    }

    static isWebXRSupported() {
        return 'xr' in navigator && 'isSessionSupported' in navigator.xr;
    }

    static isARQuickLookSupported() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    static async checkARSupport() {
        try {
            if ('xr' in navigator) {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                return isSupported;
            }
            return this.isARQuickLookSupported();
        } catch (error) {
            console.warn('AR support check failed:', error);
            return false;
        }
    }

    static getDeviceInfo() {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isAndroid = /Android/.test(userAgent);
        const isMobile = isIOS || isAndroid || /Mobi|Mobile/i.test(userAgent);
        
        return {
            isIOS,
            isAndroid,
            isMobile,
            userAgent,
            supportsWebXR: this.isWebXRSupported(),
            supportsARQuickLook: this.isARQuickLookSupported()
        };
    }

    static formatChapterNumber(num) {
        return num.toString().padStart(2, '0');
    }

    static validateChapterNumber(num) {
        const chapter = parseInt(num);
        return !isNaN(chapter) && chapter >= 1 && chapter <= 56;
    }

    static getModelPath(chapterNumber) {
        if (!this.validateChapterNumber(chapterNumber)) {
            throw new Error(`Invalid chapter number: ${chapterNumber}`);
        }
        return `./modelo${chapterNumber}.glb`;
    }

    static getUSDZPath(chapterNumber) {
        if (!this.validateChapterNumber(chapterNumber)) {
            throw new Error(`Invalid chapter number: ${chapterNumber}`);
        }
        return `./usdz/modelo${chapterNumber}.usdz`;
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

    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    static updateUrlParam(key, value, pushState = false) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        
        if (pushState) {
            history.pushState({}, '', url);
        } else {
            history.replaceState({}, '', url);
        }
    }

    static showStatus(message, type = 'info', duration = 3000) {
        const statusElement = document.getElementById('status-message') || this.createStatusElement();
        
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, duration);
        }
    }

    static createStatusElement() {
        const element = document.createElement('div');
        element.id = 'status-message';
        element.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            display: none;
            max-width: 90%;
            text-align: center;
        `;
        
        document.body.appendChild(element);
        return element;
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static async checkModelExists(chapterNumber) {
        try {
            const response = await fetch(this.getModelPath(chapterNumber), { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    static async batchCheckModels(chapterNumbers) {
        const promises = chapterNumbers.map(async (chapter) => ({
            chapter,
            exists: await this.checkModelExists(chapter)
        }));
        
        return Promise.all(promises);
    }
}

export default Utilities;
