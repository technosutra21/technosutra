// Service Worker for Techno Sutra AR
// Enhanced PWA with offline support and complete asset caching

const CACHE_NAME = 'techno-sutra-ar-v1.0.2';
const RUNTIME_CACHE = 'techno-sutra-runtime-v1.0.2';
const MODELS_CACHE = 'techno-sutra-models-v1.0.2';
let PREFETCH_IN_PROGRESS = false;

// Core application shell - critical files for app to work
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/AR.html',
    '/galeria.html',
    '/map.html',
    '/home.html',
    '/offline.html',

    // CSS
    '/styles.css',
    '/css/shared.css',

    // JS
    '/js/main.js',
    '/js/utils.js',
    '/js/qr-scanner.js',
    '/js/1.js',
    '/js/2.js',
    '/js/ar-experience.js',
    '/js/model-viewer-integration.js',
    '/js/gallery.js',

    // PWA
    '/manifest.json',

    // Icons
    '/imgs/icon.png',
    '/imgs/icon-192x192.png',
    '/imgs/icon-512x512.png'
];



// Generate model URLs (1-56)
const MODEL_ASSETS = [];
for (let i = 1; i <= 56; i++) {
    MODEL_ASSETS.push(`/models/modelo${i}.glb`);
}

// External assets that need caching
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Chakra+Petch:wght@300;400;600;700&display=swap',
    'https://fonts.gstatic.com/s/orbitron/v29/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyrFE.woff2',
    'https://fonts.gstatic.com/s/chakrapetch/v9/cIf6MapbsEk7TDLdtEz1BwkmmIpny6orMTJsMsw.woff2',

    // Model Viewer (served via Google CDN)
    'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',

    // MapLibre used in map.html
    'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js',
    'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css',

    // jsQR used on index.html
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    console.log('SW: Installing service worker...');

    // Pre-cache only core assets to avoid blocking installation
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching core assets');
            return cache.addAll(CORE_ASSETS.filter(asset => {
                // Filter out assets that might not exist yet
                return !asset.includes('icon') || asset === '/imgs/icon.png';
            }));
        }).then(() => {
            console.log('SW: Core caching completed');
            self.skipWaiting();
            
            // Cache optional assets in background without blocking installation
            Promise.all([
                cacheAssetsWithFallback(EXTERNAL_ASSETS, RUNTIME_CACHE, 'external assets')
            ]).then(() => {
                console.log('SW: Background caching completed');
            }).catch(error => {
                console.warn('SW: Background caching failed:', error);
            });
            
        }).catch(error => {
            console.error('SW: Core caching failed:', error);
            self.skipWaiting(); // Still proceed even if caching fails
        })
    );
});

