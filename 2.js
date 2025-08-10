// Enhanced particle and animation controller for Techno Sutra background effects
import { safeExecute } from './1.js';

// Global sprite cache to prevent memory leaks
const spriteCache = new Map();
const maxCacheSize = 100;

// Cleanup old cache entries
function cleanupSpriteCache() {
    if (spriteCache.size > maxCacheSize) {
        const keysToDelete = Array.from(spriteCache.keys()).slice(0, spriteCache.size - maxCacheSize);
        keysToDelete.forEach(key => spriteCache.delete(key));
    }
}

// Enhanced animation controller with better memory management
export function createAnimationController() {
    let idCounter = 0;
    const animationsToDelete = [];
    const maxAnimations = 1000; // Prevent memory bloat
    
    return {
        baseDuration: 2000,
        baseInterval: 100,
        animations: new Map(),
        
        addAnimation(shape, type, options = {}) {
            return safeExecute(() => {
                // Limit total animations to prevent memory issues
                if (this.animations.size >= maxAnimations) {
                    console.warn('Animation limit reached, cleaning up oldest animations');
                    const oldestKeys = Array.from(this.animations.keys()).slice(0, 100);
                    oldestKeys.forEach(key => this.animations.delete(key));
                }
                
                const animationId = options.id ?? `${shape.id || ++idCounter}_${type}_${Date.now()}`;
                const animation = {
                    id: animationId,
                    shape,
                    type,
                    duration: options.duration ?? this.baseDuration,
                    from: options.from ?? 1,
                    to: options.to ?? 1.2,
                    easing: options.easing ?? 'sineInOut',
                    loop: options.loop ?? false,
                    yoyo: options.yoyo ?? false,
                    reversed: false,
                    ...options,
                    startTime: performance.now(),
                    isActive: true
                };
                
                this.animations.set(animationId, animation);
                
                if (options.onStart) {
                    try {
                        options.onStart(animation);
                    } catch (error) {
                        console.warn('Animation onStart callback error:', error);
                    }
                }
                
                return animationId;
            }, null, 'addAnimation');
        },
        
        updateAnimations(currentTime) {
            return safeExecute(() => {
                animationsToDelete.length = 0;
                
                for (const [id, animation] of this.animations) {
                    if (!animation.isActive) continue;
                    
                    const elapsed = currentTime - animation.startTime;
                    const progress = Math.min(elapsed / animation.duration, 1);
                    
                    // Apply easing with error handling
                    let easedProgress = progress;
                    try {
                        if (animation.easing) {
                            easedProgress = this.applyEasing(progress, animation.easing);
                        }
                    } catch (error) {
                        console.warn('Easing calculation error:', error);
                        easedProgress = progress; // Fallback to linear
                    }
                    
                    // Update shape based on animation type
                    try {
                        if (animation.type === 'scale' && animation.shape.setScale) {
                            const scale = animation.from + (animation.to - animation.from) * easedProgress;
                            animation.shape.setScale(scale);
                        } else if (animation.type === 'opacity' && animation.shape.setOpacity) {
                            const opacity = animation.from + (animation.to - animation.from) * easedProgress;
                            animation.shape.setOpacity(opacity);
                        } else if (animation.type === 'rotation' && animation.shape.setRotation) {
                            const rotation = animation.from + (animation.to - animation.from) * easedProgress;
                            animation.shape.setRotation(rotation);
                        }
                        
                        if (animation.onUpdate) {
                            animation.onUpdate(animation, easedProgress);
                        }
                    } catch (error) {
                        console.warn('Animation update error:', error);
                        animationsToDelete.push(id);
                        continue;
                    }
                    
                    // Check if animation is complete
                    if (progress >= 1) {
                        if (animation.yoyo && !animation.reversed) {
                            // Reverse the animation
                            animation.reversed = true;
                            animation.startTime = currentTime;
                            const temp = animation.from;
                            animation.from = animation.to;
                            animation.to = temp;
                        } else if (animation.loop) {
                            // Restart the animation
                            animation.startTime = currentTime;
                            animation.reversed = false;
                            if (animation.yoyo) {
                                const temp = animation.from;
                                animation.from = animation.to;
                                animation.to = temp;
                            }
                        } else {
                            // Animation complete
                            try {
                                if (animation.onComplete) {
                                    animation.onComplete(animation);
                                }
                            } catch (error) {
                                console.warn('Animation onComplete callback error:', error);
                            }
                            animationsToDelete.push(id);
                        }
                    }
                }
                
                // Delete completed animations
                for (const id of animationsToDelete) {
                    this.animations.delete(id);
                }
            }, undefined, 'updateAnimations');
        },
        
        applyEasing(t, easingType) {
            // Clamp t to prevent calculation errors
            t = Math.max(0, Math.min(1, t));
            
            switch (easingType) {
                case 'sineInOut':
                    return -(Math.cos(Math.PI * t) - 1) / 2;
                case 'quadInOut':
                    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                case 'cubicInOut':
                    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                case 'elasticOut':
                    return t === 0 ? 0 : t === 1 ? 1 : 
                        Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
                case 'bounceOut':
                    if (t < 1 / 2.75) return 7.5625 * t * t;
                    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                default:
                    return t; // Linear
            }
        },
        
        removeAnimation(id) {
            this.animations.delete(id);
        },
        
        clearAnimations() {
            this.animations.clear();
        },
        
        getStats() {
            return {
                activeAnimations: this.animations.size,
                maxAnimations
            };
        }
    };
}

