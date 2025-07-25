/**
 * Error Handler Module
 * Centralized error handling and user feedback for Techno Sutra AR
 */

import Utilities from './utilities.js';

export class ErrorHandler {
    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 50;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
    }

    logError(error, context = '', severity = 'error') {
        const errorData = {
            timestamp: new Date().toISOString(),
            message: error.message || error.toString(),
            context,
            severity,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errorHistory.push(errorData);
        
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }

        console.error(`[${severity.toUpperCase()}] ${context}:`, error);
        
        if (severity === 'critical') {
            this.showCriticalError(error, context);
        }
    }

    showError(message, type = 'error', autoHide = true) {
        const errorElement = this.getOrCreateErrorElement();
        
        errorElement.innerHTML = `
            <div class="error-content">
                <span class="error-icon">${this.getErrorIcon(type)}</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
        `;
        
        errorElement.className = `error-display ${type}`;
        errorElement.style.display = 'block';
        
        if (autoHide) {
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    showCriticalError(error, context) {
        const errorContainer = this.getOrCreateErrorElement();
        
        errorContainer.innerHTML = `
            <div class="critical-error">
                <h3>Erro Crítico</h3>
                <p>${error.message}</p>
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn-retry">Recarregar</button>
                    <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" class="btn-dismiss">Dispensar</button>
                </div>
            </div>
        `;
        
        errorContainer.className = 'error-display critical';
        errorContainer.style.display = 'block';
    }

    showModelError(chapterNumber, error) {
        const message = `Erro ao carregar modelo do capítulo ${chapterNumber}: ${error.message}`;
        this.showError(message, 'warning');
        this.logError(error, `Model loading - Chapter ${chapterNumber}`, 'warning');
    }

    showNetworkError(operation, error) {
        const message = `Erro de rede durante ${operation}. Verifique sua conexão.`;
        this.showError(message, 'network');
        this.logError(error, `Network - ${operation}`, 'error');
    }

    showARError(error) {
        const message = 'Erro ao inicializar AR. Verifique se seu dispositivo suporta realidade aumentada.';
        this.showError(message, 'ar');
        this.logError(error, 'AR Initialization', 'error');
    }

    async retryOperation(operationKey, operation, context = '') {
        const attempts = this.retryAttempts.get(operationKey) || 0;
        
        if (attempts >= this.maxRetries) {
            throw new Error(`Operação falhou após ${this.maxRetries} tentativas: ${operationKey}`);
        }
        
        try {
            this.retryAttempts.set(operationKey, attempts + 1);
            const result = await operation();
            this.retryAttempts.delete(operationKey);
            return result;
        } catch (error) {
            this.logError(error, `Retry ${attempts + 1}/${this.maxRetries} - ${context}`);
            
            if (attempts + 1 >= this.maxRetries) {
                this.retryAttempts.delete(operationKey);
                throw error;
            }
            
            await Utilities.delay(1000 * Math.pow(2, attempts)); // Exponential backoff
            return this.retryOperation(operationKey, operation, context);
        }
    }

    getOrCreateErrorElement() {
        let element = document.getElementById('error-display');
        
        if (!element) {
            element = document.createElement('div');
            element.id = 'error-display';
            element.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                max-width: 90%;
                min-width: 300px;
                z-index: 10000;
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            `;
            
            document.body.appendChild(element);
            this.addErrorStyles();
        }
        
        return element;
    }

    addErrorStyles() {
        if (document.getElementById('error-handler-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'error-handler-styles';
        styles.textContent = `
            .error-display {
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                animation: slideIn 0.3s ease-out;
            }
            
            .error-display.error {
                background: rgba(239, 68, 68, 0.9);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: white;
            }
            
            .error-display.warning {
                background: rgba(245, 158, 11, 0.9);
                border: 1px solid rgba(245, 158, 11, 0.3);
                color: white;
            }
            
            .error-display.network {
                background: rgba(99, 102, 241, 0.9);
                border: 1px solid rgba(99, 102, 241, 0.3);
                color: white;
            }
            
            .error-display.ar {
                background: rgba(139, 69, 19, 0.9);
                border: 1px solid rgba(139, 69, 19, 0.3);
                color: white;
            }
            
            .error-display.critical {
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #ef4444;
                color: white;
            }
            
            .error-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .error-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .error-message {
                flex: 1;
                font-weight: 500;
            }
            
            .error-close {
                background: none;
                border: none;
                color: currentColor;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            
            .error-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .critical-error h3 {
                margin: 0 0 12px 0;
                font-size: 18px;
                color: #ef4444;
            }
            
            .critical-error p {
                margin: 0 0 16px 0;
                line-height: 1.5;
            }
            
            .error-actions {
                display: flex;
                gap: 12px;
            }
            
            .btn-retry, .btn-dismiss {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .btn-retry {
                background: #ef4444;
                color: white;
            }
            
            .btn-retry:hover {
                background: #dc2626;
                transform: translateY(-1px);
            }
            
            .btn-dismiss {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .btn-dismiss:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    getErrorIcon(type) {
        const icons = {
            error: '⚠️',
            warning: '⚠️',
            network: '🌐',
            ar: '📱',
            critical: '🚨'
        };
        return icons[type] || '⚠️';
    }

    getErrorReport() {
        return {
            errors: this.errorHistory,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    }

    clearErrorHistory() {
        this.errorHistory = [];
        this.retryAttempts.clear();
    }
}

// Export singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;
