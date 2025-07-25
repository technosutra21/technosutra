/**
 * Async Utilities Module for Techno Sutra AR
 * Modern asynchronous utilities with proper error handling and cancellation
 * @module AsyncUtils
 */

import logger from '../core/logger.js';

const log = logger.createContext('Async');

/**
 * Sleep for specified duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Timeout wrapper for promises
 * @param {Promise} promise - Promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} [message] - Custom timeout message
 * @returns {Promise} Promise with timeout
 */
export const withTimeout = (promise, ms, message = 'Operation timed out') => {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
    
    return Promise.race([promise, timeout]);
};

/**
 * Retry promise with exponential backoff
 * @param {Function} fn - Function that returns a promise
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves when retry succeeds
 */
export const retry = async (fn, options = {}) => {
    const {
        maxAttempts = 3,
        delay = 1000,
        backoff = 2,
        maxDelay = 10000,
        onRetry = null
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxAttempts) {
                throw error;
            }
            
            const retryDelay = Math.min(delay * Math.pow(backoff, attempt - 1), maxDelay);
            
            if (onRetry) {
                onRetry(error, attempt, retryDelay);
            }
            
            log.warn(`Attempt ${attempt} failed, retrying in ${retryDelay}ms`, error.message);
            await sleep(retryDelay);
        }
    }
    
    throw lastError;
};

/**
 * Create cancellable promise
 * @param {Function} executor - Promise executor function
 * @returns {Object} Object with promise and cancel function
 */
export const cancellable = (executor) => {
    let cancelled = false;
    let cancelReject;
    
    const promise = new Promise((resolve, reject) => {
        cancelReject = reject;
        
        const wrappedResolve = (value) => {
            if (!cancelled) resolve(value);
        };
        
        const wrappedReject = (error) => {
            if (!cancelled) reject(error);
        };
        
        executor(wrappedResolve, wrappedReject);
    });
    
    const cancel = (reason = 'Operation cancelled') => {
        if (!cancelled) {
            cancelled = true;
            cancelReject(new Error(reason));
        }
    };
    
    return { promise, cancel };
};

/**
 * Create abort controller with timeout
 * @param {number} [timeout] - Timeout in milliseconds
 * @returns {AbortController} Abort controller
 */
export const createAbortController = (timeout = null) => {
    const controller = new AbortController();
    
    if (timeout) {
        setTimeout(() => {
            if (!controller.signal.aborted) {
                controller.abort();
            }
        }, timeout);
    }
    
    return controller;
};

/**
 * Parallel execution with limit
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Function to process each item
 * @param {number} [limit=5] - Maximum concurrent operations
 * @returns {Promise<Array>} Array of results
 */
export const parallelLimit = async (items, processor, limit = 5) => {
    const results = new Array(items.length);
    const executing = [];
    
    for (let i = 0; i < items.length; i++) {
        const promise = processor(items[i], i).then(result => {
            results[i] = result;
        });
        
        executing.push(promise);
        
        if (executing.length >= limit) {
            await Promise.race(executing);
            executing.splice(executing.findIndex(p => p === promise), 1);
        }
    }
    
    await Promise.all(executing);
    return results;
};

/**
 * Queue for sequential execution
 */
export class AsyncQueue {
    #queue = [];
    #running = false;

    /**
     * Add task to queue
     * @param {Function} task - Async task function
     * @returns {Promise} Promise that resolves when task completes
     */
    add(task) {
        return new Promise((resolve, reject) => {
            this.#queue.push({
                task,
                resolve,
                reject
            });
            
            this.#process();
        });
    }

    /**
     * Process queue
     * @private
     */
    async #process() {
        if (this.#running || this.#queue.length === 0) {
            return;
        }
        
        this.#running = true;
        
        while (this.#queue.length > 0) {
            const { task, resolve, reject } = this.#queue.shift();
            
            try {
                const result = await task();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
        
        this.#running = false;
    }

    /**
     * Clear all pending tasks
     */
    clear() {
        const remainingTasks = this.#queue.splice(0);
        remainingTasks.forEach(({ reject }) => {
            reject(new Error('Queue cleared'));
        });
    }

    /**
     * Get queue size
     * @returns {number} Number of pending tasks
     */
    get size() {
        return this.#queue.length;
    }

    /**
     * Check if queue is empty
     * @returns {boolean} True if queue is empty
     */
    get isEmpty() {
        return this.#queue.length === 0;
    }

    /**
     * Check if queue is running
     * @returns {boolean} True if queue is processing
     */
    get isRunning() {
        return this.#running;
    }
}

/**
 * Batch processor for handling large datasets
 */
export class BatchProcessor {
    #batchSize;
    #delay;
    #processor;
    #onProgress;
    
    constructor(processor, options = {}) {
        this.#processor = processor;
        this.#batchSize = options.batchSize || 10;
        this.#delay = options.delay || 100;
        this.#onProgress = options.onProgress || null;
    }

