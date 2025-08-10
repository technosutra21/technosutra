// Enhanced Service Worker for Techno Sutra AR - COMPLETE VERSION v2.4.0
// Provides reliable caching, offline support, and performance optimizations

const CACHE_VERSION = '2.4.0';
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
    '/summaries/characters.csv',
    '/1.js',
    '/2.js',
    '/qr-scanner.js'
];

// ACTUAL EXISTING MODELS - Only cache models that exist
const ALL_MODELS = [
    '/modelo1.glb', '/modelo2.glb', '/modelo3.glb', '/modelo4.glb', '/modelo5.glb',
    '/modelo6.glb', '/modelo9.glb', '/modelo10.glb', '/modelo11.glb', '/modelo12.glb',
    '/modelo15.glb', '/modelo17.glb', '/modelo18.glb', '/modelo19.glb', '/modelo20.glb',
    '/modelo21.glb', '/modelo22.glb', '/modelo23.glb', '/modelo24.glb', '/modelo26.glb',
    '/modelo28.glb', '/modelo29.glb', '/modelo30.glb', '/modelo31.glb', '/modelo32.glb',
    '/modelo33.glb', '/modelo34.glb', '/modelo35.glb', '/modelo36.glb', '/modelo37.glb',
    '/modelo38.glb', '/modelo39.glb', '/modelo40.glb', '/modelo41.glb', '/modelo42.glb',
    '/modelo44.glb', '/modelo45.glb', '/modelo46.glb', '/modelo47.glb', '/modelo48.glb',
    '/modelo49.glb', '/modelo50.glb', '/modelo51.glb', '/modelo54.glb', '/modelo55.glb',
    '/modelo56.glb', '/modelo-dragao.glb', '/14.glb', '/31.glb', '/cosmic-buddha.glb',
    '/cosmic.glb', '/fat-buddha.glb', '/nsrinha.glb'
];

// External resources
const EXTERNAL_RESOURCES = [
    'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
    'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css',
    'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Chakra+Petch:wght@300;400;600;700&display=swap'
];

// Model files pattern
const MODEL_PATTERN = /\.(glb|usdz)$/i;

// Install event - cache critical resources and trigger complete caching
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker v' + CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            cacheStaticAssets(),
            cacheExternalResources(),
            // Don't cache all models during install to avoid long installation times
            // They will be cached on first access or when explicitly requested
        ]).then(() => {
            console.log('[SW] Installation complete');
            return self.skipWaiting();
        }).catch(error => {
            console.error('[SW] Installation failed:', error);
        })
    );
});

// Activate event - clean up old caches and setup complete caching if needed
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
        
        // Cache assets with better error handling
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
            try {
                const response = await fetch(asset, { 
                    cache: 'no-cache',
                    credentials: 'same-origin'
                });
                
                if (response.ok) {
                    await cache.put(asset, response.clone());
                    console.log(`[SW] ✅ Cached: ${asset}`);
                    return true;
                } else {
                    console.warn(`[SW] ⚠️ Failed to cache ${asset}: ${response.status}`);
                    return false;
                }
            } catch (error) {
                console.warn(`[SW] ⚠️ Error caching ${asset}:`, error.message);
                return false;
            }
        });
        
        const results = await Promise.allSettled(cachePromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        
        console.log(`[SW] Static assets cached: ${successCount}/${STATIC_ASSETS.length}`);
    } catch (error) {
        console.error('[SW] Error caching static assets:', error);
    }
}

// Cache external resources
async function cacheExternalResources() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        
        const externalPromises = EXTERNAL_RESOURCES.map(async (url) => {
            try {
                const response = await fetch(url, {
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    await cache.put(url, response.clone());
                    console.log(`[SW] ✅ Cached external: ${url}`);
                    return true;
                }
                return false;
            } catch (error) {
                console.warn(`[SW] ⚠️ Failed to cache external ${url}:`, error.message);
                return false;
            }
        });
        
        await Promise.allSettled(externalPromises);
    } catch (error) {
        console.error('[SW] Error caching external resources:', error);
    }
}

