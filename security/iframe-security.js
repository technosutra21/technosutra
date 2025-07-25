/**
 * Techno Sutra AR - iframe Security Management
 * Secure iframe handling and postMessage communication
 */

class IframeSecurity {
    constructor() {
        this.allowedOrigins = new Set([
            window.location.origin,
            'https://technosutra.com',
            'https://www.technosutra.com',
            'https://wix.com',
            'https://www.wix.com'
        ]);
        
        this.messageHandlers = new Map();
        this.rateLimiter = new Map();
        this.setupMessageListener();
    }

    /**
     * Add allowed origin for postMessage
     */
    addAllowedOrigin(origin) {
        if (typeof origin === 'string' && origin.startsWith('https://')) {
            this.allowedOrigins.add(origin);
        }
    }

    /**
     * Remove allowed origin
     */
    removeAllowedOrigin(origin) {
        this.allowedOrigins.delete(origin);
    }

    /**
     * Check if origin is allowed
     */
    isOriginAllowed(origin) {
        return this.allowedOrigins.has(origin);
    }

    /**
     * Setup secure postMessage listener
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            this.handleMessage(event);
        });
    }

    /**
     * Handle incoming postMessage
     */
    handleMessage(event) {
        try {
            // Validate origin
            if (!this.isOriginAllowed(event.origin)) {
                this.logSecurityViolation('Unauthorized postMessage origin', {
                    origin: event.origin,
                    data: event.data
                });
                return;
            }

            // Rate limiting check
            if (!this.checkRateLimit(event.origin)) {
                this.logSecurityViolation('PostMessage rate limit exceeded', {
                    origin: event.origin
                });
                return;
            }

            // Validate message structure
            const validatedData = this.validateMessageData(event.data);
            if (!validatedData.valid) {
                this.logSecurityViolation('Invalid postMessage data', {
                    origin: event.origin,
                    error: validatedData.error,
                    data: event.data
                });
                return;
            }

            // Process valid message
            this.processMessage(validatedData.data, event.origin);

        } catch (error) {
            this.logSecurityViolation('PostMessage processing error', {
                origin: event.origin,
                error: error.message
            });
        }
    }

    /**
     * Validate postMessage data structure
     */
    validateMessageData(data) {
        try {
            // Data must be an object
            if (!data || typeof data !== 'object') {
                return { valid: false, error: 'Message data must be an object' };
            }

            // Check for required fields
            if (!data.type || typeof data.type !== 'string') {
                return { valid: false, error: 'Message must have a type field' };
            }

            // Validate allowed message types
            const allowedTypes = [
                'navigate',
                'resize',
                'status',
                'model-change',
                'ar-status',
                'gallery-navigate'
            ];

            if (!allowedTypes.includes(data.type)) {
                return { valid: false, error: `Unknown message type: ${data.type}` };
            }

            // Type-specific validation
            switch (data.type) {
                case 'navigate':
                case 'model-change':
                    if (!this.validateModelId(data.modelId)) {
                        return { valid: false, error: 'Invalid model ID in navigation message' };
                    }
                    break;

                case 'resize':
                    if (!this.validateDimensions(data.width, data.height)) {
                        return { valid: false, error: 'Invalid dimensions in resize message' };
                    }
                    break;
            }

            return { valid: true, data };

        } catch (error) {
            return { valid: false, error: `Validation error: ${error.message}` };
        }
    }

    /**
     * Validate model ID
     */
    validateModelId(modelId) {
        const id = parseInt(modelId);
        return !isNaN(id) && id >= 1 && id <= 56;
    }

    /**
     * Validate iframe dimensions
     */
    validateDimensions(width, height) {
        const w = parseInt(width);
        const h = parseInt(height);
        
        // Reasonable limits for iframe dimensions
        return !isNaN(w) && !isNaN(h) && 
               w >= 100 && w <= 4000 && 
               h >= 100 && h <= 4000;
    }

    /**
     * Rate limiting for postMessages
     */
    checkRateLimit(origin) {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const maxMessages = 60; // Max 60 messages per minute per origin

        if (!this.rateLimiter.has(origin)) {
            this.rateLimiter.set(origin, []);
        }

        const timestamps = this.rateLimiter.get(origin);
        
        // Remove old timestamps
        const cutoff = now - windowMs;
        const recentTimestamps = timestamps.filter(ts => ts > cutoff);
        
        if (recentTimestamps.length >= maxMessages) {
            return false;
        }

        // Add current timestamp
        recentTimestamps.push(now);
        this.rateLimiter.set(origin, recentTimestamps);
        
        return true;
    }

    /**
     * Process validated message
     */
    processMessage(data, origin) {
        const handler = this.messageHandlers.get(data.type);
        
        if (handler && typeof handler === 'function') {
            try {
                handler(data, origin);
            } catch (error) {
                this.logSecurityViolation('Message handler error', {
                    type: data.type,
                    origin,
                    error: error.message
                });
            }
        } else {
            // Log unhandled message type
            if (window.SecurityLogger) {
                window.SecurityLogger.log('warning', `Unhandled message type: ${data.type}`, {
                    origin,
                    data
                });
            }
        }
    }

    /**
     * Register message handler
     */
    registerMessageHandler(type, handler) {
        if (typeof type === 'string' && typeof handler === 'function') {
            this.messageHandlers.set(type, handler);
        }
    }

