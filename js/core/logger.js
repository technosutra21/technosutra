/**
 * Logger Module for Techno Sutra AR
 * Modern logging system with levels, contexts, and structured output
 * @module Logger
 */

export class Logger {
    static #instance = null;
    #logLevel = 'info';
    #enabledContexts = new Set();
    #logHistory = [];
    #maxHistorySize = 100;

    // Log levels with priority
    static LEVELS = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        trace: 4
    };

    constructor(options = {}) {
        if (Logger.#instance) {
            return Logger.#instance;
        }
        
        Logger.#instance = this;
        this.#logLevel = options.level || 'info';
        this.#maxHistorySize = options.maxHistorySize || 100;
        
        // Enable all contexts by default in development
        if (this.#isDevelopment()) {
            this.#enabledContexts.add('*');
        }
    }

    /**
     * Check if running in development mode
     * @returns {boolean}
     * @private
     */
    #isDevelopment() {
        return process.env.NODE_ENV === 'development' || 
               !window.location.hostname.includes('production') ||
               window.location.hostname === 'localhost';
    }

    /**
     * Set log level
     * @param {string} level - Log level (error, warn, info, debug, trace)
     */
    setLevel(level) {
        if (level in Logger.LEVELS) {
            this.#logLevel = level;
        } else {
            this.warn('Logger', `Invalid log level: ${level}`);
        }
    }

    /**
     * Enable logging for specific context
     * @param {string} context - Context to enable ('*' for all)
     */
    enableContext(context) {
        this.#enabledContexts.add(context);
    }

    /**
     * Disable logging for specific context
     * @param {string} context - Context to disable
     */
    disableContext(context) {
        this.#enabledContexts.delete(context);
    }

    /**
     * Check if context is enabled
     * @param {string} context - Context to check
     * @returns {boolean}
     * @private
     */
    #isContextEnabled(context) {
        return this.#enabledContexts.has('*') || this.#enabledContexts.has(context);
    }

    /**
     * Check if log level is enabled
     * @param {string} level - Log level to check
     * @returns {boolean}
     * @private
     */
    #isLevelEnabled(level) {
        return Logger.LEVELS[level] <= Logger.LEVELS[this.#logLevel];
    }

    /**
     * Core logging method
     * @param {string} level - Log level
     * @param {string} context - Log context
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     * @private
     */
    #log(level, context, message, ...args) {
        if (!this.#isLevelEnabled(level) || !this.#isContextEnabled(context)) {
            return;
        }

        const timestamp = new Date().toISOString();
        const levelUpper = level.toUpperCase().padEnd(5);
        const contextFormatted = context.padEnd(15);
        
        const logEntry = {
            timestamp,
            level,
            context,
            message,
            args,
            stack: level === 'error' ? new Error().stack : null
        };

        // Add to history
        this.#logHistory.push(logEntry);
        if (this.#logHistory.length > this.#maxHistorySize) {
            this.#logHistory.shift();
        }

        // Format console output
        const prefix = `[${timestamp}] ${levelUpper} [${contextFormatted}]`;
        
        // Choose appropriate console method
        const consoleMethod = this.#getConsoleMethod(level);
        
        if (args.length > 0) {
            consoleMethod(`${prefix} ${message}`, ...args);
        } else {
            consoleMethod(`${prefix} ${message}`);
        }
    }

    /**
     * Get appropriate console method for log level
     * @param {string} level - Log level
     * @returns {Function} Console method
     * @private
     */
    #getConsoleMethod(level) {
        switch (level) {
            case 'error': return console.error;
            case 'warn': return console.warn;
            case 'info': return console.info;
            case 'debug': return console.debug;
            case 'trace': return console.trace;
            default: return console.log;
        }
    }

    /**
     * Log error message
     * @param {string} context - Context identifier
     * @param {string} message - Error message
     * @param {...any} args - Additional arguments
     */
    error(context, message, ...args) {
        this.#log('error', context, message, ...args);
    }

    /**
     * Log warning message
     * @param {string} context - Context identifier
     * @param {string} message - Warning message
     * @param {...any} args - Additional arguments
     */
    warn(context, message, ...args) {
        this.#log('warn', context, message, ...args);
    }

    /**
     * Log info message
     * @param {string} context - Context identifier
     * @param {string} message - Info message
     * @param {...any} args - Additional arguments
     */
    info(context, message, ...args) {
        this.#log('info', context, message, ...args);
    }

    /**
     * Log debug message
     * @param {string} context - Context identifier
     * @param {string} message - Debug message
     * @param {...any} args - Additional arguments
     */
    debug(context, message, ...args) {
        this.#log('debug', context, message, ...args);
    }

    /**
     * Log trace message
     * @param {string} context - Context identifier
     * @param {string} message - Trace message
     * @param {...any} args - Additional arguments
     */
    trace(context, message, ...args) {
        this.#log('trace', context, message, ...args);
    }

    /**
     * Create a contextual logger
     * @param {string} context - Context identifier
     * @returns {Object} Contextual logger methods
     */
    createContext(context) {
        return {
            error: (message, ...args) => this.error(context, message, ...args),
            warn: (message, ...args) => this.warn(context, message, ...args),
            info: (message, ...args) => this.info(context, message, ...args),
            debug: (message, ...args) => this.debug(context, message, ...args),
            trace: (message, ...args) => this.trace(context, message, ...args)
        };
    }

    /**
     * Log performance timing
     * @param {string} context - Context identifier
     * @param {string} operation - Operation name
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Additional metadata
     */
    timing(context, operation, duration, metadata = {}) {
        this.info(context, `⏱️ ${operation} completed in ${duration.toFixed(2)}ms`, metadata);
    }

    /**
     * Log API request/response
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {number} status - Response status
     * @param {number} duration - Request duration
     */
    api(method, url, status, duration) {
        const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
        const emoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
        
        this.#log(level, 'API', `${emoji} ${method} ${url} ${status} (${duration.toFixed(2)}ms)`);
    }

    /**
     * Log AR session events
     * @param {string} event - Event type
     * @param {Object} data - Event data
     */
    ar(event, data = {}) {
        const emoji = {
            'session-start': '🚀',
            'session-end': '🏁',
            'object-placed': '📍',
            'error': '❌',
            'feature-detected': '🔍'
        }[event] || '📱';

        this.info('AR', `${emoji} ${event}`, data);
    }

    /**
     * Log model loading events
     * @param {string|number} modelId - Model identifier
     * @param {string} event - Event type (loading, loaded, error)
     * @param {Object} metadata - Additional metadata
     */
    model(modelId, event, metadata = {}) {
        const emoji = {
            'loading': '⏳',
            'loaded': '✅',
            'error': '❌',
            'cached': '💾'
        }[event] || '📦';

        this.info('Model', `${emoji} modelo${modelId} ${event}`, metadata);
    }

    /**
     * Get log history
     * @param {string} [level] - Filter by log level
     * @param {string} [context] - Filter by context
     * @returns {Array} Log entries
     */
    getHistory(level = null, context = null) {
        let history = [...this.#logHistory];

        if (level) {
            history = history.filter(entry => entry.level === level);
        }

        if (context) {
            history = history.filter(entry => entry.context === context);
        }

        return history;
    }

    /**
     * Clear log history
     */
    clearHistory() {
        this.#logHistory = [];
    }

    /**
     * Export logs as JSON
     * @returns {string} JSON formatted logs
     */
    exportLogs() {
        return JSON.stringify(this.#logHistory, null, 2);
    }

    /**
     * Group related log messages
     * @param {string} label - Group label
     * @param {Function} callback - Function to execute within group
     */
    group(label, callback) {
        console.group(label);
        try {
            callback();
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Create a timer for measuring performance
     * @param {string} label - Timer label
     * @returns {Object} Timer object with end method
     */
    timer(label) {
        const start = performance.now();
        
        return {
            end: (context = 'Performance') => {
                const duration = performance.now() - start;
                this.timing(context, label, duration);
                return duration;
            }
        };
    }

    /**
     * Assert a condition and log error if false
     * @param {boolean} condition - Condition to check
     * @param {string} context - Context identifier
     * @param {string} message - Error message if assertion fails
     */
    assert(condition, context, message) {
        if (!condition) {
            this.error(context, `Assertion failed: ${message}`);
        }
    }
}

// Create singleton instance
const logger = new Logger();

// Export singleton instance as default
export default logger;

// Export convenience functions
export const createContext = (context) => logger.createContext(context);
export const setLogLevel = (level) => logger.setLevel(level);
export const enableContext = (context) => logger.enableContext(context);
export const disableContext = (context) => logger.disableContext(context);
