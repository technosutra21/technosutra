// Enhanced Service Worker for Techno Sutra AR
// Provides aggressive caching, offline support, and performance optimizations
// ENSURES COMPLETE OFFLINE FUNCTIONALITY WHEN INSTALLED AS PWA

const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `techno-sutra-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `techno-sutra-dynamic-v${CACHE_VERSION}`;
const MODEL_CACHE = `techno-sutra-models-v${CACHE_VERSION}`;
const CSS_CACHE = `techno-sutra-css-v${CACHE_VERSION}`;
const FONT_CACHE = `techno-sutra-fonts-v${CACHE_VERSION}`;
const DATA_CACHE = `techno-sutra-data-v${CACHE_VERSION}`;

// COMPLETE LIST OF CRITICAL RESOURCES FOR FULL OFFLINE FUNCTIONALITY
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
    '/trail.json'
];

// CSS and Style Resources
const CSS_ASSETS = [
    '/css/app.css',
    '/css/critical.css',
    '/css/main.css',
    '/css/mobile.css'
];

// Data files for offline functionality
const DATA_ASSETS = [
    '/summaries/chapters.csv',
    '/summaries/characters.csv',
    '/summaries/txt/iframe_wrapper_fixed.html',
    '/summaries/txt/iframe_fullscreen_aggressive.html'
];

// Model files pattern - includes all GLB files
const MODEL_PATTERN = /\.(glb|usdz)$/;

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

// COMPREHENSIVE CACHING FOR COMPLETE OFFLINE FUNCTIONALITY
async function cacheStaticAssets() {
    try {
        // Cache all static assets
        await cacheAssetGroup(STATIC_CACHE, STATIC_ASSETS, 'Static Assets');
        
        // Cache CSS files
        await cacheAssetGroup(CSS_CACHE, CSS_ASSETS, 'CSS Assets');
        
        // Cache data files
        await cacheAssetGroup(DATA_CACHE, DATA_ASSETS, 'Data Assets');
        
        // Cache MapLibre GL resources for map.html offline functionality
        await cacheMapLibreResources();
        
        // Start aggressive model preloading for complete offline experience
        await preloadCriticalModels();
        
        // Dev: console.log('[SW] Complete offline caching completed');
    } catch (error) {
        // Dev: console.error('[SW] Error in comprehensive caching:', error);
    }
}

// Cache a group of assets
async function cacheAssetGroup(cacheName, assets, groupName) {
    try {
        const cache = await caches.open(cacheName);
        const responses = await Promise.allSettled(
            assets.map(url => 
                fetch(url)
                    .then(response => {
                        if (response.ok) {
                            cache.put(url, response.clone());
                            return response;
                        }
                        throw new Error(`Failed to fetch ${url}: ${response.status}`);
                    })
                    .catch(error => {
                        // Dev: console.warn(`[SW] Failed to cache ${url}:`, error);
                        return null;
                    })
            )
        );
        
        const successful = responses.filter(r => r.status === 'fulfilled' && r.value).length;
        // Dev: console.log(`[SW] Cached ${successful}/${assets.length} ${groupName}`);
    } catch (error) {
        // Dev: console.error(`[SW] Error caching ${groupName}:`, error);
    }
}

// Cache MapLibre GL resources for map offline functionality
async function cacheMapLibreResources() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const mapLibreResources = [
            'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css',
            'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js'
        ];
        
        for (const url of mapLibreResources) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    // Dev: console.log(`[SW] Cached MapLibre resource: ${url}`);
                }
            } catch (error) {
                // Dev: console.warn(`[SW] Failed to cache MapLibre resource ${url}:`, error);
            }
        }
    } catch (error) {
        // Dev: console.error('[SW] Error caching MapLibre resources:', error);
    }
}

// Preload critical models immediately for offline AR experience
async function preloadCriticalModels() {
    try {
        const cache = await caches.open(MODEL_CACHE);
        
        // Priority models to cache immediately (first 10 chapters)
        const criticalModels = [
            'modelo1.glb', 'modelo2.glb', 'modelo3.glb', 'modelo4.glb', 'modelo5.glb',
            'modelo6.glb', 'modelo8.glb', 'modelo9.glb', 'modelo10.glb', 'modelo11.glb'
        ];
        
        const cachePromises = criticalModels.map(async (modelFile) => {
            try {
                // Check if model exists first
                const headResponse = await fetch(modelFile, { method: 'HEAD' });
                if (headResponse.ok) {
                    const response = await fetch(modelFile);
                    if (response.ok) {
                        await cache.put(modelFile, response);
                        // Dev: console.log(`[SW] Preloaded critical model: ${modelFile}`);
                        return true;
                    }
                }
                return false;
            } catch (error) {
                // Dev: console.warn(`[SW] Failed to preload ${modelFile}:`, error);
                return false;
            }
        });
        
        const results = await Promise.allSettled(cachePromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        // Dev: console.log(`[SW] Preloaded ${successful}/${criticalModels.length} critical models`);
        
    } catch (error) {
        // Dev: console.error('[SW] Error preloading critical models:', error);
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
    return url.origin !== self.location.origin;
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
        // Try network first with manual timeout for compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(request, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
        
        // List of all available models for caching
        const allModels = [
            'cosmic-buddha.glb', 'cosmic.glb', 'fat-buddha.glb', 'modelo-dragao.glb', 'nsrinha.glb',
            'modelo1.glb', 'modelo2.glb', 'modelo3.glb', 'modelo4.glb', 'modelo5.glb',
            'modelo6.glb', 'modelo8.glb', 'modelo9.glb', 'modelo10.glb', 'modelo11.glb',
            'modelo12.glb', 'modelo15.glb', 'modelo17.glb', 'modelo18.glb', 'modelo19.glb',
            'modelo20.glb', 'modelo21.glb', 'modelo22.glb', 'modelo23.glb', 'modelo24.glb',
            'modelo26.glb', 'modelo28.glb', 'modelo29.glb', 'modelo30.glb', 'modelo31.glb',
            'modelo32.glb', 'modelo33.glb', 'modelo34.glb', 'modelo35.glb', 'modelo36.glb',
            'modelo37.glb', 'modelo38.glb', 'modelo39.glb', 'modelo40.glb', 'modelo41.glb',
            'modelo42.glb', 'modelo44.glb', 'modelo45.glb', 'modelo46.glb', 'modelo47.glb',
            'modelo48.glb', 'modelo49.glb', 'modelo50.glb', 'modelo51.glb', 'modelo54.glb',
            'modelo55.glb', 'modelo56.glb'
        ];
        
        // Preload in batches to avoid overwhelming the system
        const batchSize = 5;
        for (let i = 0; i < allModels.length; i += batchSize) {
            const batch = allModels.slice(i, i + batchSize);
            const batchPromises = batch.map(modelFile => 
                fetch(modelFile)
                    .then(response => {
                        if (response.ok) {
                            return caches.open(MODEL_CACHE)
                                .then(cache => {
                                    // Check cache size before adding
                                    return manageCacheSize(MODEL_CACHE, CACHE_LIMITS[MODEL_CACHE])
                                        .then(() => cache.put(modelFile, response));
                                });
                        }
                    })
                    .catch(error => {
                        // Dev: console.log(`[SW] Failed to preload ${modelFile}:`, error);
                    })
            );
            
            await Promise.allSettled(batchPromises);
            
            // Small delay between batches to prevent overwhelming
            if (i + batchSize < allModels.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
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
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || 1
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Explorar em AR',
                    icon: '/icon.png'
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

// PWA INSTALLATION DETECTION - TRIGGERS COMPLETE OFFLINE CACHING
self.addEventListener('appinstalled', event => {
    // Dev: console.log('[SW] 🎉 PWA installed! Starting complete offline caching...');
    
    // Trigger aggressive caching when PWA is installed
    event.waitUntil(
        completeOfflineCaching().then(() => {
            // Dev: console.log('[SW] ✅ Complete offline caching finished - App fully functional offline!');
            
            // Notify all clients that offline caching is complete
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'OFFLINE_READY',
                        message: 'App is now fully available offline!'
                    });
                });
            });
        })
    );
});

// COMPLETE OFFLINE CACHING - Downloads everything for full offline functionality
async function completeOfflineCaching() {
    try {
        // Dev: console.log('[SW] 🚀 Starting complete offline caching process...');
        
        // 1. Cache all remaining models aggressively
        await cacheAllAvailableModels();
        
        // 2. Cache additional resources that might be needed
        await cacheAdditionalResources();
        
        // 3. Preload critical data files
        await preloadDataFiles();
        
        // Dev: console.log('[SW] 🎯 Complete offline caching process finished!');
        return true;
        
    } catch (error) {
        // Dev: console.error('[SW] ❌ Error in complete offline caching:', error);
        return false;
    }
}

// Cache ALL available models for complete offline AR experience
async function cacheAllAvailableModels() {
    try {
        const cache = await caches.open(MODEL_CACHE);
        
        // All possible models (including USDZ for iOS)
        const allModels = [
            // GLB models
            'cosmic-buddha.glb', 'cosmic.glb', 'fat-buddha.glb', 'modelo-dragao.glb', 'nsrinha.glb',
            'modelo1.glb', 'modelo2.glb', 'modelo3.glb', 'modelo4.glb', 'modelo5.glb',
            'modelo6.glb', 'modelo8.glb', 'modelo9.glb', 'modelo10.glb', 'modelo11.glb',
            'modelo12.glb', 'modelo15.glb', 'modelo17.glb', 'modelo18.glb', 'modelo19.glb',
            'modelo20.glb', 'modelo21.glb', 'modelo22.glb', 'modelo23.glb', 'modelo24.glb',
            'modelo26.glb', 'modelo28.glb', 'modelo29.glb', 'modelo30.glb', 'modelo31.glb',
            'modelo32.glb', 'modelo33.glb', 'modelo34.glb', 'modelo35.glb', 'modelo36.glb',
            'modelo37.glb', 'modelo38.glb', 'modelo39.glb', 'modelo40.glb', 'modelo41.glb',
            'modelo42.glb', 'modelo44.glb', 'modelo45.glb', 'modelo46.glb', 'modelo47.glb',
            'modelo48.glb', 'modelo49.glb', 'modelo50.glb', 'modelo51.glb', 'modelo54.glb',
            'modelo55.glb', 'modelo56.glb',
            // USDZ models for iOS
            'modelo1.usdz', 'modelo2.usdz', 'modelo3.usdz', 'modelo4.usdz', 'modelo5.usdz',
            'modelo6.usdz', 'modelo8.usdz', 'modelo9.usdz', 'modelo10.usdz', 'modelo11.usdz',
            'modelo12.usdz', 'modelo15.usdz', 'modelo17.usdz', 'modelo18.usdz', 'modelo19.usdz',
            'modelo20.usdz', 'modelo21.usdz', 'modelo22.usdz', 'modelo23.usdz', 'modelo24.usdz',
            'modelo26.usdz', 'modelo28.usdz', 'modelo29.usdz', 'modelo30.usdz', 'modelo31.usdz',
            'modelo32.usdz', 'modelo33.usdz', 'modelo34.usdz', 'modelo35.usdz', 'modelo36.usdz',
            'modelo37.usdz', 'modelo38.usdz', 'modelo39.usdz', 'modelo40.usdz', 'modelo41.usdz',
            'modelo42.usdz', 'modelo44.usdz', 'modelo45.usdz', 'modelo46.usdz', 'modelo47.usdz',
            'modelo48.usdz', 'modelo49.usdz', 'modelo50.usdz', 'modelo51.usdz', 'modelo54.usdz',
            'modelo55.usdz', 'modelo56.usdz'
        ];
        
        let cachedCount = 0;
        const batchSize = 3; // Smaller batches for complete caching
        
        for (let i = 0; i < allModels.length; i += batchSize) {
            const batch = allModels.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (modelFile) => {
                try {
                    // Check if model exists first
                    const headResponse = await fetch(modelFile, { method: 'HEAD' });
                    if (headResponse.ok) {
                        const response = await fetch(modelFile);
                        if (response.ok) {
                            await cache.put(modelFile, response);
                            cachedCount++;
                            // Dev: console.log(`[SW] 📦 Cached model ${cachedCount}: ${modelFile}`);
                            return true;
                        }
                    }
                    return false;
                } catch (error) {
                    // Dev: console.warn(`[SW] ⚠️ Failed to cache ${modelFile}:`, error.message);
                    return false;
                }
            });
            
            await Promise.allSettled(batchPromises);
            
            // Longer delay for complete caching to prevent overwhelming
            if (i + batchSize < allModels.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Dev: console.log(`[SW] 🎯 Complete model caching finished: ${cachedCount} models cached`);
        
    } catch (error) {
        // Dev: console.error('[SW] ❌ Error in complete model caching:', error);
    }
}

// Cache additional resources for complete offline functionality
async function cacheAdditionalResources() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        
        // Additional resources that might be needed offline
        const additionalResources = [
            // Font files (if any)
            '/fonts/Inter-Regular.woff2',
            '/fonts/Inter-Medium.woff2',
            '/fonts/Inter-Bold.woff2',
            // Additional images
            '/images/placeholder.png',
            '/images/loading.gif',
            // Error pages
            '/404.html',
            '/offline.html'
        ];
        
        for (const resource of additionalResources) {
            try {
                const response = await fetch(resource);
                if (response.ok) {
                    await cache.put(resource, response);
                    // Dev: console.log(`[SW] 📄 Cached additional resource: ${resource}`);
                }
            } catch (error) {
                // Dev: console.warn(`[SW] ⚠️ Additional resource not found: ${resource}`);
            }
        }
        
    } catch (error) {
        // Dev: console.error('[SW] ❌ Error caching additional resources:', error);
    }
}

// Preload data files for offline functionality
async function preloadDataFiles() {
    try {
        const cache = await caches.open(DATA_CACHE);
        
        // Ensure all data files are cached
        for (const dataFile of DATA_ASSETS) {
            try {
                const response = await fetch(dataFile);
                if (response.ok) {
                    await cache.put(dataFile, response);
                    // Dev: console.log(`[SW] 📊 Cached data file: ${dataFile}`);
                }
            } catch (error) {
                // Dev: console.warn(`[SW] ⚠️ Data file not found: ${dataFile}`);
            }
        }
        
    } catch (error) {
        // Dev: console.error('[SW] ❌ Error preloading data files:', error);
    }
}

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
            
        case 'FORCE_COMPLETE_CACHE':
            // Manual trigger for complete offline caching
            completeOfflineCaching().then((success) => {
                event.ports[0].postMessage({ 
                    type: 'COMPLETE_CACHE_FINISHED', 
                    success: success,
                    message: success ? 'All content cached for offline use!' : 'Some content failed to cache'
                });
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
