// Service Worker for Techno Sutra AR
// Enhanced PWA with offline support and complete asset caching

const CACHE_NAME = 'techno-sutra-ar-v1.0.0';
const RUNTIME_CACHE = 'techno-sutra-runtime-v1.0.0';
const MODELS_CACHE = 'techno-sutra-models-v1.0.0';

// Core application shell - critical files for app to work
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/main.js',
    '/manifest.json',
    '/icon.png',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/AR.html',
    '/offline.html'
];

// Optional assets - enhance experience but not critical
const OPTIONAL_ASSETS = [
    '/qr-scanner.js',
    '/1.js',
    '/2.js'
];

// Generate model URLs (1-56)
const MODEL_ASSETS = [];
for (let i = 1; i <= 56; i++) {
    MODEL_ASSETS.push(`/models/model${i}.glb`);
    MODEL_ASSETS.push(`/models/model${i}.usdz`);
    MODEL_ASSETS.push(`/images/chapter${i}.jpg`);
}

// External assets that need caching
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Chakra+Petch:wght@300;400;600;700&display=swap',
    'https://fonts.gstatic.com/s/orbitron/v29/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyrFE.woff2',
    'https://fonts.gstatic.com/s/chakrapetch/v9/cIf6MapbsEk7TDLdtEz1BwkmmIpny6orMTJsMsw.woff2'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    console.log('SW: Installing service worker...');
    
    event.waitUntil(
        Promise.all([
            // Cache core assets - these must be available immediately
            caches.open(CACHE_NAME).then((cache) => {
                console.log('SW: Caching core assets');
                return cache.addAll(CORE_ASSETS.filter(asset => asset !== '/offline.html'))
                    .catch(error => {
                        console.warn('SW: Failed to cache some core assets:', error);
                        // Try to cache individually to identify problematic assets
                        return Promise.allSettled(
                            CORE_ASSETS.map(asset => cache.add(asset))
                        );
                    });
            }),
            
            // Create offline fallback
            caches.open(CACHE_NAME).then((cache) => {
                return fetch('/offline.html').then(response => {
                    if (response.ok) {
                        return cache.put('/offline.html', response);
                    }
                }).catch(() => {
                    // Create a basic offline page if file doesn't exist
                    const offlineResponse = new Response(`
                        <!DOCTYPE html>
                        <html lang="pt-BR">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Techno Sutra AR - Offline</title>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif; 
                                    text-align: center; 
                                    padding: 2rem;
                                    background: #000;
                                    color: #00ff95;
                                }
                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>🔮 Techno Sutra AR</h1>
                                <h2>Você está offline</h2>
                                <p>Esta página não está disponível offline. Verifique sua conexão com a internet e tente novamente.</p>
                                <button onclick="window.location.reload()">Tentar Novamente</button>
                            </div>
                        </body>
                        </html>
                    `, {
                        headers: { 'Content-Type': 'text/html' }
                    });
                    return cache.put('/offline.html', offlineResponse);
                });
            })
        ]).then(() => {
            console.log('SW: Core installation completed');
            self.skipWaiting(); // Activate immediately
        }).catch(error => {
            console.error('SW: Installation failed:', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('SW: Activating service worker...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => 
                            cacheName !== CACHE_NAME && 
                            cacheName !== RUNTIME_CACHE && 
                            cacheName !== MODELS_CACHE
                        )
                        .map(cacheName => {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            
            // Take control of all clients immediately
            self.clients.claim()
        ]).then(() => {
            console.log('SW: Activation completed');
            
            // Notify clients about successful activation
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_ACTIVATED',
                        message: 'Service Worker activated successfully'
                    });
                });
            });
        })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Strategy 1: Core app files - Cache First (always serve from cache if available)
        if (CORE_ASSETS.some(asset => url.pathname === asset || url.pathname === asset + '/')) {
            return await cacheFirst(request, CACHE_NAME);
        }
        
        // Strategy 2: Model files - Cache First with network fallback
        if (url.pathname.includes('/models/') || url.pathname.includes('/images/')) {
            return await cacheFirst(request, MODELS_CACHE);
        }
        
        // Strategy 3: Fonts and external assets - Stale While Revalidate
        if (url.hostname === 'fonts.googleapis.com' || 
            url.hostname === 'fonts.gstatic.com' ||
            url.hostname === 'modelviewer.dev') {
            return await staleWhileRevalidate(request, RUNTIME_CACHE);
        }
        
        // Strategy 4: API calls and dynamic content - Network First
        if (url.pathname.startsWith('/api/')) {
            return await networkFirst(request, RUNTIME_CACHE);
        }
        
        // Strategy 5: Everything else - Network First with offline fallback
        return await networkFirstWithOffline(request);
        
    } catch (error) {
        console.error('SW: Fetch error:', error);
        return await getOfflineFallback(request);
    }
}

