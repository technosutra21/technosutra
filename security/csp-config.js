/**
 * Content Security Policy Configuration for Techno Sutra AR
 * Modern security implementation with proper CSP headers
 */

// CSP Configuration
export const CSP_CONFIG = {
    // Core directives
    'default-src': "'self'",
    'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for model-viewer
        "ajax.googleapis.com",
        "*.googleapis.com"
    ].join(' '),
    'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for dynamic styles
        "fonts.googleapis.com"
    ].join(' '),
    'img-src': [
        "'self'",
        "data:",
        "blob:",
        "*.googleapis.com"
    ].join(' '),
    'font-src': [
        "'self'",
        "fonts.gstatic.com",
        "data:"
    ].join(' '),
    'connect-src': [
        "'self'",
        "https:",
        "wss:"
    ].join(' '),
    'worker-src': "'self'",
    'frame-src': "'self'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'"
};

// Security Headers
export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Input Validation
export class SecurityValidator {
    /**
     * Validate model ID parameter
     * @param {string|number} modelId - Model ID to validate
     * @returns {number|null} Valid model ID or null
     */
    static validateModelId(modelId) {
        const id = parseInt(modelId);
        if (isNaN(id) || id < 1 || id > 56) {
            return null;
        }
        return id;
    }

    /**
     * Sanitize URL parameters
     * @param {string} param - Parameter to sanitize
     * @returns {string} Sanitized parameter
     */
    static sanitizeParam(param) {
        if (typeof param !== 'string') return '';
        return param.replace(/[<>"/\\&]/g, '');
    }

    /**
     * Validate file path
     * @param {string} path - File path to validate
     * @returns {boolean} True if valid
     */
    static validateFilePath(path) {
        // Prevent directory traversal
        if (path.includes('..') || path.includes('\\')) {
            return false;
        }
        // Only allow .glb and .usdz files
        return /^modelo\d+\.(glb|usdz)$/.test(path);
    }

    /**
     * Validate postMessage origin
     * @param {string} origin - Origin to validate
     * @returns {boolean} True if trusted origin
     */
    static validateOrigin(origin) {
        const trustedOrigins = [
            window.location.origin,
            'https://technosutra.com',
            'https://www.technosutra.com'
        ];
        return trustedOrigins.includes(origin);
    }
}

// Error Handler with security considerations
export class SecureErrorHandler {
    /**
     * Handle errors securely without information disclosure
     * @param {Error} error - Error to handle
     * @param {string} context - Error context
     */
    static handleError(error, context = 'general') {
        // Log error securely (in production, send to logging service)
        const errorId = Date.now().toString(36);
        
        // User-friendly messages without stack traces
        const userMessages = {
            'model-load': 'Modelo não disponível. Tente outro capítulo.',
            'ar-support': 'Recurso AR não suportado neste dispositivo.',
            'camera': 'Câmera não disponível. Verifique permissões.',
            'network': 'Erro de conexão. Verifique sua internet.',
            'general': 'Algo deu errado. Tente novamente.'
        };

        return {
            id: errorId,
            message: userMessages[context] || userMessages.general,
            timestamp: new Date().toISOString()
        };
    }
}

// Generate CSP header string
export function generateCSPHeader() {
    return Object.entries(CSP_CONFIG)
        .map(([directive, value]) => `${directive} ${value}`)
        .join('; ');
}
