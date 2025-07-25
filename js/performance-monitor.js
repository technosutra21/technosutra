// Performance Monitor for Techno Sutra AR
// Real-time performance monitoring and optimization suggestions

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTimes: {},
            renderTimes: [],
            memoryUsage: [],
            networkRequests: [],
            cacheHitRate: 0,
            modelLoadTimes: {},
            arSessionMetrics: {}
        };
        
        this.observers = new Map();
        this.isMonitoring = false;
        this.reportInterval = null;
        
        this.init();
    }

    init() {
        this.setupPerformanceObservers();
        this.monitorMemoryUsage();
        this.monitorNetworkRequests();
        this.startMonitoring();
    }

    // Setup performance observers
    setupPerformanceObservers() {
        // Navigation timing
        if ('PerformanceObserver' in window) {
            // Navigation timing
            const navigationObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordNavigationTiming(entry);
                }
            });
            
            try {
                navigationObserver.observe({ entryTypes: ['navigation'] });
                this.observers.set('navigation', navigationObserver);
            } catch (e) {
                console.warn('Navigation timing not supported');
            }

            // Resource timing
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordResourceTiming(entry);
                }
            });
            
            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.set('resource', resourceObserver);
            } catch (e) {
                console.warn('Resource timing not supported');
            }

            // Measure timing
            const measureObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMeasureTiming(entry);
                }
            });
            
            try {
                measureObserver.observe({ entryTypes: ['measure'] });
                this.observers.set('measure', measureObserver);
            } catch (e) {
                console.warn('Measure timing not supported');
            }

            // Long tasks (performance bottlenecks)
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordLongTask(entry);
                }
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longtask', longTaskObserver);
            } catch (e) {
                console.warn('Long task timing not supported');
            }

            // Layout shifts
            const layoutShiftObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordLayoutShift(entry);
                }
            });
            
            try {
                layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('layout-shift', layoutShiftObserver);
            } catch (e) {
                console.warn('Layout shift timing not supported');
            }
        }
    }

    // Record navigation timing
    recordNavigationTiming(entry) {
        this.metrics.loadTimes = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            totalLoad: entry.loadEventEnd - entry.navigationStart,
            ttfb: entry.responseStart - entry.navigationStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
        };

        this.reportMetric('Navigation', this.metrics.loadTimes);
    }

    // Record resource timing
    recordResourceTiming(entry) {
        const resource = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || entry.encodedBodySize,
            type: this.getResourceType(entry.name),
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
        };

        this.metrics.networkRequests.push(resource);
        
        // Track model loading specifically
        if (resource.name.includes('.glb') || resource.name.includes('.usdz')) {
            const modelId = this.extractModelId(resource.name);
            if (modelId) {
                this.metrics.modelLoadTimes[modelId] = {
                    duration: resource.duration,
                    size: resource.size,
                    cached: resource.cached
                };
            }
        }

        this.updateCacheHitRate();
    }

    // Record custom measurements
    recordMeasureTiming(entry) {
        if (entry.name.startsWith('model-load-')) {
            const modelId = entry.name.replace('model-load-', '');
            if (!this.metrics.modelLoadTimes[modelId]) {
                this.metrics.modelLoadTimes[modelId] = {};
            }
            this.metrics.modelLoadTimes[modelId].totalDuration = entry.duration;
        }
        
        if (entry.name.startsWith('ar-session-')) {
            const sessionType = entry.name.replace('ar-session-', '');
            this.metrics.arSessionMetrics[sessionType] = entry.duration;
        }
    }

    // Record long tasks (performance bottlenecks)
    recordLongTask(entry) {
        const longTask = {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name || 'unknown'
        };

        if (!this.metrics.longTasks) {
            this.metrics.longTasks = [];
        }
        
        this.metrics.longTasks.push(longTask);
        
        // Warn about long tasks
        if (entry.duration > 50) {
            console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
        }
    }

    // Record layout shifts
    recordLayoutShift(entry) {
        if (!this.metrics.layoutShifts) {
            this.metrics.layoutShifts = [];
        }
        
        this.metrics.layoutShifts.push({
            value: entry.value,
            hadRecentInput: entry.hadRecentInput,
            startTime: entry.startTime
        });
    }

    // Monitor memory usage
    monitorMemoryUsage() {
        if ('memory' in performance) {
            const recordMemory = () => {
                const memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                this.metrics.memoryUsage.push(memory);
                
                // Keep only last 50 measurements
                if (this.metrics.memoryUsage.length > 50) {
                    this.metrics.memoryUsage.shift();
                }
                
                // Warn about memory usage
                const usagePercent = (memory.used / memory.limit) * 100;
                if (usagePercent > 80) {
                    console.warn(`[Performance] High memory usage: ${usagePercent.toFixed(1)}%`);
                }
            };

            // Record memory every 5 seconds
            setInterval(recordMemory, 5000);
            recordMemory(); // Initial reading
        }
    }

    // Monitor network requests
    monitorNetworkRequests() {
        // Override fetch to track requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch.apply(window, args);
                const duration = performance.now() - startTime;
                
                this.recordNetworkRequest({
                    url,
                    duration,
                    status: response.status,
                    size: response.headers.get('content-length'),
                    cached: response.headers.get('x-cache') === 'HIT'
                });
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                this.recordNetworkRequest({
                    url,
                    duration,
                    status: 0,
                    error: error.message
                });
                throw error;
            }
        };
    }

    // Record network request
    recordNetworkRequest(request) {
        this.metrics.networkRequests.push({
            ...request,
            timestamp: Date.now()
        });
        
        // Keep only last 100 requests
        if (this.metrics.networkRequests.length > 100) {
            this.metrics.networkRequests.shift();
        }
    }

    // Update cache hit rate
    updateCacheHitRate() {
        const cachedRequests = this.metrics.networkRequests.filter(r => r.cached).length;
        const totalRequests = this.metrics.networkRequests.length;
        
        if (totalRequests > 0) {
            this.metrics.cacheHitRate = (cachedRequests / totalRequests) * 100;
        }
    }

    // Start monitoring
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Report metrics every 30 seconds
        this.reportInterval = setInterval(() => {
            this.generateReport();
        }, 30000);
        
        console.log('[Performance] Monitoring started');
    }

    // Stop monitoring
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
        
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        console.log('[Performance] Monitoring stopped');
    }

    // Generate performance report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            loadTimes: this.metrics.loadTimes,
            cacheHitRate: this.metrics.cacheHitRate.toFixed(1) + '%',
            memoryUsage: this.getCurrentMemoryUsage(),
            modelLoadTimes: this.metrics.modelLoadTimes,
            networkSummary: this.getNetworkSummary(),
            recommendations: this.getRecommendations()
        };

        console.log('[Performance Report]', report);
        
        // Store in localStorage for analysis
        this.storeReport(report);
        
        return report;
    }

    // Get current memory usage
    getCurrentMemoryUsage() {
        if ('memory' in performance && this.metrics.memoryUsage.length > 0) {
            const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
            return {
                used: this.formatBytes(latest.used),
                total: this.formatBytes(latest.total),
                usagePercent: ((latest.used / latest.limit) * 100).toFixed(1) + '%'
            };
        }
        return null;
    }

    // Get network summary
    getNetworkSummary() {
        const requests = this.metrics.networkRequests;
        if (requests.length === 0) return null;
        
        const totalSize = requests.reduce((sum, r) => sum + (parseInt(r.size) || 0), 0);
        const avgDuration = requests.reduce((sum, r) => sum + r.duration, 0) / requests.length;
        const failedRequests = requests.filter(r => r.status >= 400 || r.error).length;
        
        return {
            totalRequests: requests.length,
            totalSize: this.formatBytes(totalSize),
            avgDuration: avgDuration.toFixed(2) + 'ms',
            failureRate: ((failedRequests / requests.length) * 100).toFixed(1) + '%',
            cacheHitRate: this.metrics.cacheHitRate.toFixed(1) + '%'
        };
    }

    // Get performance recommendations
    getRecommendations() {
        const recommendations = [];
        
        // Check load times
        if (this.metrics.loadTimes.totalLoad > 3000) {
            recommendations.push('Page load time is slow (>3s). Consider optimizing assets.');
        }
        
        // Check cache hit rate
        if (this.metrics.cacheHitRate < 50) {
            recommendations.push('Low cache hit rate. Improve caching strategy.');
        }
        
        // Check memory usage
        const currentMemory = this.getCurrentMemoryUsage();
        if (currentMemory && parseFloat(currentMemory.usagePercent) > 80) {
            recommendations.push('High memory usage detected. Monitor for memory leaks.');
        }
        
        // Check model load times
        const slowModels = Object.entries(this.metrics.modelLoadTimes)
            .filter(([_, data]) => data.duration > 5000)
            .map(([id]) => id);
        
        if (slowModels.length > 0) {
            recommendations.push(`Slow model loading detected: ${slowModels.join(', ')}`);
        }
        
        // Check long tasks
        if (this.metrics.longTasks && this.metrics.longTasks.length > 0) {
            const avgLongTask = this.metrics.longTasks.reduce((sum, t) => sum + t.duration, 0) / this.metrics.longTasks.length;
            if (avgLongTask > 100) {
                recommendations.push('Multiple long tasks detected. Optimize JavaScript execution.');
            }
        }
        
        // Check layout shifts
        if (this.metrics.layoutShifts && this.metrics.layoutShifts.length > 0) {
            const totalShift = this.metrics.layoutShifts.reduce((sum, s) => sum + s.value, 0);
            if (totalShift > 0.1) {
                recommendations.push('High Cumulative Layout Shift detected. Optimize layout stability.');
            }
        }
        
        return recommendations.length > 0 ? recommendations : ['Performance looks good!'];
    }

    // Store report in localStorage
    storeReport(report) {
        try {
            const reports = JSON.parse(localStorage.getItem('technosutra_perf_reports') || '[]');
            reports.push(report);
            
            // Keep only last 10 reports
            if (reports.length > 10) {
                reports.shift();
            }
            
            localStorage.setItem('technosutra_perf_reports', JSON.stringify(reports));
        } catch (error) {
            console.warn('Failed to store performance report:', error);
        }
    }

    // Utility methods
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }

    getResourceType(url) {
        if (url.includes('.glb') || url.includes('.usdz')) return 'model';
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'stylesheet';
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) return 'image';
        return 'other';
    }

    extractModelId(url) {
        const match = url.match(/modelo(\d+)\.(glb|usdz)/);
        return match ? match[1] : null;
    }

    formatBytes(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    reportMetric(category, data) {
        console.log(`[Performance - ${category}]`, data);
    }

    // Public API methods
    markStart(name) {
        performance.mark(`${name}-start`);
    }

    markEnd(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getStoredReports() {
        try {
            return JSON.parse(localStorage.getItem('technosutra_perf_reports') || '[]');
        } catch {
            return [];
        }
    }

    clearStoredReports() {
        localStorage.removeItem('technosutra_perf_reports');
    }
}

// Initialize performance monitor if not in production
let performanceMonitor;
if (typeof window !== 'undefined' && !window.location.hostname.includes('production-domain.com')) {
    performanceMonitor = new PerformanceMonitor();
    
    // Expose to global scope for debugging
    window.performanceMonitor = performanceMonitor;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
