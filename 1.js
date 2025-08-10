// Constants for performance
const GOLDEN_ANGLE = Math.PI * (1 + Math.sqrt(5));
const TWO_PI = Math.PI * 2;

// Error handling wrapper
function safeExecute(fn, fallback, context = '') {
    try {
        return fn();
    } catch (error) {
        console.warn(`Safe execution failed in ${context}:`, error);
        return fallback;
    }
}

// Cache for precomputed sphere positions with memory management
let sphereCache = {
    gridSize: 0,
    staticData: [],
    positions: [],
    maxCacheSize: 10000, // Prevent memory bloat
    
    reset() {
        this.gridSize = 0;
        this.staticData.length = 0;
        this.positions.length = 0;
    },
    
    checkMemoryUsage() {
        if (this.staticData.length > this.maxCacheSize) {
            console.warn('Sphere cache size exceeded, resetting');
            this.reset();
        }
    }
};

// Enhanced RotatingSmallerSphereSort with performance optimizations and error handling
export default function RotatingSmallerSphereSort(gridSize = 40, currentTime, controller) {
    return safeExecute(() => {
        // Guard against invalid gridSize
        if (gridSize <= 0 || gridSize > 100) return [];
        
        sphereCache.checkMemoryUsage();
        
        const count = Math.min(gridSize * gridSize, 4000); // Limit for performance
        const center = gridSize / 2;
        const reducedRadius = gridSize / 3;
        const t = currentTime / 2000;

        // Rebuild cache only if gridSize changed
        if (sphereCache.gridSize !== gridSize) {
            sphereCache.gridSize = gridSize;
            sphereCache.staticData.length = 0;
            
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(1 - 2 * (i + 0.5) / count);
                const theta0 = GOLDEN_ANGLE * i;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                sphereCache.staticData.push({
                    sinPhi,
                    cosPhi,
                    theta0,
                    phase: i / count * TWO_PI
                });
            }
            
            // Resize positions array
            sphereCache.positions.length = count;
            for (let i = 0; i < count; i++) {
                sphereCache.positions[i] = {
                    x: 0, y: 0, z: 0,
                    depth: 0, opacity: 0, size: 0,
                    angle: 0, phase: 0
                };
            }
        }

        // Add pulsing effect with performance check
        const pulse = 1 + 0.1 * Math.sin(currentTime / 1000);
        const finalRadius = reducedRadius * pulse;

        // Enhanced rotation angles
        const rotationAngle = t;
        const rotationY = t * 0.7;
        
        // Precompute rotation values
        const cosRotZ = Math.cos(rotationAngle);
        const sinRotZ = Math.sin(rotationAngle);
        const cosRotY = Math.cos(rotationY);
        const sinRotY = Math.sin(rotationY);

        // Update existing position objects instead of creating new ones
        for (let i = 0; i < count; i++) {
            const cached = sphereCache.staticData[i];
            const pos = sphereCache.positions[i];
            
            const theta = cached.theta0 + t;
            
            // Compute 3D position using cached values
            const x3d = cached.sinPhi * Math.cos(theta);
            const y3d = cached.sinPhi * Math.sin(theta);
            const z3d = cached.cosPhi;

            // Apply rotations using precomputed values
            const rotatedX = x3d * cosRotZ - z3d * sinRotZ;
            const rotatedZ = x3d * sinRotZ + z3d * cosRotZ;
            const rotatedY = y3d;
            
            const finalY = rotatedY * cosRotY - rotatedZ * sinRotY;
            const finalZ = rotatedY * sinRotY + rotatedZ * cosRotY;

            // Update position object in-place
            pos.x = center + rotatedX * finalRadius;
            pos.y = center + finalY * finalRadius;
            pos.z = finalZ;
            pos.depth = (finalZ + 1) * 0.5; // Normalize to 0-1
            pos.opacity = 0.3 + 0.7 * pos.depth;
            pos.size = 1 + 2 * pos.depth;
            pos.angle = theta;
            pos.phase = cached.phase;
        }

        return sphereCache.positions;
    }, [], 'RotatingSmallerSphereSort');
}