    /**
     * Process items in batches
     * @param {Array} items - Items to process
     * @returns {Promise<Array>} Processed results
     */
    async process(items) {
        const results = [];
        const totalBatches = Math.ceil(items.length / this.#batchSize);
        
        for (let i = 0; i < items.length; i += this.#batchSize) {
            const batch = items.slice(i, i + this.#batchSize);
            const batchNumber = Math.floor(i / this.#batchSize) + 1;
            
            log.debug(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
            
            const batchResults = await Promise.all(
                batch.map(item => this.#processor(item))
            );
            
            results.push(...batchResults);
            
            if (this.#onProgress) {
                this.#onProgress({
                    batch: batchNumber,
                    totalBatches,
                    processed: results.length,
                    total: items.length,
                    progress: (results.length / items.length) * 100
                });
            }
            
            // Add delay between batches to prevent overwhelming
            if (i + this.#batchSize < items.length && this.#delay > 0) {
                await sleep(this.#delay);
            }
        }
        
        return results;
    }
}

/**
 * Resource pool for managing limited resources
 */
export class ResourcePool {
    #resources = [];
    #available = [];
    #waitQueue = [];
    #maxSize;

    constructor(factory, maxSize = 5) {
        this.#maxSize = maxSize;
        this.factory = factory;
    }

    /**
     * Acquire resource from pool
     * @returns {Promise} Promise resolving to resource
     */
    async acquire() {
        // Return available resource if exists
        if (this.#available.length > 0) {
            return this.#available.pop();
        }
        
        // Create new resource if pool not full
        if (this.#resources.length < this.#maxSize) {
            const resource = await this.factory();
            this.#resources.push(resource);
            return resource;
        }
        
        // Wait for resource to become available
        return new Promise((resolve) => {
            this.#waitQueue.push(resolve);
        });
    }

    /**
     * Release resource back to pool
     * @param {*} resource - Resource to release
     */
    release(resource) {
        if (this.#waitQueue.length > 0) {
            const resolve = this.#waitQueue.shift();
            resolve(resource);
        } else {
            this.#available.push(resource);
        }
    }

    /**
     * Use resource with automatic release
     * @param {Function} fn - Function to execute with resource
     * @returns {Promise} Promise resolving to function result
     */
    async use(fn) {
        const resource = await this.acquire();
        
        try {
            return await fn(resource);
        } finally {
            this.release(resource);
        }
    }

    /**
     * Destroy all resources in pool
     * @param {Function} [destroyer] - Function to destroy resources
     */
    async destroy(destroyer = null) {
        if (destroyer) {
            await Promise.all(this.#resources.map(destroyer));
        }
        
        this.#resources = [];
        this.#available = [];
        
        // Reject all waiting promises
        this.#waitQueue.forEach(resolve => {
            resolve(Promise.reject(new Error('Resource pool destroyed')));
        });
        this.#waitQueue = [];
    }

    /**
     * Get pool statistics
     * @returns {Object} Pool statistics
     */
    get stats() {
        return {
            total: this.#resources.length,
            available: this.#available.length,
            inUse: this.#resources.length - this.#available.length,
            waiting: this.#waitQueue.length,
            maxSize: this.#maxSize
        };
    }
}

/**
 * Circuit breaker for handling unreliable operations
 */
export class CircuitBreaker {
    #state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    #failureCount = 0;
    #lastFailureTime = null;
    #successCount = 0;
    
    constructor(options = {}) {
        this.threshold = options.threshold || 5;
        this.timeout = options.timeout || 60000;
        this.monitoringPeriod = options.monitoringPeriod || 10000;
        this.onStateChange = options.onStateChange || null;
    }

    /**
     * Execute operation through circuit breaker
     * @param {Function} operation - Operation to execute
     * @returns {Promise} Promise resolving to operation result
     */
    async execute(operation) {
        if (this.#state === 'OPEN') {
            if (Date.now() - this.#lastFailureTime < this.timeout) {
                throw new Error('Circuit breaker is OPEN');
            } else {
                this.#state = 'HALF_OPEN';
                this.#successCount = 0;
                this.#notifyStateChange();
            }
        }

        try {
            const result = await operation();
            this.#onSuccess();
            return result;
        } catch (error) {
            this.#onFailure();
            throw error;
        }
    }

    /**
     * Handle successful operation
     * @private
     */
    #onSuccess() {
        this.#failureCount = 0;
        
        if (this.#state === 'HALF_OPEN') {
            this.#successCount++;
            if (this.#successCount >= 3) {
                this.#state = 'CLOSED';
                this.#notifyStateChange();
            }
        }
    }

    /**
     * Handle failed operation
     * @private
     */
    #onFailure() {
        this.#failureCount++;
        this.#lastFailureTime = Date.now();
        
        if (this.#failureCount >= this.threshold) {
            this.#state = 'OPEN';
            this.#notifyStateChange();
        }
    }

    /**
     * Notify state change
     * @private
     */
    #notifyStateChange() {
        log.info(`Circuit breaker state changed to: ${this.#state}`);
        
        if (this.onStateChange) {
            this.onStateChange(this.#state);
        }
    }

    /**
     * Get circuit breaker state
     * @returns {string} Current state
     */
    get state() {
        return this.#state;
    }

    /**
     * Reset circuit breaker
     */
    reset() {
        this.#state = 'CLOSED';
        this.#failureCount = 0;
        this.#lastFailureTime = null;
        this.#successCount = 0;
        this.#notifyStateChange();
    }
}

/**
 * Debounced async function
 * @param {Function} fn - Async function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounceAsync = (fn, delay) => {
    let timeoutId;
    let latestPromise;
    
    return function (...args) {
        return new Promise((resolve, reject) => {
            clearTimeout(timeoutId);
            
            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn.apply(this, args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    };
};

/**
 * Create promise that resolves when condition is met
 * @param {Function} condition - Function that returns boolean
 * @param {number} [interval=100] - Check interval in milliseconds
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<void>} Promise that resolves when condition is met
 */
export const waitFor = (condition, interval = 100, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
            if (condition()) {
                resolve();
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error('Condition timeout'));
            } else {
                setTimeout(check, interval);
            }
        };
        
        check();
    });
};