// Enhanced particle system with comprehensive optimizations
export function createParticleSystem(canvas, ctx) {
    return safeExecute(() => {
        const particles = [];
        const maxParticles = Math.min(80, Math.max(30, Math.floor(canvas.width * canvas.height / 20000))); // Adaptive count
        let lastFrameTime = 0;
        let isDestroyed = false;
        let performanceMode = false;
        
        // Performance monitoring
        let frameCount = 0;
        let lastPerformanceCheck = performance.now();
        
        // Optimized sprite creation with caching
        function getOrCreateParticleSprite(size, intensity) {
            const key = `${Math.round(size * 2)}_${Math.round(intensity * 10)}`;
            
            if (!spriteCache.has(key)) {
                cleanupSpriteCache();
                
                const spriteSize = Math.max(8, size * 6);
                const spriteCanvas = document.createElement('canvas');
                spriteCanvas.width = spriteSize;
                spriteCanvas.height = spriteSize;
                const spriteCtx = spriteCanvas.getContext('2d');
                
                const centerX = spriteSize / 2;
                const centerY = spriteSize / 2;
                const radius = size * 3;
                
                // Create gradient
                const gradient = spriteCtx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.9})`);
                gradient.addColorStop(0.3, `rgba(0, 255, 149, ${intensity * 0.8})`);
                gradient.addColorStop(0.7, `rgba(157, 0, 255, ${intensity * 0.5})`);
                gradient.addColorStop(1, 'rgba(0, 255, 149, 0)');
                
                // Draw main glow
                spriteCtx.fillStyle = gradient;
                spriteCtx.beginPath();
                spriteCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                spriteCtx.fill();
                
                // Add bright center dot
                spriteCtx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
                spriteCtx.beginPath();
                spriteCtx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
                spriteCtx.fill();
                
                spriteCache.set(key, spriteCanvas);
            }
            
            return spriteCache.get(key);
        }
        
        // Optimized particle class
        class Particle {
            constructor() {
                this.reset(true);
                this.sprite = null;
                this.lastSpriteKey = '';
            }
            
            reset(randomLife = false) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * (performanceMode ? 0.3 : 0.5);
                this.vy = (Math.random() - 0.5) * (performanceMode ? 0.3 : 0.5);
                this.life = randomLife ? Math.random() : 1;
                this.maxLife = 2 + Math.random() * 3;
                this.size = 0.8 + Math.random() * 1.5;
                this.twinkle = Math.random() * Math.PI * 2;
                this.twinkleSpeed = 0.015 + Math.random() * 0.025;
                this.decayRate = 0.001 + Math.random() * 0.002;
                this.lastIntensity = -1;
            }
            
            update(deltaTime) {
                if (isDestroyed) return;
                
                const normalizedDelta = Math.min(deltaTime, 0.033); // Cap at ~30fps equivalent
                const movement = normalizedDelta * 60;
                
                this.x += this.vx * movement;
                this.y += this.vy * movement;
                this.life -= this.decayRate * movement;
                this.twinkle = (this.twinkle + this.twinkleSpeed * movement) % (Math.PI * 2);
                
                // Efficient boundary wrapping
                if (this.x < 0) this.x = canvas.width;
                else if (this.x > canvas.width) this.x = 0;
                
                if (this.y < 0) this.y = canvas.height;
                else if (this.y > canvas.height) this.y = 0;
                
                if (this.life <= 0) {
                    this.reset();
                }
            }
            
            draw() {
                if (isDestroyed || this.life <= 0) return;
                
                try {
                    const alpha = Math.max(0, this.life * (0.4 + 0.6 * Math.sin(this.twinkle)));
                    const intensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.twinkle));
                    
                    // Only update sprite if intensity changed significantly
                    const spriteKey = `${Math.round(this.size * 2)}_${Math.round(intensity * 10)}`;
                    if (this.lastSpriteKey !== spriteKey) {
                        this.sprite = getOrCreateParticleSprite(this.size, intensity);
                        this.lastSpriteKey = spriteKey;
                    }
                    
                    if (this.sprite) {
                        ctx.save();
                        ctx.globalAlpha = alpha * 0.7;
                        
                        const drawSize = this.size * 6;
                        ctx.drawImage(
                            this.sprite,
                            this.x - drawSize / 2,
                            this.y - drawSize / 2
                        );
                        
                        ctx.restore();
                    }
                } catch (error) {
                    console.warn('Particle draw error:', error);
                }
            }
        }
        
        // Performance monitoring
        function checkPerformance() {
            frameCount++;
            const now = performance.now();
            
            if (now - lastPerformanceCheck > 2000) { // Check every 2 seconds
                const fps = frameCount * 1000 / (now - lastPerformanceCheck);
                const wasPerformanceMode = performanceMode;
                performanceMode = fps < 25;
                
                if (performanceMode !== wasPerformanceMode) {
                    console.log(`Performance mode ${performanceMode ? 'enabled' : 'disabled'} (FPS: ${fps.toFixed(1)})`);
                    
                    if (performanceMode && particles.length > 40) {
                        particles.splice(40); // Reduce particle count
                    } else if (!performanceMode && particles.length < maxParticles) {
                        // Add particles back
                        while (particles.length < Math.min(maxParticles, 60)) {
                            particles.push(new Particle());
                        }
                    }
                }
                
                frameCount = 0;
                lastPerformanceCheck = now;
            }
        }
        
        // Initialize particles with adaptive count
        const initialCount = Math.min(maxParticles, 60);
        for (let i = 0; i < initialCount; i++) {
            particles.push(new Particle());
        }
        
        return {
            update(currentTime) {
                if (isDestroyed) return;
                
                checkPerformance();
                
                const deltaTime = lastFrameTime ? Math.min((currentTime - lastFrameTime) / 1000, 0.033) : 0.016;
                lastFrameTime = currentTime;
                
                for (let i = 0; i < particles.length; i++) {
                    particles[i].update(deltaTime);
                }
            },
            
            draw() {
                if (isDestroyed) return;
                
                try {
                    // Use batch drawing for better performance
                    const batchSize = performanceMode ? 20 : particles.length;
                    const startIndex = Math.floor(Math.random() * Math.max(1, particles.length - batchSize));
                    
                    for (let i = startIndex; i < Math.min(startIndex + batchSize, particles.length); i++) {
                        particles[i].draw();
                    }
                } catch (error) {
                    console.warn('Particle system draw error:', error);
                }
            },
            
            resize() {
                if (isDestroyed) return;
                
                try {
                    // Redistribute particles and clear sprite cache
                    for (let i = 0; i < particles.length; i++) {
                        const particle = particles[i];
                        if (particle.x > canvas.width) particle.x = Math.random() * canvas.width;
                        if (particle.y > canvas.height) particle.y = Math.random() * canvas.height;
                        particle.sprite = null;
                        particle.lastSpriteKey = '';
                    }
                    
                    // Clear sprite cache on resize to force regeneration
                    spriteCache.clear();
                } catch (error) {
                    console.warn('Particle system resize error:', error);
                }
            },
            
            destroy() {
                isDestroyed = true;
                particles.length = 0;
                spriteCache.clear();
            },
            
            getStats() {
                return {
                    particleCount: particles.length,
                    maxParticles,
                    performanceMode,
                    cacheSize: spriteCache.size
                };
            },
            
            setPerformanceMode(enabled) {
                performanceMode = enabled;
            }
        };
    }, {
        update: () => {},
        draw: () => {},
        resize: () => {},
        destroy: () => {},
        getStats: () => ({ error: true }),
        setPerformanceMode: () => {}
    }, 'createParticleSystem');
}

// Error boundaries for canvas operations
export function createCanvasFallback() {
    return {
        update: () => {},
        draw: () => {},
        resize: () => {},
        destroy: () => {},
        getStats: () => ({ fallback: true })
    };
}

// Utility functions for performance monitoring
export function getGlobalStats() {
    return {
        totalSpriteCacheSize: spriteCache.size,
        maxCacheSize
    };
}

// Cleanup function
export function cleanup() {
    spriteCache.clear();
}

// Enhanced exports
export {
    createAnimationController,
    createParticleSystem,
    createCanvasFallback,
    getGlobalStats,
    cleanup
};
