/**
 * Techno Sutra AR - Input Validation and XSS Prevention
 * Comprehensive input validation for all user inputs
 */

class InputValidator {
    /**
     * Validate and sanitize model parameter
     */
    static validateModelParam(modelParam) {
        if (!modelParam) {
            return { valid: true, sanitized: 1, warnings: [] };
        }

        const warnings = [];
        let sanitized = 1;

        try {
            // Remove any non-numeric characters
            const cleaned = String(modelParam).replace(/[^\d]/g, '');
            
            if (!cleaned) {
                warnings.push('Model parameter contained no valid digits, defaulting to 1');
                return { valid: true, sanitized: 1, warnings };
            }

            const parsed = parseInt(cleaned, 10);
            
            if (isNaN(parsed)) {
                warnings.push('Model parameter could not be parsed, defaulting to 1');
                return { valid: true, sanitized: 1, warnings };
            }

            // Clamp to valid range
            sanitized = Math.max(1, Math.min(56, parsed));
            
            if (sanitized !== parsed) {
                warnings.push(`Model parameter ${parsed} was clamped to valid range: ${sanitized}`);
            }

            return { valid: true, sanitized, warnings };

        } catch (error) {
            warnings.push(`Error parsing model parameter: ${error.message}`);
            return { valid: true, sanitized: 1, warnings };
        }
    }

    /**
     * Validate chapter navigation parameter
     */
    static validateChapterParam(chapterParam) {
        return this.validateModelParam(chapterParam); // Same validation logic
    }

    /**
     * Sanitize HTML content for display
     */
    static sanitizeHTML(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // HTML entity encoding
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/\\/g, '&#x5C;');
    }

    /**
     * Validate and sanitize URL parameters
     */
    static validateURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const sanitized = {};
        const warnings = [];

        // Process model parameter
        const modelParam = urlParams.get('model');
        const modelResult = this.validateModelParam(modelParam);
        sanitized.model = modelResult.sanitized;
        warnings.push(...modelResult.warnings);

        // Log any suspicious parameters
        for (const [key, value] of urlParams.entries()) {
            if (key !== 'model') {
                warnings.push(`Unknown URL parameter detected and ignored: ${key}=${value}`);
                if (window.SecurityLogger) {
                    window.SecurityLogger.logSuspiciousActivity(
                        'Unknown URL parameter',
                        { parameter: key, value: value }
                    );
                }
            }
        }

        return { sanitized, warnings };
    }

    /**
     * Validate file path for directory traversal attacks
     */
    static validateFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return { valid: false, error: 'Invalid file path' };
        }

        // Check for directory traversal patterns
        const suspiciousPatterns = [
            /\.\./,           // Parent directory
            /\/\//,           // Double slashes
            /\\/,             // Backslashes
            /[<>:"|?*]/,      // Windows forbidden characters
            /^\/.*$/,         // Absolute paths
            /^\w+:/,          // Protocol prefixes
            /%2e%2e/i,        // URL encoded ..
            /%2f/i,           // URL encoded /
            /%5c/i            // URL encoded \
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(filePath)) {
                return {
                    valid: false,
                    error: `Suspicious pattern detected in file path: ${pattern.source}`
                };
            }
        }

        // Check if it matches expected model file pattern
        const modelPattern = /^modelo\d{1,2}\.(glb|usdz)$/;
        if (!modelPattern.test(filePath)) {
            return {
                valid: false,
                error: 'File path does not match expected model pattern'
            };
        }

        return { valid: true };
    }

    /**
     * Validate postMessage origin for iframe communication
     */
    static validateMessageOrigin(origin, allowedOrigins = []) {
        if (!origin || typeof origin !== 'string') {
            return false;
        }

        // Default allowed origins
        const defaultAllowed = [
            window.location.origin,
            'https://technosutra.com',
            'https://www.technosutra.com'
        ];

        const allowed = [...defaultAllowed, ...allowedOrigins];

        return allowed.includes(origin);
    }

    /**
     * Validate iframe src for security
     */
    static validateIframeSrc(src) {
        if (!src || typeof src !== 'string') {
            return { valid: false, error: 'Invalid iframe src' };
        }

        // Check for data URLs (potential XSS vector)
        if (src.startsWith('data:')) {
            return { valid: false, error: 'Data URLs not allowed in iframe src' };
        }

        // Check for javascript URLs
        if (src.startsWith('javascript:')) {
            return { valid: false, error: 'JavaScript URLs not allowed in iframe src' };
        }

        // Must be HTTPS or same origin
        if (!src.startsWith('https://') && !src.startsWith('/') && !src.startsWith('./')) {
            return { valid: false, error: 'Only HTTPS URLs and relative paths allowed' };
        }

        return { valid: true };
    }

    /**
     * Rate limiting validation
     */
    static validateRateLimit(identifier, rateLimiter) {
        if (!rateLimiter) {
            return { allowed: true, warning: 'Rate limiter not initialized' };
        }

        const allowed = rateLimiter.checkLimit(identifier);
        
        if (!allowed && window.SecurityLogger) {
            window.SecurityLogger.logSuspiciousActivity(
                'Rate limit exceeded',
                { identifier, timestamp: new Date().toISOString() }
            );
        }

        return { allowed };
    }

    /**
     * Validate user agent for bot detection
     */
    static validateUserAgent(userAgent = navigator.userAgent) {
        const suspiciousBots = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /^$/  // Empty user agent
        ];

        const isSuspicious = suspiciousBots.some(pattern => pattern.test(userAgent));
        
        if (isSuspicious && window.SecurityLogger) {
            window.SecurityLogger.logSuspiciousActivity(
                'Suspicious user agent detected',
                { userAgent }
            );
        }

        return { suspicious: isSuspicious, userAgent };
    }

    /**
     * Comprehensive security check for page load
     */
    static performSecurityCheck() {
        const results = {
            timestamp: new Date().toISOString(),
            urlParams: this.validateURLParameters(),
            userAgent: this.validateUserAgent(),
            origin: window.location.origin,
            referrer: document.referrer,
            protocol: window.location.protocol
        };

        // Check for HTTPS in production
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            results.warnings = results.warnings || [];
            results.warnings.push('Page not served over HTTPS');
        }

        return results;
    }
}