// Caching Strategies
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('SW: Network failed for:', request.url);
        return await getOfflineFallback(request);
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Always try to update in background
    const networkPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, that's ok for SWR
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        networkPromise; // Let it run in background
        return cachedResponse;
    }
    
    // No cache, wait for network
    try {
        return await networkPromise;
    } catch (error) {
        return await getOfflineFallback(request);
    }
}

async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return await getOfflineFallback(request);
    }
}

async function networkFirstWithOffline(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Try cache first
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return await getOfflineFallback(request);
    }
}

async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML pages, show offline page
    if (request.headers.get('accept')?.includes('text/html')) {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match('/offline.html');
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    // For other requests, return a basic error response
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// Message handling for force caching and other commands
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'FORCE_COMPLETE_CACHE':
            handleCompleteCache(event);
            break;
            
        case 'CACHE_ALL_ASSETS':
            handleCacheAllAssets();
            break;
            
        case 'CLEAR_CACHE':
            handleClearCache();
            break;
            
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        default:
            console.log('SW: Unknown message type:', type);
    }
});

async function handleCompleteCache(event) {
    console.log('SW: Starting complete cache operation...');
    
    try {
        const results = await Promise.allSettled([
            // Cache optional assets
            cacheAssets(OPTIONAL_ASSETS, CACHE_NAME),
            
            // Cache model assets (in batches to avoid overwhelming)
            cacheModelAssetsInBatches(),
            
            // Cache external assets
            cacheAssets(EXTERNAL_ASSETS, RUNTIME_CACHE)
        ]);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`SW: Complete cache finished. Success: ${successful}, Failed: ${failed}`);
        
        // Send result back to main thread
        event.ports[0].postMessage({
            type: 'COMPLETE_CACHE_FINISHED',
            success: failed === 0,
            message: failed === 0 ? 
                'All content cached successfully!' : 
                `Cached with ${failed} failures. App may have limited offline functionality.`
        });
        
    } catch (error) {
        console.error('SW: Complete cache failed:', error);
        event.ports[0].postMessage({
            type: 'COMPLETE_CACHE_FINISHED',
            success: false,
            message: 'Caching failed. Check your internet connection.'
        });
    }
}

async function cacheAssets(assets, cacheName) {
    const cache = await caches.open(cacheName);
    const results = await Promise.allSettled(
        assets.map(async (asset) => {
            try {
                const response = await fetch(asset);
                if (response.ok) {
                    await cache.put(asset, response);
                    return asset;
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.warn(`SW: Failed to cache ${asset}:`, error.message);
                throw error;
            }
        })
    );
    
    return results;
}

async function cacheModelAssetsInBatches() {
    const batchSize = 5; // Cache 5 models at a time
    const cache = await caches.open(MODELS_CACHE);
    
    for (let i = 0; i < MODEL_ASSETS.length; i += batchSize) {
        const batch = MODEL_ASSETS.slice(i, i + batchSize);
        await Promise.allSettled(
            batch.map(async (asset) => {
                try {
                    const response = await fetch(asset);
                    if (response.ok) {
                        await cache.put(asset, response);
                    }
                } catch (error) {
                    console.warn(`SW: Failed to cache model ${asset}`);
                }
            })
        );
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function handleCacheAllAssets() {
    console.log('SW: Caching all assets...');
    
    try {
        await Promise.all([
            cacheAssets(OPTIONAL_ASSETS, CACHE_NAME),
            cacheAssets(EXTERNAL_ASSETS, RUNTIME_CACHE)
        ]);
        
        console.log('SW: All assets cached successfully');
    } catch (error) {
        console.error('SW: Failed to cache all assets:', error);
    }
}

async function handleClearCache() {
    console.log('SW: Clearing all caches...');
    
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    console.log('SW: All caches cleared');
}

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
    self.addEventListener('sync', (event) => {
        if (event.tag === 'background-sync') {
            event.waitUntil(handleBackgroundSync());
        }
    });
}

async function handleBackgroundSync() {
    console.log('SW: Performing background sync...');
    // Implement any background sync logic here
}

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/icon-192x192.png',
                badge: '/icon-72x72.png',
                tag: 'techno-sutra-notification'
            })
        );
    }
});

console.log('SW: Service Worker script loaded');
