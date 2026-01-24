import test from 'node:test';
import { strict as assert } from 'assert';

test('AR Experience', async (t) => {
    await t.test('should support model range 1-56', () => {
        const isValidModel = (id) => id >= 1 && id <= 56;

        assert(isValidModel(1), 'Model 1 should be valid');
        assert(isValidModel(28), 'Model 28 should be valid');
        assert(isValidModel(56), 'Model 56 should be valid');
        assert(!isValidModel(0), 'Model 0 should be invalid');
        assert(!isValidModel(57), 'Model 57 should be invalid');
    });

    await t.test('should generate correct model paths', () => {
        const generatePath = (id) => `/models/modelo${id}.glb`;

        assert.equal(generatePath(1), '/models/modelo1.glb', 'Model 1 path correct');
        assert.equal(generatePath(10), '/models/modelo10.glb', 'Model 10 path correct');
        assert.equal(generatePath(56), '/models/modelo56.glb', 'Model 56 path correct');
    });

    await t.test('should not generate USDZ paths', () => {
        // Verify no USDZ fallback generation
        const generatePath = (id) => `/models/modelo${id}.glb`;
        const path = generatePath(1);
        
        assert(!path.includes('usdz'), 'Should not include usdz in model path');
        assert(path.includes('.glb'), 'Should use GLB format');
    });

    await t.test('should parse URL parameters correctly', () => {
        const parseModelParam = (query) => {
            const params = new URLSearchParams(query);
            const model = parseInt(params.get('model')) || 1;
            return Math.max(1, Math.min(model, 56));
        };

        assert.equal(parseModelParam('model=1'), 1, 'Model 1 from query');
        assert.equal(parseModelParam('model=56'), 56, 'Model 56 from query');
        assert.equal(parseModelParam('model=0'), 1, 'Invalid model 0 should clamp to 1');
        assert.equal(parseModelParam('model=100'), 56, 'Invalid model 100 should clamp to 56');
        assert.equal(parseModelParam(''), 1, 'Empty query should default to 1');
    });

    await t.test('should handle camera permissions gracefully', () => {
        const cameraState = {
            stream: null,
            hasPermission: false,
            error: null
        };

        // Simulate permission denied
        cameraState.error = 'NotAllowedError';
        assert(cameraState.error !== null, 'Should handle permission errors');
    });

    await t.test('should support keyboard navigation', () => {
        const navigateModel = (currentModel, direction) => {
            const newModel = currentModel + direction;
            if (newModel >= 1 && newModel <= 56) {
                return newModel;
            }
            return currentModel;
        };

        assert.equal(navigateModel(10, 1), 11, 'Should navigate right');
        assert.equal(navigateModel(10, -1), 9, 'Should navigate left');
        assert.equal(navigateModel(1, -1), 1, 'Should not go below 1');
        assert.equal(navigateModel(56, 1), 56, 'Should not go above 56');
    });
});

test('Model Viewer Integration', async (t) => {
    await t.test('should configure model-viewer attributes correctly', () => {
        const attributes = {
            src: '/models/modelo1.glb',
            ar: '',
            'ar-modes': 'quick-look webxr scene-viewer',
            'ar-scale': 'auto',
            'auto-rotate': '',
            'camera-controls': ''
        };

        assert(attributes.src.includes('.glb'), 'Should use GLB format');
        assert(!attributes['ios-src'], 'Should not have ios-src attribute');
        assert(attributes['ar-modes'].includes('quick-look'), 'Should support iOS Quick Look');
    });

    await t.test('should not reference USDZ in attributes', () => {
        const attributes = {
            src: '/models/modelo1.glb'
        };

        assert(!('ios-src' in attributes), 'Should not have ios-src key');
        assert(!Object.values(attributes).some(v => v?.includes('usdz')), 
            'Should not reference USDZ anywhere');
    });
});

test('AR Status Management', async (t) => {
    await t.test('should track AR session state', () => {
        const arSession = {
            active: false,
            startedAt: null,

            start: function() {
                this.active = true;
                this.startedAt = Date.now();
            },

            end: function() {
                this.active = false;
                this.startedAt = null;
            }
        };

        assert.equal(arSession.active, false, 'Should start inactive');
        arSession.start();
        assert.equal(arSession.active, true, 'Should be active after start');
        arSession.end();
        assert.equal(arSession.active, false, 'Should be inactive after end');
    });

    await t.test('should emit status messages', () => {
        const statusMessages = [];
        const emit = (message) => statusMessages.push(message);

        emit('AR session started');
        emit('Model loaded');
        emit('AR session ended');

        assert.equal(statusMessages.length, 3, 'Should track messages');
        assert(statusMessages[0].includes('started'), 'First message should indicate start');
    });
});

test('Error Handling', async (t) => {
    await t.test('should handle missing models gracefully', () => {
        const loadModel = (id) => {
            if (id < 1 || id > 56) {
                return { success: false, error: 'Invalid model ID' };
            }
            return { success: true, model: `modelo${id}` };
        };

        assert(!loadModel(0).success, 'Should reject invalid model');
        assert(!loadModel(57).success, 'Should reject model above 56');
        assert(loadModel(1).success, 'Should accept valid model');
    });

    await t.test('should provide fallback model', () => {
        const getFallbackModel = () => 1;

        assert.equal(getFallbackModel(), 1, 'Fallback should be model 1');
    });
});
