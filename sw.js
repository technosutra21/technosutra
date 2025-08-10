// Enhanced Service Worker for Techno Sutra AR - FIXED VERSION
// Provides reliable caching, offline support, and performance optimizations

const CACHE_VERSION = '2.2.0';
const STATIC_CACHE = `techno-sutra-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `techno-sutra-dynamic-v${CACHE_VERSION}`;
const MODEL_CACHE = `techno-sutra-models-v${CACHE_VERSION}`;

// CRITICAL RESOURCES FOR OFFLINE FUNCTIONALITY
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/home.html',
    '/AR.html',
    '/galeria.html',
    '/map.html',
    '/navegador-capitulos-updated.html',
    '/manifest.json',
    '/icon.png',
    '/lobo-guará.jpg',
    '/config.json',
    '/trail.json',
    '/css/app.css',
    '/css/main.css',
    '/summaries/chapters.csv',
    '/summaries/characters.csv'
];

// External resources
const EXTERNAL_RESOURCES = [
    'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
    'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css',
    'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js'
];

// Model files pattern
const MODEL_PATTERN = /\.(glb|usdz)$/i;

// Install event - cache critical resources only
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker v' + CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            cacheStaticAssets(),
            cacheExternalResources()
        ]).then(() => {
            console.log('[SW] Installation complete');
            return self.skipWaiting();
        }).catch(error => {
            console.error('[SW] Installation failed:', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        cleanupOldCaches().then(() => {
            console.log('[SW] Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip non-http protocols
    if (!url.protocol.startsWith('http')) return;
    
    // Route requests appropriately
    if (isModelFile(request)) {
        event.respondWith(handleModelFile(request));
    } else if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isExternalResource(request)) {
        event.respondWith(handleExternalResource(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

// Cache static assets during install
async function cacheStaticAssets() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        
        // Cache assets one by one to handle failures gracefully
        let successCount = 0;
        for (const asset of STATIC_ASSETS) {
            try {
                const response = await fetch(asset, { 
                    cache: 'no-cache',
                    credentials: 'same-origin'
                });
                
                if (response.ok) {
                    await cache.put(asset, response.clone());
                    successCount++;
                    console.log(`[SW] ✅ Cached: ${asset}`);
                } else {
                    console.warn(`[SW] ⚠️ Failed to cache ${asset}: ${response.status}`);
                }
            } catch (error) {
                console.warn(`[SW] ⚠️ Error caching ${asset}:`, error.message);
            }
        }
        
        console.log(`[SW] Static assets cached: ${successCount}/${STATIC_ASSETS.length}`);
    } catch (error) {
        console.error('[SW] Error caching static assets:', error);
    }
}

// Cache external resources
async function cacheExternalResources() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        
        for (const url of EXTERNAL_RESOURCES) {
            try {
                const response = await fetch(url, {
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    await cache.put(url, response.clone());
                    console.log(`[SW] ✅ Cached external: ${url}`);
                }
            } catch (error) {
                console.warn(`[SW] ⚠️ Failed to cache external ${url}:`, error.message);
            }
        }
    } catch (error) {
        console.error('[SW] Error caching external resources:', error);
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
                console.log(`[SW] 🗑️ Deleting old cache: ${name}`);
                return caches.delete(name);
            })
        );
        
        console.log(`[SW] Cleaned up ${oldCaches.length} old caches`);
    } catch (error) {
        console.error('[SW] Error cleaning up caches:', error);
    }
}

// Check if request is for a model file
function isModelFile(request) {
    const url = new URL(request.url);
    return MODEL_PATTERN.test(url.pathname);
}

// Check if request is for a static asset
function isStaticAsset(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return STATIC_ASSETS.some(asset => pathname === asset || pathname.endsWith(asset)) ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.svg') ||
           pathname.endsWith('.ico') ||
           pathname.endsWith('.json');
}

// Check if request is for external resource
function isExternalResource(request) {
    const url = new URL(request.url);
    return url.origin !== self.location.origin;
}

// Handle model file requests - FIXED VERSION
async function handleModelFile(request) {
    const url = request.url;
    const cache = await caches.open(MODEL_CACHE);
    
    try {
        // Always check cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log(`[SW] ✅ Serving cached model: ${url}`);
            return cachedResponse;
        }
        
        console.log(`[SW] 📡 Fetching model: ${url}`);
        
        // Fetch with shorter timeout for large files
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
        
        const response = await fetch(request, {
            signal: controller.signal,
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log(`[SW] 💾 Caching model: ${url}`);
            
            // Clone response before caching
            const responseClone = response.clone();
            
            // Cache asynchronously to not block response
            cache.put(request, responseClone).then(() => {
                console.log(`[SW] ✅ Model cached: ${url}`);
            }).catch(error => {
                console.warn(`[SW] ⚠️ Failed to cache model ${url}:`, error);
            });
            
            return response;
        } else {
            console.warn(`[SW] ⚠️ Model fetch failed: ${url} (${response.status})`);
            return response;
        }
        
    } catch (error) {
        console.error(`[SW] ❌ Error handling model ${url}:`, error);
        
        // Try cache again as fallback
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log(`[SW] 🔄 Serving cached model as fallback: ${url}`);
            return cachedResponse;
        }
        
        // Return 404 for missing models
        return new Response('Model not found', { 
            status: 404,
            statusText: 'Model Not Found'
        });
    }
}

// Handle static asset requests - Cache First strategy
async function handleStaticAsset(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Fetch and cache new version
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[SW] Error handling static asset:', error);
        
        // Try to return cached version as fallback
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        return cached || new Response('Offline', { status: 503 });
    }
}

// Handle external resource requests
async function handleExternalResource(request) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(request, {
            signal: controller.signal,
            mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Fallback to cache
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        return cached || new Response('External resource unavailable', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
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

// Get offline page
async function getOfflinePage() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        return await cache.match('/index.html') || await cache.match('/');
    } catch {
        return null;
    }
}

// Message handling for debugging and manual operations
self.addEventListener('message', event => {
    const { type, data } = event.data || {};
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_MODEL':
            if (data && data.modelUrl) {
                cacheSpecificModel(data.modelUrl).then(() => {
                    event.source?.postMessage({ 
                        type: 'MODEL_CACHED', 
                        modelUrl: data.modelUrl 
                    });
                });
            }
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.source?.postMessage({ 
                    type: 'CACHE_STATUS', 
                    data: status 
                });
            });
            break;
    }
});

// Cache specific model manually
async function cacheSpecificModel(modelUrl) {
    try {
        const cache = await caches.open(MODEL_CACHE);
        const response = await fetch(modelUrl);
        
        if (response.ok) {
            await cache.put(modelUrl, response);
            console.log(`[SW] ✅ Manually cached model: ${modelUrl}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`[SW] ❌ Error manually caching model ${modelUrl}:`, error);
        return false;
    }
}

// Get cache status for debugging
async function getCacheStatus() {
    try {
        const cacheNames = await caches.keys();
        const status = {};
        
        for (const name of cacheNames) {
            if (name.startsWith('techno-sutra-')) {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                status[name] = keys.length;
            }
        }
        
        return status;
    } catch (error) {
        console.error('[SW] Error getting cache status:', error);
        return {};
    }
}

console.log('[SW] Service worker script loaded - v' + CACHE_VERSION);