// Service Worker for Techno Sutra AR
// Provides offline functionality and caching for better performance

const CACHE_NAME = 'techno-sutra-ar-v1.2';
const STATIC_CACHE_NAME = 'techno-sutra-static-v1.2';
const DYNAMIC_CACHE_NAME = 'techno-sutra-dynamic-v1.2';

// Files to cache immediately (critical for app functionality)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    // External dependencies will be cached dynamically
];

// GLB models that exist in the project (auto-updated)
const AVAILABLE_MODELS = [
    '/modelo1.glb',
    '/modelo2.glb',
    '/modelo4.glb',
    '/modelo8.glb',
    '/modelo9.glb',
    '/modelo11.glb',
    '/modelo21.glb',
    '/modelo27.glb',
    '/modelo28.glb',
    '/modelo30.glb',
    '/modelo31.glb',
    '/modelo32.glb',
    '/modelo33.glb',
    '/modelo34.glb',
    '/modelo51.glb',
    '/modelo56.glb',
    '/modelo-dragao.glb'
];

// Network-first strategy for these resources
const NETWORK_FIRST_PATTERNS = [
    /^https:\/\/ajax\.googleapis\.com\/ajax\/libs\/model-viewer/,
    /\.glb$/
];

// Cache-first strategy for these resources
const CACHE_FIRST_PATTERNS = [
    /\.jpg$/,
    /\.jpeg$/,
    /\.png$/,
    /\.gif$/,
    /\.webp$/,
    /\.svg$/,
    /\.css$/,
    /\.js$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            // Pre-cache available models
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                console.log('[SW] Pre-caching available models');
                return Promise.allSettled(
                    AVAILABLE_MODELS.map(model => 
                        cache.add(model).catch(err => 
                            console.log(`[SW] Could not cache ${model}:`, err)
                        )
                    )
                );
            })
        ]).then(() => {
            console.log('[SW] Installation complete');
            // Force activation of new service worker
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && 
                        cacheName !== DYNAMIC_CACHE_NAME &&
                        cacheName.startsWith('techno-sutra-')) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Activation complete');
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Strategy 1: Network-first for critical external resources and models
        if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.href))) {
            return await networkFirstStrategy(request);
        }
        
        // Strategy 2: Cache-first for static assets
        if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.href))) {
            return await cacheFirstStrategy(request);
        }
        
        // Strategy 3: Stale-while-revalidate for HTML pages
        if (url.pathname === '/' || url.pathname.endsWith('.html')) {
            return await staleWhileRevalidateStrategy(request);
        }
        
        // Default: Network-first
        return await networkFirstStrategy(request);
        
    } catch (error) {
        console.error('[SW] Error handling request:', error);
        return await handleOfflineFallback(request);
    }
}

// Network-first strategy: Try network, fallback to cache
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Cache-first strategy: Try cache, fallback to network
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache-first failed for:', request.url);
        throw error;
    }
}

// Stale-while-revalidate: Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkResponsePromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.log('[SW] Background update failed:', error);
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        // Don't await the network request
        networkResponsePromise;
        return cachedResponse;
    }
    
    // If no cache, wait for network
    return await networkResponsePromise;
}

// Offline fallback handling
async function handleOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML requests, return cached index.html
    if (request.headers.get('accept')?.includes('text/html')) {
        const cachedPage = await caches.match('/index.html');
        if (cachedPage) {
            return cachedPage;
        }
    }
    
    // For model requests, return a specific error response
    if (url.pathname.endsWith('.glb')) {
        return new Response(
            JSON.stringify({
                error: 'Model not available offline',
                model: url.pathname
            }),
            {
                status: 404,
                statusText: 'Not Found',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
    
    // Generic offline response
    return new Response(
        'Offline - Resource not available',
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        }
    );
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_MODEL') {
        const modelUrl = event.data.url;
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            return cache.add(modelUrl);
        }).then(() => {
            console.log('[SW] Model cached:', modelUrl);
        }).catch(error => {
            console.error('[SW] Failed to cache model:', error);
        });
    }
});

// Periodic cache cleanup (optional)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupOldCaches());
    }
});

async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name.startsWith('techno-sutra-') && 
        name !== STATIC_CACHE_NAME && 
        name !== DYNAMIC_CACHE_NAME
    );
    
    return Promise.all(oldCaches.map(name => caches.delete(name)));
}
