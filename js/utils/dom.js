/**
 * DOM Utilities Module for Techno Sutra AR
 * Modern DOM manipulation utilities with error handling and performance optimization
 * @module DOMUtils
 */

import logger from '../core/logger.js';

const log = logger.createContext('DOM');

/**
 * Enhanced DOM selector with error handling
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context element
 * @returns {Element|null} Selected element
 */
export const $ = (selector, context = document) => {
    try {
        return context.querySelector(selector);
    } catch (error) {
        log.error(`Invalid selector: ${selector}`, error);
        return null;
    }
};

/**
 * Enhanced DOM selector for multiple elements
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context element
 * @returns {NodeList} Selected elements
 */
export const $$ = (selector, context = document) => {
    try {
        return context.querySelectorAll(selector);
    } catch (error) {
        log.error(`Invalid selector: ${selector}`, error);
        return [];
    }
};

/**
 * Create element with attributes and children
 * @param {string} tagName - Element tag name
 * @param {Object} attributes - Element attributes
 * @param {...(string|Element)} children - Child elements or text
 * @returns {Element} Created element
 */
export const createElement = (tagName, attributes = {}, ...children) => {
    const element = document.createElement(tagName);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            // Event listeners
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Add children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Element) {
            element.appendChild(child);
        }
    });
    
    return element;
};

/**
 * Wait for element to exist in DOM
 * @param {string} selector - CSS selector
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @param {Element} [context=document] - Context element
 * @returns {Promise<Element>} Promise resolving to element
 */
export const waitForElement = (selector, timeout = 5000, context = document) => {
    return new Promise((resolve, reject) => {
        const element = $(selector, context);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            const element = $(selector, context);
            if (element) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(element);
            }
        });

        const timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element not found: ${selector}`));
        }, timeout);

        observer.observe(context, {
            childList: true,
            subtree: true
        });
    });
};

/**
 * Wait for DOM content to be loaded
 * @returns {Promise<void>}
 */
export const waitForDOM = () => {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
            resolve();
        }
    });
};

/**
 * Add CSS class with animation support
 * @param {Element} element - Target element
 * @param {string} className - Class name to add
 * @param {boolean} [animate=false] - Enable CSS transitions
 */
export const addClass = (element, className, animate = false) => {
    if (!element) return;
    
    if (animate) {
        element.style.transition = 'all 0.3s ease';
    }
    
    element.classList.add(className);
};

/**
 * Remove CSS class with animation support
 * @param {Element} element - Target element
 * @param {string} className - Class name to remove
 * @param {boolean} [animate=false] - Enable CSS transitions
 */
export const removeClass = (element, className, animate = false) => {
    if (!element) return;
    
    if (animate) {
        element.style.transition = 'all 0.3s ease';
    }
    
    element.classList.remove(className);
};

/**
 * Toggle CSS class with animation support
 * @param {Element} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} [animate=false] - Enable CSS transitions
 * @returns {boolean} True if class was added, false if removed
 */
export const toggleClass = (element, className, animate = false) => {
    if (!element) return false;
    
    if (animate) {
        element.style.transition = 'all 0.3s ease';
    }
    
    return element.classList.toggle(className);
};

/**
 * Show element with optional animation
 * @param {Element} element - Element to show
 * @param {string} [display='block'] - Display style
 * @param {boolean} [animate=false] - Enable fade in animation
 */
export const show = (element, display = 'block', animate = false) => {
    if (!element) return;
    
    if (animate) {
        element.style.opacity = '0';
        element.style.display = display;
        element.style.transition = 'opacity 0.3s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    } else {
        element.style.display = display;
    }
};

/**
 * Hide element with optional animation
 * @param {Element} element - Element to hide
 * @param {boolean} [animate=false] - Enable fade out animation
 */
export const hide = (element, animate = false) => {
    if (!element) return;
    
    if (animate) {
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 300);
    } else {
        element.style.display = 'none';
    }
};

/**
 * Set text content with HTML entity encoding
 * @param {Element} element - Target element
 * @param {string} text - Text content
 */
export const setText = (element, text) => {
    if (!element) return;
    element.textContent = text;
};

/**
 * Set HTML content with sanitization warning
 * @param {Element} element - Target element
 * @param {string} html - HTML content
 * @param {boolean} [trusted=false] - Mark as trusted content
 */
export const setHTML = (element, html, trusted = false) => {
    if (!element) return;
    
    if (!trusted) {
        log.warn('Setting untrusted HTML content. Consider using setText() instead.');
    }
    
    element.innerHTML = html;
};

/**
 * Get element's position relative to viewport
 * @param {Element} element - Target element
 * @returns {Object} Position object with x, y, width, height
 */
export const getElementPosition = (element) => {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
    };
};

/**
 * Check if element is visible in viewport
 * @param {Element} element - Target element
 * @param {number} [threshold=0] - Visibility threshold (0-1)
 * @returns {boolean} True if element is visible
 */
export const isElementVisible = (element, threshold = 0) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    
    const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
    const totalArea = rect.height * rect.width;
    
    return totalArea > 0 && (visibleArea / totalArea) >= threshold;
};

/**
 * Smooth scroll to element
 * @param {Element|string} target - Target element or selector
 * @param {Object} options - Scroll options
 */
export const scrollToElement = (target, options = {}) => {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
};

/**
 * Set up intersection observer for element
 * @param {Element|string} target - Target element or selector
 * @param {Function} callback - Callback function
 * @param {Object} options - Observer options
 * @returns {IntersectionObserver} Observer instance
 */
export const observeElement = (target, callback, options = {}) => {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return null;
    
    const defaultOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(callback, { ...defaultOptions, ...options });
    observer.observe(element);
    
    return observer;
};

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
    let timeoutId;
    
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
    let inThrottle;
    
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Add event listener with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Cleanup function
 */
export const addEventListener = (element, event, handler, options = {}) => {
    if (!element) return () => {};
    
    element.addEventListener(event, handler, options);
    
    return () => {
        element.removeEventListener(event, handler, options);
    };
};

/**
 * Create custom event
 * @param {string} eventName - Event name
 * @param {*} detail - Event detail data
 * @param {Object} options - Event options
 * @returns {CustomEvent} Custom event
 */
export const createCustomEvent = (eventName, detail = null, options = {}) => {
    return new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true,
        ...options
    });
};

/**
 * Dispatch custom event on element
 * @param {Element} element - Target element
 * @param {string} eventName - Event name
 * @param {*} detail - Event detail data
 */
export const dispatchEvent = (element, eventName, detail = null) => {
    if (!element) return;
    
    const event = createCustomEvent(eventName, detail);
    element.dispatchEvent(event);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = createElement('textarea', {
                value: text,
                style: 'position: fixed; left: -999999px; top: -999999px;'
            });
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return success;
        }
    } catch (error) {
        log.error('Failed to copy to clipboard', error);
        return false;
    }
};

/**
 * Get computed style property
 * @param {Element} element - Target element
 * @param {string} property - CSS property name
 * @returns {string} Computed style value
 */
export const getComputedStyle = (element, property) => {
    if (!element) return '';
    
    return window.getComputedStyle(element).getPropertyValue(property);
};

/**
 * Set multiple CSS properties
 * @param {Element} element - Target element
 * @param {Object} styles - Style properties
 */
export const setStyles = (element, styles) => {
    if (!element) return;
    
    Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
    });
};