    /**
     * Send secure postMessage
     */
    sendSecureMessage(targetWindow, message, targetOrigin) {
        try {
            // Validate target origin
            if (!this.isOriginAllowed(targetOrigin)) {
                throw new Error(`Target origin not allowed: ${targetOrigin}`);
            }

            // Validate message structure
            const validatedMessage = this.validateOutgoingMessage(message);
            if (!validatedMessage.valid) {
                throw new Error(`Invalid outgoing message: ${validatedMessage.error}`);
            }

            // Send message
            targetWindow.postMessage(validatedMessage.data, targetOrigin);

        } catch (error) {
            this.logSecurityViolation('Failed to send secure message', {
                error: error.message,
                targetOrigin,
                message
            });
        }
    }

    /**
     * Validate outgoing message
     */
    validateOutgoingMessage(message) {
        if (!message || typeof message !== 'object') {
            return { valid: false, error: 'Message must be an object' };
        }

        if (!message.type || typeof message.type !== 'string') {
            return { valid: false, error: 'Message must have a type field' };
        }

        // Add timestamp and origin for tracking
        const enhancedMessage = {
            ...message,
            timestamp: Date.now(),
            origin: window.location.origin
        };

        return { valid: true, data: enhancedMessage };
    }

    /**
     * Create secure iframe element
     */
    createSecureIframe(src, options = {}) {
        const iframe = document.createElement('iframe');
        
        // Validate src
        const srcValidation = this.validateIframeSrc(src);
        if (!srcValidation.valid) {
            throw new Error(`Invalid iframe src: ${srcValidation.error}`);
        }

        // Set secure attributes
        iframe.src = src;
        iframe.setAttribute('sandbox', this.generateSandboxValue(options.sandbox));
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        
        // Apply CSP to iframe if supported
        if (options.csp) {
            iframe.setAttribute('csp', options.csp);
        }

        // Set dimensions safely
        if (options.width && this.validateDimension(options.width)) {
            iframe.width = options.width;
        }
        if (options.height && this.validateDimension(options.height)) {
            iframe.height = options.height;
        }

        // Add security event listeners
        iframe.addEventListener('load', () => {
            this.onIframeLoad(iframe);
        });

        iframe.addEventListener('error', (event) => {
            this.onIframeError(iframe, event);
        });

        return iframe;
    }

    /**
     * Validate iframe src URL
     */
    validateIframeSrc(src) {
        if (!src || typeof src !== 'string') {
            return { valid: false, error: 'Invalid src URL' };
        }

        // Block dangerous protocols
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
        for (const protocol of dangerousProtocols) {
            if (src.toLowerCase().startsWith(protocol)) {
                return { valid: false, error: `Dangerous protocol: ${protocol}` };
            }
        }

        // Allow only HTTPS and relative URLs
        if (!src.startsWith('https://') && !src.startsWith('/') && !src.startsWith('./')) {
            return { valid: false, error: 'Only HTTPS and relative URLs allowed' };
        }

        return { valid: true };
    }

    /**
     * Generate sandbox attribute value
     */
    generateSandboxValue(customSandbox = []) {
        const defaultSandbox = [
            'allow-scripts',
            'allow-same-origin',
            'allow-forms'
        ];

        const allowedSandboxValues = [
            'allow-downloads',
            'allow-forms',
            'allow-modals',
            'allow-orientation-lock',
            'allow-pointer-lock',
            'allow-popups',
            'allow-popups-to-escape-sandbox',
            'allow-presentation',
            'allow-same-origin',
            'allow-scripts',
            'allow-top-navigation',
            'allow-top-navigation-by-user-activation'
        ];

        const sandbox = Array.isArray(customSandbox) ? customSandbox : defaultSandbox;
        const validSandbox = sandbox.filter(value => allowedSandboxValues.includes(value));

        return validSandbox.join(' ');
    }

    /**
     * Validate dimension value
     */
    validateDimension(dimension) {
        const num = parseInt(dimension);
        return !isNaN(num) && num >= 1 && num <= 4000;
    }

    /**
     * Handle iframe load event
     */
    onIframeLoad(iframe) {
        if (window.SecurityLogger) {
            window.SecurityLogger.log('info', 'Iframe loaded successfully', {
                src: iframe.src,
                sandbox: iframe.getAttribute('sandbox')
            });
        }
    }

    /**
     * Handle iframe error event
     */
    onIframeError(iframe, event) {
        this.logSecurityViolation('Iframe load error', {
            src: iframe.src,
            error: event.type
        });
    }

    /**
     * Log security violation
     */
    logSecurityViolation(violation, details = {}) {
        if (window.SecurityLogger) {
            window.SecurityLogger.logSecurityViolation(violation, details);
        } else {
            console.warn('[IFRAME SECURITY]', violation, details);
        }
    }
}

// Initialize iframe security
const iframeSecurity = new IframeSecurity();

// Register default message handlers
iframeSecurity.registerMessageHandler('navigate', (data, origin) => {
    if (data.modelId && window.location.pathname.includes('index.html')) {
        const url = new URL(window.location);
        url.searchParams.set('model', data.modelId);
        window.location.href = url.toString();
    }
});

iframeSecurity.registerMessageHandler('model-change', (data, origin) => {
    if (data.modelId && typeof window.loadModel === 'function') {
        window.loadModel(data.modelId);
    }
});

iframeSecurity.registerMessageHandler('gallery-navigate', (data, origin) => {
    if (data.action === 'open-gallery') {
        window.location.href = 'galeria.html';
    }
});

// Export for global use
if (typeof window !== 'undefined') {
    window.IframeSecurity = IframeSecurity;
    window.iframeSecurity = iframeSecurity;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IframeSecurity };
}
