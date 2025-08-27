/**
 * Extension Compatibility Handler
 * Prevents extension-related errors from breaking the application
 */

(function() {
    'use strict';
    
    // Handle chrome extension API errors gracefully
    if (typeof chrome !== 'undefined') {
        // Create safe wrapper for chrome.storage
        if (chrome.storage && typeof chrome.storage.sync === 'undefined') {
            chrome.storage.sync = {
                get: function() { return Promise.resolve({}); },
                set: function() { return Promise.resolve(); },
                remove: function() { return Promise.resolve(); },
                clear: function() { return Promise.resolve(); }
            };
        }
        
        if (chrome.storage && typeof chrome.storage.local === 'undefined') {
            chrome.storage.local = {
                get: function() { return Promise.resolve({}); },
                set: function() { return Promise.resolve(); },
                remove: function() { return Promise.resolve(); },
                clear: function() { return Promise.resolve(); }
            };
        }
    }
    
    // Override error handling for content scripts
    const originalError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        // Ignore extension-related errors
        if (source && (
            source.includes('extension://') || 
            source.includes('content.js') ||
            source.includes('error-handler.js') ||
            message.includes('chrome.storage')
        )) {
            console.warn('Extension error suppressed:', message, source);
            return true; // Prevent default error handling
        }
        
        // Call original error handler for app errors
        if (originalError) {
            return originalError.call(this, message, source, lineno, colno, error);
        }
        return false;
    };
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message) {
            const message = event.reason.message;
            if (message.includes('chrome.storage') || 
                message.includes('Extension context invalidated')) {
                console.warn('Extension promise rejection suppressed:', message);
                event.preventDefault();
                return;
            }
        }
    });
    
    console.log('Extension compatibility handler loaded');
})();