// Wrapper function for compatibility with HTML import
export function generatePositions(gridSize, time, controller) {
    return safeExecute(() => {
        const spherePositions = RotatingSmallerSphereSort(gridSize, time, controller);
        
        // Convert to normalized coordinates (0-1) for screen mapping
        return spherePositions.map(pos => ({
            x: pos.x / gridSize, // Normalize to 0-1
            y: pos.y / gridSize, // Normalize to 0-1
            depth: pos.depth,
            opacity: pos.opacity,
            size: pos.size
        }));
    }, [], 'generatePositions');
}

// Enhanced cosmic background generator with comprehensive improvements
export function createCosmicBackground(canvas, ctx) {
    return safeExecute(() => {
        const nebulaClouds = [];
        const stars = [];
        const gradientCache = new Map();
        let isDestroyed = false;
        let lastCanvasWidth = canvas.width;
        let lastCanvasHeight = canvas.height;
        let performanceMode = false;
        
        // Performance monitoring
        let frameCount = 0;
        let lastFPSCheck = performance.now();
        
        // Gradient cache with intelligent management
        function getCachedGradient(x, y, radius, color) {
            const key = `${Math.round(x/10)}_${Math.round(y/10)}_${Math.round(radius)}_${color}`;
            
            if (!gradientCache.has(key)) {
                // Limit cache size to prevent memory bloat
                if (gradientCache.size > 50) {
                    const firstKey = gradientCache.keys().next().value;
                    gradientCache.delete(firstKey);
                }
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, color.replace('30%', '40%'));
                gradient.addColorStop(0.6, color.replace('30%', '20%'));
                gradient.addColorStop(1, 'transparent');
                gradientCache.set(key, gradient);
            }
            
            return gradientCache.get(key);
        }
        
        // Adaptive performance based on device capabilities
        function checkPerformance() {
            frameCount++;
            const now = performance.now();
            
            if (now - lastFPSCheck > 1000) { // Check every second
                const fps = frameCount * 1000 / (now - lastFPSCheck);
                performanceMode = fps < 30; // Enable performance mode if FPS drops
                
                if (performanceMode && nebulaClouds.length > 4) {
                    // Reduce visual complexity
                    nebulaClouds.splice(4);
                    stars.splice(100);
                }
                
                frameCount = 0;
                lastFPSCheck = now;
            }
        }
        
        // Create nebula clouds with optimized count
        const cloudCount = performanceMode ? 4 : 6;
        for (let i = 0; i < cloudCount; i++) {
            const cloud = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 50 + Math.random() * 120,
                speed: 0.1 + Math.random() * 0.2,
                color: `hsl(${180 + Math.random() * 120}, 70%, 30%)`,
                opacity: 0.1 + Math.random() * 0.15,
                lastDrawnX: -1,
                lastDrawnY: -1,
                lastDrawnRadius: -1,
                cachedGradient: null
            };
            nebulaClouds.push(cloud);
        }
        
        // Create distant stars with adaptive count
        const starCount = performanceMode ? 80 : 120;
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.2,
                twinkle: Math.random() * TWO_PI,
                speed: Math.random() * 0.015,
                brightness: 0.3 + Math.random() * 0.7
            });
        }
        
        return {
            update(time) {
                if (isDestroyed) return;
                
                checkPerformance();
                
                // Update nebula positions with bounds checking
                for (let i = 0; i < nebulaClouds.length; i++) {
                    const cloud = nebulaClouds[i];
                    cloud.x += Math.sin(time * cloud.speed) * 0.2;
                    cloud.y += Math.cos(time * cloud.speed) * 0.15;
                    
                    // Efficient wrap around
                    if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius;
                    else if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius;
                    
                    if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius;
                    else if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius;
                }
                
                // Update star twinkle with overflow protection
                for (let i = 0; i < stars.length; i++) {
                    const star = stars[i];
                    star.twinkle = (star.twinkle + star.speed) % TWO_PI;
                }
            },
            
            draw(time) {
                if (isDestroyed) return;
                
                try {
                    // Draw nebula clouds with cached gradients
                    for (let i = 0; i < nebulaClouds.length; i++) {
                        const cloud = nebulaClouds[i];
                        
                        // Use cached gradient system
                        const shouldUpdateGradient = !cloud.cachedGradient ||
                            Math.abs(cloud.x - cloud.lastDrawnX) > 10 ||
                            Math.abs(cloud.y - cloud.lastDrawnY) > 10 ||
                            Math.abs(cloud.radius - cloud.lastDrawnRadius) > 5;
                        
                        if (shouldUpdateGradient) {
                            cloud.cachedGradient = getCachedGradient(
                                cloud.x, cloud.y, cloud.radius, cloud.color
                            );
                            cloud.lastDrawnX = cloud.x;
                            cloud.lastDrawnY = cloud.y;
                            cloud.lastDrawnRadius = cloud.radius;
                        }
                        
                        ctx.save();
                        ctx.globalAlpha = cloud.opacity;
                        ctx.fillStyle = cloud.cachedGradient;
                        ctx.beginPath();
                        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, TWO_PI);
                        ctx.fill();
                        ctx.restore();
                    }
                    
                    // Draw optimized twinkling stars
                    for (let i = 0; i < stars.length; i++) {
                        const star = stars[i];
                        const alpha = star.brightness * (0.5 + 0.5 * Math.sin(star.twinkle));
                        
                        ctx.save();
                        ctx.globalAlpha = alpha * 0.8;
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(star.x, star.y, star.size, 0, TWO_PI);
                        ctx.fill();
                        ctx.restore();
                    }
                } catch (error) {
                    console.warn('Cosmic background draw error:', error);
                }
            },
            
            resize() {
                if (isDestroyed) return;
                
                try {
                    const widthChanged = Math.abs(canvas.width - lastCanvasWidth) > 10;
                    const heightChanged = Math.abs(canvas.height - lastCanvasHeight) > 10;
                    
                    if (widthChanged || heightChanged) {
                        // Clear gradient cache on significant resize
                        gradientCache.clear();
                        
                        // Redistribute elements when canvas resizes
                        for (let i = 0; i < nebulaClouds.length; i++) {
                            const cloud = nebulaClouds[i];
                            if (cloud.x > canvas.width) cloud.x = Math.random() * canvas.width;
                            if (cloud.y > canvas.height) cloud.y = Math.random() * canvas.height;
                            cloud.cachedGradient = null;
                        }
                        
                        for (let i = 0; i < stars.length; i++) {
                            const star = stars[i];
                            if (star.x > canvas.width) star.x = Math.random() * canvas.width;
                            if (star.y > canvas.height) star.y = Math.random() * canvas.height;
                        }
                        
                        lastCanvasWidth = canvas.width;
                        lastCanvasHeight = canvas.height;
                    }
                } catch (error) {
                    console.warn('Cosmic background resize error:', error);
                }
            },
            
            destroy() {
                isDestroyed = true;
                // Comprehensive cleanup
                nebulaClouds.length = 0;
                stars.length = 0;
                gradientCache.clear();
                sphereCache.reset();
            },
            
            // Diagnostic methods
            getPerformanceInfo() {
                return {
                    performanceMode,
                    cloudCount: nebulaClouds.length,
                    starCount: stars.length,
                    cacheSize: gradientCache.size
                };
            }
        };
    }, {
        update: () => {},
        draw: () => {},
        resize: () => {},
        destroy: () => {},
        getPerformanceInfo: () => ({ error: true })
    }, 'createCosmicBackground');
}

// Enhanced exports with error handling
export {
    RotatingSmallerSphereSort as default,
    generatePositions,
    createCosmicBackground,
    GOLDEN_ANGLE,
    TWO_PI,
    safeExecute
};

// Cleanup function for module unload
export function cleanup() {
    sphereCache.reset();
}
