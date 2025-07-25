// Enhanced Service Worker for Techno Sutra AR
// Provides aggressive caching, offline support, and performance optimizations

const CACHE_VERSION = '1.2.0';
const STATIC_CACHE = `techno-sutra-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `techno-sutra-dynamic-v${CACHE_VERSION}`;
const MODEL_CACHE = `techno-sutra-models-v${CACHE_VERSION}`;

// Critical resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/index-optimized.html',
    '/galeria.html',
    '/galeria-optimized.html',
    '/css/critical.css',
    '/css/main.css',
    '/js/performance-utils.js',
    '/config.json',
    '/technosutra-logo.png',
    '/manifest.json'
];

// Model files pattern
const MODEL_PATTERN = /modelo\d+\.(glb|usdz)$/;

// External resources
const EXTERNAL_RESOURCES = [
    'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js'
];

// Cache size limits (in MB)
const CACHE_LIMITS = {
    [STATIC_CACHE]: 50,
    [DYNAMIC_CACHE]: 100,
    [MODEL_CACHE]: 500
};

// Install event - cache critical resources
self.addEventListener('install', event => {
    // Dev: console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        Promise.all([
            cacheStaticAssets(),
            cacheExternalResources()
        ]).then(() => {
            // Dev: console.log('[SW] Installation complete');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    // Dev: console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            self.clients.claim()
        ]).then(() => {
            // Dev: console.log('[SW] Activation complete');
        })
    );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) return;
    
    // Route requests to appropriate handlers
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isModelFile(request)) {
        event.respondWith(handleModelFile(request));
    } else if (isExternalResource(request)) {
        event.respondWith(handleExternalResource(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

// Cache static assets on install
async function cacheStaticAssets() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const responses = await Promise.allSettled(
            STATIC_ASSETS.map(url => 
                fetch(url)
                    .then(response => {
                        if (response.ok) {
                            cache.put(url, response.clone());
                        }
                        return response;
                    })
                    .catch(error => {
                        // Dev: console.warn(`[SW] Failed to cache ${url}:`, error);
                        return null;
                    })
            )
        );
        
        const successful = responses.filter(r => r.status === 'fulfilled' && r.value).length;
        // Dev: console.log(`[SW] Cached ${successful}/${STATIC_ASSETS.length} static assets`);
    } catch (error) {
        // Dev: console.error('[SW] Error caching static assets:', error);
    }
}

// Cache external resources
async function cacheExternalResources() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        
        for (const url of EXTERNAL_RESOURCES) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    // Dev: console.log(`[SW] Cached external resource: ${url}`);
                }
            } catch (error) {
                // Dev: console.warn(`[SW] Failed to cache external resource ${url}:`, error);
            }
        }
    } catch (error) {
        // Dev: console.error('[SW] Error caching external resources:', error);
    }
}

// Clean up old caches
async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
            name.startsWith('techno-sutra-') && 
            !name.includes(CACHE_VERSION)
        );
        
        await Promise.all(
            oldCaches.map(name => {
                // Dev: console.log(`[SW] Deleting old cache: ${name}`);
                return caches.delete(name);
            })
        );
        
        // Dev: console.log(`[SW] Cleaned up ${oldCaches.length} old caches`);
    } catch (error) {
        // Dev: console.error('[SW] Error cleaning up caches:', error);
    }
}

// Check if request is for a static asset
function isStaticAsset(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return STATIC_ASSETS.some(asset => pathname.endsWith(asset)) ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.svg') ||
           pathname.endsWith('.ico') ||
           pathname.endsWith('.json');
}

// Check if request is for a model file
function isModelFile(request) {
    return MODEL_PATTERN.test(new URL(request.url).pathname);
}

// Check if request is for external resource
function isExternalResource(request) {
    const url = new URL(request.url);
    return !url.origin.includes(self.location.origin);
}

// Handle static asset requests - Cache First strategy
async function handleStaticAsset(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            // Return cached version immediately
            return cached;
        }
        
        // Fetch and cache new version
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Dev: console.error('[SW] Error handling static asset:', error);
        
        // Try to return cached version as fallback
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        
        // Return offline page if available
        return new Response('Offline', { status: 503 });
    }
}

// Handle model file requests - Cache First with size management
async function handleModelFile(request) {
    try {
        const cache = await caches.open(MODEL_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            // Dev: console.log('[SW] Serving cached model:', request.url);
            return cached;
        }
        
        // Dev: console.log('[SW] Fetching model:', request.url);
        
        // Check HEAD first to validate model exists
        const headResponse = await fetch(request.url, { method: 'HEAD' });
        if (!headResponse.ok) {
            throw new Error(`Model not found: ${headResponse.status}`);
        }
        
        // Fetch full model
        const response = await fetch(request);
        
        if (response.ok) {
            // Check cache size before storing
            await manageCacheSize(MODEL_CACHE, CACHE_LIMITS[MODEL_CACHE]);
            await cache.put(request, response.clone());
            // Dev: console.log('[SW] Cached model:', request.url);
        }
        
        return response;
    } catch (error) {
        // Dev: console.error('[SW] Error handling model file:', error);
        
        // Return 404 for missing models
        return new Response('Model not found', { 
            status: 404,
            statusText: 'Model Not Found'
        });
    }
}

// Handle external resource requests - Network First with cache fallback
async function handleExternalResource(request) {
    try {
        // Try network first
        const response = await fetch(request, {
            // Add timeout for external resources
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
            // Cache successful responses
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Dev: console.log('[SW] Network failed for external resource, trying cache:', request.url);
        
        // Fallback to cache
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Return error response
        return new Response('External resource unavailable', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Handle dynamic requests - Network First with cache fallback
async function handleDynamicRequest(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Dev: console.log('[SW] Network failed for dynamic request, trying cache:', request.url);
        
        // Fallback to cache
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlineResponse = await getOfflinePage();
            if (offlineResponse) return offlineResponse;
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// Manage cache size to prevent unlimited growth
async function manageCacheSize(cacheName, limitMB) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        // Estimate cache size
        let totalSize = 0;
        const sizePromises = keys.map(async (request) => {
            const response = await cache.match(request);
            const size = await estimateResponseSize(response);
            return { request, size };
        });
        
        const sizes = await Promise.all(sizePromises);
        totalSize = sizes.reduce((sum, item) => sum + item.size, 0);
        
        const limitBytes = limitMB * 1024 * 1024;
        
        if (totalSize > limitBytes) {
            // Dev: console.log(`[SW] Cache ${cacheName} exceeds limit (${(totalSize / 1024 / 1024).toFixed(2)}MB), cleaning up...`);
            
            // Sort by size (largest first) and remove until under limit
            sizes.sort((a, b) => b.size - a.size);
            
            let removedSize = 0;
            for (const { request, size } of sizes) {
                if (totalSize - removedSize <= limitBytes) break;
                
                await cache.delete(request);
                removedSize += size;
                // Dev: console.log(`[SW] Removed from cache: ${request.url}`);
            }
        }
    } catch (error) {
        // Dev: console.error('[SW] Error managing cache size:', error);
    }
}

// Estimate response size
async function estimateResponseSize(response) {
    try {
        const clone = response.clone();
        const arrayBuffer = await clone.arrayBuffer();
        return arrayBuffer.byteLength;
    } catch {
        // Fallback estimation
        return 1024; // 1KB default
    }
}

// Get offline page
async function getOfflinePage() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        return await cache.match('/index.html') || await cache.match('/');
    } catch {
        return null;
    }
}

// Background sync for model preloading
self.addEventListener('sync', event => {
    if (event.tag === 'preload-models') {
        event.waitUntil(preloadModels());
    }
});

// Preload popular models in background
async function preloadModels() {
    try {
        // Dev: console.log('[SW] Background preloading models...');
        
        // Preload first 5 models
        const modelPromises = [];
        for (let i = 1; i <= 5; i++) {
            modelPromises.push(
                fetch(`modelo${i}.glb`)
                    .then(response => {
                        if (response.ok) {
                            return caches.open(MODEL_CACHE)
                                .then(cache => cache.put(`modelo${i}.glb`, response));
                        }
                    })
                    .catch(error => {
                        // Dev: console.log(`[SW] Failed to preload modelo${i}.glb:`, error);
                    })
            );
        }
        
        await Promise.allSettled(modelPromises);
        // Dev: console.log('[SW] Background preloading complete');
    } catch (error) {
        // Dev: console.error('[SW] Error in background preloading:', error);
    }
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/technosutra-logo.png',
            badge: '/technosutra-logo.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || 1
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Explorar em AR',
                    icon: '/technosutra-logo.png'
                },
                {
                    action: 'close',
                    title: 'Fechar'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Techno Sutra AR', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow(`/index.html?model=${event.notification.data.primaryKey}`)
        );
    }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_STATS':
            getCacheStats().then(stats => {
                event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats });
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache(data.cacheName).then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;
            
        case 'PRELOAD_MODEL':
            preloadSpecificModel(data.modelId).then(() => {
                event.ports[0].postMessage({ type: 'MODEL_PRELOADED', data: { modelId: data.modelId } });
            });
            break;
    }
});

// Get cache statistics
async function getCacheStats() {
    try {
        const cacheNames = await caches.keys();
        const stats = {};
        
        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            stats[name] = {
                entries: keys.length,
                size: await estimateCacheSize(cache, keys)
            };
        }
        
        return stats;
    } catch (error) {
        // Dev: console.error('[SW] Error getting cache stats:', error);
        return {};
    }
}

// Estimate cache size
async function estimateCacheSize(cache, keys) {
    try {
        let totalSize = 0;
        
        for (const key of keys.slice(0, 10)) { // Sample first 10 for estimation
            const response = await cache.match(key);
            if (response) {
                totalSize += await estimateResponseSize(response);
            }
        }
        
        // Extrapolate for all keys
        return Math.round((totalSize / Math.min(keys.length, 10)) * keys.length);
    } catch {
        return 0;
    }
}

// Clear specific cache
async function clearCache(cacheName) {
    try {
        await caches.delete(cacheName);
        // Dev: console.log(`[SW] Cleared cache: ${cacheName}`);
    } catch (error) {
        // Dev: console.error(`[SW] Error clearing cache ${cacheName}:`, error);
    }
}

// Preload specific model
async function preloadSpecificModel(modelId) {
    try {
        const cache = await caches.open(MODEL_CACHE);
        const modelUrl = `modelo${modelId}.glb`;
        
        const response = await fetch(modelUrl);
        if (response.ok) {
            await cache.put(modelUrl, response);
            // Dev: console.log(`[SW] Preloaded model: ${modelUrl}`);
        }
    } catch (error) {
        // Dev: console.error(`[SW] Error preloading model ${modelId}:`, error);
    }
}

// Dev: console.log('[SW] Service worker script loaded');