/**
 * XSS Prevention utilities
 */
class XSSPrevention {
    /**
     * Escape HTML for safe insertion
     */
    static escapeHTML(str) {
        return InputValidator.sanitizeHTML(str);
    }

    /**
     * Create safe DOM element with text content
     */
    static createSafeElement(tagName, textContent, attributes = {}) {
        const element = document.createElement(tagName);
        
        // Set text content safely
        if (textContent) {
            element.textContent = textContent;
        }

        // Set attributes safely
        for (const [key, value] of Object.entries(attributes)) {
            if (this.isSafeAttribute(key)) {
                element.setAttribute(key, this.sanitizeAttributeValue(value));
            }
        }

        return element;
    }

    /**
     * Check if attribute is safe to set
     */
    static isSafeAttribute(attributeName) {
        const unsafeAttributes = [
            'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
            'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
            'onkeyup', 'onkeypress', 'href', 'src', 'action', 'formaction'
        ];

        return !unsafeAttributes.includes(attributeName.toLowerCase());
    }

    /**
     * Sanitize attribute value
     */
    static sanitizeAttributeValue(value) {
        if (typeof value !== 'string') {
            return String(value);
        }

        // Remove javascript: and data: protocols
        return value
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/on\w+=/gi, '');
    }

    /**
     * Safe innerHTML replacement
     */
    static safeInnerHTML(element, content) {
        // Clear existing content
        element.textContent = '';
        
        // Set sanitized content
        element.textContent = this.escapeHTML(content);
    }
}

// Initialize security check on page load
document.addEventListener('DOMContentLoaded', () => {
    const securityCheck = InputValidator.performSecurityCheck();
    
    if (window.SecurityLogger) {
        window.SecurityLogger.log('info', 'Security check completed', securityCheck);
    }

    // Log any warnings
    if (securityCheck.urlParams && securityCheck.urlParams.warnings.length > 0) {
        securityCheck.urlParams.warnings.forEach(warning => {
            if (window.SecurityLogger) {
                window.SecurityLogger.log('warning', warning);
            }
        });
    }
});

// Export for global use
if (typeof window !== 'undefined') {
    window.InputValidator = InputValidator;
    window.XSSPrevention = XSSPrevention;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InputValidator,
        XSSPrevention
    };
}
