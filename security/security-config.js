/**
 * Techno Sutra AR - Security Configuration
 * Centralized security settings and validation functions
 */

const SECURITY_CONFIG = {
    // Content Security Policy settings
    csp: {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline' https://ajax.googleapis.com",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: blob:",
        'connect-src': "'self' https:",
        'font-src': "'self'",
        'object-src': "'none'",
        'media-src': "'self'",
        'frame-src': "'self'",
        'worker-src': "'self'",
        'manifest-src': "'self'",
        'form-action': "'self'",
        'frame-ancestors': "'self'",
        'base-uri': "'self'"
    },

    // Security headers
    headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    },

    // Model validation
    models: {
        validRange: { min: 1, max: 56 },
        validExtensions: ['.glb', '.usdz'],
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedPaths: /^modelo\d{1,2}\.(glb|usdz)$/
    },

    // URL parameter validation
    urlParams: {
        model: {
            type: 'integer',
            min: 1,
            max: 56,
            default: 1
        }
    },

    // Rate limiting
    rateLimiting: {
        maxRequestsPerMinute: 100,
        maxModelsPerSession: 20,
        blockDuration: 300000 // 5 minutes
    }
};

/**
 * Input validation utilities
 */
class SecurityValidator {
    /**
     * Validate model ID parameter
     */
    static validateModelId(modelId) {
        const id = parseInt(modelId);
        
        if (isNaN(id)) {
            return { valid: false, error: 'Model ID must be a number', sanitized: 1 };
        }
        
        if (id < SECURITY_CONFIG.models.validRange.min || id > SECURITY_CONFIG.models.validRange.max) {
            return { 
                valid: false, 
                error: `Model ID must be between ${SECURITY_CONFIG.models.validRange.min} and ${SECURITY_CONFIG.models.validRange.max}`, 
                sanitized: Math.max(1, Math.min(56, id))
            };
        }
        
        return { valid: true, sanitized: id };
    }

    /**
     * Validate model file path
     */
    static validateModelPath(modelPath) {
        if (!modelPath || typeof modelPath !== 'string') {
            return { valid: false, error: 'Invalid model path' };
        }

        // Prevent directory traversal
        if (modelPath.includes('..') || modelPath.includes('/') || modelPath.includes('\\')) {
            return { valid: false, error: 'Invalid characters in model path' };
        }

        // Check against allowed pattern
        if (!SECURITY_CONFIG.models.allowedPaths.test(modelPath)) {
            return { valid: false, error: 'Model path does not match allowed pattern' };
        }

        return { valid: true };
    }

    /**
     * Sanitize HTML content
     */
    static sanitizeHTML(input) {
        if (!input || typeof input !== 'string') return '';
        
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate URL parameters
     */
    static validateURLParams(params) {
        const validated = {};
        const errors = [];

        for (const [key, value] of Object.entries(params)) {
            if (key === 'model') {
                const result = this.validateModelId(value);
                validated[key] = result.sanitized;
                if (!result.valid) {
                    errors.push(result.error);
                }
            } else {
                // Unknown parameter - ignore for security
                continue;
            }
        }

        return { validated, errors };
    }

    /**
     * Generate security nonce
     */
    static generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, b => ('0' + b.toString(16)).slice(-2)).join('');
    }
}

/**
 * Rate limiting tracker
 */
class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.blocked = new Set();
    }

    isBlocked(identifier) {
        return this.blocked.has(identifier);
    }

    checkLimit(identifier) {
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window

        if (this.isBlocked(identifier)) {
            return false;
        }

        // Get requests in current window
        const userRequests = this.requests.get(identifier) || [];
        const recentRequests = userRequests.filter(time => time > windowStart);

        if (recentRequests.length >= SECURITY_CONFIG.rateLimiting.maxRequestsPerMinute) {
            this.blocked.add(identifier);
            setTimeout(() => {
                this.blocked.delete(identifier);
            }, SECURITY_CONFIG.rateLimiting.blockDuration);
            return false;
        }

        // Update request log
        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);

        return true;
    }
}

/**
 * Security error logger
 */
class SecurityLogger {
    static log(level, message, details = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...details
        };

        // In production, send to logging service
        if (level === 'error' || level === 'warning') {
            console.warn('[SECURITY]', logEntry);
        }
    }

    static logSecurityViolation(violation, details = {}) {
        this.log('error', `Security violation: ${violation}`, details);
    }

    static logSuspiciousActivity(activity, details = {}) {
        this.log('warning', `Suspicious activity: ${activity}`, details);
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.SECURITY_CONFIG = SECURITY_CONFIG;
    window.SecurityValidator = SecurityValidator;
    window.RateLimiter = RateLimiter;
    window.SecurityLogger = SecurityLogger;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SECURITY_CONFIG,
        SecurityValidator,
        RateLimiter,
        SecurityLogger
    };
}
