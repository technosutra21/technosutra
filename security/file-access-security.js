/**
 * Techno Sutra AR - File Access Security
 * Secure file access validation and directory traversal prevention
 */

class FileAccessSecurity {
    constructor() {
        this.allowedExtensions = new Set(['.glb', '.usdz', '.json', '.html', '.css', '.js']);
        this.allowedPaths = new Set([
            'models',
            'characters',
            'chapters',
            'summaries',
            'css',
            'js',
            'qr_codes'
        ]);
        this.blockedPatterns = [
            /\.\./,                    // Parent directory traversal
            /\/\//,                    // Double slashes
            /\\/,                      // Backslashes (Windows paths)
            /^\/.*$/,                  // Absolute paths
            /^\w+:/,                   // Protocol prefixes
            /%2e%2e/i,                 // URL encoded ..
            /%2f/i,                    // URL encoded /
            /%5c/i,                    // URL encoded \
            /[<>:"|?*]/,               // Windows forbidden characters
            /[\x00-\x1f\x7f-\x9f]/,    // Control characters
            /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|dmg)$/i // Executable extensions
        ];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.accessLog = new Map();
    }

    /**
     * Validate file path for security
     */
    validateFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return {
                valid: false,
                error: 'Invalid file path: must be a non-empty string',
                sanitized: null
            };
        }

        // Trim and normalize
        const normalized = filePath.trim().toLowerCase();

        // Check blocked patterns
        for (const pattern of this.blockedPatterns) {
            if (pattern.test(normalized)) {
                this.logSecurityViolation('Blocked file pattern detected', {
                    filePath,
                    pattern: pattern.source
                });
                return {
                    valid: false,
                    error: `Blocked pattern detected: ${pattern.source}`,
                    sanitized: null
                };
            }
        }

        // Validate extension
        const extension = this.getFileExtension(normalized);
        if (!this.allowedExtensions.has(extension)) {
            this.logSecurityViolation('Unauthorized file extension', {
                filePath,
                extension
            });
            return {
                valid: false,
                error: `File extension not allowed: ${extension}`,
                sanitized: null
            };
        }

        // For model files, validate the specific pattern
        if (extension === '.glb' || extension === '.usdz') {
            const modelValidation = this.validateModelFilePath(normalized);
            if (!modelValidation.valid) {
                return modelValidation;
            }
        }

        return {
            valid: true,
            sanitized: normalized,
            extension
        };
    }

    /**
     * Validate model file path specifically
     */
    validateModelFilePath(filePath) {
        // Model files must match the pattern: modelo{1-56}.{glb|usdz}
        const modelPattern = /^modelo(\d{1,2})\.(glb|usdz)$/;
        const match = filePath.match(modelPattern);

        if (!match) {
            return {
                valid: false,
                error: 'Model file must match pattern: modelo{1-56}.{glb|usdz}',
                sanitized: null
            };
        }

        const modelNumber = parseInt(match[1], 10);
        if (modelNumber < 1 || modelNumber > 56) {
            return {
                valid: false,
                error: 'Model number must be between 1 and 56',
                sanitized: null
            };
        }

        return {
            valid: true,
            sanitized: filePath,
            modelNumber,
            extension: match[2]
        };
    }

    /**
     * Get file extension from path
     */
    getFileExtension(filePath) {
        const lastDot = filePath.lastIndexOf('.');
        return lastDot === -1 ? '' : filePath.slice(lastDot);
    }

    /**
     * Validate file size
     */
    async validateFileSize(fileUrl) {
        try {
            const response = await fetch(fileUrl, { method: 'HEAD' });
            
            if (!response.ok) {
                return {
                    valid: false,
                    error: `File not accessible: ${response.status} ${response.statusText}`
                };
            }

            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                const size = parseInt(contentLength, 10);
                if (size > this.maxFileSize) {
                    return {
                        valid: false,
                        error: `File too large: ${size} bytes (max: ${this.maxFileSize} bytes)`
                    };
                }
                return { valid: true, size };
            }

            return { valid: true, size: null };

        } catch (error) {
            return {
                valid: false,
                error: `Failed to validate file size: ${error.message}`
            };
        }
    }

    /**
     * Create secure file URL
     */
    createSecureFileUrl(filePath, baseUrl = '') {
        const validation = this.validateFilePath(filePath);
        
        if (!validation.valid) {
            throw new Error(`Cannot create URL for invalid file path: ${validation.error}`);
        }

        // Use sanitized path
        const securePath = validation.sanitized;
        
        // Build URL with proper encoding
        const url = new URL(securePath, baseUrl || window.location.origin);
        
        // Log access attempt
        this.logFileAccess(securePath, 'url_created');
        
        return url.toString();
    }

    /**
     * Secure file existence check
     */
    async checkFileExists(filePath) {
        const validation = this.validateFilePath(filePath);
        
        if (!validation.valid) {
            this.logSecurityViolation('File existence check with invalid path', {
                filePath,
                error: validation.error
            });
            return { exists: false, error: validation.error };
        }

        try {
            const url = this.createSecureFileUrl(validation.sanitized);
            const response = await fetch(url, { 
                method: 'HEAD',
                cache: 'no-cache'
            });

            const exists = response.ok;
            
            this.logFileAccess(validation.sanitized, exists ? 'exists' : 'not_found');
            
            return { 
                exists, 
                status: response.status,
                statusText: response.statusText
            };

        } catch (error) {
            this.logFileAccess(validation.sanitized, 'check_failed', { error: error.message });
            return { 
                exists: false, 
                error: error.message 
            };
        }
    }

    /**
     * Secure batch file existence check
     */
    async checkMultipleFiles(filePaths, options = {}) {
        const maxConcurrent = options.maxConcurrent || 5;
        const timeout = options.timeout || 5000;
        
        const results = new Map();
        
        // Process files in batches
        const batches = this.createBatches(filePaths, maxConcurrent);
        
        for (const batch of batches) {
            const promises = batch.map(async (filePath) => {
                try {
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), timeout)
                    );
                    
                    const checkPromise = this.checkFileExists(filePath);
                    const result = await Promise.race([checkPromise, timeoutPromise]);
                    
                    results.set(filePath, result);
                } catch (error) {
                    results.set(filePath, { exists: false, error: error.message });
                }
            });
            
            await Promise.allSettled(promises);
        }
        
        return results;
    }

    /**
     * Create batches for processing
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Log file access attempts
     */
    logFileAccess(filePath, action, details = {}) {
        const timestamp = Date.now();
        const entry = {
            timestamp,
            filePath,
            action,
            userAgent: navigator.userAgent,
            origin: window.location.origin,
            referrer: document.referrer,
            ...details
        };

        // Store in memory log
        if (!this.accessLog.has(filePath)) {
            this.accessLog.set(filePath, []);
        }
        
        const fileLog = this.accessLog.get(filePath);
        fileLog.push(entry);
        
        // Keep only last 100 entries per file
        if (fileLog.length > 100) {
            fileLog.splice(0, fileLog.length - 100);
        }

        // Log to security logger if available
        if (window.SecurityLogger) {
            window.SecurityLogger.log('info', `File access: ${action}`, entry);
        }
    }

    /**
     * Log security violation
     */
    logSecurityViolation(violation, details = {}) {
        const entry = {
            timestamp: Date.now(),
            violation,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent,
            origin: window.location.origin,
            referrer: document.referrer,
            ...details
        };

        if (window.SecurityLogger) {
            window.SecurityLogger.logSecurityViolation(violation, entry);
        } else {
            console.warn('[FILE SECURITY VIOLATION]', violation, entry);
        }
    }

    /**
     * Get client IP (best effort)
     */
    getClientIP() {
        // This is limited in browsers, but we can try some techniques
        try {
            // This won't work in most browsers due to privacy restrictions
            // but we include it for completeness
            return 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Get access statistics
     */
    getAccessStatistics() {
        const stats = {
            totalFiles: this.accessLog.size,
            totalAccesses: 0,
            accessesByAction: {},
            topFiles: [],
            recentActivity: []
        };

        const fileAccesses = [];

        for (const [filePath, entries] of this.accessLog.entries()) {
            stats.totalAccesses += entries.length;
            
            fileAccesses.push({
                filePath,
                accessCount: entries.length,
                lastAccess: Math.max(...entries.map(e => e.timestamp)),
                actions: entries.reduce((acc, e) => {
                    acc[e.action] = (acc[e.action] || 0) + 1;
                    return acc;
                }, {})
            });

            // Count actions globally
            entries.forEach(entry => {
                stats.accessesByAction[entry.action] = (stats.accessesByAction[entry.action] || 0) + 1;
            });
        }

        // Sort by access count for top files
        stats.topFiles = fileAccesses
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 10);

        // Get recent activity (last 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        stats.recentActivity = [];
        
        for (const [filePath, entries] of this.accessLog.entries()) {
            const recentEntries = entries.filter(e => e.timestamp > oneDayAgo);
            if (recentEntries.length > 0) {
                stats.recentActivity.push({
                    filePath,
                    recentAccesses: recentEntries.length,
                    lastAccess: Math.max(...recentEntries.map(e => e.timestamp))
                });
            }
        }

        stats.recentActivity.sort((a, b) => b.lastAccess - a.lastAccess);

        return stats;
    }

    /**
     * Clear old access logs
     */
    clearOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const cutoff = Date.now() - maxAge;
        
        for (const [filePath, entries] of this.accessLog.entries()) {
            const recentEntries = entries.filter(e => e.timestamp > cutoff);
            if (recentEntries.length === 0) {
                this.accessLog.delete(filePath);
            } else {
                this.accessLog.set(filePath, recentEntries);
            }
        }
    }
}

// Initialize file access security
const fileAccessSecurity = new FileAccessSecurity();

// Clean old logs periodically (every hour)
setInterval(() => {
    fileAccessSecurity.clearOldLogs();
}, 60 * 60 * 1000);

// Export for global use
if (typeof window !== 'undefined') {
    window.FileAccessSecurity = FileAccessSecurity;
    window.fileAccessSecurity = fileAccessSecurity;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileAccessSecurity };
}
