/**
 * Modern Service Worker for Techno Sutra AR
 * ES6+ service worker with improved caching strategies and error handling
 */

// Service Worker version and cache names
const SW_VERSION = '2.0.0';
const CACHE_PREFIX = 'techno-sutra-ar';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-v${SW_VERSION}`;
const MODEL_CACHE = `${CACHE_PREFIX}-models-v${SW_VERSION}`;

// Cache configuration
const CACHE_CONFIG = {
    static: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxEntries: 50
    },
    dynamic: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        maxEntries: 100
    },
    models: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxEntries: 20
    }
};

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/galeria.html',
    '/manifest.json',
    '/js/app/TechnoSutraAR.js',
    '/js/core/config.js',
    '/js/core/logger.js',
    '/js/utils/dom.js',
    '/js/utils/async.js',
    '/js/components/ModelViewer.js'
];

// Available models (will be updated dynamically)
const AVAILABLE_MODELS = [
    '/modelo1.glb', '/modelo2.glb', '/modelo3.glb', '/modelo4.glb', '/modelo5.glb',
    '/modelo6.glb', '/modelo8.glb', '/modelo9.glb', '/modelo10.glb', '/modelo11.glb',
    '/modelo12.glb', '/modelo15.glb', '/modelo17.glb', '/modelo18.glb', '/modelo19.glb',
    '/modelo20.glb', '/modelo21.glb', '/modelo22.glb', '/modelo23.glb', '/modelo24.glb',
    '/modelo26.glb', '/modelo28.glb', '/modelo29.glb', '/modelo30.glb', '/modelo31.glb',
    '/modelo32.glb', '/modelo33.glb', '/modelo34.glb', '/modelo35.glb', '/modelo36.glb',
    '/modelo37.glb', '/modelo38.glb', '/modelo39.glb', '/modelo40.glb', '/modelo41.glb',
    '/modelo42.glb', '/modelo44.glb', '/modelo45.glb', '/modelo46.glb', '/modelo47.glb',
    '/modelo48.glb', '/modelo49.glb', '/modelo50.glb', '/modelo51.glb', '/modelo54.glb',
    '/modelo55.glb', '/modelo56.glb'
];

// Network patterns for different caching strategies
const NETWORK_FIRST_PATTERNS = [
    /^https:\/\/ajax\.googleapis\.com\/ajax\/libs\/model-viewer/,
    /\.glb$/,
    /\.usdz$/,
    /^https:\/\/modelviewer\.dev/
];

const CACHE_FIRST_PATTERNS = [
    /\.(jpg|jpeg|png|gif|webp|svg)$/,
    /\.(css|js)$/,
    /\.(woff|woff2|ttf|eot)$/
];

// Logging utilities
const log = (level, message, ...args) => {
    if (level === 'error' || self.location.hostname === 'localhost') {
        console[level](`[SW ${SW_VERSION}] ${message}`, ...args);
    }
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    log('info', 'Installing service worker...');
    
    event.waitUntil(
        Promise.all([
            cacheStaticAssets(),
            precachePopularModels()
        ]).then(() => {
            log('info', '✅ Service worker installation complete');
            return self.skipWaiting();
        }).catch((error) => {
            log('error', '❌ Service worker installation failed:', error);
        })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    log('info', 'Activating service worker...');
    
    event.waitUntil(
        cleanupOldCaches()
            .then(() => {
                log('info', '✅ Service worker activation complete');
                return self.clients.claim();
            })
            .catch((error) => {
                log('error', '❌ Service worker activation failed:', error);
            })
    );
});

/**
 * Fetch event - handle network requests
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    // Skip non-GET requests and non-HTTP(S) requests
    if (request.method !== 'GET' || !request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(handleRequest(request));
});

/**
 * Message event - handle messages from main thread
 */
self.addEventListener('message', (event) => {
    handleMessage(event);
});

/**
 * Cache static assets
 */
async function cacheStaticAssets() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const responses = await Promise.allSettled(
            STATIC_ASSETS.map(asset => 
                cache.add(asset).catch(error => 
                    log('warn', `Failed to cache static asset: ${asset}`, error)
                )
            )
        );
        
        const successful = responses.filter(r => r.status === 'fulfilled').length;
        log('info', `Cached ${successful}/${STATIC_ASSETS.length} static assets`);
        
    } catch (error) {
        log('error', 'Failed to cache static assets:', error);
        throw error;
    }
}

/**
 * Precache popular models
 */
async function precachePopularModels() {
    try {
        const cache = await caches.open(MODEL_CACHE);
        const popularModels = AVAILABLE_MODELS.slice(0, 3); // Cache first 3 models
        
        const responses = await Promise.allSettled(
            popularModels.map(model => 
                cache.add(model).catch(error => 
                    log('debug', `Model not available for precaching: ${model}`)
                )
            )
        );
        
        const successful = responses.filter(r => r.status === 'fulfilled').length;
        log('info', `Precached ${successful}/${popularModels.length} models`);
        
    } catch (error) {
        log('warn', 'Failed to precache models:', error);
    }
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, MODEL_CACHE];
        
        const oldCaches = cacheNames.filter(name => 
            name.startsWith(CACHE_PREFIX) && !currentCaches.includes(name)
        );
        
        if (oldCaches.length > 0) {
            await Promise.all(oldCaches.map(name => caches.delete(name)));
            log('info', `Cleaned up ${oldCaches.length} old caches:`, oldCaches);
        }
        
    } catch (error) {
        log('error', 'Failed to cleanup old caches:', error);
    }
}

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Determine caching strategy based on URL pattern
        if (isNetworkFirst(url)) {
            return await networkFirstStrategy(request);
        } else if (isCacheFirst(url)) {
            return await cacheFirstStrategy(request);
        } else if (isHTMLRequest(request)) {
            return await staleWhileRevalidateStrategy(request);
        } else {
            return await networkFirstStrategy(request);
        }
        
    } catch (error) {
        log('debug', `Request failed: ${url.pathname}`, error.message);
        return await handleOfflineFallback(request);
    }
}

/**
 * Network-first caching strategy
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        const cachedResponse = await getCachedResponse(request);
        
        if (cachedResponse) {
            log('debug', `Serving from cache: ${request.url}`);
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Cache-first caching strategy
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await getCachedResponse(request);
    
    if (cachedResponse && !isExpired(cachedResponse)) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        if (cachedResponse) {
            log('debug', `Serving stale cache: ${request.url}`);
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Stale-while-revalidate caching strategy
 */
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await getCachedResponse(request);
    
    // Start network request in background
    const networkPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cacheResponse(request, response.clone());
            }
            return response;
        })
        .catch(error => {
            log('debug', `Background update failed: ${request.url}`);
        });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        // Don't wait for network request
        networkPromise;
        return cachedResponse;
    }
    
    // If no cache, wait for network
    return await networkPromise;
}

/**
 * Cache response with appropriate cache name
 */
async function cacheResponse(request, response) {
    const url = new URL(request.url);
    let cacheName;
    
    if (isModelRequest(url)) {
        cacheName = MODEL_CACHE;
    } else if (isStaticAsset(url)) {
        cacheName = STATIC_CACHE;
    } else {
        cacheName = DYNAMIC_CACHE;
    }
    
    try {
        const cache = await caches.open(cacheName);
        
        // Add timestamp header for expiration checking
        const responseWithTimestamp = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...Object.fromEntries(response.headers.entries()),
                'sw-cached-at': Date.now().toString()
            }
        });
        
        await cache.put(request, responseWithTimestamp);
        
        // Cleanup cache if needed
        await cleanupCache(cacheName);
        
    } catch (error) {
        log('warn', `Failed to cache response: ${request.url}`, error);
    }
}

/**
 * Get cached response
 */
async function getCachedResponse(request) {
    const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, MODEL_CACHE];
    
    for (const cacheName of cacheNames) {
        try {
            const cache = await caches.open(cacheName);
            const response = await cache.match(request);
            
            if (response) {
                return response;
            }
        } catch (error) {
            log('debug', `Cache lookup failed in ${cacheName}:`, error);
        }
    }
    
    return null;
}

/**
 * Check if cached response is expired
 */
function isExpired(response) {
    const cachedAt = response.headers.get('sw-cached-at');
    
    if (!cachedAt) {
        return false; // No timestamp, assume valid
    }
    
    const age = Date.now() - parseInt(cachedAt);
    const url = new URL(response.url);
    
    let maxAge;
    if (isModelRequest(url)) {
        maxAge = CACHE_CONFIG.models.maxAge;
    } else if (isStaticAsset(url)) {
        maxAge = CACHE_CONFIG.static.maxAge;
    } else {
        maxAge = CACHE_CONFIG.dynamic.maxAge;
    }
    
    return age > maxAge;
}

/**
 * Cleanup cache based on configuration
 */
async function cleanupCache(cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        let config;
        if (cacheName === MODEL_CACHE) {
            config = CACHE_CONFIG.models;
        } else if (cacheName === STATIC_CACHE) {
            config = CACHE_CONFIG.static;
        } else {
            config = CACHE_CONFIG.dynamic;
        }
        
        // Remove oldest entries if cache is too large
        if (requests.length > config.maxEntries) {
            const entriesToDelete = requests.slice(0, requests.length - config.maxEntries);
            await Promise.all(entriesToDelete.map(request => cache.delete(request)));
            
            log('debug', `Cleaned up ${entriesToDelete.length} entries from ${cacheName}`);
        }
        
    } catch (error) {
        log('warn', `Failed to cleanup cache ${cacheName}:`, error);
    }
}

/**
 * Handle offline fallback
 */
async function handleOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML requests, return cached index.html
    if (isHTMLRequest(request)) {
        const cachedPage = await getCachedResponse(new Request('/index.html'));
        if (cachedPage) {
            return cachedPage;
        }
    }
    
    // For model requests, return specific error response
    if (isModelRequest(url)) {
        return new Response(
            JSON.stringify({
                error: 'Modelo não disponível offline',
                model: url.pathname,
                timestamp: new Date().toISOString()
            }),
            {
                status: 404,
                statusText: 'Not Found',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            }
        );
    }
    
    // Generic offline response
    return new Response(
        JSON.stringify({
            error: 'Recurso não disponível offline',
            url: request.url,
            timestamp: new Date().toISOString()
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        }
    );
}

/**
 * Handle messages from main thread
 */
async function handleMessage(event) {
    const { data, ports } = event;
    const port = ports?.[0];
    
    if (!data || typeof data !== 'object') {
        return;
    }
    
    try {
        let response = null;
        
        switch (data.type) {
            case 'SKIP_WAITING':
                await self.skipWaiting();
                break;
                
            case 'CACHE_RESOURCE':
                response = await cacheSpecificResource(data.url);
                break;
                
            case 'GET_CACHE_INFO':
                response = await getCacheInfo();
                break;
                
            case 'CLEAR_CACHE':
                response = await clearSpecificCache(data.cacheName);
                break;
                
            case 'IS_CACHED':
                response = await checkIfCached(data.url);
                break;
                
            default:
                log('warn', `Unknown message type: ${data.type}`);
        }
        
        if (port && response !== null) {
            port.postMessage(response);
        }
        
    } catch (error) {
        log('error', `Message handler error for ${data.type}:`, error);
        
        if (port) {
            port.postMessage({ error: error.message });
        }
    }
}

/**
 * Cache specific resource
 */
async function cacheSpecificResource(url) {
    try {
        const request = new Request(url);
        const response = await fetch(request);
        
        if (response.ok) {
            await cacheResponse(request, response.clone());
            return { success: true, url };
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        log('error', `Failed to cache resource ${url}:`, error);
        return { success: false, url, error: error.message };
    }
}

/**
 * Get cache information
 */
async function getCacheInfo() {
    try {
        const cacheNames = await caches.keys();
        const info = {};
        
        for (const cacheName of cacheNames) {
            if (cacheName.startsWith(CACHE_PREFIX)) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                
                info[cacheName] = {
                    entries: requests.length,
                    urls: requests.map(req => req.url)
                };
            }
        }
        
        return { caches: info, version: SW_VERSION };
        
    } catch (error) {
        log('error', 'Failed to get cache info:', error);
        return { error: error.message };
    }
}

/**
 * Clear specific cache
 */
async function clearSpecificCache(cacheName) {
    try {
        if (cacheName) {
            const deleted = await caches.delete(cacheName);
            return { success: deleted, cacheName };
        } else {
            // Clear all app caches
            const cacheNames = await caches.keys();
            const appCaches = cacheNames.filter(name => name.startsWith(CACHE_PREFIX));
            
            const results = await Promise.all(
                appCaches.map(name => caches.delete(name))
            );
            
            return { 
                success: results.every(Boolean), 
                cleared: appCaches.length 
            };
        }
    } catch (error) {
        log('error', 'Failed to clear cache:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if resource is cached
 */
async function checkIfCached(url) {
    try {
        const request = new Request(url);
        const response = await getCachedResponse(request);
        
        return { 
            cached: response !== null,
            url,
            expired: response ? isExpired(response) : false
        };
    } catch (error) {
        return { cached: false, url, error: error.message };
    }
}

/**
 * URL pattern matchers
 */
function isNetworkFirst(url) {
    return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.href));
}

function isCacheFirst(url) {
    return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.href));
}

function isHTMLRequest(request) {
    return request.headers.get('accept')?.includes('text/html');
}

function isModelRequest(url) {
    return /\.(glb|usdz)$/.test(url.pathname);
}

function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.pathname === asset) ||
           /\.(css|js|json|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)$/.test(url.pathname);
}

// Log service worker startup
log('info', `🚀 Modern Service Worker ${SW_VERSION} loaded`);