// Cache all models - NEW FUNCTION
async function cacheAllModels(port = null) {
    const cache = await caches.open(MODEL_CACHE);
    let successCount = 0;
    let failCount = 0;
    
    console.log(`[SW] 🚀 Starting to cache all ${ALL_MODELS.length} models...`);
    
    // Send progress updates if port is provided
    const sendProgress = (current, total, success, failed) => {
        if (port) {
            port.postMessage({
                type: 'CACHE_PROGRESS',
                current,
                total,
                success,
                failed,
                percentage: Math.round((current / total) * 100)
            });
        }
    };
    
    for (let i = 0; i < ALL_MODELS.length; i++) {
        const modelUrl = ALL_MODELS[i];
        
        try {
            // Check if already cached
            const cached = await cache.match(modelUrl);
            if (cached) {
                console.log(`[SW] ✅ Model already cached: ${modelUrl}`);
                successCount++;
                sendProgress(i + 1, ALL_MODELS.length, successCount, failCount);
                continue;
            }
            
            // Fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds
            
            const response = await fetch(modelUrl, {
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                await cache.put(modelUrl, response.clone());
                successCount++;
                console.log(`[SW] ✅ Cached model ${i + 1}/${ALL_MODELS.length}: ${modelUrl}`);
            } else {
                failCount++;
                console.warn(`[SW] ⚠️ Failed to cache model ${modelUrl}: ${response.status}`);
            }
            
        } catch (error) {
            failCount++;
            console.error(`[SW] ❌ Error caching model ${modelUrl}:`, error.message);
        }
        
        sendProgress(i + 1, ALL_MODELS.length, successCount, failCount);
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`[SW] 🏁 Model caching complete: ${successCount} success, ${failCount} failed`);
    
    return {
        success: failCount === 0,
        successCount,
        failCount,
        total: ALL_MODELS.length
    };
}

// Discover and cache all assets dynamically - NEW FUNCTION
async function discoverAndCacheAllAssets(port = null) {
    try {
        // First, cache all known static assets and models
        await cacheStaticAssets();
        await cacheExternalResources();
        
        // Cache all models with progress tracking
        const modelResults = await cacheAllModels(port);
        
        // Try to discover additional assets from config files
        try {
            const configResponse = await fetch('/config.json');
            if (configResponse.ok) {
                const config = await configResponse.json();
                await cacheDiscoveredAssets(config);
            }
        } catch (error) {
            console.warn('[SW] Could not load config.json for asset discovery:', error);
        }
        
        try {
            const trailResponse = await fetch('/trail.json');
            if (trailResponse.ok) {
                const trail = await trailResponse.json();
                await cacheDiscoveredAssets(trail);
            }
        } catch (error) {
            console.warn('[SW] Could not load trail.json for asset discovery:', error);
        }
        
        return modelResults;
        
    } catch (error) {
        console.error('[SW] Error in complete asset caching:', error);
        return {
            success: false,
            successCount: 0,
            failCount: ALL_MODELS.length,
            total: ALL_MODELS.length,
            error: error.message
        };
    }
}

// Cache assets discovered from config files
async function cacheDiscoveredAssets(configData) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Extract URLs from config data (adapt based on your config structure)
    const extractUrls = (obj, urls = []) => {
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'string') {
                // Check if it looks like a URL or path
                if (value.startsWith('/') || value.startsWith('http') || 
                    value.endsWith('.html') || value.endsWith('.json') || 
                    value.endsWith('.csv') || value.endsWith('.jpg') || 
                    value.endsWith('.png') || value.endsWith('.glb')) {
                    urls.push(value);
                }
            } else if (typeof value === 'object' && value !== null) {
                extractUrls(value, urls);
            }
        }
        return urls;
    };
    
    const discoveredUrls = extractUrls(configData);
    
    for (const url of discoveredUrls) {
        try {
            if (!url.startsWith('http') && !STATIC_ASSETS.includes(url)) {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    console.log(`[SW] ✅ Cached discovered asset: ${url}`);
                }
            }
        } catch (error) {
            console.warn(`[SW] ⚠️ Failed to cache discovered asset ${url}:`, error);
        }
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
    return MODEL_PATTERN.test(url.pathname) || ALL_MODELS.some(model => url.pathname.endsWith(model));
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
           pathname.endsWith('.json') ||
           pathname.endsWith('.csv');
}

// Check if request is for external resource
function isExternalResource(request) {
    const url = new URL(request.url);
    return url.origin !== self.location.origin;
}

// Handle model file requests with improved caching
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
        
        // Fetch with timeout for large files
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds
        
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

// Enhanced message handling for complete caching with security checks
self.addEventListener('message', event => {
    // Security: Only accept messages from same origin
    if (event.origin !== self.origin) {
        console.warn('[SW] Rejected message from foreign origin:', event.origin);
        return;
    }
    
    const { type, data } = event.data || {};
    const port = event.ports[0];
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'FORCE_COMPLETE_CACHE':
            console.log('[SW] 🚀 Starting complete offline caching...');
            discoverAndCacheAllAssets(port).then(results => {
                const message = `Cached ${results.successCount}/${results.total} models successfully`;
                port?.postMessage({ 
                    type: 'COMPLETE_CACHE_FINISHED', 
                    success: results.success,
                    message: results.error ? `Error: ${results.error}` : message,
                    results
                });
            }).catch(error => {
                console.error('[SW] Complete caching failed:', error);
                port?.postMessage({ 
                    type: 'COMPLETE_CACHE_FINISHED', 
                    success: false,
                    message: `Caching failed: ${error.message}`,
                    error: error.message
                });
            });
            break;
            
        case 'CACHE_MODEL':
            if (data && data.modelUrl && isValidModelUrl(data.modelUrl)) {
                cacheSpecificModel(data.modelUrl).then(() => {
                    port?.postMessage({ 
                        type: 'MODEL_CACHED', 
                        modelUrl: data.modelUrl 
                    });
                });
            } else {
                console.warn('[SW] Invalid model URL rejected:', data?.modelUrl);
            }
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                port?.postMessage({ 
                    type: 'CACHE_STATUS', 
                    data: status 
                });
            });
            break;
    }
});

// Security: Validate model URLs
function isValidModelUrl(url) {
    try {
        const urlObj = new URL(url, self.origin);
        // Only allow same-origin model files
        if (urlObj.origin !== self.origin) return false;
        // Must match model pattern
        return MODEL_PATTERN.test(urlObj.pathname) || ALL_MODELS.includes(urlObj.pathname);
    } catch {
        return false;
    }
}

// Cache specific model manually
async function cacheSpecificModel(modelUrl) {
    try {
        const cache = await caches.open(MODEL_CACHE);
        
        // Check if already cached
        const cached = await cache.match(modelUrl);
        if (cached) {
            console.log(`[SW] ✅ Model already cached: ${modelUrl}`);
            return true;
        }
        
        const response = await fetch(modelUrl, { cache: 'no-cache' });
        
        if (response.ok) {
            await cache.put(modelUrl, response.clone()); // Fix: Clone response
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
                status[name] = {
                    count: keys.length,
                    urls: keys.map(req => req.url)
                };
            }
        }
        
        return status;
    } catch (error) {
        console.error('[SW] Error getting cache status:', error);
        return {};
    }
}

console.log('[SW] Service worker script loaded - v' + CACHE_VERSION);