// Helper function to cache assets with error handling
async function cacheAssetsWithFallback(assets, cacheName, description) {
    try {
        const cache = await caches.open(cacheName);
        console.log(`SW: Caching ${description}`);
        
        // Cache assets individually to avoid total failure
        const promises = assets.map(async (asset) => {
            try {
                const response = await fetch(asset);
                if (response.ok) {
                    await cache.put(asset, response);
                }
            } catch (error) {
                console.warn(`SW: Failed to cache ${asset}:`, error.message);
            }
        });
        
        await Promise.allSettled(promises);
        console.log(`SW: ${description} caching completed`);
    } catch (error) {
        console.warn(`SW: Failed to cache ${description}:`, error);
    }
}

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
        if (url.pathname.includes('/models/')) {
            // For model files, use a more aggressive caching strategy
            try {
                // First check cache
                const cachedResponse = await caches.match(request, { cacheName: MODELS_CACHE });
                if (cachedResponse) {
                    // If in cache, use it but also update cache in background
                    const fetchPromise = fetch(request)
                        .then(async (networkResponse) => {
                            if (networkResponse.ok) {
                                const cache = await caches.open(MODELS_CACHE);
                                await cache.put(request, networkResponse.clone());
                                console.log('SW: Updated cached model:', url.pathname);
                            }
                            return networkResponse;
                        })
                        .catch(error => {
                            console.warn('SW: Failed to update model cache:', error);
                        });
                    
                    // Trigger update but don't wait for it
                    fetchPromise.catch(() => {});
                    
                    return cachedResponse;
                }
                
                // If not in cache, fetch from network and cache
                const networkResponse = await fetch(request);
                if (networkResponse.ok) {
                    const cache = await caches.open(MODELS_CACHE);
                    await cache.put(request, networkResponse.clone());
                    console.log('SW: Cached new model:', url.pathname);
                }
                return networkResponse;
            } catch (error) {
                console.error('SW: Model fetch failed:', error);
                // Return offline fallback if available
                return caches.match('/offline.html');
            }
        }
        
        // Strategy for images - Cache First
        if (url.pathname.includes('/imgs/')) {
            return await cacheFirst(request, MODELS_CACHE);
        }
        
        // Strategy 3: Fonts and external assets - Stale While Revalidate
        if (
            url.hostname === 'fonts.googleapis.com' || 
            url.hostname === 'fonts.gstatic.com' ||
            url.hostname === 'modelviewer.dev' ||
            url.hostname === 'ajax.googleapis.com' ||
            url.hostname === 'unpkg.com' ||
            url.hostname === 'cdn.jsdelivr.net'
        ) {
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
    // Check if event.data exists and has the expected structure
    if (!event.data || typeof event.data !== 'object') {
        console.warn('SW: Received message with invalid data format:', event.data);
        return;
    }
    
    const { type } = event.data;
    
    // Ensure type is defined
    if (!type) {
        console.warn('SW: Received message without type:', event.data);
        return;
    }
    
    switch (type) {
        case 'SKIP_WAITING':
            console.log('SW: Received SKIP_WAITING command');
            self.skipWaiting();
            break;
        case 'CACHE_ALL_MODELS':
            (async () => {
                if (PREFETCH_IN_PROGRESS) {
                    console.log('SW: Model prefetch already in progress');
                    return;
                }
                PREFETCH_IN_PROGRESS = true;
                try {
                    const cache = await caches.open(MODELS_CACHE);
                    const total = MODEL_ASSETS.length;
                    let already = 0;
                    let cached = 0;
                    let failed = 0;
                    console.log(`SW: Prefetch models start (${total})`);

                    for (let i = 0; i < MODEL_ASSETS.length; i++) {
                        const asset = MODEL_ASSETS[i];
                        const modelNum = i + 1;
                        
                        try {
                            const req = new Request(asset, { cache: 'no-store' });
                            // Check if already cached
                            const inCache = await cache.match(asset);
                            if (inCache) {
                                already++;
                                console.log(`SW: Already cached [${already}]: ${asset}`);
                                
                                // Notificar cliente que já está em cache
                                const clientsArr = await self.clients.matchAll();
                                clientsArr.forEach(c => c.postMessage({ 
                                    type: 'CACHE_COMPLETE', 
                                    data: { model: modelNum }
                                }));
                                continue;
                            }
                            
                            // Notificar início do download
                            const clientsArr = await self.clients.matchAll();
                            clientsArr.forEach(c => c.postMessage({ 
                                type: 'CACHE_PROGRESS', 
                                data: { model: modelNum, progress: 0 }
                            }));
                            
                            const resp = await fetch(req);
                            if (resp && resp.ok) {
                                await cache.put(asset, resp.clone());
                                cached++;
                                console.log(`SW: Cached model [${cached}]: ${asset}`);
                                
                                // Notificar conclusão
                                const clients = await self.clients.matchAll();
                                clients.forEach(c => c.postMessage({ 
                                    type: 'CACHE_COMPLETE', 
                                    data: { model: modelNum }
                                }));
                            } else {
                                failed++;
                                console.warn(`SW: Failed (response not ok): ${asset}`);
                                
                                // Notificar erro
                                const clients = await self.clients.matchAll();
                                clients.forEach(c => c.postMessage({ 
                                    type: 'CACHE_ERROR', 
                                    data: { model: modelNum }
                                }));
                            }
                        } catch (e) {
                            failed++;
                            console.warn(`SW: Failed to fetch ${asset}: ${e.message}`);
                            
                            // Notificar erro
                            const clients = await self.clients.matchAll();
                            clients.forEach(c => c.postMessage({ 
                                type: 'CACHE_ERROR', 
                                data: { model: modelNum }
                            }));
                        }
                    }
                    const summary = `SW: Prefetch models complete. cached=${cached}, already=${already}, failed=${failed}, total=${total}`;
                    console.log(summary);
                    // Broadcast summary to all clients
                    const clientsArr = await self.clients.matchAll();
                    clientsArr.forEach(c => c.postMessage({ type: 'MODELS_PREFETCH_SUMMARY', data: { cached, already, failed, total } }));
                } catch (err) {
                    console.error('SW: Prefetch error:', err);
                } finally {
                    PREFETCH_IN_PROGRESS = false;
                }
            })();
            break;
        default:
            console.log('SW: Unknown message type:', type);
    }
});

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
                icon: '/imgs/icon-192x192.png',
                badge: '/imgs/icon-72x72.png',
                tag: 'techno-sutra-notification'
            })
        );
    }
});

console.log('SW: Service Worker script loaded');
