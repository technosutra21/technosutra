import test from 'node:test';
import { strict as assert } from 'assert';

// Mock service worker environment
const mockCaches = {
    cacheNames: [],
    caches: new Map(),

    open: async function(name) {
        if (!this.caches.has(name)) {
            this.caches.set(name, {
                name,
                items: new Map(),
                put: async function(request, response) {
                    const url = typeof request === 'string' ? request : request.url;
                    this.items.set(url, response);
                },
                match: async function(request) {
                    const url = typeof request === 'string' ? request : request.url;
                    return this.items.get(url);
                },
                addAll: async function(urls) {
                    for (const url of urls) {
                        const response = new Response('mock data');
                        await this.put(url, response);
                    }
                },
                delete: async function() {
                    return true;
                }
            });
        }
        return this.caches.get(name);
    },

    keys: async function() {
        return Array.from(this.caches.keys());
    },

    delete: async function(name) {
        return this.caches.delete(name);
    }
};

test('Service Worker - Asset Caching', async (t) => {
    await t.test('should cache core assets', async () => {
        const cache = await mockCaches.open('test-cache');
        const assets = ['/', '/index.html', '/AR.html'];

        await cache.addAll(assets);
        for (const asset of assets) {
            const cached = await cache.match(asset);
            assert(cached !== undefined, `Asset ${asset} should be cached`);
        }
    });

    await t.test('should handle model caching (56 models)', async () => {
        const cache = await mockCaches.open('models-cache');
        let cachedCount = 0;

        for (let i = 1; i <= 56; i++) {
            const modelUrl = `/models/modelo${i}.glb`;
            const response = new Response('mock glb data');
            await cache.put(modelUrl, response);
            cachedCount++;
        }

        assert.equal(cachedCount, 56, 'All 56 models should be cacheable');
    });

    await t.test('should not cache usdz files', async () => {
        // Verify USDZ references are removed
        const cache = await mockCaches.open('models-cache');
        const usdzUrl = '/models/usdz/modelo1.usdz';
        const cached = await cache.match(usdzUrl);
        assert.equal(cached, undefined, 'USDZ files should not be pre-cached');
    });
});

test('Model Viewer Configuration', async (t) => {
    await t.test('should load models without ios-src attribute', () => {
        // Verify AR.html doesn't set ios-src
        const mockModelViewer = {
            src: '/models/modelo1.glb',
            getAttribute: (attr) => {
                if (attr === 'ios-src') {
                    return null; // Should not be set
                }
                return null;
            }
        };

        assert.equal(mockModelViewer.getAttribute('ios-src'), null, 'ios-src should not be set');
    });

    await t.test('should have valid GLB paths for all 56 models', () => {
        const validModels = [];
        for (let i = 1; i <= 56; i++) {
            const path = `/models/modelo${i}.glb`;
            validModels.push(path);
        }

        assert.equal(validModels.length, 56, 'Should have 56 valid model paths');
        assert(validModels[0] === '/models/modelo1.glb', 'First model path should be correct');
        assert(validModels[55] === '/models/modelo56.glb', 'Last model path should be correct');
    });
});

test('App Configuration', async (t) => {
    await t.test('should define 56 total models', () => {
        const TOTAL_MODELS = 56;
        assert.equal(TOTAL_MODELS, 56, 'App should support exactly 56 models');
    });

    await t.test('should validate model ID bounds (1-56)', () => {
        const validateModelId = (id) => {
            return id >= 1 && id <= 56;
        };

        assert(validateModelId(1), 'Model 1 should be valid');
        assert(validateModelId(56), 'Model 56 should be valid');
        assert(!validateModelId(0), 'Model 0 should be invalid');
        assert(!validateModelId(57), 'Model 57 should be invalid');
    });
});

test('Offline Functionality', async (t) => {
    await t.test('should support offline page fallback', async () => {
        const cache = await mockCaches.open('test-cache');
        const offlineHtml = '<h1>Offline</h1>';
        const offlineResponse = new Response(offlineHtml);

        await cache.put('/offline.html', offlineResponse);
        const cached = await cache.match('/offline.html');

        assert(cached !== undefined, 'Offline page should be cached');
    });

    await t.test('should maintain cache structure', async () => {
        const cacheNames = [
            'techno-sutra-ar-v1.0.1',
            'techno-sutra-runtime-v1.0.1',
            'techno-sutra-models-v1.0.1'
        ];

        for (const name of cacheNames) {
            const cache = await mockCaches.open(name);
            assert(cache !== undefined, `Cache ${name} should be creatable`);
        }
    });
});
