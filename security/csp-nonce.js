/**
 * CSP Nonce Generator and Management
 * Handles nonce generation for inline scripts and styles
 */

class CSPNonceManager {
    constructor() {
        this.currentNonce = this.generateNonce();
        this.nonceMap = new Map();
    }

    /**
     * Generate cryptographically secure nonce
     */
    generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }

    /**
     * Get current nonce
     */
    getCurrentNonce() {
        return this.currentNonce;
    }

    /**
     * Register inline script with nonce
     */
    registerInlineScript(scriptContent) {
        const nonce = this.generateNonce();
        this.nonceMap.set(nonce, {
            content: scriptContent,
            type: 'script',
            timestamp: Date.now()
        });
        return nonce;
    }

    /**
     * Register inline style with nonce
     */
    registerInlineStyle(styleContent) {
        const nonce = this.generateNonce();
        this.nonceMap.set(nonce, {
            content: styleContent,
            type: 'style',
            timestamp: Date.now()
        });
        return nonce;
    }

    /**
     * Validate nonce
     */
    validateNonce(nonce) {
        return this.nonceMap.has(nonce);
    }

    /**
     * Clean old nonces (older than 1 hour)
     */
    cleanOldNonces() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [nonce, data] of this.nonceMap.entries()) {
            if (data.timestamp < oneHourAgo) {
                this.nonceMap.delete(nonce);
            }
        }
    }

    /**
     * Apply nonce to inline script element
     */
    applyNonceToScript(scriptElement) {
        if (scriptElement && scriptElement.tagName === 'SCRIPT') {
            const nonce = this.registerInlineScript(scriptElement.innerHTML);
            scriptElement.setAttribute('nonce', nonce);
            return nonce;
        }
        return null;
    }

    /**
     * Apply nonce to inline style element
     */
    applyNonceToStyle(styleElement) {
        if (styleElement && styleElement.tagName === 'STYLE') {
            const nonce = this.registerInlineStyle(styleElement.innerHTML);
            styleElement.setAttribute('nonce', nonce);
            return nonce;
        }
        return null;
    }

    /**
     * Generate CSP header with current nonce
     */
    generateCSPHeader() {
        const config = window.SECURITY_CONFIG || {};
        const csp = config.csp || {};
        
        let cspHeader = Object.entries(csp)
            .map(([directive, value]) => {
                if (directive === 'script-src' && value.includes("'unsafe-inline'")) {
                    // Replace unsafe-inline with nonce for scripts
                    return `${directive} ${value.replace("'unsafe-inline'", `'nonce-${this.currentNonce}'`)}`;
                }
                return `${directive} ${value}`;
            })
            .join('; ');

        return cspHeader;
    }
}

/**
 * CSP Violation Reporter
 */
class CSPViolationReporter {
    constructor() {
        this.setupViolationListener();
    }

    setupViolationListener() {
        document.addEventListener('securitypolicyviolation', (e) => {
            this.reportViolation(e);
        });
    }

    reportViolation(event) {
        const violation = {
            blockedURI: event.blockedURI,
            columnNumber: event.columnNumber,
            directive: event.violatedDirective,
            effectiveDirective: event.effectiveDirective,
            lineNumber: event.lineNumber,
            originalPolicy: event.originalPolicy,
            referrer: event.referrer,
            sample: event.sample,
            sourceFile: event.sourceFile,
            statusCode: event.statusCode,
            timestamp: new Date().toISOString()
        };

        // Log violation
        if (window.SecurityLogger) {
            window.SecurityLogger.logSecurityViolation('CSP Violation', violation);
        }

        // In production, send to monitoring service
        console.warn('[CSP VIOLATION]', violation);

        // Send to backend if endpoint is configured
        this.sendViolationReport(violation);
    }

    async sendViolationReport(violation) {
        try {
            // This would be your actual violation reporting endpoint
            const endpoint = '/api/security/csp-violation';
            
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(violation)
            });
        } catch (error) {
            console.error('Failed to send CSP violation report:', error);
        }
    }
}

// Initialize CSP management
const cspNonceManager = new CSPNonceManager();
const cspViolationReporter = new CSPViolationReporter();

// Clean old nonces every hour
setInterval(() => {
    cspNonceManager.cleanOldNonces();
}, 60 * 60 * 1000);

// Export for global use
if (typeof window !== 'undefined') {
    window.CSPNonceManager = CSPNonceManager;
    window.CSPViolationReporter = CSPViolationReporter;
    window.cspNonceManager = cspNonceManager;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CSPNonceManager,
        CSPViolationReporter
    };
}
